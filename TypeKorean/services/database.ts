/**
 * Database Service with Auto-Seeding and Versioning
 * Checks if database is empty and seeds from bundled JSON data
 * Uses versioning to handle schema migrations
 *
 * Strategy:
 * 1. On app initialization, check database version
 * 2. Run migrations if needed to update schema
 * 3. If empty or doesn't exist, seed from bundled JSON file
 * 4. This ensures the database is always populated on first launch
 *
 * @format
 */

import { open } from 'react-native-quick-sqlite';

// Database version - increment when schema changes
const DB_VERSION = 3;

// Import JSON data for seeding
const commonWordsData = require('../data/common_words.json') as Array<{
  korean: string;
  english: string;
  emoji?: string;
  imageUrl?: string;
}>;

const lettersData = require('../data/letters.json') as Array<{
  korean: string;
  english: string;
  emoji?: string;
  imageUrl?: string;
}>;

export interface Word {
  id: number;
  korean: string;
  english: string;
  emoji?: string;
  imageUrl?: string;
  vocabulary_set?: string;
}

let db: ReturnType<typeof open> | null = null;

/**
 * Initialize the database
 * This should be called once when the app starts
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Open database
        db = open({ name: 'common_words.db', location: 'default' });
    
    await createVersionTable();
    await migrateDatabase();
    await createTables();
    await seedIfEmpty();
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Create version tracking table
 */
async function createVersionTable(): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  db.execute(`
    CREATE TABLE IF NOT EXISTS db_version (
      version INTEGER PRIMARY KEY
    )
  `);
}

/**
 * Get current database version
 */
function getCurrentVersion(): number {
  if (!db) {
    return 0;
  }

  try {
    const result = db.execute('SELECT version FROM db_version LIMIT 1');
    const row = result.rows?.item(0);
    return row ? (row.version as number) : 0;
  } catch (error) {
    // Table might not exist yet
    return 0;
  }
}

/**
 * Set database version
 */
function setVersion(version: number): void {
  if (!db) {
    return;
  }

  db.execute('DELETE FROM db_version');
  db.execute('INSERT INTO db_version (version) VALUES (?)', [version]);
}

/**
 * Migrate database to latest version
 */
async function migrateDatabase(): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  const currentVersion = getCurrentVersion();
  console.log(`Current database version: ${currentVersion}, Target version: ${DB_VERSION}`);

  if (currentVersion >= DB_VERSION) {
    console.log('Database is up to date');
    return;
  }

  // Migration from version 1 to 2: Add emoji and imageUrl columns
  if (currentVersion < 2) {
    console.log('Migrating database from version 1 to 2...');
    try {
      // Check if columns already exist (in case migration was partially run)
      const tableInfo = db.execute('PRAGMA table_info(words)');
      let hasEmoji = false;
      let hasImageUrl = false;

      if (tableInfo.rows) {
        for (let i = 0; i < tableInfo.rows.length; i++) {
          const column = tableInfo.rows.item(i);
          if (column.name === 'emoji') hasEmoji = true;
          if (column.name === 'imageUrl') hasImageUrl = true;
        }
      }

      if (!hasEmoji) {
        db.execute('ALTER TABLE words ADD COLUMN emoji TEXT');
        console.log('Added emoji column');
      }

      if (!hasImageUrl) {
        db.execute('ALTER TABLE words ADD COLUMN imageUrl TEXT');
        console.log('Added imageUrl column');
      }

      // Update existing rows with emoji data from JSON
      console.log('Updating existing words with emoji data...');
      db.execute('BEGIN TRANSACTION');
      try {
        for (const wordData of commonWordsData) {
          db.execute(
            'UPDATE words SET emoji = ?, imageUrl = ? WHERE korean = ? AND english = ?',
            [wordData.emoji || '', wordData.imageUrl || '', wordData.korean, wordData.english]
          );
        }
        db.execute('COMMIT');
        console.log('Updated existing words with emoji data');
      } catch (error) {
        db.execute('ROLLBACK');
        throw error;
      }

      setVersion(2);
      console.log('Migration to version 2 completed');
    } catch (error) {
      console.error('Error during migration:', error);
      throw error;
    }
  }

  // Migration from version 2 to 3: Add vocabulary_set column
  if (currentVersion < 3) {
    console.log('Migrating database from version 2 to 3...');
    try {
      // Check if vocabulary_set column already exists
      const tableInfo = db.execute('PRAGMA table_info(words)');
      let hasVocabularySet = false;

      if (tableInfo.rows) {
        for (let i = 0; i < tableInfo.rows.length; i++) {
          const column = tableInfo.rows.item(i);
          if (column.name === 'vocabulary_set') hasVocabularySet = true;
        }
      }

      if (!hasVocabularySet) {
        db.execute('ALTER TABLE words ADD COLUMN vocabulary_set TEXT DEFAULT "common-words"');
        console.log('Added vocabulary_set column');
        
        // Update existing rows to have vocabulary_set = 'common-words'
        db.execute('UPDATE words SET vocabulary_set = "common-words" WHERE vocabulary_set IS NULL');
        console.log('Updated existing words with vocabulary_set');
      }

      setVersion(3);
      console.log('Migration to version 3 completed');
    } catch (error) {
      console.error('Error during migration:', error);
      throw error;
    }
  }
}

