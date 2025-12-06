/**
 * Database Service with Auto-Seeding
 * Checks if database is empty and seeds from bundled JSON data
 *
 * Strategy:
 * 1. On app initialization, check if database exists and has data
 * 2. If empty or doesn't exist, seed from bundled JSON file
 * 3. This ensures the database is always populated on first launch
 *
 * @format
 */

import { open } from 'react-native-quick-sqlite';

// Import JSON data for seeding
const koreanWordsData = require('../data/korean_words.json') as Array<{
  korean: string;
  english: string;
}>;

export interface Word {
  id: number;
  korean: string;
  english: string;
}

let db: ReturnType<typeof open> | null = null;

/**
 * Initialize the database
 * This should be called once when the app starts
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Open database
    db = open({ name: 'korean_words.db', location: 'default' });
    
    await createTables();
    await seedIfEmpty();
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Create database tables
 */
async function createTables(): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  // Create words table
  db.execute(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      korean TEXT NOT NULL,
      english TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create index for faster lookups
  db.execute(`CREATE INDEX IF NOT EXISTS idx_korean ON words(korean)`);

  console.log('Database tables created');
}

/**
 * Check if database is empty and seed if needed
 */
async function seedIfEmpty(): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    // Check if words table is empty
    const result = db.execute('SELECT COUNT(*) as count FROM words');
    const count = result.rows?.item(0)?.count || 0;
    
    if (count === 0) {
      console.log('Database is empty, seeding...');
      await seedDatabase();
      console.log('Database seeded successfully');
    } else {
      console.log(`Database already has ${count} words, skipping seed`);
    }
  } catch (error) {
    console.error('Error checking/seeding database:', error);
    // If there's an error, try to seed anyway (might be first run)
    await seedDatabase();
  }
}

/**
 * Seed the database with Korean words from JSON
 */
async function seedDatabase(): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  console.log(`Seeding ${koreanWordsData.length} words...`);

  // Use transaction for better performance
  db.execute('BEGIN TRANSACTION');

  try {
    const insertQuery = 'INSERT INTO words (korean, english) VALUES (?, ?)';
    
    for (const word of koreanWordsData) {
      db.execute(insertQuery, [word.korean, word.english]);
    }

    db.execute('COMMIT');
    console.log(`Successfully seeded ${koreanWordsData.length} words`);
  } catch (error) {
    db.execute('ROLLBACK');
    console.error('Error seeding database:', error);
    throw error;
  }
}

/**
 * Get a random word from the database
 */
export async function getRandomWord(): Promise<Word | null> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const result = db.execute('SELECT * FROM words ORDER BY RANDOM() LIMIT 1');
    const row = result.rows?.item(0);
    
    if (row) {
      return {
        id: row.id as number,
        korean: row.korean as string,
        english: row.english as string,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting random word:', error);
    return null;
  }
}

/**
 * Get a word by ID
 */
export async function getWordById(id: number): Promise<Word | null> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const result = db.execute('SELECT * FROM words WHERE id = ?', [id]);
    const row = result.rows?.item(0);
    
    if (row) {
      return {
        id: row.id as number,
        korean: row.korean as string,
        english: row.english as string,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting word by ID:', error);
    return null;
  }
}

/**
 * Get all words (for testing/debugging)
 */
export async function getAllWords(): Promise<Word[]> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const result = db.execute('SELECT * FROM words');
    const words: Word[] = [];
    
    if (result.rows) {
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        words.push({
          id: row.id as number,
          korean: row.korean as string,
          english: row.english as string,
        });
      }
    }
    
    return words;
  } catch (error) {
    console.error('Error getting all words:', error);
    return [];
  }
}

/**
 * Get word count
 */
export async function getWordCount(): Promise<number> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const result = db.execute('SELECT COUNT(*) as count FROM words');
    return (result.rows?.item(0)?.count as number) || 0;
  } catch (error) {
    console.error('Error getting word count:', error);
    return 0;
  }
}

/**
 * Get words in batches (pagination)
 * @param limit - Number of words to fetch
 * @param offset - Number of words to skip
 */
export async function getWordsBatch(
  limit: number = 10,
  offset: number = 0,
): Promise<Word[]> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const result = db.execute(
      'SELECT * FROM words ORDER BY id LIMIT ? OFFSET ?',
      [limit, offset],
    );
    const words: Word[] = [];

    if (result.rows) {
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        words.push({
          id: row.id as number,
          korean: row.korean as string,
          english: row.english as string,
        });
      }
    }

    return words;
  } catch (error) {
    console.error('Error getting words batch:', error);
    return [];
  }
}

