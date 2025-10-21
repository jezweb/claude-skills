/**
 * R2 Presigned URL Generator Worker
 *
 * Generates presigned URLs for:
 * - Direct client uploads to R2 (bypasses Worker)
 * - Temporary download links with expiry
 *
 * IMPORTANT:
 * - Never expose R2 access keys in client code
 * - Always generate presigned URLs server-side
 * - Set appropriate expiry times (1-24 hours)
 * - Add authentication before generating URLs
 *
 * Setup:
 * 1. Create R2 API token in Cloudflare dashboard
 * 2. Add secrets to wrangler:
 *    wrangler secret put R2_ACCESS_KEY_ID
 *    wrangler secret put R2_SECRET_ACCESS_KEY
 *    wrangler secret put ACCOUNT_ID
 */

import { Hono } from 'hono';
import { AwsClient } from 'aws4fetch';

type Bindings = {
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  ACCOUNT_ID: string;
  MY_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// Generate presigned upload URL
app.post('/presigned/upload', async (c) => {
  // TODO: Add authentication here
  // const authHeader = c.req.header('Authorization');
  // if (!authHeader) {
  //   return c.json({ error: 'Unauthorized' }, 401);
  // }

  const { filename, expiresIn = 3600 } = await c.req.json<{
    filename: string;
    expiresIn?: number;
  }>();

  if (!filename) {
    return c.json({
      success: false,
      error: 'Missing required field: filename',
    }, 400);
  }

  // Validate expiry (max 7 days)
  const maxExpiry = 7 * 24 * 60 * 60; // 7 days
  const validExpiry = Math.min(expiresIn, maxExpiry);

  try {
    const r2Client = new AwsClient({
      accessKeyId: c.env.R2_ACCESS_KEY_ID,
      secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
    });

    const bucketName = 'my-bucket'; // Replace with your bucket name
    const accountId = c.env.ACCOUNT_ID;

    const url = new URL(
      `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${filename}`
    );

    // Set expiry
    url.searchParams.set('X-Amz-Expires', validExpiry.toString());

    // Sign the URL for PUT
    const signed = await r2Client.sign(
      new Request(url, { method: 'PUT' }),
      { aws: { signQuery: true } }
    );

    return c.json({
      success: true,
      uploadUrl: signed.url,
      filename,
      expiresIn: validExpiry,
      expiresAt: new Date(Date.now() + validExpiry * 1000).toISOString(),
    });
  } catch (error: any) {
    console.error('Presigned upload URL error:', error.message);
    return c.json({
      success: false,
      error: 'Failed to generate presigned upload URL',
    }, 500);
  }
});

// Generate presigned download URL
app.post('/presigned/download', async (c) => {
  // TODO: Add authentication here
  // const authHeader = c.req.header('Authorization');
  // if (!authHeader) {
  //   return c.json({ error: 'Unauthorized' }, 401);
  // }

  const { filename, expiresIn = 3600 } = await c.req.json<{
    filename: string;
    expiresIn?: number;
  }>();

  if (!filename) {
    return c.json({
      success: false,
      error: 'Missing required field: filename',
    }, 400);
  }

  // Validate expiry (max 7 days)
  const maxExpiry = 7 * 24 * 60 * 60;
  const validExpiry = Math.min(expiresIn, maxExpiry);

  try {
    // Check if file exists first
    const exists = await c.env.MY_BUCKET.head(filename);
    if (!exists) {
      return c.json({
        success: false,
        error: 'File not found',
      }, 404);
    }

    const r2Client = new AwsClient({
      accessKeyId: c.env.R2_ACCESS_KEY_ID,
      secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
    });

    const bucketName = 'my-bucket'; // Replace with your bucket name
    const accountId = c.env.ACCOUNT_ID;

    const url = new URL(
      `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${filename}`
    );

    url.searchParams.set('X-Amz-Expires', validExpiry.toString());

    // Sign the URL for GET
    const signed = await r2Client.sign(
      new Request(url, { method: 'GET' }),
      { aws: { signQuery: true } }
    );

    return c.json({
      success: true,
      downloadUrl: signed.url,
      filename,
      size: exists.size,
      expiresIn: validExpiry,
      expiresAt: new Date(Date.now() + validExpiry * 1000).toISOString(),
    });
  } catch (error: any) {
    console.error('Presigned download URL error:', error.message);
    return c.json({
      success: false,
      error: 'Failed to generate presigned download URL',
    }, 500);
  }
});

// Generate batch presigned URLs (upload)
app.post('/presigned/upload/batch', async (c) => {
  const { filenames, expiresIn = 3600 } = await c.req.json<{
    filenames: string[];
    expiresIn?: number;
  }>();

  if (!filenames || !Array.isArray(filenames)) {
    return c.json({
      success: false,
      error: 'Invalid request: filenames must be an array',
    }, 400);
  }

  const maxExpiry = 7 * 24 * 60 * 60;
  const validExpiry = Math.min(expiresIn, maxExpiry);

  try {
    const r2Client = new AwsClient({
      accessKeyId: c.env.R2_ACCESS_KEY_ID,
      secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
    });

    const bucketName = 'my-bucket';
    const accountId = c.env.ACCOUNT_ID;

    const urls = await Promise.all(
      filenames.map(async (filename) => {
        const url = new URL(
          `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${filename}`
        );
        url.searchParams.set('X-Amz-Expires', validExpiry.toString());

        const signed = await r2Client.sign(
          new Request(url, { method: 'PUT' }),
          { aws: { signQuery: true } }
        );

        return {
          filename,
          uploadUrl: signed.url,
        };
      })
    );

    return c.json({
      success: true,
      urls,
      expiresIn: validExpiry,
      expiresAt: new Date(Date.now() + validExpiry * 1000).toISOString(),
    });
  } catch (error: any) {
    console.error('Batch presigned URLs error:', error.message);
    return c.json({
      success: false,
      error: 'Failed to generate presigned URLs',
    }, 500);
  }
});

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'r2-presigned-urls',
    timestamp: new Date().toISOString(),
  });
});

export default app;

/**
 * Example client-side upload with presigned URL:
 *
 * // 1. Get presigned URL from your Worker
 * const response = await fetch('https://my-worker.workers.dev/presigned/upload', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': 'Bearer YOUR_TOKEN'
 *   },
 *   body: JSON.stringify({
 *     filename: 'uploads/photo.jpg',
 *     expiresIn: 3600
 *   })
 * });
 *
 * const { uploadUrl } = await response.json();
 *
 * // 2. Upload file directly to R2
 * const file = document.querySelector('input[type="file"]').files[0];
 *
 * await fetch(uploadUrl, {
 *   method: 'PUT',
 *   body: file,
 *   headers: {
 *     'Content-Type': file.type
 *   }
 * });
 *
 * console.log('Upload complete!');
 */

/**
 * Wrangler setup for secrets:
 *
 * # Add R2 access key ID
 * wrangler secret put R2_ACCESS_KEY_ID
 *
 * # Add R2 secret access key
 * wrangler secret put R2_SECRET_ACCESS_KEY
 *
 * # Add account ID
 * wrangler secret put ACCOUNT_ID
 *
 * # Create R2 API token:
 * 1. Go to Cloudflare Dashboard → R2
 * 2. Click "Manage R2 API Tokens"
 * 3. Create API Token with:
 *    - Permissions: Object Read & Write
 *    - Buckets: Specific bucket or all buckets
 * 4. Save the Access Key ID and Secret Access Key
 */
