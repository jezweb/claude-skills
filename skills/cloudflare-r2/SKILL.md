---
name: Cloudflare R2 Object Storage
description: |
  Complete knowledge domain for Cloudflare R2 - S3-compatible object storage on Cloudflare's edge network.

  Use when: creating R2 buckets, uploading files to R2, downloading objects, configuring R2 bindings,
  setting up CORS, generating presigned URLs, multipart uploads, storing images/assets, managing object
  metadata, or encountering "R2_ERROR", CORS errors, presigned URL failures, multipart upload issues,
  or storage quota errors.

  Keywords: r2, r2 storage, cloudflare r2, r2 bucket, r2 upload, r2 download, r2 binding, object storage,
  s3 compatible, r2 cors, presigned urls, multipart upload, r2 api, r2 workers, file upload, asset storage,
  R2_ERROR, R2Bucket, r2 metadata, custom metadata, http metadata, content-type, cache-control,
  aws4fetch, s3 client, bulk delete, r2 list, storage class
---

# Cloudflare R2 Object Storage

**Status**: Production Ready ✅
**Last Updated**: 2025-10-21
**Dependencies**: cloudflare-worker-base (for Worker setup)
**Latest Versions**: wrangler@4.43.0, @cloudflare/workers-types@4.20251014.0, aws4fetch@1.0.20

---

## Quick Start (5 Minutes)

### 1. Create R2 Bucket

```bash
# Via Wrangler CLI (recommended)
npx wrangler r2 bucket create my-bucket

# Or via Cloudflare Dashboard
# https://dash.cloudflare.com → R2 Object Storage → Create bucket
```

**Bucket Naming Rules:**
- 3-63 characters
- Lowercase letters, numbers, hyphens only
- Must start/end with letter or number
- Globally unique within your account

### 2. Configure R2 Binding

Add to your `wrangler.jsonc`:

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-11",
  "r2_buckets": [
    {
      "binding": "MY_BUCKET",          // Available as env.MY_BUCKET in your Worker
      "bucket_name": "my-bucket",      // Name from wrangler r2 bucket create
      "preview_bucket_name": "my-bucket-preview"  // Optional: separate bucket for dev
    }
  ]
}
```

**CRITICAL:**
- `binding` is how you access the bucket in code (`env.MY_BUCKET`)
- `bucket_name` is the actual R2 bucket name
- `preview_bucket_name` is optional but recommended for separate dev/prod data

### 3. Basic Upload/Download

```typescript
// src/index.ts
import { Hono } from 'hono';

