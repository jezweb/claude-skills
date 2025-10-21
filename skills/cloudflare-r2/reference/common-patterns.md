# R2 Common Patterns

**Last Updated**: 2025-10-21

---

## Image Upload & Serving

### Upload with Automatic Content-Type Detection

```typescript
import { Hono } from 'hono';

type Bindings = {
  IMAGES: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post('/upload/image', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('image') as File;

  if (!file) {
    return c.json({ error: 'No file provided' }, 400);
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: 'Invalid file type' }, 400);
  }

  // Generate unique filename
  const extension = file.name.split('.').pop();
  const filename = `${crypto.randomUUID()}.${extension}`;
  const key = `images/${filename}`;

  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  const object = await c.env.IMAGES.put(key, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000, immutable',
    },
    customMetadata: {
      originalFilename: file.name,
      uploadedAt: new Date().toISOString(),
    },
  });

  return c.json({
    success: true,
    url: `/images/${filename}`,
    key: object.key,
    size: object.size,
  });
});

// Serve image
app.get('/images/:filename', async (c) => {
  const filename = c.req.param('filename');
  const key = `images/${filename}`;

  const object = await c.env.IMAGES.get(key);

  if (!object) {
    return c.json({ error: 'Image not found' }, 404);
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': object.httpEtag,
    },
  });
});

export default app;
```

---

## User File Storage with Folder Organization

```typescript
app.post('/users/:userId/files', async (c) => {
  const userId = c.req.param('userId');
  const formData = await c.req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return c.json({ error: 'No file provided' }, 400);
  }

  // Organize by user ID and date
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = file.name;
  const key = `users/${userId}/${date}/${filename}`;

  const arrayBuffer = await file.arrayBuffer();
  const object = await c.env.MY_BUCKET.put(key, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
      contentDisposition: `attachment; filename="${filename}"`,
    },
    customMetadata: {
      userId,
      uploadDate: date,
      originalSize: file.size.toString(),
    },
  });

  return c.json({
    success: true,
    fileId: object.key,
    size: object.size,
  });
});

// List user's files
app.get('/users/:userId/files', async (c) => {
  const userId = c.req.param('userId');
  const cursor = c.req.query('cursor');

  const listed = await c.env.MY_BUCKET.list({
    prefix: `users/${userId}/`,
    limit: 100,
    cursor: cursor || undefined,
  });

  return c.json({
    files: listed.objects.map(obj => ({
      key: obj.key,
      filename: obj.key.split('/').pop(),
      size: obj.size,
      uploaded: obj.uploaded,
      metadata: obj.customMetadata,
    })),
    hasMore: listed.truncated,
    cursor: listed.cursor,
  });
});
```

---

## Thumbnail Generation & Caching

```typescript
app.get('/thumbnails/:filename', async (c) => {
  const filename = c.req.param('filename');
  const width = parseInt(c.req.query('w') || '200');
  const height = parseInt(c.req.query('h') || '200');

  const thumbnailKey = `thumbnails/${width}x${height}/${filename}`;

  // Check if thumbnail already exists
  let thumbnail = await c.env.IMAGES.get(thumbnailKey);

  if (!thumbnail) {
    // Get original image
    const original = await c.env.IMAGES.get(`images/${filename}`);

    if (!original) {
      return c.json({ error: 'Image not found' }, 404);
    }

    // Generate thumbnail (using Cloudflare Images or external service)
    // This is a placeholder - use actual image processing
    const thumbnailData = await generateThumbnail(
      await original.arrayBuffer(),
      width,
      height
    );

    // Store thumbnail for future requests
    await c.env.IMAGES.put(thumbnailKey, thumbnailData, {
      httpMetadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    thumbnail = await c.env.IMAGES.get(thumbnailKey);
  }

  return new Response(thumbnail!.body, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
});

async function generateThumbnail(
  imageData: ArrayBuffer,
  width: number,
  height: number
): Promise<ArrayBuffer> {
  // Use Cloudflare Images API, sharp, or other image processing library
  // This is a placeholder
  return imageData;
}
```

---

## Versioned File Storage

```typescript
app.put('/files/:filename', async (c) => {
  const filename = c.req.param('filename');
  const body = await c.req.arrayBuffer();

  // Get current version number
  const versionKey = `versions/${filename}/latest`;
  const currentVersion = await c.env.MY_BUCKET.head(versionKey);

  let version = 1;
  if (currentVersion?.customMetadata?.version) {
    version = parseInt(currentVersion.customMetadata.version) + 1;
  }

  // Store new version
  const versionedKey = `versions/${filename}/v${version}`;
  await c.env.MY_BUCKET.put(versionedKey, body, {
    httpMetadata: {
      contentType: c.req.header('content-type') || 'application/octet-stream',
    },
    customMetadata: {
      version: version.toString(),
      createdAt: new Date().toISOString(),
    },
  });

  // Update "latest" pointer
  await c.env.MY_BUCKET.put(versionKey, body, {
    httpMetadata: {
      contentType: c.req.header('content-type') || 'application/octet-stream',
    },
    customMetadata: {
      version: version.toString(),
      latestVersion: 'true',
    },
  });

  return c.json({
    success: true,
    version,
    key: versionedKey,
  });
});

// Get specific version
app.get('/files/:filename/v/:version', async (c) => {
  const filename = c.req.param('filename');
  const version = c.req.param('version');

  const key = `versions/${filename}/v${version}`;
  const object = await c.env.MY_BUCKET.get(key);

  if (!object) {
    return c.json({ error: 'Version not found' }, 404);
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
    },
  });
});
```

