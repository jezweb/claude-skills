# R2 Workers API Complete Reference

**Last Updated**: 2025-10-21
**Official Docs**: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/

---

## R2Bucket Methods

### put()

Upload an object to R2.

```typescript
put(
  key: string,
  value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob,
  options?: R2PutOptions
): Promise<R2Object | null>
```

**Parameters:**
- `key` - Object key (path) in the bucket
- `value` - Object data
- `options` - Optional upload options

**Returns:**
- `R2Object` - Metadata of uploaded object
- `null` - If precondition failed (onlyIf clause)

**Options (R2PutOptions):**
```typescript
interface R2PutOptions {
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
  md5?: ArrayBuffer;
  sha1?: ArrayBuffer;
  sha256?: ArrayBuffer;
  sha384?: ArrayBuffer;
  sha512?: ArrayBuffer;
  onlyIf?: R2Conditional;
  storageClass?: 'Standard';
}
```

---

### get()

Download an object from R2.

```typescript
get(
  key: string,
  options?: R2GetOptions
): Promise<R2ObjectBody | null>
```

**Parameters:**
- `key` - Object key (path) in the bucket
- `options` - Optional download options

**Returns:**
- `R2ObjectBody` - Object with metadata and body stream
- `null` - If object doesn't exist or precondition failed

**Options (R2GetOptions):**
```typescript
interface R2GetOptions {
  onlyIf?: R2Conditional | Headers;
  range?: R2Range;
}
```

---

### head()

Get object metadata without downloading body.

```typescript
head(key: string): Promise<R2Object | null>
```

**Parameters:**
- `key` - Object key (path) in the bucket

**Returns:**
- `R2Object` - Object metadata only
- `null` - If object doesn't exist

**Use Cases:**
- Check if file exists
- Get file size
- Get last modified date
- Validate etag

---

### delete()

Delete one or more objects.

```typescript
delete(key: string | string[]): Promise<void>
```

**Parameters:**
- `key` - Single key or array of keys (max 1000)

**Returns:**
- `void` - Always succeeds (idempotent)

**Notes:**
- No error if object doesn't exist
- Can delete up to 1000 objects at once
- Deletes are strongly consistent

---

### list()

List objects in the bucket.

```typescript
list(options?: R2ListOptions): Promise<R2Objects>
```

**Parameters:**
- `options` - Optional listing options

**Returns:**
- `R2Objects` - List of objects and metadata

**Options (R2ListOptions):**
```typescript
interface R2ListOptions {
  limit?: number;          // Max 1000, default 1000
  prefix?: string;         // Filter by prefix
  cursor?: string;         // Pagination cursor
  delimiter?: string;      // Folder delimiter (usually '/')
  include?: ('httpMetadata' | 'customMetadata')[];
}
```

**Response (R2Objects):**
```typescript
interface R2Objects {
  objects: R2Object[];           // Array of objects
  truncated: boolean;            // true if more results exist
  cursor?: string;               // Cursor for next page
  delimitedPrefixes: string[];   // "Folder" names (if delimiter used)
}
```

---

### createMultipartUpload()

Create a new multipart upload.

```typescript
createMultipartUpload(
  key: string,
  options?: R2MultipartOptions
): Promise<R2MultipartUpload>
```

**Parameters:**
- `key` - Object key for the upload
- `options` - Optional metadata

**Returns:**
- `R2MultipartUpload` - Object for managing the upload

**Options (R2MultipartOptions):**
```typescript
interface R2MultipartOptions {
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
}
```

---

### resumeMultipartUpload()

Resume an existing multipart upload.

```typescript
resumeMultipartUpload(
  key: string,
  uploadId: string
): R2MultipartUpload
```

**Parameters:**
- `key` - Object key for the upload
- `uploadId` - Upload ID from createMultipartUpload()

**Returns:**
- `R2MultipartUpload` - Object for managing the upload

**Notes:**
- Does NOT validate uploadId or key
- No network request made
- Use to continue an upload after Worker restart

---

## R2Object Interface

Metadata for an R2 object.

```typescript
interface R2Object {
  key: string;                          // Object key
  version: string;                      // Version ID
  size: number;                         // Size in bytes
  etag: string;                         // ETag (without quotes)
  httpEtag: string;                     // ETag with quotes (RFC 9110)
  uploaded: Date;                       // Upload timestamp
  httpMetadata?: R2HTTPMetadata;        // HTTP metadata
  customMetadata?: Record<string, string>;  // Custom metadata
  range?: R2Range;                      // Range (if partial)
  checksums?: R2Checksums;              // Checksums
  storageClass: 'Standard';             // Storage class
  ssecKeyMd5?: string;                  // SSE-C key hash

  writeHttpMetadata(headers: Headers): void;  // Apply metadata to headers
}
```

---

## R2ObjectBody Interface

