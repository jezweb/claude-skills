# Firebase Storage Correction Rules

## SDK Version (firebase@12.8.0+)

Use the modular API (v9+), not the namespaced API:

```typescript
// CORRECT - Modular API
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

const storageRef = ref(storage, 'path/to/file');
await uploadBytes(storageRef, file);

// WRONG - Namespaced API (deprecated)
import firebase from 'firebase/app';
const storageRef = firebase.storage().ref('path/to/file');
await storageRef.put(file);
```

## Upload with Progress

Use `uploadBytesResumable` for progress tracking:

```typescript
// CORRECT - Resumable upload with progress
import { uploadBytesResumable } from 'firebase/storage';

const uploadTask = uploadBytesResumable(storageRef, file);
uploadTask.on('state_changed', (snapshot) => {
  const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
});

// WRONG - No progress tracking
import { uploadBytes } from 'firebase/storage';
await uploadBytes(storageRef, file);  // Can't track progress
```

## Always Set Content Type

```typescript
// CORRECT - Explicit content type
await uploadBytes(storageRef, file, {
  contentType: file.type,
});

// WRONG - Content type may be wrong
await uploadBytes(storageRef, file);  // May serve with incorrect MIME
```

## Unique Filenames

```typescript
// CORRECT - Unique filename prevents collisions
const filename = `${Date.now()}-${file.name}`;
const storageRef = ref(storage, `uploads/${filename}`);

// WRONG - May overwrite existing files
const storageRef = ref(storage, `uploads/${file.name}`);
```

## Handle Upload Errors

```typescript
// CORRECT - Full error handling
uploadTask.on('state_changed',
  (snapshot) => { /* progress */ },
  (error) => {
    // Handle errors
    switch (error.code) {
      case 'storage/unauthorized':
        console.error('Not authorized');
        break;
      case 'storage/canceled':
        console.error('Upload canceled');
        break;
      default:
        console.error('Upload failed:', error);
    }
  },
  () => { /* complete */ }
);

// WRONG - No error handling
uploadTask.on('state_changed', (snapshot) => { /* progress only */ });
```

## Cancel Upload on Unmount

```typescript
// CORRECT - Cancel on unmount
useEffect(() => {
  const uploadTask = uploadBytesResumable(storageRef, file);
  // ... setup listeners

  return () => {
    uploadTask.cancel();  // Clean up on unmount
  };
}, []);

// WRONG - Upload continues after unmount
useEffect(() => {
  uploadBytesResumable(storageRef, file);
  // No cleanup!
}, []);
```

## CORS Configuration

```bash
# MUST configure CORS for web uploads
gsutil cors set cors.json gs://your-bucket.appspot.com

# WRONG - Skipping CORS results in browser errors
# No cors.json = CORS errors in browser
```

## Validate Before Upload

```typescript
// CORRECT - Validate client-side (defense in depth)
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

if (file.size > MAX_SIZE) {
  throw new Error('File too large');
}
if (!ALLOWED_TYPES.includes(file.type)) {
  throw new Error('Invalid file type');
}

// Still validate in security rules too!

// WRONG - Trust client blindly
await uploadBytes(storageRef, file);  // No validation
```

## Download URL Caching

```typescript
// CORRECT - Download URLs don't expire (but can be revoked)
const downloadURL = await getDownloadURL(storageRef);
// Store this URL - it's permanent unless security rules change

// For temporary access, use signed URLs (Admin SDK)
const [signedUrl] = await adminStorage.file(path).getSignedUrl({
  action: 'read',
  expires: Date.now() + 60 * 60 * 1000,  // 1 hour
});
```

## Security Rules - Size Limits

```javascript
// CORRECT - Enforce size limits in rules
match /uploads/{fileName} {
  allow write: if request.resource.size < 5 * 1024 * 1024;  // 5MB
}

// WRONG - No size limit (DoS vulnerability)
match /uploads/{fileName} {
  allow write: if true;
}
```

## Admin SDK Storage Bucket

```typescript
// CORRECT - Specify bucket in config
initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'your-project.appspot.com',  // Required!
});

// WRONG - Missing bucket
initializeApp({
  credential: cert(serviceAccount),
  // storageBucket missing - getStorage().bucket() will fail
});
```
