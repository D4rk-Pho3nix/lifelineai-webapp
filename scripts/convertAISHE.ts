import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

// Note: To use this script, place the AISHE HEI dataset as 'aishe_institutions.csv' in the 'data' folder
// Then execute with: npx tsx scripts/convertAISHE.ts

const csvFilePath = path.join(process.cwd(), 'data', 'aishe_institutions.csv');
const jsonFilePath = path.join(process.cwd(), 'data', 'indianColleges.json');

const results: Array<{ name: string; state: string; district: string }> = [];

console.log('Reading AISHE dataset from:', csvFilePath);

if (!fs.existsSync(csvFilePath)) {
  console.error("Error: Could not find aishe_institutions.csv in the data directory.");
  console.error("Please download it from https://aishe.gov.in/aishe/downloadData and place it in the data/ folder.");
  process.exit(1);
}

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (data) => {
    // Attempting to match the common CSV headers from AISHE. 
    // They may sometimes vary slightly (e.g., 'Institution_Name' instead of 'Institution Name')
    const name = data['Institution Name'] || data['Institution_Name'] || data['name'] || "Unknown Institution";
    const state = data['State'] || data['state'] || "Unknown State";
    const district = data['District'] || data['district'] || "Unknown District";
    
    if (name) {
      results.push({
        name: name.trim(),
        state: state.trim(),
        district: district.trim(),
      });
    }
  })
  .on('end', () => {
    fs.writeFileSync(jsonFilePath, JSON.stringify(results, null, 2));
    console.log(`Successfully converted ${results.length} institutions to ${jsonFilePath}`);
  });
