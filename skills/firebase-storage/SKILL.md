---
name: firebase-storage
description: |
  Build with Firebase Cloud Storage - file uploads, downloads, and secure access. Use when: uploading images/files, generating download URLs, implementing file pickers, setting up storage security rules, or troubleshooting storage/unauthorized, cors errors, quota exceeded, or upload failed errors. Prevents 9 documented errors.
user-invocable: true
---

# Firebase Cloud Storage

**Status**: Production Ready
**Last Updated**: 2026-01-25
**Dependencies**: None (standalone skill)
**Latest Versions**: firebase@12.8.0, firebase-admin@13.6.0

---

## Quick Start (5 Minutes)

### 1. Initialize Firebase Storage (Client)

```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  // ... other config
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
```

### 2. Initialize Firebase Admin Storage (Server)

```typescript
// src/lib/firebase-admin.ts
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export const adminStorage = getStorage().bucket();
```

---

## File Upload (Client SDK)

### Basic Upload

```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

async function uploadFile(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);

  // Upload file
  const snapshot = await uploadBytes(storageRef, file);

  // Get download URL
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
}

// Usage
const url = await uploadFile(file, `uploads/${userId}/${file.name}`);
```

### Upload with Progress

```typescript
import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage';
import { storage } from './firebase';

function uploadFileWithProgress(
  file: File,
  path: string,
  onProgress: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}

// Usage with React state
const [progress, setProgress] = useState(0);
const url = await uploadFileWithProgress(file, path, setProgress);
```

### Upload with Metadata

```typescript
import { ref, uploadBytes, getDownloadURL, UploadMetadata } from 'firebase/storage';
import { storage } from './firebase';

async function uploadWithMetadata(file: File, path: string) {
  const storageRef = ref(storage, path);

  const metadata: UploadMetadata = {
    contentType: file.type,
    customMetadata: {
      uploadedBy: userId,
      originalName: file.name,
      uploadTime: new Date().toISOString(),
    },
  };

  const snapshot = await uploadBytes(storageRef, file, metadata);
  const downloadURL = await getDownloadURL(snapshot.ref);

  return { downloadURL, metadata: snapshot.metadata };
}
```

### Upload from Data URL / Base64

```typescript
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

// Upload base64 string
async function uploadBase64(base64String: string, path: string) {
  const storageRef = ref(storage, path);

  // For data URL (includes prefix like "data:image/png;base64,")
  const snapshot = await uploadString(storageRef, base64String, 'data_url');

  // For raw base64 (no prefix)
  // const snapshot = await uploadString(storageRef, base64String, 'base64');

  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}
```

---

## File Download

### Get Download URL

```typescript
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

async function getFileURL(path: string): Promise<string> {
  const storageRef = ref(storage, path);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}
```

### Download File as Blob

```typescript
import { ref, getBlob } from 'firebase/storage';
import { storage } from './firebase';

async function downloadFile(path: string): Promise<Blob> {
  const storageRef = ref(storage, path);
  const blob = await getBlob(storageRef);
  return blob;
}

// Trigger browser download
async function downloadAndSave(path: string, filename: string) {
  const blob = await downloadFile(path);
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
```

### Get File Metadata

```typescript
import { ref, getMetadata } from 'firebase/storage';
import { storage } from './firebase';

async function getFileMetadata(path: string) {
  const storageRef = ref(storage, path);
  const metadata = await getMetadata(storageRef);

  return {
    name: metadata.name,
    size: metadata.size,
    contentType: metadata.contentType,
    created: metadata.timeCreated,
    updated: metadata.updated,
    customMetadata: metadata.customMetadata,
  };
}
```

---

## File Management

### Delete File

```typescript
import { ref, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}
```

### List Files in Directory

```typescript
import { ref, listAll, list, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

// List all files in a directory
async function listAllFiles(directoryPath: string) {
  const storageRef = ref(storage, directoryPath);
  const result = await listAll(storageRef);

  const files = await Promise.all(
    result.items.map(async (itemRef) => ({
      name: itemRef.name,
      fullPath: itemRef.fullPath,
      downloadURL: await getDownloadURL(itemRef),
    }))
  );

  const folders = result.prefixes.map((folderRef) => ({
    name: folderRef.name,
    fullPath: folderRef.fullPath,
  }));

  return { files, folders };
}

// Paginated list (for large directories)
async function listFilesPaginated(directoryPath: string, pageSize = 100) {
  const storageRef = ref(storage, directoryPath);
  const result = await list(storageRef, { maxResults: pageSize });

  // Get next page
  if (result.nextPageToken) {
    const nextPage = await list(storageRef, {
      maxResults: pageSize,
      pageToken: result.nextPageToken,
    });
  }

  return result;
}
```

