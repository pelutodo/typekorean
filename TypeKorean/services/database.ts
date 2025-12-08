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

// Word set schema
interface WordSet {
  type: 'word_set';
  name: string;
  displayName: string;
  words: Array<{
    korean: string;
    english: string;
    emoji?: string;
    imageUrl?: string;
  }>;
}

// Import JSON data for seeding
const commonWordsSet = require('../data/common_words.json') as WordSet;
const lettersSet = require('../data/letters.json') as WordSet;

const commonWordsData = commonWordsSet.words;
const lettersData = lettersSet.words;

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
    await createTables(); // Create tables first, then migrate
    await migrateDatabase();
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
      // Note: createTables() is called before migrateDatabase(), so table should exist
      let hasVocabularySet = false;
      try {
        const tableInfo = db.execute('PRAGMA table_info(words)');
        if (tableInfo.rows) {
          for (let i = 0; i < tableInfo.rows.length; i++) {
            const column = tableInfo.rows.item(i);
            if (column.name === 'vocabulary_set') {
              hasVocabularySet = true;
              break;
            }
          }
        }
      } catch (error) {
        // Table might not exist yet (shouldn't happen since createTables is called first, but handle gracefully)
        console.warn('Could not check table info:', error);
      }

      if (!hasVocabularySet) {
        try {
          db.execute('ALTER TABLE words ADD COLUMN vocabulary_set TEXT DEFAULT "common-words"');
          console.log('Added vocabulary_set column');
        } catch (error: any) {
          // Column might already exist
          if (error?.message?.includes('duplicate column')) {
            console.log('Column already exists, skipping ALTER TABLE');
          } else {
            throw error;
          }
        }
      }
      
      // Update existing rows to have vocabulary_set = 'common-words' (in case they're NULL, empty, or undefined)
      try {
        const updateResult = db.execute('UPDATE words SET vocabulary_set = "common-words" WHERE vocabulary_set IS NULL OR vocabulary_set = "" OR vocabulary_set = "undefined"');
        console.log(`Updated existing words with vocabulary_set="common-words" (affected rows: ${updateResult.rowsAffected || 0})`);
      } catch (error) {
        // Table might be empty, that's okay
        console.log('Update existing words failed (table may be empty):', error);
      }
      
      // Check if we need to seed letters
      try {
        const lettersCount = db.execute('SELECT COUNT(*) as count FROM words WHERE vocabulary_set = "letters"');
        const lettersCountValue = lettersCount.rows?.item(0)?.count || 0;
        
        if (lettersCountValue === 0) {
          console.log('Seeding letters vocabulary set...');
          db.execute('BEGIN TRANSACTION');
          try {
            const insertQuery = 'INSERT INTO words (korean, english, emoji, imageUrl, vocabulary_set) VALUES (?, ?, ?, ?, ?)';
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
            console.log(`Seeded ${lettersData.length} letters`);
          } catch (error) {
            db.execute('ROLLBACK');
            console.error('Error seeding letters:', error);
          }
        }
      } catch (error) {
        // Table might be empty, that's okay - seeding will happen in seedIfEmpty
        console.log('Letters count check failed (table may be empty):', error);
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
      vocabulary_set TEXT,
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
      
      // Verify vocabulary_set values are set correctly
      const commonWordsCount = db.execute('SELECT COUNT(*) as count FROM words WHERE vocabulary_set = "common-words"');
      const lettersCount = db.execute('SELECT COUNT(*) as count FROM words WHERE vocabulary_set = "letters"');
      const nullCount = db.execute('SELECT COUNT(*) as count FROM words WHERE vocabulary_set IS NULL OR vocabulary_set = "" OR vocabulary_set = "undefined"');
      
      const commonCount = commonWordsCount.rows?.item(0)?.count || 0;
      const lettersCountValue = lettersCount.rows?.item(0)?.count || 0;
      const nullCountValue = nullCount.rows?.item(0)?.count || 0;
      
      console.log(`Vocabulary set counts - "Common Words" (common-words): ${commonCount}, "Letters" (letters): ${lettersCountValue}, NULL/empty/undefined: ${nullCountValue}`);
      
      // Fix NULL/empty/undefined values first
      if (nullCountValue > 0) {
        console.log('Fixing vocabulary_set values...');
        const updateResult = db.execute('UPDATE words SET vocabulary_set = "common-words" WHERE vocabulary_set IS NULL OR vocabulary_set = "" OR vocabulary_set = "undefined"');
        console.log(`Updated ${updateResult.rowsAffected || nullCountValue} words to have vocabulary_set="common-words"`);
      }
      
      // Check if common words need to be seeded
      if (commonCount === 0) {
        console.log('Seeding "Common Words" vocabulary set...');
        db.execute('BEGIN TRANSACTION');
        try {
          const insertQuery = 'INSERT INTO words (korean, english, emoji, imageUrl, vocabulary_set) VALUES (?, ?, ?, ?, ?)';
          for (const word of commonWordsData) {
            db.execute(insertQuery, [
              word.korean,
              word.english,
              word.emoji || '',
              word.imageUrl || '',
              'common-words',
            ]);
          }
          db.execute('COMMIT');
          console.log(`Seeded ${commonWordsData.length} words from "Common Words" (vocabulary_set: common-words)`);
        } catch (error) {
          db.execute('ROLLBACK');
          console.error('Error seeding common words:', error);
        }
      }
      
      // Check if letters need to be seeded
      if (lettersCountValue === 0) {
        console.log('Seeding "Letters" vocabulary set...');
        db.execute('BEGIN TRANSACTION');
        try {
          const insertQuery = 'INSERT INTO words (korean, english, emoji, imageUrl, vocabulary_set) VALUES (?, ?, ?, ?, ?)';
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
          console.log(`Seeded ${lettersData.length} words from "Letters" (vocabulary_set: letters)`);
        } catch (error) {
          db.execute('ROLLBACK');
          console.error('Error seeding letters:', error);
        }
      }
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

  console.log(`Seeding ${commonWordsData.length} words from "${commonWordsSet.displayName}" and ${lettersData.length} words from "${lettersSet.displayName}"...`);

  // Use transaction for better performance
  db.execute('BEGIN TRANSACTION');

  try {
    const insertQuery = 'INSERT INTO words (korean, english, emoji, imageUrl, vocabulary_set) VALUES (?, ?, ?, ?, ?)';
    
    // Seed common words with hardcoded vocabulary_set name
    for (const word of commonWordsData) {
      db.execute(insertQuery, [
        word.korean,
        word.english,
        word.emoji || '',
        word.imageUrl || '',
        'common-words',
      ]);
    }

    // Seed letters with hardcoded vocabulary_set name
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
    console.log(`Successfully seeded ${commonWordsData.length} words from "Common Words" (vocabulary_set: common-words) and ${lettersData.length} words from "Letters" (vocabulary_set: letters)`);
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
    // First, check total word count for debugging
    const totalCount = db.execute('SELECT COUNT(*) as count FROM words');
    const totalWords = totalCount.rows?.item(0)?.count || 0;
    console.log(`getWordsBatch: Total words in database: ${totalWords}`);
    
    // Debug: Check what vocabulary_set values actually exist
    if (totalWords > 0) {
      const vocabSetCheck = db.execute('SELECT DISTINCT vocabulary_set, COUNT(*) as count FROM words GROUP BY vocabulary_set');
      console.log('getWordsBatch: Vocabulary sets in database:');
      if (vocabSetCheck.rows) {
        for (let i = 0; i < vocabSetCheck.rows.length; i++) {
          const row = vocabSetCheck.rows.item(i);
          const vocabSet = row.vocabulary_set;
          const count = row.count;
          console.log(`  - vocabulary_set="${vocabSet}" (or ${typeof vocabSet}): ${count} words`);
        }
      }
      
      // Also check for NULL/empty/undefined explicitly
      const nullCheck = db.execute('SELECT COUNT(*) as count FROM words WHERE vocabulary_set IS NULL');
      const emptyCheck = db.execute('SELECT COUNT(*) as count FROM words WHERE vocabulary_set = ""');
      const undefinedCheck = db.execute('SELECT COUNT(*) as count FROM words WHERE vocabulary_set = "undefined"');
      console.log(`getWordsBatch: NULL vocabulary_set: ${nullCheck.rows?.item(0)?.count || 0}`);
      console.log(`getWordsBatch: Empty string vocabulary_set: ${emptyCheck.rows?.item(0)?.count || 0}`);
      console.log(`getWordsBatch: "undefined" string vocabulary_set: ${undefinedCheck.rows?.item(0)?.count || 0}`);
    }
    
    // Check count for this vocabulary set - exact match only
    const countQuery = 'SELECT COUNT(*) as count FROM words WHERE vocabulary_set = ?';
    const setCount = db.execute(countQuery, [vocabularySet]);
    const setWordsCount = setCount.rows?.item(0)?.count || 0;
    console.log(`getWordsBatch: Words in vocabulary_set="${vocabularySet}": ${setWordsCount}`);
    
    // Query for the specific vocabulary set - exact match only
    const query = 'SELECT * FROM words WHERE vocabulary_set = ? ORDER BY id LIMIT ? OFFSET ?';
    const params = [vocabularySet, limit, offset];
    
    const result = db.execute(query, params);
    const words: Word[] = [];

    if (result.rows) {
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        const vocabSet = row.vocabulary_set as string | undefined;
        
        // Safety check: must match exactly
        if (vocabSet !== vocabularySet) {
          console.warn(`getWordsBatch: Skipping word "${row.korean}" - vocabulary_set mismatch. Expected "${vocabularySet}", got "${vocabSet}"`);
          continue;
        }
        
        words.push({
          id: row.id as number,
          korean: row.korean as string,
          english: row.english as string,
          emoji: row.emoji as string | undefined,
          imageUrl: row.imageUrl as string | undefined,
          vocabulary_set: vocabSet,
        });
      }
    }

    console.log(`getWordsBatch: Returning ${words.length} words for vocabulary_set="${vocabularySet}" (limit=${limit}, offset=${offset})`);
    
    // Log first few words for debugging
    if (words.length > 0) {
      console.log(`getWordsBatch: First word: ${words[0].korean} (vocabulary_set: ${words[0].vocabulary_set || 'NULL/empty'})`);
    } else {
      console.warn(`getWordsBatch: No words found for vocabulary_set="${vocabularySet}"`);
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

