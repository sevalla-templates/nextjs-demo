#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Key financial metrics that your app uses
const KEY_METRICS = [
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
  'OperatingCashFlowsFromOperatingActivities',
  // Additional common metrics for completeness
  'OperatingExpenses',
  'ResearchAndDevelopmentExpense',
  'SellingGeneralAndAdministrativeExpense',
  'InterestExpense',
  'IncomeTaxExpenseBenefit',
  'DepreciationDepletionAndAmortization',
  'PropertyPlantAndEquipmentNet',
  'Goodwill',
  'LongTermDebt',
  'ShortTermInvestments',
  'AccountsReceivableNetCurrent',
  'InventoryNet',
  'AccountsPayableCurrent',
  'DividendsCommonStockCash',
  'WeightedAverageNumberOfSharesOutstandingBasic',
  'WeightedAverageNumberOfDilutedSharesOutstanding'
];

function processFinancialData(rawData) {
  const processedData = {
    cik: rawData.cik,
    entityName: rawData.entityName,
    processedAt: new Date().toISOString(),
    facts: {}
  };

  // Process US-GAAP facts
  if (rawData.facts && rawData.facts['us-gaap']) {
    processedData.facts['us-gaap'] = {};
    
    KEY_METRICS.forEach(metricKey => {
      const metric = rawData.facts['us-gaap'][metricKey];
      if (!metric || !metric.units) return;

      // Find the most common unit (usually USD)
      const units = Object.keys(metric.units);
      const primaryUnit = units.find(unit => unit === 'USD') || units[0];
      
      if (!primaryUnit || !metric.units[primaryUnit]) return;

      // Process and deduplicate data points
      const rawDataPoints = metric.units[primaryUnit]
        .filter(point => point.end && point.val !== undefined && point.val !== null)
        .map(point => {
          const endDate = new Date(point.end);
          const year = endDate.getFullYear();
          const month = endDate.getMonth() + 1;
          const quarter = Math.ceil(month / 3);
          const periodKey = `${year}-Q${quarter}`;
          
          return {
            value: point.val,
            period: periodKey,
            end: point.end,
            quarter: `Q${quarter}`,
            year: year.toString(),
            filed: point.filed || point.end,
            form: point.form
          };
        });

      // Deduplicate by period, keeping the most recently filed data
      const periodMap = new Map();
      rawDataPoints.forEach(point => {
        const existing = periodMap.get(point.period);
        if (!existing || (point.filed && existing.filed && new Date(point.filed).getTime() > new Date(existing.filed).getTime())) {
          periodMap.set(point.period, point);
        }
      });

      const dataPoints = Array.from(periodMap.values())
        .sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime());

      if (dataPoints.length > 0) {
        processedData.facts['us-gaap'][metricKey] = {
          description: metric.description || '',
          unit: primaryUnit,
          dataPoints: dataPoints
        };
      }
    });
  }

  // Process DEI (Document and Entity Information) facts if available
  if (rawData.facts && rawData.facts.dei) {
    processedData.facts.dei = {};
    
    // Key DEI metrics
    const deiMetrics = [
      'EntityRegistrantName',
      'EntityCentralIndexKey',
      'EntityFilerCategory',
      'EntityPublicFloat',
      'EntityCommonStockSharesOutstanding',
      'DocumentPeriodEndDate',
      'DocumentFiscalYearEnd',
      'DocumentType'
    ];

    deiMetrics.forEach(metricKey => {
      const metric = rawData.facts.dei[metricKey];
      if (!metric || !metric.units) return;

      const units = Object.keys(metric.units);
      const primaryUnit = units[0];
      
      if (!primaryUnit || !metric.units[primaryUnit]) return;

      const latestDataPoint = metric.units[primaryUnit]
        .filter(point => point.end && point.val !== undefined && point.val !== null)
        .sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime())[0];

      if (latestDataPoint) {
        processedData.facts.dei[metricKey] = {
          description: metric.description || '',
          unit: primaryUnit,
          value: latestDataPoint.val,
          end: latestDataPoint.end,
          filed: latestDataPoint.filed
        };
      }
    });
  }

  return processedData;
}

async function processAllFiles() {
  const inputDir = path.join(process.cwd(), 'data', 'companyfacts');
  const outputDir = path.join(process.cwd(), 'data', 'processed');

  console.log('📁 Processing SEC company facts files...');
  console.log(`Input directory: ${inputDir}`);
  console.log(`Output directory: ${outputDir}`);

  try {
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });
    
    // Read all CIK files
    const files = await fs.readdir(inputDir);
    const cikFiles = files.filter(file => file.startsWith('CIK') && file.endsWith('.json'));
    
    console.log(`Found ${cikFiles.length} CIK files to process`);
    
    let processed = 0;
    let errors = 0;
    
    for (const file of cikFiles) {
      try {
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, file);
        
        // Read raw data
        const rawData = JSON.parse(await fs.readFile(inputPath, 'utf-8'));
        
        // Process and extract essential data
        const processedData = processFinancialData(rawData);
        
        // Write processed data
        await fs.writeFile(outputPath, JSON.stringify(processedData, null, 2));
        
        processed++;
        
        if (processed % 100 === 0) {
          console.log(`✓ Processed ${processed}/${cikFiles.length} files...`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n🎉 Processing completed!');
    console.log(`✅ Successfully processed: ${processed} files`);
    console.log(`❌ Errors: ${errors} files`);
    
    // Calculate size reduction
    const inputStats = await fs.stat(inputDir);
    const outputStats = await fs.stat(outputDir);
    
    console.log('\n📊 Results:');
    console.log(`📂 Processed files location: ${outputDir}`);
    console.log(`💾 Files contain only essential financial metrics`);
    console.log(`🔧 Ready for your app to use!`);
    
  } catch (error) {
    console.error('❌ Processing failed:', error.message);
    process.exit(1);
  }
}

// Run the processing
processAllFiles();