---

## Backup & Archive Pattern

```typescript
// Daily database backup to R2
async function backupDatabase(env: Bindings) {
  const date = new Date().toISOString().split('T')[0];
  const key = `backups/database/${date}/dump.sql.gz`;

  // Generate backup (placeholder)
  const backupData = await generateDatabaseDump();

  await env.BACKUPS.put(key, backupData, {
    httpMetadata: {
      contentType: 'application/gzip',
      contentEncoding: 'gzip',
    },
    customMetadata: {
      backupDate: date,
      backupType: 'full',
      database: 'production',
    },
  });

  // Delete backups older than 30 days
  await cleanupOldBackups(env, 30);
}

async function cleanupOldBackups(env: Bindings, retentionDays: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const listed = await env.BACKUPS.list({
    prefix: 'backups/database/',
  });

  const oldBackups = listed.objects.filter(
    obj => obj.uploaded < cutoffDate
  );

  if (oldBackups.length > 0) {
    const keysToDelete = oldBackups.map(obj => obj.key);
    await env.BACKUPS.delete(keysToDelete);
  }
}
```

---

## Static Site Hosting with SPA Fallback

```typescript
app.get('/*', async (c) => {
  const url = new URL(c.req.url);
  let key = url.pathname.slice(1); // Remove leading slash

  if (key === '' || key.endsWith('/')) {
    key += 'index.html';
  }

  let object = await c.env.STATIC.get(key);

  // SPA fallback: if file not found, try index.html
  if (!object && !key.includes('.')) {
    object = await c.env.STATIC.get('index.html');
  }

  if (!object) {
    return c.json({ error: 'Not found' }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);

  // Set appropriate cache headers
  if (key.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    headers.set('Cache-Control', 'public, max-age=3600, must-revalidate');
  }

  return new Response(object.body, { headers });
});
```

---

## CDN with Origin Fallback

```typescript
// Use R2 as CDN with external origin fallback
app.get('/cdn/*', async (c) => {
  const url = new URL(c.req.url);
  const key = url.pathname.replace('/cdn/', '');

  // Check R2 cache first
  let object = await c.env.CDN_CACHE.get(key);

  if (!object) {
    // Fetch from origin
    const originUrl = `https://origin.example.com/${key}`;
    const response = await fetch(originUrl);

    if (!response.ok) {
      return c.json({ error: 'Not found on origin' }, 404);
    }

    const data = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Cache in R2
    await c.env.CDN_CACHE.put(key, data, {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000',
      },
    });

    object = await c.env.CDN_CACHE.get(key);
  }

  return new Response(object!.body, {
    headers: {
      'Content-Type': object!.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000',
      'X-Cache': object ? 'HIT' : 'MISS',
    },
  });
});
```

---

## Signed Upload with Quota Limits

```typescript
app.post('/request-upload', async (c) => {
  const { userId, filename, fileSize } = await c.req.json();

  // Check user's quota
  const quota = await getUserQuota(userId);

  if (quota.used + fileSize > quota.total) {
    return c.json({ error: 'Quota exceeded' }, 403);
  }

  // Generate presigned URL
  const r2Client = new AwsClient({
    accessKeyId: c.env.R2_ACCESS_KEY_ID,
    secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
  });

  const key = `users/${userId}/${filename}`;
  const url = new URL(
    `https://my-bucket.${c.env.ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`
  );

  url.searchParams.set('X-Amz-Expires', '3600');

  const signed = await r2Client.sign(
    new Request(url, { method: 'PUT' }),
    { aws: { signQuery: true } }
  );

  return c.json({
    uploadUrl: signed.url,
    expiresIn: 3600,
  });
});

async function getUserQuota(userId: string) {
  // Query database for user quota
  return {
    used: 1024 * 1024 * 100, // 100MB used
    total: 1024 * 1024 * 1024, // 1GB total
  };
}
```

---

## Best Practices Summary

1. **Use meaningful key prefixes** for organization (`users/{id}/`, `images/`, `backups/`)
2. **Set appropriate cache headers** for static assets
3. **Store metadata** for tracking and filtering
4. **Use bulk delete** instead of loops
5. **Implement cleanup** for old/temporary files
6. **Add authentication** before presigned URL generation
7. **Validate file types** before uploading
8. **Use UUIDs** for unique filenames
9. **Set expiry times** on presigned URLs
10. **Monitor quota** to prevent overages
