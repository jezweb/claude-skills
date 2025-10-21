/**
 * Simple R2 Upload/Download Worker
 *
 * Features:
 * - Upload files with PUT requests
 * - Download files with GET requests
 * - Delete files with DELETE requests
 * - List all files
 * - Proper content-type handling
 * - Error handling
 */

import { Hono } from 'hono';

type Bindings = {
  MY_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// Upload a file
app.put('/files/:filename', async (c) => {
  const filename = c.req.param('filename');
  const body = await c.req.arrayBuffer();
  const contentType = c.req.header('content-type') || 'application/octet-stream';

  try {
    const object = await c.env.MY_BUCKET.put(filename, body, {
      httpMetadata: {
        contentType: contentType,
        cacheControl: 'public, max-age=3600',
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'api',
      },
    });

    return c.json({
      success: true,
      key: object.key,
      size: object.size,
      etag: object.etag,
      uploaded: object.uploaded,
    });
  } catch (error: any) {
    console.error('Upload error:', error.message);
    return c.json({
      success: false,
      error: 'Failed to upload file',
    }, 500);
  }
});

// Download a file
app.get('/files/:filename', async (c) => {
  const filename = c.req.param('filename');

  try {
    const object = await c.env.MY_BUCKET.get(filename);

    if (!object) {
      return c.json({
        success: false,
        error: 'File not found',
      }, 404);
    }

    // Apply http metadata from R2
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    return new Response(object.body, { headers });
  } catch (error: any) {
    console.error('Download error:', error.message);
    return c.json({
      success: false,
      error: 'Failed to download file',
    }, 500);
  }
});

// Get file metadata (without downloading body)
app.head('/files/:filename', async (c) => {
  const filename = c.req.param('filename');

  try {
    const object = await c.env.MY_BUCKET.head(filename);

    if (!object) {
      return c.json({
        success: false,
        error: 'File not found',
      }, 404);
    }

    return c.json({
      success: true,
      key: object.key,
      size: object.size,
      etag: object.etag,
      uploaded: object.uploaded,
      contentType: object.httpMetadata?.contentType,
      customMetadata: object.customMetadata,
    });
  } catch (error: any) {
    console.error('Head error:', error.message);
    return c.json({
      success: false,
      error: 'Failed to get file metadata',
    }, 500);
  }
});

// Delete a file
app.delete('/files/:filename', async (c) => {
  const filename = c.req.param('filename');

  try {
    // Check if file exists first
    const exists = await c.env.MY_BUCKET.head(filename);

    if (!exists) {
      return c.json({
        success: false,
        error: 'File not found',
      }, 404);
    }

    await c.env.MY_BUCKET.delete(filename);

    return c.json({
      success: true,
      message: 'File deleted successfully',
      key: filename,
    });
  } catch (error: any) {
    console.error('Delete error:', error.message);
    return c.json({
      success: false,
      error: 'Failed to delete file',
    }, 500);
  }
});

// List all files (with pagination)
app.get('/files', async (c) => {
  const cursor = c.req.query('cursor');
  const limit = parseInt(c.req.query('limit') || '100');
  const prefix = c.req.query('prefix') || '';

  try {
    const listed = await c.env.MY_BUCKET.list({
      limit: Math.min(limit, 1000), // Max 1000
      cursor: cursor || undefined,
      prefix: prefix || undefined,
    });

    return c.json({
      success: true,
      files: listed.objects.map(obj => ({
        key: obj.key,
        size: obj.size,
        etag: obj.etag,
        uploaded: obj.uploaded,
        contentType: obj.httpMetadata?.contentType,
      })),
      truncated: listed.truncated,
      cursor: listed.cursor,
      count: listed.objects.length,
    });
  } catch (error: any) {
    console.error('List error:', error.message);
    return c.json({
      success: false,
      error: 'Failed to list files',
    }, 500);
  }
});

// Bulk delete (up to 1000 files)
app.post('/files/bulk-delete', async (c) => {
  const { keys } = await c.req.json<{ keys: string[] }>();

  if (!keys || !Array.isArray(keys)) {
    return c.json({
      success: false,
      error: 'Invalid request: keys must be an array',
    }, 400);
  }

  if (keys.length > 1000) {
    return c.json({
      success: false,
      error: 'Cannot delete more than 1000 keys at once',
    }, 400);
  }

  try {
    await c.env.MY_BUCKET.delete(keys);

    return c.json({
      success: true,
      message: `Deleted ${keys.length} files`,
      count: keys.length,
    });
  } catch (error: any) {
    console.error('Bulk delete error:', error.message);
    return c.json({
      success: false,
      error: 'Failed to delete files',
    }, 500);
  }
});

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'r2-worker',
    timestamp: new Date().toISOString(),
  });
});

export default app;
