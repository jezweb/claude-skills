# R2 S3 API Compatibility

**Last Updated**: 2025-10-21
**Official Docs**: https://developers.cloudflare.com/r2/api/s3/api/

---

## Overview

R2 implements a large portion of the Amazon S3 API, allowing you to use existing S3 SDKs and tools.

**S3 Endpoint Format:**
```
https://<account_id>.r2.cloudflarestorage.com
```

---

## Supported S3 Operations

### Bucket Operations
- ✅ ListBuckets
- ❌ CreateBucket (use Cloudflare Dashboard or Wrangler)
- ❌ DeleteBucket (use Cloudflare Dashboard or Wrangler)

### Object Operations
- ✅ GetObject
- ✅ PutObject
- ✅ DeleteObject
- ✅ DeleteObjects (bulk delete, max 1000)
- ✅ HeadObject
- ✅ ListObjectsV2
- ✅ CopyObject
- ✅ UploadPart
- ✅ CreateMultipartUpload
- ✅ CompleteMultipartUpload
- ✅ AbortMultipartUpload
- ✅ ListMultipartUploads
- ✅ ListParts

### Presigned URLs
- ✅ GetObject (download)
- ✅ PutObject (upload)
- ✅ UploadPart (multipart)

### Not Supported
- ❌ Versioning
- ❌ Object Lock
- ❌ ACLs (use CORS instead)
- ❌ Bucket policies
- ❌ Object tagging (use custom metadata)
- ❌ Server-side encryption config (use SSE-C instead)

---

## Using AWS SDK for JavaScript

### Installation

```bash
npm install @aws-sdk/client-s3
npm install @aws-sdk/s3-request-presigner
```

### Basic Usage

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// Create S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: '<R2_ACCESS_KEY_ID>',
    secretAccessKey: '<R2_SECRET_ACCESS_KEY>',
  },
});

// Upload object
const uploadParams = {
  Bucket: 'my-bucket',
  Key: 'path/to/file.txt',
  Body: 'Hello, R2!',
  ContentType: 'text/plain',
};

await s3Client.send(new PutObjectCommand(uploadParams));

// Download object
const downloadParams = {
  Bucket: 'my-bucket',
  Key: 'path/to/file.txt',
};

const response = await s3Client.send(new GetObjectCommand(downloadParams));
const text = await response.Body.transformToString();
```

### Presigned URLs with AWS SDK

```typescript
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// Generate presigned upload URL
const uploadCommand = new PutObjectCommand({
  Bucket: 'my-bucket',
  Key: 'uploads/file.jpg',
});

const uploadUrl = await getSignedUrl(s3Client, uploadCommand, {
  expiresIn: 3600, // 1 hour
});

// Generate presigned download URL
const downloadCommand = new GetObjectCommand({
  Bucket: 'my-bucket',
  Key: 'uploads/file.jpg',
});

const downloadUrl = await getSignedUrl(s3Client, downloadCommand, {
  expiresIn: 3600,
});
```

---

## Using aws4fetch (Lightweight Alternative)

### Installation

```bash
npm install aws4fetch
```

### Usage

```typescript
import { AwsClient } from 'aws4fetch';

const r2Client = new AwsClient({
  accessKeyId: '<R2_ACCESS_KEY_ID>',
  secretAccessKey: '<R2_SECRET_ACCESS_KEY>',
});

const endpoint = `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`;

// Upload object
await r2Client.fetch(`${endpoint}/my-bucket/file.txt`, {
  method: 'PUT',
  body: 'Hello, R2!',
  headers: {
    'Content-Type': 'text/plain',
  },
});

// Download object
const response = await r2Client.fetch(`${endpoint}/my-bucket/file.txt`);
const text = await response.text();

// Delete object
await r2Client.fetch(`${endpoint}/my-bucket/file.txt`, {
  method: 'DELETE',
});

// List objects
const listResponse = await r2Client.fetch(
  `${endpoint}/my-bucket?list-type=2&max-keys=100`
);
const xml = await listResponse.text();
```

### Presigned URLs with aws4fetch

```typescript
import { AwsClient } from 'aws4fetch';

const r2Client = new AwsClient({
  accessKeyId: '<R2_ACCESS_KEY_ID>',
  secretAccessKey: '<R2_SECRET_ACCESS_KEY>',
});

