/**
 * Convert Korean words CSV to JSON for bundling with the app
 */

const fs = require('fs');
const path = require('path');

function convertCsvToJson() {
  const csvPath = path.join(__dirname, '../data/korean_words.csv');
  const jsonPath = path.join(__dirname, '../TypeKorean/data/korean_words.json');

  console.log('Reading CSV file...');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');
  
  // Skip header row
  const dataLines = lines.slice(1);
  
  const words = [];
  
  for (const line of dataLines) {
    // Handle CSV parsing - now supports korean,english,emoji,imageUrl
    const parts = line.split(',');
    if (parts.length >= 2) {
      const korean = parts[0].trim();
      const english = parts[1].trim();
      const emoji = parts[2]?.trim() || '';
      const imageUrl = parts[3]?.trim() || '';
      
      if (korean && english) {
        words.push({ korean, english, emoji, imageUrl });
      }
    }
  }

  // Ensure directory exists
  const jsonDir = path.dirname(jsonPath);
  if (!fs.existsSync(jsonDir)) {
    fs.mkdirSync(jsonDir, { recursive: true });
  }

  // Write JSON file
  fs.writeFileSync(jsonPath, JSON.stringify(words, null, 2), 'utf-8');
  
  console.log(`✅ Converted ${words.length} words to JSON`);
  console.log(`   Output: ${jsonPath}`);
}

convertCsvToJson();

