# Firebase Cloud Storage Skill

Production-tested skill for implementing file uploads, downloads, and storage management with Firebase Cloud Storage.

## Auto-Trigger Keywords

This skill activates when Claude detects these keywords:

### Technology Keywords
- firebase storage, firebase cloud storage
- firebase file upload, firebase upload
- firebase file download, firebase download
- firebase bucket, storage bucket
- firebase-admin storage
- firebase signed url

### Operation Keywords
- uploadBytes, uploadBytesResumable
- getDownloadURL, downloadURL
- uploadString, base64 upload
- listAll, list files
- deleteObject, delete file
- getMetadata, updateMetadata
- ref, storageRef
- firebase upload progress
- firebase resumable upload

### Error Keywords
- storage/unauthorized
- storage/object-not-found
- storage/quota-exceeded
- storage/canceled
- firebase storage cors
- firebase upload failed
- firebase download error
- storage permission denied

### Framework Keywords
- react firebase storage
- next.js firebase upload
- firebase image upload
- firebase file picker
- firebase storage rules
- firebase storage security

## What This Skill Covers

- Client SDK file uploads
- Upload progress tracking
- Resumable uploads for large files
- File downloads and URLs
- Metadata management
- Server-side operations (Admin SDK)
- Signed URLs for temporary access
- Security rules
- CORS configuration
- React upload components
- Error handling patterns

## When to Use This Skill

Use when:
- Uploading images or files to Firebase
- Implementing file pickers and upload components
- Generating download URLs
- Setting up storage security rules
- Configuring CORS for web uploads
- Managing file metadata
- Implementing profile picture uploads
- Handling large file uploads with progress

## Related Skills

- `firebase-firestore` - Firebase Firestore database
- `firebase-auth` - Firebase Authentication
- `cloudflare-r2` - Alternative: Cloudflare R2 storage
- `vercel-blob` - Alternative: Vercel Blob storage
