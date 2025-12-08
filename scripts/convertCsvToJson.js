/**
 * Convert Korean words CSV to JSON for bundling with the app
 * Outputs in word_set schema: { type: "word_set", id: string, displayName: string, words: array }
 */

const fs = require('fs');
const path = require('path');

function convertCsvToJson(csvFileName, setName, displayName) {
  const csvPath = path.join(__dirname, '../data', csvFileName);
  const jsonFileName = csvFileName.replace('.csv', '.json');
  const jsonPath = path.join(__dirname, '../TypeKorean/data', jsonFileName);

  console.log(`Reading CSV file: ${csvFileName}...`);
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

  // Write JSON file with word_set schema
  const wordSet = {
    type: 'word_set',
    name: setName,
    displayName: displayName,
    words: words
  };
  
  fs.writeFileSync(jsonPath, JSON.stringify(wordSet, null, 2), 'utf-8');
  
  console.log(`✅ Converted ${words.length} words to JSON`);
  console.log(`   Output: ${jsonPath}`);
  console.log(`   Schema: word_set (name: ${setName}, displayName: ${displayName})`);
}

// Convert both files
convertCsvToJson('common_words.csv', 'common-words', 'Common Words');
convertCsvToJson('letters.csv', 'letters', 'Letters');

