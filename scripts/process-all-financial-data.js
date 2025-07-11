#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Input and output directories
const INPUT_DIR = path.join(__dirname, '..', 'data', 'companyfacts');
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'processed');

/**
 * Extract ALL financial metrics from SEC companyfacts JSON files
 * Preserves all historical data for detailed (/ticker.d) and quarterly (/ticker.q) views
 * Creates smaller files by removing only non-essential metadata
 */

async function processFinancialData() {
  console.log('🚀 Starting comprehensive financial data extraction...');
  console.log('📊 Extracting ALL metrics for detailed and quarterly views...');
  
  try {
    // Create output directory
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`✓ Created output directory: ${OUTPUT_DIR}`);
    
    // Get all CIK files
    const files = await fs.readdir(INPUT_DIR);
    const cikFiles = files.filter(file => file.startsWith('CIK') && file.endsWith('.json'));
    
    console.log(`📁 Found ${cikFiles.length} CIK files to process`);
    
    let processed = 0;
    let errors = 0;
    let totalMetricsFound = 0;
    
    for (const filename of cikFiles) {
      try {
        const metricsCount = await processSingleFile(filename);
        totalMetricsFound += metricsCount;
        processed++;
        
        if (processed % 100 === 0) {
          console.log(`📊 Processed ${processed}/${cikFiles.length} files...`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${filename}:`, error.message);
        errors++;
      }
    }
    
    console.log(`🎉 Processing completed!`);
    console.log(`✅ Successfully processed: ${processed} files`);
    console.log(`📈 Total metrics extracted: ${totalMetricsFound}`);
    console.log(`❌ Errors: ${errors} files`);
    
    // Calculate space savings
    const originalSize = await getFolderSize(INPUT_DIR);
    const processedSize = await getFolderSize(OUTPUT_DIR);
    const savings = originalSize > 0 ? ((originalSize - processedSize) / originalSize * 100).toFixed(1) : 0;
    
    console.log(`💾 Original size: ${(originalSize / 1024 / 1024).toFixed(1)} MB`);
    console.log(`💾 Processed size: ${(processedSize / 1024 / 1024).toFixed(1)} MB`);
    console.log(`🎯 Space savings: ${savings}%`);
    
  } catch (error) {
    console.error('❌ Processing failed:', error);
    process.exit(1);
  }
}

async function processSingleFile(filename) {
  const inputPath = path.join(INPUT_DIR, filename);
  const outputPath = path.join(OUTPUT_DIR, filename);
  
  // Read original file
  const rawData = await fs.readFile(inputPath, 'utf-8');
  const companyData = JSON.parse(rawData);
  
  // Extract ALL financial data while keeping structure clean
  const processedData = {
    cik: companyData.cik,
    entityName: companyData.entityName,
    facts: {}
  };
  
  let metricsCount = 0;
  
  // Extract ALL US-GAAP metrics (this is where the financial data lives)
  if (companyData.facts && companyData.facts['us-gaap']) {
    processedData.facts['us-gaap'] = {};
    
    for (const [metricKey, metricData] of Object.entries(companyData.facts['us-gaap'])) {
      // Keep ALL metrics but clean the data structure
      if (metricData && metricData.units) {
        processedData.facts['us-gaap'][metricKey] = {
          label: metricData.label,
          description: metricData.description,
          units: {}
        };
        
        // Process all unit types (USD, shares, etc.)
        for (const [unitType, values] of Object.entries(metricData.units)) {
          if (Array.isArray(values) && values.length > 0) {
            // Clean and sort the values by date
            processedData.facts['us-gaap'][metricKey].units[unitType] = values
              .filter(item => item.val !== null && item.val !== undefined)
              .map(item => ({
                end: item.end,
                val: item.val,
                accn: item.accn,
                fy: item.fy,
                fp: item.fp,
                form: item.form,
                filed: item.filed,
                frame: item.frame
              }))
              .sort((a, b) => new Date(a.end) - new Date(b.end));
            
            metricsCount++;
          }
        }
        
        // Remove empty units
        if (Object.keys(processedData.facts['us-gaap'][metricKey].units).length === 0) {
          delete processedData.facts['us-gaap'][metricKey];
        }
      }
    }
  }
  
  // Extract ALL DEI (Document and Entity Information) - includes important company details
  if (companyData.facts && companyData.facts.dei) {
    processedData.facts.dei = {};
    
    for (const [metricKey, metricData] of Object.entries(companyData.facts.dei)) {
      if (metricData && metricData.units) {
        processedData.facts.dei[metricKey] = {
          label: metricData.label,
          description: metricData.description,
          units: {}
        };
        
        for (const [unitType, values] of Object.entries(metricData.units)) {
          if (Array.isArray(values) && values.length > 0) {
            processedData.facts.dei[metricKey].units[unitType] = values
              .filter(item => item.val !== null && item.val !== undefined)
              .map(item => ({
                end: item.end,
                val: item.val,
                accn: item.accn,
                fy: item.fy,
                fp: item.fp,
                form: item.form,
                filed: item.filed,
                frame: item.frame
              }))
              .sort((a, b) => new Date(a.end) - new Date(b.end));
          }
        }
        
        if (Object.keys(processedData.facts.dei[metricKey].units).length === 0) {
          delete processedData.facts.dei[metricKey];
        }
      }
    }
  }
  
  // Extract IFRS metrics if they exist (for international companies)
  if (companyData.facts && companyData.facts['ifrs-full']) {
    processedData.facts['ifrs-full'] = {};
    
    for (const [metricKey, metricData] of Object.entries(companyData.facts['ifrs-full'])) {
      if (metricData && metricData.units) {
        processedData.facts['ifrs-full'][metricKey] = {
          label: metricData.label,
          description: metricData.description,
          units: {}
        };
        
        for (const [unitType, values] of Object.entries(metricData.units)) {
          if (Array.isArray(values) && values.length > 0) {
            processedData.facts['ifrs-full'][metricKey].units[unitType] = values
              .filter(item => item.val !== null && item.val !== undefined)
              .map(item => ({
                end: item.end,
                val: item.val,
                accn: item.accn,
                fy: item.fy,
                fp: item.fp,
                form: item.form,
                filed: item.filed,
                frame: item.frame
              }))
              .sort((a, b) => new Date(a.end) - new Date(b.end));
            
            metricsCount++;
          }
        }
        
        if (Object.keys(processedData.facts['ifrs-full'][metricKey].units).length === 0) {
          delete processedData.facts['ifrs-full'][metricKey];
        }
      }
    }
  }
  
  // Write processed file
  await fs.writeFile(outputPath, JSON.stringify(processedData, null, 2));
  
  return metricsCount;
}

async function getFolderSize(folderPath) {
  let totalSize = 0;
  
  try {
    const files = await fs.readdir(folderPath);
    
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile()) {
        totalSize += stats.size;
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not calculate size for ${folderPath}`);
  }
  
  return totalSize;
}

// Run the processing
if (require.main === module) {
  processFinancialData();
}

module.exports = { processFinancialData };
