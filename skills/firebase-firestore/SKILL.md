---
name: firebase-firestore
description: |
  Build with Firestore NoSQL database - real-time sync, offline support, and scalable document storage. Use when: creating collections, querying documents, setting up security rules, handling real-time listeners, or troubleshooting permission-denied, quota exceeded, invalid query, or offline persistence errors. Prevents 10 documented errors.
user-invocable: true
---

# Firebase Firestore Database

**Status**: Production Ready
**Last Updated**: 2026-01-25
**Dependencies**: None (standalone skill)
**Latest Versions**: firebase@12.8.0, firebase-admin@13.6.0

---

## Quick Start (5 Minutes)

### 1. Install Firebase SDK

```bash
# Client SDK (web/mobile)
npm install firebase

# Admin SDK (server/backend)
npm install firebase-admin
```

### 2. Initialize Firebase (Client)

```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

### 3. Initialize Firebase Admin (Server)

```typescript
// src/lib/firebase-admin.ts
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize only once
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace escaped newlines in private key
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminDb = getFirestore();
```

**CRITICAL:**
- Never expose `FIREBASE_PRIVATE_KEY` in client code
- Use Admin SDK for server-side operations (bypasses security rules)
- Use Client SDK for authenticated user operations

---

## Core Operations

### Document CRUD (Client SDK - Modular v9+)

```typescript
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// CREATE - Auto-generated ID
const docRef = await addDoc(collection(db, 'users'), {
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: serverTimestamp(),
});
console.log('Created document with ID:', docRef.id);

// CREATE - Specific ID
await setDoc(doc(db, 'users', 'user-123'), {
  name: 'Jane Doe',
  email: 'jane@example.com',
  createdAt: serverTimestamp(),
});

// READ - Single document
const docSnap = await getDoc(doc(db, 'users', 'user-123'));
if (docSnap.exists()) {
  console.log('Document data:', docSnap.data());
} else {
  console.log('No such document!');
}

// READ - Collection with query
const q = query(
  collection(db, 'users'),
  where('email', '==', 'john@example.com'),
  orderBy('createdAt', 'desc'),
  limit(10)
);
const querySnapshot = await getDocs(q);
querySnapshot.forEach((doc) => {
  console.log(doc.id, ' => ', doc.data());
});

// UPDATE - Merge fields (doesn't overwrite entire document)
await updateDoc(doc(db, 'users', 'user-123'), {
  name: 'Jane Smith',
  updatedAt: serverTimestamp(),
});

// UPDATE - Set with merge (creates if doesn't exist)
await setDoc(doc(db, 'users', 'user-123'), {
  lastLogin: serverTimestamp(),
}, { merge: true });

// DELETE
await deleteDoc(doc(db, 'users', 'user-123'));
```

### Document CRUD (Admin SDK)

```typescript
import { adminDb } from './firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// CREATE
const docRef = await adminDb.collection('users').add({
  name: 'John Doe',
  createdAt: FieldValue.serverTimestamp(),
});

// CREATE with specific ID
await adminDb.collection('users').doc('user-123').set({
  name: 'Jane Doe',
  createdAt: FieldValue.serverTimestamp(),
});

// READ
const doc = await adminDb.collection('users').doc('user-123').get();
if (doc.exists) {
  console.log('Document data:', doc.data());
}

// READ with query
const snapshot = await adminDb
  .collection('users')
  .where('email', '==', 'john@example.com')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .get();

snapshot.forEach((doc) => {
  console.log(doc.id, '=>', doc.data());
});

// UPDATE
await adminDb.collection('users').doc('user-123').update({
  name: 'Jane Smith',
  updatedAt: FieldValue.serverTimestamp(),
});

// DELETE
await adminDb.collection('users').doc('user-123').delete();
```

---

## Real-Time Listeners (Client SDK)

```typescript
import { onSnapshot, query, where, collection, doc } from 'firebase/firestore';
import { db } from './firebase';

// Listen to single document
const unsubscribe = onSnapshot(doc(db, 'users', 'user-123'), (doc) => {
  if (doc.exists()) {
    console.log('Current data:', doc.data());
  }
});