const url = new URL(
  `https://<ACCOUNT_ID>.r2.cloudflarestorage.com/my-bucket/file.txt`
);

// Set expiry (in seconds)
url.searchParams.set('X-Amz-Expires', '3600');

// Sign for PUT (upload)
const signedUpload = await r2Client.sign(
  new Request(url, { method: 'PUT' }),
  { aws: { signQuery: true } }
);

console.log(signedUpload.url);

// Sign for GET (download)
const signedDownload = await r2Client.sign(
  new Request(url, { method: 'GET' }),
  { aws: { signQuery: true } }
);

console.log(signedDownload.url);
```

---

## S3 vs R2 Workers API Comparison

| Feature | S3 API | R2 Workers API |
|---------|--------|----------------|
| **Performance** | External network call | Native binding (faster) |
| **Authentication** | Access keys required | Automatic via binding |
| **Presigned URLs** | Supported | Requires S3 API + access keys |
| **Multipart Upload** | Full S3 API | Simplified Workers API |
| **Custom Metadata** | `x-amz-meta-*` headers | `customMetadata` object |
| **Conditional Ops** | S3 headers | `onlyIf` object |
| **Size Limits** | 5GB per PUT | 100MB per PUT (200MB Business, 500MB Enterprise) |

---

## When to Use S3 API vs Workers API

### Use S3 API when:
- ✅ Migrating from AWS S3
- ✅ Using existing S3 tools (aws-cli, s3cmd)
- ✅ Generating presigned URLs
- ✅ Need S3 compatibility for external systems

### Use Workers API when:
- ✅ Building new applications on Cloudflare
- ✅ Need better performance (native binding)
- ✅ Don't want to manage access keys
- ✅ Using R2 from Workers

---

## R2-Specific Extensions

R2 adds some extensions to the S3 API:

### Conditional Operations

```typescript
// Only upload if file doesn't exist
await s3Client.send(new PutObjectCommand({
  Bucket: 'my-bucket',
  Key: 'file.txt',
  Body: data,
  IfUnmodifiedSince: new Date('2020-01-01'), // Before R2 existed
}));
```

### Storage Class

R2 currently only supports 'Standard' storage class.

```typescript
await s3Client.send(new PutObjectCommand({
  Bucket: 'my-bucket',
  Key: 'file.txt',
  Body: data,
  StorageClass: 'STANDARD',
}));
```

---

## Migration from S3

### 1. Update Endpoint

```diff
const s3Client = new S3Client({
  region: 'auto',
- endpoint: 'https://s3.amazonaws.com',
+ endpoint: 'https://<ACCOUNT_ID>.r2.cloudflarestorage.com',
  credentials: {
-   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
-   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
+   accessKeyId: process.env.R2_ACCESS_KEY_ID,
+   secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
```

### 2. Remove Unsupported Features

```diff
await s3Client.send(new PutObjectCommand({
  Bucket: 'my-bucket',
  Key: 'file.txt',
  Body: data,
- ACL: 'public-read',  // ❌ Not supported
- Tagging: 'key=value', // ❌ Not supported (use custom metadata)
+ Metadata: {            // ✅ Use custom metadata instead
+   visibility: 'public',
+ },
}));
```

### 3. Use CORS Instead of ACLs

R2 doesn't support S3 ACLs. Use CORS policies instead for browser access.

---

## Common Issues

### Issue: SignatureDoesNotMatch

**Cause:** Incorrect access keys or endpoint URL

**Fix:**
- Verify access key ID and secret
- Ensure endpoint includes your account ID
- Check region is set to 'auto'

### Issue: Presigned URLs Don't Work with Custom Domains

**Cause:** Presigned URLs only work with R2 S3 endpoint

**Fix:**
- Use `<ACCOUNT_ID>.r2.cloudflarestorage.com` endpoint
- Or use Worker with R2 binding for custom domains

### Issue: Upload Size Exceeds Limit

**Cause:** S3 API PUT has 5GB limit, but R2 Workers has 100-500MB limit

**Fix:**
- Use multipart upload for large files
- Or use S3 API directly (not through Worker)

---

## Official Resources

- **S3 API Compatibility**: https://developers.cloudflare.com/r2/api/s3/api/
- **AWS SDK Examples**: https://developers.cloudflare.com/r2/examples/aws/
- **Presigned URLs**: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
