# Firebase Firestore Correction Rules

## SDK Version (firebase@12.8.0+)

Use the modular API (v9+), not the namespaced API:

```typescript
// CORRECT - Modular API
import { collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

const docRef = doc(db, 'users', 'user-123');
const docSnap = await getDoc(docRef);

// WRONG - Namespaced API (deprecated)
import firebase from 'firebase/app';
const docSnap = await firebase.firestore().collection('users').doc('user-123').get();
```

## Query Patterns

### Inequality Filters

Only one field can have inequality operators (`<`, `<=`, `>`, `>=`, `!=`):

```typescript
// CORRECT - Single inequality field
query(collection(db, 'posts'),
  where('category', '==', 'tech'),
  where('date', '>=', startDate)
);

// WRONG - Multiple inequality fields
query(collection(db, 'posts'),
  where('date', '>=', startDate),
  where('likes', '>', 100)  // ERROR
);
```

### OrderBy with Inequality

Must `orderBy` the inequality field first:

```typescript
// CORRECT
query(collection(db, 'posts'),
  where('date', '>=', startDate),
  orderBy('date'),  // Must come first
  orderBy('likes')
);

// WRONG
query(collection(db, 'posts'),
  where('date', '>=', startDate),
  orderBy('likes')  // ERROR: must orderBy('date') first
);
```

## Real-Time Listeners

Always unsubscribe from listeners:

```typescript
// CORRECT - With cleanup
useEffect(() => {
  const unsubscribe = onSnapshot(doc(db, 'users', userId), (doc) => {
    setUser(doc.data());
  });
  return () => unsubscribe();  // Cleanup on unmount
}, [userId]);

// WRONG - Memory leak
useEffect(() => {
  onSnapshot(doc(db, 'users', userId), (doc) => {
    setUser(doc.data());
  });
  // No cleanup!
}, [userId]);
```

## Timestamps

Use `serverTimestamp()` for consistent timestamps:

```typescript
import { serverTimestamp } from 'firebase/firestore';

// CORRECT
await addDoc(collection(db, 'posts'), {
  title: 'My Post',
  createdAt: serverTimestamp(),
});

// WRONG - Client time can be inaccurate
await addDoc(collection(db, 'posts'), {
  title: 'My Post',
  createdAt: new Date(),
});
```

## Batch Operations

Batches are limited to 500 operations:

```typescript
// CORRECT - Split large batches
const items = [...]; // 1000 items
const batchSize = 500;

for (let i = 0; i < items.length; i += batchSize) {
  const batch = writeBatch(db);
  items.slice(i, i + batchSize).forEach(item => {
    batch.set(doc(collection(db, 'items')), item);
  });
  await batch.commit();
}

// WRONG - Exceeds limit
const batch = writeBatch(db);
items.forEach(item => batch.set(...)); // 1000+ items - will fail
await batch.commit();
```

## Transaction Rules

No side effects inside transactions (they may retry):

```typescript
// CORRECT - Side effects outside
await runTransaction(db, async (transaction) => {
  const doc = await transaction.get(docRef);
  transaction.update(docRef, { count: doc.data().count + 1 });
});
await sendNotification(); // Side effect outside

// WRONG - Side effect inside
await runTransaction(db, async (transaction) => {
  const doc = await transaction.get(docRef);
  transaction.update(docRef, { count: doc.data().count + 1 });
  await sendNotification(); // May run multiple times!
});
```

## Admin SDK Private Key

Handle escaped newlines in environment variables:

```typescript
// CORRECT
privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),

// WRONG - Will fail with "invalid_grant" or "no credentials"
privateKey: process.env.FIREBASE_PRIVATE_KEY,
```

## Document References

Use `doc()` for references, `collection()` for queries:

```typescript
// CORRECT
const userRef = doc(db, 'users', 'user-123');
const usersCollection = collection(db, 'users');

// WRONG - Path confusion
const userRef = collection(db, 'users', 'user-123'); // This is a subcollection path!
```

## Null vs Undefined

Use `null` for missing optional fields, never `undefined`:

```typescript
// CORRECT
await setDoc(docRef, {
  name: 'John',
  bio: userBio || null,
});

// WRONG - Undefined causes issues
await setDoc(docRef, {
  name: 'John',
  bio: undefined,  // May cause unexpected behavior
});
```