type Bindings = {
  MY_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// Upload file
app.put('/upload/:filename', async (c) => {
  const filename = c.req.param('filename');
  const body = await c.req.arrayBuffer();

  try {
    const object = await c.env.MY_BUCKET.put(filename, body, {
      httpMetadata: {
        contentType: c.req.header('content-type') || 'application/octet-stream',
      },
    });

    return c.json({
      success: true,
      key: object.key,
      size: object.size,
      etag: object.etag,
    });
  } catch (error: any) {
    console.error('R2 Upload Error:', error.message);
    return c.json({ error: 'Upload failed' }, 500);
  }
});

// Download file
app.get('/download/:filename', async (c) => {
  const filename = c.req.param('filename');

  try {
    const object = await c.env.MY_BUCKET.get(filename);

    if (!object) {
      return c.json({ error: 'File not found' }, 404);
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'ETag': object.httpEtag,
        'Cache-Control': object.httpMetadata?.cacheControl || 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('R2 Download Error:', error.message);
    return c.json({ error: 'Download failed' }, 500);
  }
});

export default app;
```

### 4. Deploy and Test

```bash
# Deploy
npx wrangler deploy

# Test upload
curl -X PUT https://my-worker.workers.dev/upload/test.txt \
  -H "Content-Type: text/plain" \
  -d "Hello, R2!"

# Test download
curl https://my-worker.workers.dev/download/test.txt
```

---

## R2 Workers API

### Type Definitions

```typescript
// Add to env.d.ts or worker-configuration.d.ts
interface Env {
  MY_BUCKET: R2Bucket;
  // ... other bindings
}

// For Hono
type Bindings = {
  MY_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();
```

### put() - Upload Objects

**Signature:**
```typescript
put(key: string, value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob, options?: R2PutOptions): Promise<R2Object | null>
```

**Basic Usage:**

```typescript
// Upload from request body
await env.MY_BUCKET.put('path/to/file.txt', request.body);

// Upload string
await env.MY_BUCKET.put('config.json', JSON.stringify({ foo: 'bar' }));

// Upload ArrayBuffer
await env.MY_BUCKET.put('image.png', await file.arrayBuffer());
```

**With Metadata:**

```typescript
const object = await env.MY_BUCKET.put('document.pdf', fileData, {
  httpMetadata: {
    contentType: 'application/pdf',
    contentLanguage: 'en-US',
    contentDisposition: 'attachment; filename="report.pdf"',
    contentEncoding: 'gzip',
    cacheControl: 'public, max-age=86400',
  },
  customMetadata: {
    userId: '12345',
    uploadDate: new Date().toISOString(),
    version: '1.0',
  },
});
```

**Conditional Uploads (Prevent Overwrites):**

```typescript
// Only upload if file doesn't exist
const object = await env.MY_BUCKET.put('file.txt', data, {
  onlyIf: {
    uploadedBefore: new Date('2020-01-01'), // Any date before R2 existed
  },
});

if (!object) {
  // File already exists, upload prevented
  return c.json({ error: 'File already exists' }, 409);
}

// Only upload if etag matches (update specific version)
const object = await env.MY_BUCKET.put('file.txt', data, {
  onlyIf: {
    etagMatches: existingEtag,
  },
});
```

**With Checksums:**

```typescript
// R2 will verify the checksum
const md5Hash = await crypto.subtle.digest('MD5', fileData);

await env.MY_BUCKET.put('file.txt', fileData, {
  md5: md5Hash,
});
```

### get() - Download Objects

**Signature:**
```typescript
get(key: string, options?: R2GetOptions): Promise<R2ObjectBody | null>
```

**Basic Usage:**

```typescript
// Get full object
const object = await env.MY_BUCKET.get('file.txt');

if (!object) {
  return c.json({ error: 'Not found' }, 404);
}

// Return as response
return new Response(object.body, {
  headers: {
    'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
    'ETag': object.httpEtag,
  },
});
```

**Read as Different Formats:**

```typescript
const object = await env.MY_BUCKET.get('data.json');

if (object) {
  const text = await object.text();           // As string
  const json = await object.json();           // As JSON object
  const buffer = await object.arrayBuffer();  // As ArrayBuffer
  const blob = await object.blob();           // As Blob
}
```

**Range Requests (Partial Downloads):**

```typescript
// Get first 1MB of file
const object = await env.MY_BUCKET.get('large-file.mp4', {
  range: { offset: 0, length: 1024 * 1024 },
});

// Get bytes 100-200
const object = await env.MY_BUCKET.get('file.bin', {
  range: { offset: 100, length: 100 },
});

// Get from offset to end
const object = await env.MY_BUCKET.get('file.bin', {
  range: { offset: 1000 },
});
```

**Conditional Downloads:**

```typescript
// Only download if etag matches
const object = await env.MY_BUCKET.get('file.txt', {
  onlyIf: {
    etagMatches: cachedEtag,
  },
});

if (!object) {
  // Etag didn't match, file was modified
  return c.json({ error: 'File changed' }, 412);
}
```

### head() - Get Metadata Only

**Signature:**
```typescript
head(key: string): Promise<R2Object | null>
```

**Usage:**

```typescript
// Get object metadata without downloading body
const object = await env.MY_BUCKET.head('file.txt');

if (object) {
  console.log({
    key: object.key,
    size: object.size,
    etag: object.etag,
    uploaded: object.uploaded,
    contentType: object.httpMetadata?.contentType,
    customMetadata: object.customMetadata,
  });
}
```

**Use Cases:**
- Check if file exists
- Get file size before downloading
- Check last modified date
- Validate etag for caching

### delete() - Delete Objects

**Signature:**
```typescript
delete(key: string | string[]): Promise<void>
```

**Single Delete:**

```typescript
// Delete single object
await env.MY_BUCKET.delete('file.txt');

// No error if file doesn't exist (idempotent)
```

**Bulk Delete (Up to 1000 keys):**

```typescript
// Delete multiple objects at once
const keysToDelete = [
  'old-file-1.txt',
  'old-file-2.txt',
  'temp/cache-data.json',
];

await env.MY_BUCKET.delete(keysToDelete);

// Much faster than individual deletes
```

**Delete with Confirmation:**

```typescript
app.delete('/files/:filename', async (c) => {
  const filename = c.req.param('filename');

  // Check if exists first
  const exists = await c.env.MY_BUCKET.head(filename);

  if (!exists) {
    return c.json({ error: 'File not found' }, 404);
  }

  await c.env.MY_BUCKET.delete(filename);

  return c.json({ success: true, deleted: filename });
});
```

### list() - List Objects

**Signature:**
```typescript
list(options?: R2ListOptions): Promise<R2Objects>
```

**Basic Listing:**

```typescript
// List all objects (up to 1000)
const listed = await env.MY_BUCKET.list();

console.log({
  objects: listed.objects,      // Array of R2Object
  truncated: listed.truncated,  // true if more results exist
  cursor: listed.cursor,        // For pagination
});

// Process objects
for (const object of listed.objects) {
  console.log(`${object.key}: ${object.size} bytes`);
}
```

**Pagination:**

```typescript
app.get('/api/files', async (c) => {
  const cursor = c.req.query('cursor');

  const listed = await c.env.MY_BUCKET.list({
    limit: 100,
    cursor: cursor || undefined,
  });

  return c.json({
    files: listed.objects.map(obj => ({
      name: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
      etag: obj.etag,
    })),
    hasMore: listed.truncated,
    nextCursor: listed.cursor,
  });
});
```

**Prefix Filtering (List by Directory):**

```typescript
// List all files in 'images/' folder
const images = await env.MY_BUCKET.list({
  prefix: 'images/',
});

// List all user files
const userFiles = await env.MY_BUCKET.list({
  prefix: `users/${userId}/`,
});
```

**Delimiter (Folder-like Listing):**

```typescript
// List only top-level items in 'uploads/'
const listed = await env.MY_BUCKET.list({
  prefix: 'uploads/',
  delimiter: '/',
});

console.log('Files:', listed.objects);          // Files directly in uploads/
console.log('Folders:', listed.delimitedPrefixes); // Sub-folders like uploads/2024/
```

---

## Multipart Uploads

For files larger than 100MB or for resumable uploads, use multipart upload API.

### When to Use Multipart Upload

✅ **Use multipart when:**
- File size > 100MB
- Need resumable uploads
- Want to parallelize upload
- Uploading from browser/client

❌ **Don't use multipart when:**
- File size < 5MB (overhead not worth it)
- Uploading within Worker (use direct put())

### Basic Multipart Upload Flow

```typescript
app.post('/api/upload/start', async (c) => {
  const { filename } = await c.req.json();

  // Create multipart upload
  const multipart = await c.env.MY_BUCKET.createMultipartUpload(filename, {
    httpMetadata: {
      contentType: 'application/octet-stream',
    },
  });

  return c.json({
    key: multipart.key,
    uploadId: multipart.uploadId,
  });
});

app.put('/api/upload/part', async (c) => {
  const { key, uploadId, partNumber } = await c.req.json();
  const body = await c.req.arrayBuffer();

  // Resume the multipart upload
  const multipart = c.env.MY_BUCKET.resumeMultipartUpload(key, uploadId);

  // Upload a part
  const uploadedPart = await multipart.uploadPart(partNumber, body);

  return c.json({
    partNumber: uploadedPart.partNumber,
    etag: uploadedPart.etag,
  });
});

app.post('/api/upload/complete', async (c) => {
  const { key, uploadId, parts } = await c.req.json();

  // Resume the multipart upload
  const multipart = c.env.MY_BUCKET.resumeMultipartUpload(key, uploadId);

  // Complete the upload
  const object = await multipart.complete(parts);

  return c.json({
    success: true,
    key: object.key,
    size: object.size,
    etag: object.etag,
  });
});

app.post('/api/upload/abort', async (c) => {
  const { key, uploadId } = await c.req.json();

  const multipart = c.env.MY_BUCKET.resumeMultipartUpload(key, uploadId);
  await multipart.abort();

  return c.json({ success: true });
});
```

### Complete Multipart Upload Example

```typescript
// Full Worker implementing multipart upload API
interface Env {
  MY_BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);
    const action = url.searchParams.get('action');

    switch (request.method) {
      case 'POST': {
        switch (action) {
          case 'mpu-create': {
            // Create multipart upload
            const multipart = await env.MY_BUCKET.createMultipartUpload(key);
            return Response.json({
              key: multipart.key,
              uploadId: multipart.uploadId,
            });
          }
          case 'mpu-complete': {
            // Complete multipart upload
            const uploadId = url.searchParams.get('uploadId')!;
            const multipart = env.MY_BUCKET.resumeMultipartUpload(key, uploadId);
            const parts = await request.json();
            const object = await multipart.complete(parts);
            return Response.json({
              key: object.key,
              etag: object.etag,
              size: object.size,
            });
          }
          default:
            return new Response(`Unknown action: ${action}`, { status: 400 });
        }
      }
      case 'PUT': {
        switch (action) {
          case 'mpu-uploadpart': {
            // Upload a part
            const uploadId = url.searchParams.get('uploadId')!;
            const partNumber = parseInt(url.searchParams.get('partNumber')!);
            const multipart = env.MY_BUCKET.resumeMultipartUpload(key, uploadId);
            const uploadedPart = await multipart.uploadPart(partNumber, request.body!);
            return Response.json({
              partNumber: uploadedPart.partNumber,
              etag: uploadedPart.etag,
            });
          }
          default:
            return new Response(`Unknown action: ${action}`, { status: 400 });
        }
      }
      case 'DELETE': {
        switch (action) {
          case 'mpu-abort': {
            // Abort multipart upload
            const uploadId = url.searchParams.get('uploadId')!;
            const multipart = env.MY_BUCKET.resumeMultipartUpload(key, uploadId);
            await multipart.abort();
            return new Response(null, { status: 204 });
          }
          default:
            return new Response(`Unknown action: ${action}`, { status: 400 });
        }
      }
      default:
        return new Response('Method Not Allowed', { status: 405 });
    }
  },
} satisfies ExportedHandler<Env>;
```

---

## Presigned URLs

Presigned URLs allow clients to upload/download objects directly to/from R2 without going through your Worker.

### When to Use Presigned URLs

✅ **Use presigned URLs when:**
- Client uploads directly to R2 (saves Worker bandwidth)
- Temporary access to private objects
- Sharing download links with expiry
- Avoiding Worker request size limits

❌ **Don't use presigned URLs when:**
- You need to process/validate uploads
- Files are already public
- Using custom domains (presigned URLs only work with R2 endpoint)

### Generate Presigned URLs with aws4fetch

```bash
npm install aws4fetch
```

```typescript
import { AwsClient } from 'aws4fetch';

interface Env {
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  ACCOUNT_ID: string;
  MY_BUCKET: R2Bucket;
}

const app = new Hono<{ Bindings: Env }>();

app.post('/api/presigned-upload', async (c) => {
  const { filename } = await c.req.json();

  // Create AWS client for R2
  const r2Client = new AwsClient({
    accessKeyId: c.env.R2_ACCESS_KEY_ID,
    secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
  });

  const bucketName = 'my-bucket';
  const accountId = c.env.ACCOUNT_ID;

  const url = new URL(
    `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${filename}`
  );

  // Set expiry (1 hour)
  url.searchParams.set('X-Amz-Expires', '3600');

  // Sign the URL for PUT
  const signed = await r2Client.sign(
    new Request(url, { method: 'PUT' }),
    { aws: { signQuery: true } }
  );

  return c.json({
    uploadUrl: signed.url,
    expiresIn: 3600,
  });
});

app.post('/api/presigned-download', async (c) => {
  const { filename } = await c.req.json();

  const r2Client = new AwsClient({
    accessKeyId: c.env.R2_ACCESS_KEY_ID,
    secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
  });

  const bucketName = 'my-bucket';
  const accountId = c.env.ACCOUNT_ID;

  const url = new URL(
    `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${filename}`
  );

  url.searchParams.set('X-Amz-Expires', '3600');

  const signed = await r2Client.sign(
    new Request(url, { method: 'GET' }),
    { aws: { signQuery: true } }
  );

  return c.json({
    downloadUrl: signed.url,
    expiresIn: 3600,
  });
});
```

### Client-Side Upload with Presigned URL

```javascript
// 1. Get presigned URL from your Worker
const response = await fetch('https://my-worker.workers.dev/api/presigned-upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ filename: 'photo.jpg' }),
});

