# Firebase Firestore Indexes Required

## Composite Indexes Needed

### 1. tickerChat Collection
**Purpose**: For real-time chat messages filtered by ticker and ordered by timestamp
```
Collection: tickerChat
Fields: 
- ticker (Ascending)
- timestamp (Descending)
Query Scope: Collection
```

### 2. predictions Collection (by ticker)
**Purpose**: For community predictions page filtered by ticker and ordered by timestamp
```
Collection: predictions
Fields:
- ticker (Ascending) 
- timestamp (Descending)
Query Scope: Collection
```

### 3. predictions Collection (by userId)
**Purpose**: For user profile page showing user's predictions ordered by timestamp
```
Collection: predictions
Fields:
- userId (Ascending)
- timestamp (Descending)
Query Scope: Collection
```

### 4. predictionComments Collection
**Purpose**: For comments on predictions filtered by ticker and ordered by timestamp
```
Collection: predictionComments
Fields:
- ticker (Ascending)
- timestamp (Ascending)
Query Scope: Collection
```

### 5. votes Collection (by ticker)
**Purpose**: For voting data filtered by ticker and ordered by timestamp
```
Collection: votes
Fields:
- ticker (Ascending)
- timestamp (Descending)
Query Scope: Collection
```

### 6. votes Collection (by userId)
**Purpose**: For user voting history
```
Collection: votes
Fields:
- userId (Ascending)
- timestamp (Descending)
Query Scope: Collection
```

## How to Create These Indexes

### Method 1: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `thebottomtick`
3. Navigate to Firestore Database
4. Click on "Indexes" tab
5. Click "Create Index"
6. Add each index configuration from above

### Method 2: Firebase CLI
```bash
# Deploy indexes using firestore.indexes.json
firebase deploy --only firestore:indexes
```

### Method 3: Auto-creation from Error Links
When you encounter index errors, Firebase provides direct links to create the required indexes. Click these links to automatically create them.

## Current Status
- ✅ Modified queries to work without composite indexes (temporary fix)
- ⚠️ For optimal performance, create the indexes above
- ⚠️ Some queries now use client-side sorting instead of server-side

## Performance Impact
- **Without indexes**: Client-side sorting, higher bandwidth usage
- **With indexes**: Server-side sorting, optimal performance, lower bandwidth

## Security Rules
The `firestore.rules` file has been created with appropriate security rules for all collections.
