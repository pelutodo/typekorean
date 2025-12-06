# Database Service - Auto-Seeding Strategy

## Overview

The database service implements an auto-seeding strategy that ensures the database is populated on first launch.

## Strategy

1. **Initialization**: When the app starts, `initializeDatabase()` is called
2. **Table Creation**: Creates the `words` table if it doesn't exist
3. **Empty Check**: Checks if the `words` table is empty
4. **Auto-Seed**: If empty, seeds the database from the bundled JSON file (`korean_words.json`)
5. **Skip if Populated**: If data exists, skips seeding (only seeds once)

## Benefits

- ✅ Database is always ready on first launch
- ✅ No manual seeding required
- ✅ Fast - only checks count, not full table scan
- ✅ Idempotent - safe to call multiple times
- ✅ Works offline - data is bundled with the app

## Implementation

### Current State
- Uses JSON file as data source (works without SQLite)
- Ready to integrate with SQLite library

### To Complete SQLite Integration

1. Install a React Native SQLite library:
   ```bash
   npm install react-native-quick-sqlite
   # or
   npm install react-native-sqlite-storage
   ```

2. Update `database.ts`:
   - Replace TODO comments with actual SQLite code
   - Uncomment and adapt the example SQL statements

3. The seeding logic will automatically work once SQLite is integrated

## Usage

```typescript
import { initializeDatabase, getRandomWord } from './services/database';

// On app startup
await initializeDatabase();

// Get a random word
const word = await getRandomWord();
```

## Data Source

The Korean words are stored in:
- **Source**: `data/korean_words.csv` (514 words)
- **Bundled**: `TypeKorean/data/korean_words.json` (converted for app bundling)