// Listen to collection with query
const q = query(
  collection(db, 'messages'),
  where('roomId', '==', 'room-123'),
  orderBy('createdAt', 'desc'),
  limit(50)
);

const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
  const messages: Message[] = [];
  querySnapshot.forEach((doc) => {
    messages.push({ id: doc.id, ...doc.data() } as Message);
  });
  // Update UI with messages
  setMessages(messages);
});

// Handle errors
const unsubscribeWithError = onSnapshot(
  doc(db, 'users', 'user-123'),
  (doc) => {
    // Handle updates
  },
  (error) => {
    console.error('Listener error:', error);
    // Handle permission denied, etc.
  }
);

// IMPORTANT: Unsubscribe when done (React useEffect cleanup)
useEffect(() => {
  const unsubscribe = onSnapshot(/* ... */);
  return () => unsubscribe();
}, []);
```

**CRITICAL:**
- Always unsubscribe from listeners to prevent memory leaks
- Listeners count against your concurrent connection limit
- Each listener is a WebSocket connection

---

## Query Patterns

### Compound Queries

```typescript
import { query, where, orderBy, limit, startAfter, collection } from 'firebase/firestore';

// Multiple where clauses (requires composite index)
const q = query(
  collection(db, 'products'),
  where('category', '==', 'electronics'),
  where('price', '<=', 1000),
  orderBy('price', 'asc')
);

// Range query (only one field can have inequality)
const rangeQuery = query(
  collection(db, 'events'),
  where('date', '>=', new Date('2025-01-01')),
  where('date', '<=', new Date('2025-12-31')),
  orderBy('date', 'asc')
);

// Array contains
const arrayQuery = query(
  collection(db, 'posts'),
  where('tags', 'array-contains', 'firebase')
);

// Array contains any (max 30 values)
const arrayAnyQuery = query(
  collection(db, 'posts'),
  where('tags', 'array-contains-any', ['firebase', 'google', 'cloud'])
);

// In query (max 30 values)
const inQuery = query(
  collection(db, 'users'),
  where('status', 'in', ['active', 'pending'])
);

// Not in query (max 10 values)
const notInQuery = query(
  collection(db, 'users'),
  where('status', 'not-in', ['banned', 'deleted'])
);
```

### Pagination with Cursors

```typescript
import { query, orderBy, limit, startAfter, getDocs, collection, DocumentSnapshot } from 'firebase/firestore';

let lastVisible: DocumentSnapshot | null = null;