Extends R2Object with body stream and read methods.

```typescript
interface R2ObjectBody extends R2Object {
  body: ReadableStream;                 // Object body stream
  bodyUsed: boolean;                    // Whether body consumed

  arrayBuffer(): Promise<ArrayBuffer>;  // Read as ArrayBuffer
  text(): Promise<string>;              // Read as text
  json<T>(): Promise<T>;                // Read as JSON
  blob(): Promise<Blob>;                // Read as Blob
}
```

---

## R2MultipartUpload Interface

Manage a multipart upload.

```typescript
interface R2MultipartUpload {
  key: string;                          // Object key
  uploadId: string;                     // Upload ID

  uploadPart(
    partNumber: number,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob,
    options?: R2MultipartOptions
  ): Promise<R2UploadedPart>;

  abort(): Promise<void>;
  complete(uploadedParts: R2UploadedPart[]): Promise<R2Object>;
}
```

**Methods:**

- **uploadPart()** - Upload a single part (1-10,000)
- **abort()** - Cancel the multipart upload
- **complete()** - Finish upload with list of parts

---

## R2UploadedPart Interface

Metadata for an uploaded part.

```typescript
interface R2UploadedPart {
  partNumber: number;     // Part number (1-10,000)
  etag: string;           // Part ETag
}
```

---

## R2HTTPMetadata Interface

HTTP headers for object.

```typescript
interface R2HTTPMetadata {
  contentType?: string;              // Content-Type header
  contentLanguage?: string;          // Content-Language header
  contentDisposition?: string;       // Content-Disposition header
  contentEncoding?: string;          // Content-Encoding header
  cacheControl?: string;             // Cache-Control header
  cacheExpiry?: Date;                // Expires header
}
```

---

## R2Conditional Interface

Conditional operations (onlyIf clause).

```typescript
interface R2Conditional {
  etagMatches?: string;              // If-Match
  etagDoesNotMatch?: string;         // If-None-Match
  uploadedBefore?: Date;             // If-Unmodified-Since
  uploadedAfter?: Date;              // If-Modified-Since
}
```

**Alternatively, pass a Headers object with:**
- `If-Match`
- `If-None-Match`
- `If-Modified-Since`
- `If-Unmodified-Since`

---

## R2Range Interface

Byte range for partial downloads.

```typescript
interface R2Range {
  offset?: number;       // Start byte
  length?: number;       // Number of bytes
  suffix?: number;       // Last N bytes
}
```

**Examples:**
```typescript
// First 1000 bytes
{ offset: 0, length: 1000 }

// Bytes 100-200
{ offset: 100, length: 100 }

// From byte 1000 to end
{ offset: 1000 }

// Last 500 bytes
{ suffix: 500 }
```

---

## R2Checksums Interface

Stored checksums for object.

```typescript
interface R2Checksums {
  md5?: ArrayBuffer;
  sha1?: ArrayBuffer;
  sha256?: ArrayBuffer;
  sha384?: ArrayBuffer;
  sha512?: ArrayBuffer;
}
```

---

## Complete Example

```typescript
import { Hono } from 'hono';

type Bindings = {
  MY_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// Upload with all metadata
app.put('/files/:key', async (c) => {
  const key = c.req.param('key');
  const body = await c.req.arrayBuffer();

  const object = await c.env.MY_BUCKET.put(key, body, {
    httpMetadata: {
      contentType: c.req.header('content-type') || 'application/octet-stream',
      cacheControl: 'public, max-age=3600',
      contentDisposition: `attachment; filename="${key}"`,
    },
    customMetadata: {
      uploadedBy: 'api',
      uploadedAt: new Date().toISOString(),
    },
    onlyIf: {
      // Only upload if file doesn't exist
      uploadedBefore: new Date('2020-01-01'),
    },
  });

  if (!object) {
    return c.json({ error: 'File already exists' }, 409);
  }

  return c.json({
    key: object.key,
    size: object.size,
    etag: object.etag,
  });
});

// Download with range support
app.get('/files/:key', async (c) => {
  const key = c.req.param('key');
  const rangeHeader = c.req.header('range');

  let options: R2GetOptions | undefined;

  if (rangeHeader) {
    // Parse range header: bytes=0-1000
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = parseInt(match[1]);
      const end = match[2] ? parseInt(match[2]) : undefined;
      options = {
        range: {
          offset: start,
          length: end ? end - start + 1 : undefined,
        },
      };
    }
  }

  const object = await c.env.MY_BUCKET.get(key, options);

  if (!object) {
    return c.json({ error: 'Not found' }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);

  if (object.range) {
    headers.set('content-range', `bytes ${object.range.offset}-${object.range.offset + object.range.length - 1}/${object.size}`);
    return new Response(object.body, {
      status: 206,
      headers,
    });
  }

  return new Response(object.body, { headers });
});

export default app;
```
