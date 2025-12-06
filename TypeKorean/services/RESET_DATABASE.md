# Resetting the Database

## How to Reset Your Local Database

There are several ways to reset the database:

### Option 1: Delete the Database File (iOS Simulator)

1. Stop your app if it's running
2. Open Finder and navigate to:
   ```
   ~/Library/Developer/CoreSimulator/Devices/[DEVICE_ID]/data/Containers/Data/Application/[APP_ID]/Documents/
   ```
3. Find and delete `korean_words.db`
4. Restart the app - it will automatically recreate and seed the database

### Option 2: Use the Reset Function (Programmatic)

You can call the `resetDatabase()` function from your app code:

```typescript
import { resetDatabase } from './services/database';

// Call this when you want to reset
await resetDatabase();
```

### Option 3: Delete App and Reinstall

1. Delete the app from the simulator/device
2. Rebuild and reinstall the app
3. The database will be created fresh on first launch

### Option 4: Clear App Data (iOS Simulator)

1. In Xcode, go to Device → Erase All Content and Settings
2. Or use the simulator menu: Device → Erase All Content and Settings

## Database Versioning

The database uses versioning to handle schema migrations:

- **Version 1**: Initial schema (korean, english)
- **Version 2**: Added emoji and imageUrl columns

When you update the app, migrations will automatically run to update your existing database schema.

## Manual Migration

If you need to manually trigger a migration, the database will automatically migrate when you call `initializeDatabase()`. The migration system will:

1. Check the current database version
2. Run any necessary migrations
3. Update the version number