### Update Metadata

```typescript
import { ref, updateMetadata } from 'firebase/storage';
import { storage } from './firebase';

async function updateFileMetadata(path: string, newMetadata: object) {
  const storageRef = ref(storage, path);
  const updatedMetadata = await updateMetadata(storageRef, {
    customMetadata: newMetadata,
  });
  return updatedMetadata;
}
```

---

## Server-Side Operations (Admin SDK)

### Upload from Server

```typescript
import { adminStorage } from './firebase-admin';

async function uploadFromServer(
  buffer: Buffer,
  destination: string,
  contentType: string
) {
  const file = adminStorage.file(destination);

  await file.save(buffer, {
    contentType,
    metadata: {
      metadata: {
        uploadedBy: 'server',
        uploadTime: new Date().toISOString(),
      },
    },
  });

  // Make file publicly accessible (if needed)
  await file.makePublic();

  // Get public URL
  const publicUrl = `https://storage.googleapis.com/${adminStorage.name}/${destination}`;

  return publicUrl;
}
```

### Generate Signed URL

```typescript
import { adminStorage } from './firebase-admin';

async function generateSignedUrl(
  path: string,
  expiresInMinutes = 60
): Promise<string> {
  const file = adminStorage.file(path);

  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });

  return signedUrl;
}

// For uploads (write access)
async function generateUploadUrl(path: string): Promise<string> {
  const file = adminStorage.file(path);

  const [signedUrl] = await file.getSignedUrl({
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType: 'application/octet-stream',
  });

  return signedUrl;
}
```

### Delete from Server

```typescript
import { adminStorage } from './firebase-admin';

async function deleteFromServer(path: string): Promise<void> {
  const file = adminStorage.file(path);
  await file.delete();
}

// Delete entire directory
async function deleteDirectory(directoryPath: string): Promise<void> {
  await adminStorage.deleteFiles({
    prefix: directoryPath,
  });
}
```

---

## Security Rules

### Basic Rules Structure

```javascript
// storage.rules
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isValidImage() {
      return request.resource.contentType.matches('image/.*')
        && request.resource.size < 5 * 1024 * 1024; // 5MB
    }

    function isValidDocument() {
      return request.resource.contentType.matches('application/pdf')
        && request.resource.size < 10 * 1024 * 1024; // 10MB
    }

    // User uploads (private to user)
    match /users/{userId}/{allPaths=**} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId)
        && (isValidImage() || isValidDocument());
    }

    // Public uploads (anyone can read)
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if isAuthenticated() && isValidImage();
    }

    // Profile pictures
    match /profiles/{userId}/avatar.{ext} {
      allow read: if true;
      allow write: if isOwner(userId)
        && request.resource.contentType.matches('image/.*')
        && request.resource.size < 2 * 1024 * 1024; // 2MB
    }

    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### Deploy Rules

```bash
firebase deploy --only storage
```

---

## CORS Configuration

### Configure CORS (Required for Web)

Create `cors.json`:

```json
[
  {
    "origin": ["https://your-domain.com", "http://localhost:3000"],
    "method": ["GET", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

Apply CORS configuration:

```bash
gsutil cors set cors.json gs://your-bucket-name.appspot.com
```

**CRITICAL:** Without CORS configuration, uploads from browsers will fail with CORS errors.

---

## React Components

### File Upload Component

```typescript
// components/FileUpload.tsx
'use client';

import { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

interface FileUploadProps {
  path: string;
  onUploadComplete: (url: string) => void;
  accept?: string;
  maxSize?: number; // in bytes
}

export function FileUpload({
  path,
  onUploadComplete,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const storageRef = ref(storage, `${path}/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => {
          setError(error.message);
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onUploadComplete(downloadURL);
          setUploading(false);
          setProgress(100);
        }
      );
    } catch (err: any) {
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {uploading ? `Uploading... ${Math.round(progress)}%` : 'Upload File'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
```

### Image Preview with Upload

```typescript
// components/ImageUpload.tsx
'use client';

import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import Image from 'next/image';

interface ImageUploadProps {
  currentImage?: string;
  path: string;
  onUploadComplete: (url: string) => void;
}

export function ImageUpload({
  currentImage,
  path,
  onUploadComplete,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    const storageRef = ref(storage, `${path}/${Date.now()}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        setProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      },
      (error) => {
        console.error('Upload error:', error);
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onUploadComplete(downloadURL);
        setUploading(false);
      }
    );
  };

  return (
    <div className="relative w-32 h-32">
      {preview ? (
        <Image
          src={preview}
          alt="Preview"
          fill
          className="object-cover rounded-full"
        />
      ) : (
        <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-gray-500">No image</span>
        </div>
      )}

      <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
        {uploading ? `${Math.round(progress)}%` : '+'}
      </label>
    </div>
  );
}
```

---

## Error Handling

### Common Storage Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `storage/unauthorized` | User not allowed to access | Check security rules, ensure user authenticated |
| `storage/canceled` | Upload/download canceled | Handle gracefully, allow retry |
| `storage/unknown` | Unknown error | Check network, retry with backoff |
| `storage/object-not-found` | File doesn't exist | Verify path, handle missing files |
| `storage/bucket-not-found` | Bucket doesn't exist | Check storageBucket config |
| `storage/quota-exceeded` | Storage quota exceeded | Upgrade plan or delete files |
| `storage/unauthenticated` | User not authenticated | Sign in user first |
| `storage/invalid-checksum` | File corrupted during upload | Retry upload |
| `storage/retry-limit-exceeded` | Too many retries | Check network, try later |

### Error Handler Utility

```typescript
export function getStorageErrorMessage(error: any): string {
  const messages: Record<string, string> = {
    'storage/unauthorized': 'You do not have permission to access this file',
    'storage/canceled': 'Upload was canceled',
    'storage/object-not-found': 'File not found',
    'storage/quota-exceeded': 'Storage quota exceeded',
    'storage/unauthenticated': 'Please sign in to upload files',
    'storage/invalid-checksum': 'Upload failed. Please try again',
    'storage/retry-limit-exceeded': 'Upload failed after multiple retries',
  };

  return messages[error.code] || 'An unexpected error occurred';
}
```

---

## Known Issues Prevention

This skill prevents **9** documented Firebase Storage errors:

| Issue # | Error/Issue | Description | How to Avoid | Source |
|---------|-------------|-------------|--------------|--------|
| **#1** | `storage/unauthorized` | Security rules blocking access | Test rules, ensure user authenticated | Common |
| **#2** | CORS errors | Browser blocked cross-origin request | Configure CORS with `gsutil cors set` | [Docs](https://firebase.google.com/docs/storage/web/download-files#cors_configuration) |
| **#3** | Large file timeout | Upload times out | Use `uploadBytesResumable` for large files | Common |
| **#4** | Memory issues | Loading large file into memory | Stream large files, use signed URLs | Common |
| **#5** | Missing content type | File served with wrong MIME type | Always set `contentType` in metadata | Common |
| **#6** | URL expiration | Download URL stops working | Regenerate URLs, use signed URLs for temp access | Common |
| **#7** | `storage/quota-exceeded` | Free tier limit reached | Monitor usage, upgrade plan | Common |
| **#8** | Private key newline issue | Admin SDK fails to initialize | Use `.replace(/\\n/g, '\n')` | Common |
| **#9** | Duplicate uploads | Same file uploaded multiple times | Add timestamp/UUID to filename | Best practice |

---

## Best Practices

### Always Do

1. **Validate file type and size** before upload
2. **Use `uploadBytesResumable`** for large files (supports pause/resume)
3. **Set content type** in metadata
4. **Use unique filenames** (add timestamp or UUID)
5. **Handle upload errors** gracefully with retry
6. **Unsubscribe from upload tasks** on component unmount
7. **Configure CORS** for web applications
8. **Use security rules** to protect files
9. **Generate signed URLs** for temporary access

### Never Do

1. **Never upload without authentication** (unless truly public)
2. **Never trust client-provided file extension** (check content type)
3. **Never store sensitive data** without encryption
4. **Never expose Admin SDK** in client code
5. **Never allow unlimited file sizes** (DoS risk)

---

## Firebase CLI Commands

```bash
# Initialize Storage
firebase init storage

# Deploy security rules
firebase deploy --only storage

# Start emulator
firebase emulators:start --only storage
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

- **Storage Overview**: https://firebase.google.com/docs/storage
- **Web Get Started**: https://firebase.google.com/docs/storage/web/start
- **Upload Files**: https://firebase.google.com/docs/storage/web/upload-files
- **Download Files**: https://firebase.google.com/docs/storage/web/download-files
- **Security Rules**: https://firebase.google.com/docs/storage/security
- **Admin SDK**: https://firebase.google.com/docs/storage/admin/start

---

**Last verified**: 2026-01-25 | **Skill version**: 1.0.0