async function getNextPage() {
  let q = query(
    collection(db, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(10)
  );

  if (lastVisible) {
    q = query(q, startAfter(lastVisible));
  }

  const snapshot = await getDocs(q);

  // Save last document for next page
  lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

### Collection Group Queries

```typescript
import { collectionGroup, query, where, getDocs } from 'firebase/firestore';

// Query across all subcollections named 'comments'
// Structure: posts/{postId}/comments/{commentId}
const q = query(
  collectionGroup(db, 'comments'),
  where('authorId', '==', 'user-123')
);

const snapshot = await getDocs(q);
// Returns all comments by user-123 across all posts
```

**CRITICAL:** Collection group queries require an index. Create in Firebase Console or deploy via `firestore.indexes.json`.

---

## Batch Operations & Transactions

### Batch Writes (Up to 500 operations)

```typescript
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const batch = writeBatch(db);

// Add multiple documents
const usersRef = collection(db, 'users');
batch.set(doc(usersRef), { name: 'User 1', createdAt: serverTimestamp() });
batch.set(doc(usersRef), { name: 'User 2', createdAt: serverTimestamp() });

// Update existing document
batch.update(doc(db, 'counters', 'users'), { total: 100 });

// Delete document
batch.delete(doc(db, 'temp', 'old-doc'));

// Commit all operations atomically
await batch.commit();
```

### Transactions (Read then Write)

```typescript
import { runTransaction, doc, increment } from 'firebase/firestore';
import { db } from './firebase';

// Transfer credits between users
async function transferCredits(fromId: string, toId: string, amount: number) {
  await runTransaction(db, async (transaction) => {
    const fromRef = doc(db, 'users', fromId);
    const toRef = doc(db, 'users', toId);

    const fromDoc = await transaction.get(fromRef);
    const toDoc = await transaction.get(toRef);

    if (!fromDoc.exists() || !toDoc.exists()) {
      throw new Error('User not found');
    }

    const fromCredits = fromDoc.data().credits;
    if (fromCredits < amount) {
      throw new Error('Insufficient credits');
    }

    transaction.update(fromRef, { credits: fromCredits - amount });
    transaction.update(toRef, { credits: increment(amount) });
  });
}
```

**CRITICAL:**
- Transactions can fail and retry automatically (up to 5 times)
- Don't perform side effects inside transaction (may run multiple times)
- All reads must come before writes in a transaction

---

## Security Rules

### Basic Rules Structure

```javascript
// firestore.rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isValidUser() {
      return request.resource.data.keys().hasAll(['name', 'email'])
        && request.resource.data.name is string
        && request.resource.data.email is string;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isOwner(userId) && isValidUser();
      allow update: if isOwner(userId);
      allow delete: if isOwner(userId);
    }

    // Posts collection with subcollections
    match /posts/{postId} {
      allow read: if resource.data.published == true || isOwner(resource.data.authorId);
      allow create: if isAuthenticated() && request.resource.data.authorId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.authorId);

      // Comments subcollection
      match /comments/{commentId} {
        allow read: if true;
        allow create: if isAuthenticated();
        allow update, delete: if isOwner(resource.data.authorId);
      }
    }

    // Admin-only collection
    match /admin/{document=**} {
      allow read, write: if request.auth.token.admin == true;
    }
  }
}
```

### Deploy Rules

```bash
# Deploy rules
firebase deploy --only firestore:rules

# Deploy rules and indexes
firebase deploy --only firestore
```

---

## Indexes

### Composite Indexes (firestore.indexes.json)

```json
{
  "indexes": [
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "price", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "comments",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "authorId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

```bash
# Deploy indexes
firebase deploy --only firestore:indexes
```

**CRITICAL:**
- Firestore auto-creates single-field indexes
- Composite indexes must be created manually or via error link
- Collection group queries always require an index

---

## Offline Persistence

### Enable Offline Support (Web)

```typescript
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { app } from './firebase';

// Enable multi-tab offline persistence
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// OR: Enable single-tab persistence (simpler)
import { enableIndexedDbPersistence, getFirestore } from 'firebase/firestore';

const db = getFirestore(app);
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab
    console.warn('Persistence failed: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    // Browser doesn't support persistence
    console.warn('Persistence not supported');
  }
});
```

### Handle Offline State

```typescript
import { onSnapshot, doc, SnapshotMetadata } from 'firebase/firestore';

onSnapshot(doc(db, 'users', 'user-123'), (doc) => {
  const source = doc.metadata.fromCache ? 'local cache' : 'server';
  console.log(`Data came from ${source}`);

  if (doc.metadata.hasPendingWrites) {
    console.log('Local changes pending sync');
  }
});
```

---

## Data Modeling Best Practices

### Denormalization for Read Performance

```typescript
// Instead of joining users and posts...
// Store author info directly in post document

// posts/{postId}
{
  title: 'My Post',
  content: '...',
  authorId: 'user-123',
  // Denormalized author data for fast reads
  author: {
    name: 'John Doe',
    avatarUrl: 'https://...'
  },
  createdAt: Timestamp
}
```

### Subcollections vs Root Collections

```typescript
// Subcollections: Good for parent-child relationships
// posts/{postId}/comments/{commentId}
// - Easy to query all comments for a post
// - Deleting post doesn't auto-delete comments (use Cloud Functions)

// Root collections: Good for cross-cutting queries
// comments (with postId field)
// - Easy to query all comments by a user across posts
// - Requires manual data consistency
```

### Counter Pattern (High-Write Scenarios)

```typescript
// Direct increment (low traffic)
await updateDoc(doc(db, 'posts', postId), {
  viewCount: increment(1)
});