const { uploadUrl } = await response.json();

// 2. Upload file directly to R2
const file = document.querySelector('input[type="file"]').files[0];

await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': file.type,
  },
});
```

### Presigned URL Security

**CRITICAL:**
- ❌ **NEVER** expose R2 access keys in client-side code
- ✅ **ALWAYS** generate presigned URLs server-side
- ✅ **ALWAYS** set appropriate expiry times (1-24 hours typical)
- ✅ **CONSIDER** adding authentication before generating URLs
- ✅ **CONSIDER** rate limiting presigned URL generation

```typescript
// Example with auth check
app.post('/api/presigned-upload', async (c) => {
  // Verify user is authenticated
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Validate user has permission
  const userId = await verifyToken(authHeader);
  if (!userId) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  // Only allow uploads to user's own folder
  const { filename } = await c.req.json();
  const key = `users/${userId}/${filename}`;

  // Generate presigned URL...
});
```

---

## CORS Configuration

Configure CORS to allow browser requests to your R2 bucket.

### Public Bucket CORS

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://example.com"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

### Allow All Origins (Public Assets)

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["Range"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

### Upload with CORS

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://app.example.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": [
        "Content-Type",
        "Content-MD5",
        "x-amz-meta-*"
      ],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

### Apply CORS via Dashboard

1. Go to Cloudflare Dashboard → R2
2. Select your bucket
3. Go to Settings tab
4. Under CORS Policy → Add CORS policy
5. Paste JSON configuration
6. Save

### CORS for Presigned URLs

When using presigned URLs, CORS is handled by R2 directly. Configure CORS on the bucket, not in your Worker.

---

## HTTP Metadata

### Content-Type

```typescript
// Set content type on upload
await env.MY_BUCKET.put('image.jpg', imageData, {
  httpMetadata: {
    contentType: 'image/jpeg',
  },
});

