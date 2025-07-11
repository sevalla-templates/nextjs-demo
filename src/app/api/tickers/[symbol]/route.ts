import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

// Helper function to analyze financial data and generate forward estimates
function generateForwardEstimates(facts: any) {
  if (!facts || !facts['us-gaap']) {
    return null;
  }

  // Extract key metrics for analysis
  const revenues = facts['us-gaap']['Revenues'] || facts['us-gaap']['RevenueFromContractWithCustomerExcludingAssessedTax'];
  const netIncome = facts['us-gaap']['NetIncomeLoss'];
  const shares = facts['us-gaap']['WeightedAverageNumberOfSharesOutstandingBasic'];
  const eps = facts['us-gaap']['EarningsPerShareBasic'];

  if (!revenues || !netIncome || !shares || !eps) {
    return null;
  }

  // Get historical data points
  const getHistoricalData = (metric: any) => {
    const units = Object.keys(metric.units || {});
    const primaryUnit = units.find(unit => unit === 'USD' || unit === 'shares') || units[0];
    
    if (!primaryUnit || !metric.units[primaryUnit]) return [];
    
    return metric.units[primaryUnit]
      .filter((point: any) => point.end && point.val)
      .map((point: any) => {
        const endDate = new Date(point.end);
        const year = endDate.getFullYear();
        const month = endDate.getMonth() + 1;
        const quarter = Math.ceil(month / 3);
        return {
          value: point.val,
          period: `${year}-Q${quarter}`,
          date: point.end,
          year,
          quarter
        };
      })
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const revenueHistory = getHistoricalData(revenues);
  const netIncomeHistory = getHistoricalData(netIncome);
  const epsHistory = getHistoricalData(eps);

  if (revenueHistory.length < 8 || netIncomeHistory.length < 8 || epsHistory.length < 8) {
    return null; // Need at least 2 years of data for meaningful analysis
  }

  // Calculate growth rates and trends
  const calculateGrowthRate = (data: any[]) => {
    if (data.length < 4) return 0;
    
    const last4Quarters = data.slice(-4);
    const previous4Quarters = data.slice(-8, -4);
    
    const recentSum = last4Quarters.reduce((sum: number, point: any) => sum + point.value, 0);
    const previousSum = previous4Quarters.reduce((sum: number, point: any) => sum + point.value, 0);
    
    return previousSum !== 0 ? ((recentSum - previousSum) / Math.abs(previousSum)) * 100 : 0;
  };

  const revenueGrowthRate = calculateGrowthRate(revenueHistory);
  const netIncomeGrowthRate = calculateGrowthRate(netIncomeHistory);
  const epsGrowthRate = calculateGrowthRate(epsHistory);

  // Calculate profit margins
  const latestRevenue = revenueHistory[revenueHistory.length - 1]?.value || 0;
  const latestNetIncome = netIncomeHistory[netIncomeHistory.length - 1]?.value || 0;
  const netMargin = latestRevenue !== 0 ? (latestNetIncome / latestRevenue) * 100 : 0;

  // Generate forward estimates based on historical trends
  const currentYear = new Date().getFullYear();
  const latestEPS = epsHistory[epsHistory.length - 1]?.value || 0;
  
  // Conservative growth projection (cap at reasonable levels)
  const projectedEPSGrowth = Math.min(Math.max(epsGrowthRate * 0.8, -20), 25); // Cap between -20% and 25%
  
  // Generate annual estimates
  const annualEstimates = [];
  for (let i = 0; i < 2; i++) {
    const year = currentYear + i;
    const growthFactor = Math.pow(1 + projectedEPSGrowth / 100, i);
    const projectedEPS = latestEPS * growthFactor;
    
    // Calculate high/low estimates with reasonable variance
    const variance = Math.abs(projectedEPS * 0.1); // 10% variance
    const high = projectedEPS + variance;
    const low = projectedEPS - variance;
    
    // Simple price target based on historical P/E ratios (assume 15-20x earnings)
    const peRatio = 17.5; // Conservative P/E ratio
    const priceTarget = projectedEPS * peRatio;
    
    annualEstimates.push({
      year: year.toString(),
      eps: Number(projectedEPS.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      priceTarget: Number(priceTarget.toFixed(0))
    });
  }

  // Generate quarterly estimates for next 8 quarters
  const quarterlyEstimates = [];
  const lastQuarter = epsHistory[epsHistory.length - 1];
  const quarterlyGrowthRate = projectedEPSGrowth / 4; // Quarterly growth rate
  
  for (let i = 1; i <= 8; i++) {
    const baseEPS = lastQuarter.value;
    const growthFactor = Math.pow(1 + quarterlyGrowthRate / 100, i);
    const projectedQuarterlyEPS = baseEPS * growthFactor;
    
    // Calculate quarter and year
    const futureDate = new Date(lastQuarter.date);
    futureDate.setMonth(futureDate.getMonth() + (i * 3));
    const quarter = Math.ceil((futureDate.getMonth() + 1) / 3);
    const year = futureDate.getFullYear().toString().slice(-2);
    
    // Calculate percentage change from same quarter previous year
    const sameQuarterPrevYear = epsHistory.find((point: any) => 
      point.quarter === quarter && point.year === futureDate.getFullYear() - 1
    );
    
    const changePercent = sameQuarterPrevYear ? 
      ((projectedQuarterlyEPS - sameQuarterPrevYear.value) / Math.abs(sameQuarterPrevYear.value)) * 100 : 
      quarterlyGrowthRate;
    
    // Estimate sales based on historical revenue patterns
    const avgQuarterlyRevenue = revenueHistory.slice(-4).reduce((sum: number, point: any) => sum + point.value, 0) / 4;
    const projectedSales = avgQuarterlyRevenue * Math.pow(1 + revenueGrowthRate / 400, i); // Quarterly compounding
    
    quarterlyEstimates.push({
      quarter: `${getMonthName(quarter)}${year}`,
      eps: Number(projectedQuarterlyEPS.toFixed(2)),
      change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(0)}%`,
      sales: Number((projectedSales / 1e9).toFixed(1)), // Convert to billions
      salesChange: `${revenueGrowthRate >= 0 ? '+' : ''}${Math.round(revenueGrowthRate / 4)}%`
    });
  }

  function getMonthName(quarter: number): string {
    const months = ['', 'Mar-', 'Jun-', 'Sep-', 'Dec-'];
    return months[quarter] || 'Mar-';
  }

  return {
    annualEstimates,
    quarterlyEstimates,
    analysisMetrics: {
      revenueGrowthRate: Number(revenueGrowthRate.toFixed(1)),
      netIncomeGrowthRate: Number(netIncomeGrowthRate.toFixed(1)),
      epsGrowthRate: Number(epsGrowthRate.toFixed(1)),
      netMargin: Number(netMargin.toFixed(1)),
      dataQuality: revenueHistory.length >= 12 ? 'Good' : 'Limited'
    }
  };
}
function processFinancialDataServer(facts: any, viewType: string = 'default') {
  if (!facts || !facts['us-gaap']) {
    return { metrics: [], periods: [] };
  }

  const keyMetrics = [
    'Revenues',
    'RevenueFromContractWithCustomerExcludingAssessedTax', 
    'GrossProfit',
    'OperatingIncomeLoss',
    'NetIncomeLoss',
    'EarningsPerShareBasic',
    'EarningsPerShareDiluted',
    'Assets',
    'AssetsCurrent',
    'Liabilities',
    'LiabilitiesCurrent',
    'StockholdersEquity',
    'CashAndCashEquivalentsAtCarryingValue',
    'OperatingCashFlowsFromOperatingActivities'
  ];

  // Income statement specific metrics
  const incomeMetrics = [
    'Revenues',
    'RevenueFromContractWithCustomerExcludingAssessedTax',
    'CostOfRevenue',
    'CostOfGoodsAndServicesSold',
    'GrossProfit',
    'OperatingExpenses',
    'ResearchAndDevelopmentExpense',
    'SellingGeneralAndAdministrativeExpense',
    'OperatingIncomeLoss',
    'InterestExpense',
    'InterestIncome',
    'OtherNonoperatingIncomeExpense',
    'IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments',
    'IncomeTaxExpenseBenefit',
    'NetIncomeLoss',
    'NetIncomeLossAttributableToNoncontrollingInterest',
    'NetIncomeLossAttributableToParent',
    'EarningsPerShareBasic',
    'EarningsPerShareDiluted',
    'WeightedAverageNumberOfSharesOutstandingBasic',
    'WeightedAverageNumberOfDilutedSharesOutstanding'
  ];

  // Balance sheet specific metrics
  const balanceSheetMetrics = [
    'Assets',
    'AssetsCurrent',
    'CashAndCashEquivalentsAtCarryingValue',
    'MarketableSecurities',
    'AccountsReceivableNet',
    'Inventory',
    'PrepaidExpensesAndOtherAssets',
    'PropertyPlantAndEquipmentNet',
    'Goodwill',
    'IntangibleAssetsNet',
    'Investments',
    'OtherAssets',
    'Liabilities',
    'LiabilitiesCurrent',
    'AccountsPayableCurrent',
    'AccruedLiabilitiesCurrent',
    'ShortTermDebt',
    'LongTermDebt',
    'DeferredRevenue',
    'OtherLiabilities',
    'StockholdersEquity',
    'CommonStockValue',
    'RetainedEarningsAccumulatedDeficit',
    'AccumulatedOtherComprehensiveIncomeLoss',
    'TreasuryStockValue'
  ];

  // Cash flow statement specific metrics
  const cashFlowMetrics = [
    'NetCashProvidedByUsedInOperatingActivities',
    'NetIncomeLoss',
    'DepreciationDepletionAndAmortization',
    'StockBasedCompensation',
    'DeferredIncomeTaxExpenseBenefit',
    'ChangesInOperatingAssetsAndLiabilities',
    'IncreaseDecreaseInAccountsReceivable',
    'IncreaseDecreaseInInventories',
    'IncreaseDecreaseInAccountsPayable',
    'NetCashProvidedByUsedInInvestingActivities',
    'PaymentsToAcquirePropertyPlantAndEquipment',
    'PaymentsToAcquireInvestments',
    'ProceedsFromSaleOfInvestments',
    'PaymentsToAcquireBusinessesNetOfCashAcquired',
    'NetCashProvidedByUsedInFinancingActivities',
    'PaymentsOfDividends',
    'PaymentsForRepurchaseOfCommonStock',
    'ProceedsFromIssuanceOfCommonStock',
    'RepaymentsOfDebt',
    'ProceedsFromDebt',
    'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalentsBeginningOfPeriod',
    'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalentsEndOfPeriod'
  ];

  const isDetailedView = viewType === 'detailed' || viewType === 'quarterly' || viewType === 'charts';
  const isIncomeView = viewType === 'income';
  const isBalanceView = viewType === 'balance';
  const isCashFlowView = viewType === 'cashflow';
  
  const metricsToProcess = isDetailedView 
    ? Object.keys(facts['us-gaap']) 
    : isIncomeView 
      ? incomeMetrics
      : isBalanceView
        ? balanceSheetMetrics
        : isCashFlowView
          ? cashFlowMetrics
          : keyMetrics;

  console.log(`Server processing: viewType=${viewType}, isDetailedView=${isDetailedView}, total available metrics=${Object.keys(facts['us-gaap']).length}, processing ${metricsToProcess.length} metrics`);

  const processedMetrics: any[] = [];
  const allPeriods = new Set<string>();

  metricsToProcess.forEach(metricKey => {
    const metric = facts['us-gaap'][metricKey];
    if (!metric || !metric.units) return;

    const units = Object.keys(metric.units);
    const primaryUnit = units.find(unit => unit === 'USD') || units[0];
    
    if (!primaryUnit || !metric.units[primaryUnit]) return;

    const dataPoints = metric.units[primaryUnit]
      .filter((point: any) => point.end && point.val)
      .map((point: any) => {
        const endDate = new Date(point.end);
        const year = endDate.getFullYear();
        const month = endDate.getMonth() + 1;
        const quarter = Math.ceil(month / 3);
        const periodKey = `${year}-Q${quarter}`;
        
        allPeriods.add(periodKey);
        
        return {
          value: point.val,
          period: periodKey,
          date: point.end,
          quarter: `Q${quarter}`,
          year: year.toString()
        };
      })
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (dataPoints.length > 0) {
      processedMetrics.push({
        name: metricKey.replace(/([A-Z])/g, ' $1').trim(),
        description: metric.description || metricKey.replace(/([A-Z])/g, ' $1').trim(),
        unit: primaryUnit,
        dataPoints: dataPoints.slice(-20) // Last 20 quarters
      });
    }
  });

  // Sort periods with latest first (descending order)
  const sortedPeriods = Array.from(allPeriods).sort((a, b) => {
    const [yearA, quarterA] = a.split('-Q');
    const [yearB, quarterB] = b.split('-Q');
    const dateA = parseInt(yearA) * 4 + parseInt(quarterA);
    const dateB = parseInt(yearB) * 4 + parseInt(quarterB);
    return dateB - dateA; // Latest first
  });

  return {
    metrics: processedMetrics,
    periods: sortedPeriods
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'default';
    const upperSymbol = symbol.toUpperCase();

    // Load ticker-CIK mapping
    const tickerPath = path.join(process.cwd(), 'src', 'data', 'company_tickers.json');
    const tickerData = JSON.parse(await readFile(tickerPath, 'utf-8'));
    
    const company = tickerData[upperSymbol];
    if (!company) {
      return NextResponse.json(
        { error: `Ticker ${upperSymbol} not found` },
        { status: 404 }
      );
    }

    // Load and process company facts from persistent storage
    const factsPath = path.join('/var/lib/data', 'companyfacts', `CIK${company.cik}.json`);
    let processedData = null;
    let entityName = null;
    let companyInfo = null;
    
    try {
      const rawData = JSON.parse(await readFile(factsPath, 'utf-8'));
      processedData = processFinancialDataServer(rawData.facts, view);
      entityName = rawData.entityName;
      
      // Extract basic company info for the UI
      companyInfo = {
        entityName: rawData.entityName,
        dei: rawData.facts?.dei || null
      };
    } catch {
      // Financial data not available
    }

    return NextResponse.json({
      ticker: upperSymbol,
      cik: company.cik,
      title: company.title,
      entityName: entityName,
      view: view,
      financialData: processedData ? 'available' : 'not_loaded',
      facts: companyInfo, // Keep basic company info for compatibility
      ...processedData
    });

  } catch (error) {
    console.error('Error fetching ticker data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticker data' },
      { status: 500 }
    );
  }
}