// Distributed counter (high traffic - 1000+ writes/sec)
// Use Cloud Functions to aggregate shard counts
// counters/{counterId}/shards/{shardId}
```

---

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `permission-denied` | Security rules blocking access | Check rules, ensure user authenticated |
| `not-found` | Document doesn't exist | Use `exists()` check before accessing data |
| `already-exists` | Document with ID already exists | Use `setDoc` with merge or generate new ID |
| `resource-exhausted` | Quota exceeded | Upgrade plan or optimize queries |
| `failed-precondition` | Index missing for query | Create composite index (link in error) |
| `unavailable` | Service temporarily unavailable | Implement retry with backoff |
| `invalid-argument` | Invalid query combination | Check query constraints (see below) |
| `deadline-exceeded` | Operation timeout | Reduce data size or paginate |

### Query Constraints

```typescript
// INVALID: Multiple inequality filters on different fields
query(collection(db, 'posts'),
  where('date', '>', startDate),
  where('likes', '>', 100)  // ERROR: Can't use inequality on second field
);

// VALID: Use range on one field, equality on others
query(collection(db, 'posts'),
  where('category', '==', 'tech'),
  where('date', '>', startDate)
);

// INVALID: orderBy field different from inequality field
query(collection(db, 'posts'),
  where('date', '>', startDate),
  orderBy('likes')  // ERROR: Must orderBy('date') first
);

// VALID: orderBy inequality field first
query(collection(db, 'posts'),
  where('date', '>', startDate),
  orderBy('date'),
  orderBy('likes')
);
```

---

## Known Issues Prevention

This skill prevents **10** documented Firestore errors:

| Issue # | Error/Issue | Description | How to Avoid | Source |
|---------|-------------|-------------|--------------|--------|
| **#1** | `permission-denied` | Security rules blocking operation | Test rules in Firebase Console emulator first | Common |
| **#2** | `failed-precondition` (index) | Composite index missing | Click error link to create index, or define in firestore.indexes.json | Common |
| **#3** | Invalid query combination | Multiple inequality filters | Use inequality on one field only, equality on others | [Docs](https://firebase.google.com/docs/firestore/query-data/queries#query_limitations) |
| **#4** | Memory leak from listeners | Not unsubscribing from onSnapshot | Always call unsubscribe in cleanup (useEffect return) | Common |
| **#5** | Offline persistence conflict | Multiple tabs with persistence | Use `persistentMultipleTabManager()` or handle error | [Docs](https://firebase.google.com/docs/firestore/manage-data/enable-offline) |
| **#6** | Transaction side effects | Side effects run multiple times | Never perform side effects inside runTransaction | [Docs](https://firebase.google.com/docs/firestore/manage-data/transactions) |
| **#7** | Batch limit exceeded | More than 500 operations | Split into multiple batches | [Docs](https://firebase.google.com/docs/firestore/manage-data/transactions#batched-writes) |
| **#8** | `resource-exhausted` | Quota limits hit | Implement pagination, reduce reads, use caching | Common |
| **#9** | Private key newline issue | `\\n` not converted in env var | Use `.replace(/\\n/g, '\n')` on private key | Common |
| **#10** | Collection group query fails | Missing collection group index | Create index with `queryScope: COLLECTION_GROUP` | [Docs](https://firebase.google.com/docs/firestore/query-data/queries#collection-group-query) |

---

## Firebase CLI Commands

```bash
# Initialize Firestore
firebase init firestore

# Start emulators
firebase emulators:start --only firestore

# Deploy rules and indexes
firebase deploy --only firestore

# Export data (for backup)
gcloud firestore export gs://your-bucket/backups/$(date +%Y%m%d)

# Import data
gcloud firestore import gs://your-bucket/backups/20250125
```

---

## Package Versions (Verified 2026-01-25)

```json
{
  "dependencies": {
    "firebase": "^12.8.0"
  },
  "devDependencies": {
    "firebase-admin": "^13.6.0"
  }
}
```

---

## Official Documentation

- **Firestore Overview**: https://firebase.google.com/docs/firestore
- **Get Started**: https://firebase.google.com/docs/firestore/quickstart
- **Data Model**: https://firebase.google.com/docs/firestore/data-model
- **Security Rules**: https://firebase.google.com/docs/firestore/security/get-started
- **Query Data**: https://firebase.google.com/docs/firestore/query-data/queries
- **Manage Data**: https://firebase.google.com/docs/firestore/manage-data/add-data
- **Offline Data**: https://firebase.google.com/docs/firestore/manage-data/enable-offline

---

**Last verified**: 2026-01-25 | **Skill version**: 1.0.0