// Will be returned in Content-Type header when downloaded
```

### Cache-Control

```typescript
// Set caching headers
await env.MY_BUCKET.put('static/logo.png', logoData, {
  httpMetadata: {
    contentType: 'image/png',
    cacheControl: 'public, max-age=31536000, immutable',
  },
});

// For frequently updated content
await env.MY_BUCKET.put('api/data.json', jsonData, {
  httpMetadata: {
    contentType: 'application/json',
    cacheControl: 'public, max-age=60, must-revalidate',
  },
});
```

### Content-Disposition

```typescript
// Force download with specific filename
await env.MY_BUCKET.put('report.pdf', pdfData, {
  httpMetadata: {
    contentType: 'application/pdf',
    contentDisposition: 'attachment; filename="monthly-report.pdf"',
  },
});

// Display inline
await env.MY_BUCKET.put('image.jpg', imageData, {
  httpMetadata: {
    contentType: 'image/jpeg',
    contentDisposition: 'inline',
  },
});
```

### Content-Encoding

```typescript
// Indicate gzip compression
await env.MY_BUCKET.put('data.json.gz', gzippedData, {
  httpMetadata: {
    contentType: 'application/json',
    contentEncoding: 'gzip',
  },
});
```

---

## Custom Metadata

Store arbitrary key-value metadata with objects.

### Setting Custom Metadata

```typescript
await env.MY_BUCKET.put('document.pdf', pdfData, {
  customMetadata: {
    userId: '12345',
    department: 'engineering',
    uploadDate: new Date().toISOString(),
    version: '1.0',
    approved: 'true',
  },
});
```

### Reading Custom Metadata

```typescript
const object = await env.MY_BUCKET.head('document.pdf');

