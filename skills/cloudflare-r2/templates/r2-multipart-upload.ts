/**
 * R2 Multipart Upload Worker
 *
 * Enables large file uploads (>100MB) with:
 * - Resumable uploads
 * - Parallel part uploads
 * - Progress tracking
 * - Abort capability
 *
 * Flow:
 * 1. POST /mpu/create - Create multipart upload
 * 2. PUT /mpu/upload-part - Upload individual parts
 * 3. POST /mpu/complete - Complete the upload
 * 4. DELETE /mpu/abort - Abort the upload (optional)
 */

import { Hono } from 'hono';

type Bindings = {
  MY_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// Create multipart upload
app.post('/mpu/create', async (c) => {
  const { key, contentType } = await c.req.json<{
    key: string;
    contentType?: string;
  }>();

  if (!key) {
    return c.json({
      success: false,
      error: 'Missing required field: key',
    }, 400);
  }

  try {
    const multipart = await c.env.MY_BUCKET.createMultipartUpload(key, {
      httpMetadata: {
        contentType: contentType || 'application/octet-stream',
      },
    });

    return c.json({
      success: true,
      key: multipart.key,
      uploadId: multipart.uploadId,
    });
  } catch (error: any) {
    console.error('Create multipart error:', error.message);
    return c.json({
      success: false,
      error: 'Failed to create multipart upload',
    }, 500);
  }
});

// Upload a part
app.put('/mpu/upload-part', async (c) => {
  const key = c.req.query('key');
  const uploadId = c.req.query('uploadId');
  const partNumber = parseInt(c.req.query('partNumber') || '0');

  if (!key || !uploadId || !partNumber) {
    return c.json({
      success: false,
      error: 'Missing required parameters: key, uploadId, partNumber',
    }, 400);
  }

  if (partNumber < 1 || partNumber > 10000) {
    return c.json({
      success: false,
      error: 'Part number must be between 1 and 10000',
    }, 400);
  }

  try {
    const body = await c.req.arrayBuffer();

    // Resume the multipart upload
    const multipart = c.env.MY_BUCKET.resumeMultipartUpload(key, uploadId);

    // Upload the part
    const uploadedPart = await multipart.uploadPart(partNumber, body);

    return c.json({
      success: true,
      partNumber: uploadedPart.partNumber,
      etag: uploadedPart.etag,
    });
  } catch (error: any) {
    console.error('Upload part error:', error.message);
    return c.json({
      success: false,
      error: 'Failed to upload part',
      details: error.message,
    }, 500);
  }
});

// Complete multipart upload
app.post('/mpu/complete', async (c) => {
  const { key, uploadId, parts } = await c.req.json<{
    key: string;
    uploadId: string;
    parts: Array<{ partNumber: number; etag: string }>;
  }>();

  if (!key || !uploadId || !parts || !Array.isArray(parts)) {
    return c.json({
      success: false,
      error: 'Missing required fields: key, uploadId, parts',
    }, 400);
  }

  try {
    const multipart = c.env.MY_BUCKET.resumeMultipartUpload(key, uploadId);

    // Complete the upload
    const object = await multipart.complete(parts);

    return c.json({
      success: true,
      key: object.key,
      size: object.size,
      etag: object.etag,
      uploaded: object.uploaded,
    });
  } catch (error: any) {
    console.error('Complete multipart error:', error.message);
    return c.json({
      success: false,
      error: 'Failed to complete multipart upload',
      details: error.message,
    }, 500);
  }
});

// Abort multipart upload
app.delete('/mpu/abort', async (c) => {
  const key = c.req.query('key');
  const uploadId = c.req.query('uploadId');

  if (!key || !uploadId) {
    return c.json({
      success: false,
      error: 'Missing required parameters: key, uploadId',
    }, 400);
  }

  try {
    const multipart = c.env.MY_BUCKET.resumeMultipartUpload(key, uploadId);
    await multipart.abort();

    return c.json({
      success: true,
      message: 'Multipart upload aborted',
      key,
      uploadId,
    });
  } catch (error: any) {
    console.error('Abort multipart error:', error.message);
    return c.json({
      success: false,
      error: 'Failed to abort multipart upload',
    }, 500);
  }
});

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'r2-multipart-worker',
    timestamp: new Date().toISOString(),
  });
});

export default app;

/**
 * Example Python client for multipart upload:
 *
 * import requests
 * from concurrent.futures import ThreadPoolExecutor
 *
 * WORKER_URL = "https://my-worker.workers.dev"
 * FILE_PATH = "large-file.mp4"
 * PART_SIZE = 10 * 1024 * 1024  # 10MB parts
 *
 * # 1. Create multipart upload
 * response = requests.post(f"{WORKER_URL}/mpu/create", json={
 *     "key": "uploads/large-file.mp4",
 *     "contentType": "video/mp4"
 * })
 * data = response.json()
 * upload_id = data["uploadId"]
 * key = data["key"]
 *
 * # 2. Upload parts in parallel
 * def upload_part(part_number, data):
 *     response = requests.put(
 *         f"{WORKER_URL}/mpu/upload-part",
 *         params={
 *             "key": key,
 *             "uploadId": upload_id,
 *             "partNumber": part_number
 *         },
 *         data=data
 *     )
 *     return response.json()
 *
 * with open(FILE_PATH, 'rb') as f:
 *     part_number = 1
 *     uploaded_parts = []
 *
 *     with ThreadPoolExecutor(max_workers=4) as executor:
 *         while True:
 *             chunk = f.read(PART_SIZE)
 *             if not chunk:
 *                 break
 *
 *             result = executor.submit(upload_part, part_number, chunk)
 *             uploaded_parts.append(result.result())
 *             part_number += 1
 *
 * # 3. Complete upload
 * response = requests.post(f"{WORKER_URL}/mpu/complete", json={
 *     "key": key,
 *     "uploadId": upload_id,
 *     "parts": uploaded_parts
 * })
 *
 * print(response.json())
 */