/**
 * Create database tables
 */
async function createTables(): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  // Create words table (with latest schema)
  db.execute(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      korean TEXT NOT NULL,
      english TEXT NOT NULL,
      emoji TEXT,
      imageUrl TEXT,
      vocabulary_set TEXT DEFAULT "common-words",
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

  console.log(`Seeding ${commonWordsData.length} common words and ${lettersData.length} letters...`);

  // Use transaction for better performance
  db.execute('BEGIN TRANSACTION');

  try {
    const insertQuery = 'INSERT INTO words (korean, english, emoji, imageUrl, vocabulary_set) VALUES (?, ?, ?, ?, ?)';
    
    // Seed common words
    for (const word of commonWordsData) {
      db.execute(insertQuery, [
        word.korean,
        word.english,
        word.emoji || '',
        word.imageUrl || '',
        'common-words',
      ]);
    }

    // Seed letters
    for (const word of lettersData) {
      db.execute(insertQuery, [
        word.korean,
        word.english,
        word.emoji || '',
        word.imageUrl || '',
        'letters',
      ]);
    }

    db.execute('COMMIT');
    console.log(`Successfully seeded ${commonWordsData.length} common words and ${lettersData.length} letters`);
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
        emoji: row.emoji as string | undefined,
        imageUrl: row.imageUrl as string | undefined,
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
        emoji: row.emoji as string | undefined,
        imageUrl: row.imageUrl as string | undefined,
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
/**
 * Get a batch of words from the database
 * @param limit - Number of words to fetch
 * @param offset - Number of words to skip
 * @param vocabularySet - Vocabulary set to filter by (default: 'common-words')
 */
export async function getWordsBatch(
  limit: number = 10,
  offset: number = 0,
  vocabularySet: string = 'common-words',
): Promise<Word[]> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const result = db.execute(
      'SELECT * FROM words WHERE vocabulary_set = ? ORDER BY id LIMIT ? OFFSET ?',
      [vocabularySet, limit, offset],
    );
    const words: Word[] = [];

    if (result.rows) {
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        words.push({
          id: row.id as number,
          korean: row.korean as string,
          english: row.english as string,
          emoji: row.emoji as string | undefined,
          imageUrl: row.imageUrl as string | undefined,
          vocabulary_set: row.vocabulary_set as string | undefined,
        });
      }
    }

    return words;
  } catch (error) {
    console.error('Error getting words batch:', error);
    return [];
  }
}

/**
 * Reset the database - deletes all data and reseeds
 * Useful for development/testing
 */
export async function resetDatabase(): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    console.log('Resetting database...');
    db.execute('DELETE FROM words');
    db.execute('DELETE FROM db_version');
    setVersion(0);
    await migrateDatabase();
    await seedDatabase();
    console.log('Database reset complete');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}