if (object) {
  console.log(object.customMetadata);
  // {
  //   userId: '12345',
  //   department: 'engineering',
  //   uploadDate: '2025-10-21T10:00:00.000Z',
  //   version: '1.0',
  //   approved: 'true'
  // }
}
```

### Limitations

- Max 2KB total size for all custom metadata
- Keys and values must be strings
- Keys are case-insensitive
- No limit on number of keys (within 2KB total)

---

## Error Handling

### Common R2 Errors

```typescript
try {
  await env.MY_BUCKET.put(key, data);
} catch (error: any) {
  const message = error.message;

  if (message.includes('R2_ERROR')) {
    // Generic R2 error
  } else if (message.includes('exceeded')) {
    // Quota exceeded
  } else if (message.includes('precondition')) {
    // Conditional operation failed
  } else if (message.includes('multipart')) {
    // Multipart upload error
  }

  console.error('R2 Error:', message);
  return c.json({ error: 'Storage operation failed' }, 500);
}
```

### Retry Logic

```typescript
async function r2WithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const message = error.message;

      // Retry on transient errors
      const isRetryable =
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('temporarily unavailable');

      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Retry logic failed');
}

// Usage
const object = await r2WithRetry(() =>
  env.MY_BUCKET.get('important-file.txt')
);
```

---

## Performance Optimization

### Batch Operations

```typescript
// ❌ DON'T: Delete files one by one
for (const file of filesToDelete) {
  await env.MY_BUCKET.delete(file);
}

