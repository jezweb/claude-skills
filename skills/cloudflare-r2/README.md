# Cloudflare R2 Object Storage

Complete knowledge domain for Cloudflare R2 - S3-compatible object storage on Cloudflare's global network.

---

## Auto-Trigger Keywords

### Primary Keywords
- r2 storage
- cloudflare r2
- r2 upload
- r2 download
- r2 bucket
- r2 binding
- object storage
- r2 api
- r2 workers

### Secondary Keywords
- s3 compatible
- r2 cors
- presigned urls
- multipart upload
- r2 get
- r2 put
- r2 delete
- r2 list
- file upload
- asset storage
- image storage
- r2 metadata
- custom metadata
- http metadata
- r2 wrangler

### Error-Based Keywords
- R2_ERROR
- CORS error r2
- presigned url failed
- multipart upload failed
- r2 quota exceeded
- content-type missing
- r2 bucket not found
- r2 access denied
- bulk delete failed

### Framework Integration Keywords
- r2 hono
- r2 workers api
- r2 cloudflare workers
- wrangler r2
- r2 bindings

---

## What This Skill Does

This skill provides complete R2 knowledge including:

- ✅ **R2 Workers API** - put(), get(), head(), delete(), list()
- ✅ **Multipart Uploads** - For files >100MB with resumable uploads
- ✅ **Presigned URLs** - Client-side direct uploads/downloads
- ✅ **CORS Configuration** - Browser access to R2 buckets
- ✅ **HTTP Metadata** - Content-Type, Cache-Control, Content-Disposition
- ✅ **Custom Metadata** - User-defined key-value pairs
- ✅ **Bucket Configuration** - wrangler.jsonc setup and bindings
- ✅ **Error Handling** - Retry strategies and common errors
- ✅ **Performance Optimization** - Batch operations, range requests, caching

---

## Known Issues Prevented

| Issue | Description | Prevention |
|-------|-------------|------------|
| **CORS errors** | Browser uploads fail | Configure CORS before browser access |
| **Binary downloads** | Files download as binary blob | Always set `contentType` on upload |
| **Presigned URL security** | URLs never expire | Set `X-Amz-Expires` parameter |
| **Multipart limits** | Upload fails with large files | Use 5MB-100MB parts, max 10,000 parts |
| **Bulk delete limits** | Deleting >1000 keys fails | Chunk into batches of 1000 |
| **Metadata overflow** | Custom metadata exceeds 2KB | Keep total metadata under 2KB |

---

## When to Use This Skill

### ✅ Use this skill when:
- Storing user uploads (images, documents, videos)
- Serving static assets (CSS, JS, images)
- Building file management systems
- Implementing direct client uploads
- Setting up CORS for browser access
- Generating presigned URLs
- Uploading large files (multipart)
- Migrating from S3 to R2

### ❌ When NOT to use:
- You need a relational database (use cloudflare-d1)
- You need key-value storage (use cloudflare-kv)
- Files are <1KB (KV might be better)
- You need vector search (use cloudflare-vectorize)

---

## Quick Example

```typescript
import { Hono } from 'hono';

type Bindings = {
  MY_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// Upload file
app.put('/upload/:filename', async (c) => {
  const filename = c.req.param('filename');
  const body = await c.req.arrayBuffer();

  const object = await c.env.MY_BUCKET.put(filename, body, {
    httpMetadata: {
      contentType: c.req.header('content-type') || 'application/octet-stream',
    },
  });

  return c.json({
    success: true,
    key: object.key,
    size: object.size,
  });
});

// Download file
app.get('/download/:filename', async (c) => {
  const filename = c.req.param('filename');
  const object = await c.env.MY_BUCKET.get(filename);

  if (!object) {
    return c.json({ error: 'Not found' }, 404);
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'ETag': object.httpEtag,
    },
  });
});

export default app;
```

---

## Token Efficiency

- **Manual Setup**: 10,000-14,000 tokens
- **With This Skill**: 4,000-5,000 tokens
- **Savings**: ~60%

---

## Files Included

- `SKILL.md` - Complete R2 knowledge domain
- `templates/wrangler-r2-config.jsonc` - R2 binding configuration
- `templates/r2-simple-upload.ts` - Basic upload/download Worker
- `templates/r2-multipart-upload.ts` - Multipart upload Worker
- `templates/r2-presigned-urls.ts` - Presigned URL generator
- `templates/r2-cors-config.json` - CORS policy examples
- `reference/workers-api.md` - Complete Workers API reference
- `reference/s3-compatibility.md` - S3 API compatibility notes
- `reference/common-patterns.md` - Common R2 patterns

---

## Dependencies

- **cloudflare-worker-base** - For Hono + Vite + Worker setup
- **wrangler** - For R2 bucket management
- **aws4fetch** (optional) - For presigned URL generation

---

## Production Status

✅ **Production Ready**

This skill is based on:
- Official Cloudflare R2 documentation
- Cloudflare Workers SDK examples
- Production-tested patterns
- Latest package versions (verified 2025-10-21)

---

## Related Skills

- **cloudflare-worker-base** - Base Worker setup with Hono
- **cloudflare-d1** - Serverless SQLite database
- **cloudflare-kv** - Key-value storage
- **cloudflare-workers-ai** - AI inference on Workers

---

**Last Updated**: 2025-10-21
**Status**: Production Ready ✅
**Maintainer**: Jeremy Dawes | jeremy@jezweb.net
