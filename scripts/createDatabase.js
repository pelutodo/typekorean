/**
 * Script to convert Korean words CSV to SQLite3 database
 */

const fs = require('fs');
const path = require('path');

// Check if better-sqlite3 is available, otherwise use sqlite3
let Database;
try {
  Database = require('better-sqlite3');
} catch (e) {
  try {
    const sqlite3 = require('sqlite3').verbose();
    // Wrap sqlite3 in a promise-based interface for consistency
    Database = class {
      constructor(dbPath) {
        this.db = new sqlite3.Database(dbPath);
      }
      exec(sql) {
        return new Promise((resolve, reject) => {
          this.db.exec(sql, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      prepare(sql) {
        const stmt = this.db.prepare(sql);
        return {
          run: (...params) => {
            return new Promise((resolve, reject) => {
              stmt.run(...params, function(err) {
                if (err) reject(err);
                else resolve({ lastInsertRowid: this.lastID });
              });
            });
          }
        };
      }
      close() {
        return new Promise((resolve, reject) => {
          this.db.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    };
  } catch (e2) {
    console.error('Please install better-sqlite3 or sqlite3:');
    console.error('  npm install better-sqlite3');
    console.error('  or');
    console.error('  npm install sqlite3');
    process.exit(1);
  }
}

async function createDatabase() {
  const csvPath = path.join(__dirname, '../data/common_words.csv');
  const dbPath = path.join(__dirname, '../data/common_words.db');

  // Read CSV file
  console.log('Reading CSV file...');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');
  
  // Skip header row
  const dataLines = lines.slice(1);
  
  console.log(`Found ${dataLines.length} words to import`);

  // Remove existing database if it exists
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Removed existing database');
  }

  // Create database
  console.log('Creating SQLite database...');
  const db = new Database(dbPath);

  // Create table
  db.exec(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      korean TEXT NOT NULL,
      english TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create index for faster lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_korean ON words(korean)
  `);

  // Prepare insert statement
  const insertStmt = db.prepare('INSERT INTO words (korean, english) VALUES (?, ?)');

  // Insert data
  console.log('Inserting words...');
  let inserted = 0;
  
  for (const line of dataLines) {
    // Handle CSV parsing (simple split, but should handle quoted values)
    const match = line.match(/^(.+?),(.+)$/);
    if (match) {
      const korean = match[1].trim();
      const english = match[2].trim();
      
      if (korean && english) {
        await insertStmt.run(korean, english);
        inserted++;
        
        if (inserted % 50 === 0) {
          console.log(`  Inserted ${inserted} words...`);
        }
      }
    }
  }

  // Close database
  await db.close();

  console.log(`\n✅ Successfully created database with ${inserted} words!`);
  console.log(`   Database location: ${dbPath}`);
}

// Run the script
createDatabase().catch((error) => {
  console.error('Error creating database:', error);
  process.exit(1);
});