// ✅ DO: Batch delete (up to 1000 keys)
await env.MY_BUCKET.delete(filesToDelete);
```

### Range Requests for Large Files

```typescript
// Download only the first 10MB of a large video
const object = await env.MY_BUCKET.get('video.mp4', {
  range: { offset: 0, length: 10 * 1024 * 1024 },
});

// Return range to client
return new Response(object.body, {
  status: 206, // Partial Content
  headers: {
    'Content-Type': 'video/mp4',
    'Content-Range': `bytes 0-${10 * 1024 * 1024 - 1}/${object.size}`,
  },
});
```

### Cache Headers

```typescript
// Immutable assets (hashed filenames)
await env.MY_BUCKET.put('static/app.abc123.js', jsData, {
  httpMetadata: {
    contentType: 'application/javascript',
    cacheControl: 'public, max-age=31536000, immutable',
  },
});

// Dynamic content
await env.MY_BUCKET.put('api/latest.json', jsonData, {
  httpMetadata: {
    contentType: 'application/json',
    cacheControl: 'public, max-age=60, stale-while-revalidate=300',
  },
});
```

### Checksums for Data Integrity

```typescript
// Compute MD5 checksum
const md5Hash = await crypto.subtle.digest('MD5', fileData);

// R2 will verify checksum on upload
await env.MY_BUCKET.put('important.dat', fileData, {
  md5: md5Hash,
});

// If checksum doesn't match, upload will fail
```

---

## Best Practices Summary

### ✅ Always Do:

1. **Set appropriate `contentType`** for all uploads
2. **Use batch delete** for multiple objects (up to 1000)
3. **Set cache headers** (`cacheControl`) for static assets
4. **Use presigned URLs** for large client uploads
5. **Use multipart upload** for files > 100MB
6. **Set CORS policy** before allowing browser uploads
7. **Set expiry times** on presigned URLs (1-24 hours)
8. **Handle errors gracefully** with try/catch
9. **Use `head()`** instead of `get()` when you only need metadata
10. **Use conditional operations** to prevent overwrites

### ❌ Never Do:

1. **Never expose R2 access keys** in client-side code
2. **Never skip `contentType`** (files will download as binary)
3. **Never delete in loops** (use batch delete)
4. **Never upload without error handling**
5. **Never skip CORS** for browser uploads
6. **Never use multipart** for small files (< 5MB)
7. **Never delete >1000 keys** in single call (will fail)
8. **Never assume uploads succeed** (always check response)
9. **Never skip presigned URL expiry** (security risk)
10. **Never hardcode bucket names** (use bindings)

---

## Known Issues Prevented

| Issue | Description | How to Avoid |
|-------|-------------|--------------|
| **CORS errors in browser** | Browser can't upload/download due to missing CORS policy | Configure CORS in bucket settings before browser access |
| **Files download as binary** | Missing content-type causes browsers to download files instead of display | Always set `httpMetadata.contentType` on upload |
| **Presigned URL expiry** | URLs never expire, posing security risk | Always set `X-Amz-Expires` (1-24 hours typical) |
| **Multipart upload limits** | Parts exceed 100MB or >10,000 parts | Keep parts 5MB-100MB, max 10,000 parts per upload |
| **Bulk delete limits** | Trying to delete >1000 keys fails | Chunk deletes into batches of 1000 |
| **Custom metadata overflow** | Metadata exceeds 2KB limit | Keep custom metadata under 2KB total |

---

## Wrangler Commands Reference

```bash
# Bucket management
wrangler r2 bucket create <BUCKET_NAME>
wrangler r2 bucket list
wrangler r2 bucket delete <BUCKET_NAME>

# Object management
wrangler r2 object put <BUCKET_NAME>/<KEY> --file=<FILE_PATH>
wrangler r2 object get <BUCKET_NAME>/<KEY> --file=<OUTPUT_PATH>
wrangler r2 object delete <BUCKET_NAME>/<KEY>

# List objects
wrangler r2 object list <BUCKET_NAME>
wrangler r2 object list <BUCKET_NAME> --prefix="folder/"
```

---

## Official Documentation

- **R2 Overview**: https://developers.cloudflare.com/r2/
- **Get Started**: https://developers.cloudflare.com/r2/get-started/
- **Workers API**: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
- **Multipart Upload**: https://developers.cloudflare.com/r2/api/workers/workers-multipart-usage/
- **Presigned URLs**: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- **CORS Configuration**: https://developers.cloudflare.com/r2/buckets/cors/
- **Public Buckets**: https://developers.cloudflare.com/r2/buckets/public-buckets/

---

**Ready to store with R2!** 🚀
