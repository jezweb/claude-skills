/**
 * Scheduled Worker with All Cloudflare Bindings
 *
 * Demonstrates how to access various Cloudflare bindings from scheduled handlers:
 * - D1 (SQL database)
 * - R2 (object storage)
 * - KV (key-value storage)
 * - Workers AI (LLM inference)
 * - Vectorize (vector database)
 * - Queues (message queues)
 * - Workflows (multi-step processes)
 * - Durable Objects
 * - Secrets (environment variables)
 *
 * wrangler.jsonc configuration:
 * {
 *   "triggers": {
 *     "crons": ["0 * * * *"]  // Every hour
 *   },
 *   "d1_databases": [
 *     { "binding": "DB", "database_id": "..." }
 *   ],
 *   "r2_buckets": [
 *     { "binding": "MY_BUCKET", "bucket_name": "my-bucket" }
 *   ],
 *   "kv_namespaces": [
 *     { "binding": "KV_NAMESPACE", "id": "..." }
 *   ],
 *   "ai": { "binding": "AI" },
 *   "vectorize": [
 *     { "binding": "VECTOR_INDEX", "index_name": "my-index" }
 *   ],
 *   "queues": {
 *     "producers": [
 *       { "binding": "MY_QUEUE", "queue": "my-queue" }
 *     ]
 *   },
 *   "workflows": [
 *     { "binding": "MY_WORKFLOW", "name": "my-workflow" }
 *   ],
 *   "durable_objects": {
 *     "bindings": [
 *       { "name": "RATE_LIMITER", "class_name": "RateLimiter" }
 *     ]
 *   },
 *   "vars": {
 *     "ENVIRONMENT": "production"
 *   }
 * }
 *
 * Secrets (set via wrangler secret put):
 * - API_KEY
 */

interface Env {
  // Databases
  DB: D1Database;

  // Storage
  MY_BUCKET: R2Bucket;
  KV_NAMESPACE: KVNamespace;

  // AI & Vectors
  AI: Ai;
  VECTOR_INDEX: VectorizeIndex;

  // Queues & Workflows
  MY_QUEUE: Queue;
  MY_WORKFLOW: Workflow;

  // Durable Objects
  RATE_LIMITER: DurableObjectNamespace;

  // Environment Variables
  ENVIRONMENT: string;

  // Secrets
  API_KEY: string;
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('Scheduled task started');

    try {
      // Example 1: D1 Database Operations
      await workWithD1(env.DB);

      // Example 2: R2 Storage Operations
      await workWithR2(env.MY_BUCKET);

      // Example 3: KV Storage Operations
      await workWithKV(env.KV_NAMESPACE);

      // Example 4: Workers AI Operations
      await workWithAI(env.AI);

      // Example 5: Vectorize Operations
      await workWithVectorize(env.VECTOR_INDEX);

      // Example 6: Queue Operations
      await workWithQueues(env.MY_QUEUE);

      // Example 7: Workflow Operations
      await workWithWorkflows(env.MY_WORKFLOW);

      // Example 8: Durable Objects
      await workWithDurableObjects(env.RATE_LIMITER);

      // Example 9: Secrets and Environment Variables
      await workWithSecrets(env);

      console.log('Scheduled task completed successfully');
    } catch (error) {
      console.error('Scheduled task failed:', error);
      throw error;
    }
  },
};

// ============================================================================
// D1 DATABASE OPERATIONS
// ============================================================================

async function workWithD1(db: D1Database): Promise<void> {
  console.log('[D1] Running database operations...');

  // Simple query
  const users = await db.prepare('SELECT * FROM users LIMIT 10').all();
  console.log(`[D1] Found ${users.results.length} users`);

  // Parameterized query
  const activeUsers = await db
    .prepare('SELECT COUNT(*) as count FROM users WHERE active = ?')
    .bind(1)
    .first();
  console.log(`[D1] Active users: ${activeUsers.count}`);

  // Insert/Update
  await db
    .prepare('INSERT INTO activity_log (event, timestamp) VALUES (?, ?)')
    .bind('scheduled_task', Date.now())
    .run();

  // Batch operations
  const batch = [
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(Date.now()),
    db.prepare('UPDATE stats SET last_updated = ?').bind(Date.now()),
  ];
  await db.batch(batch);

  console.log('[D1] Database operations completed');
}

// ============================================================================
// R2 STORAGE OPERATIONS
// ============================================================================

async function workWithR2(bucket: R2Bucket): Promise<void> {
  console.log('[R2] Running storage operations...');

  // Put object
  const data = { timestamp: Date.now(), message: 'Scheduled backup' };
  await bucket.put('backups/latest.json', JSON.stringify(data));

  // Get object
  const object = await bucket.get('backups/latest.json');
  if (object) {
    const content = await object.text();
    console.log('[R2] Retrieved object:', content);
  }

  // List objects
  const list = await bucket.list({ prefix: 'backups/', limit: 10 });
  console.log(`[R2] Found ${list.objects.length} backup files`);

  // Delete old objects (older than 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  for (const obj of list.objects) {
    if (obj.uploaded.getTime() < thirtyDaysAgo) {
      await bucket.delete(obj.key);
      console.log(`[R2] Deleted old backup: ${obj.key}`);
    }
  }

  console.log('[R2] Storage operations completed');
}

// ============================================================================
// KV STORAGE OPERATIONS
// ============================================================================

async function workWithKV(kv: KVNamespace): Promise<void> {
  console.log('[KV] Running KV operations...');

  // Put with expiration
  await kv.put('last_execution', Date.now().toString(), {
    expirationTtl: 86400, // 24 hours
  });

  // Get as text
  const lastExecution = await kv.get('last_execution');
  console.log('[KV] Last execution:', lastExecution);

  // Get as JSON
  await kv.put('config', JSON.stringify({ version: '1.0', enabled: true }));
  const config = await kv.get('config', 'json');
  console.log('[KV] Config:', config);

  // List keys
  const keys = await kv.list({ prefix: 'cache:' });
  console.log(`[KV] Found ${keys.keys.length} cached items`);

  // Delete
  await kv.delete('temp_data');

  console.log('[KV] KV operations completed');
}

// ============================================================================
// WORKERS AI OPERATIONS
// ============================================================================

async function workWithAI(ai: Ai): Promise<void> {
  console.log('[AI] Running AI operations...');

  // Text generation
  const response = await ai.run('@cf/meta/llama-3-8b-instruct', {
    prompt: 'Summarize the status of our scheduled tasks',
  });

  console.log('[AI] AI response:', response);

  // Image classification (if you have an image)
  // const imageResponse = await ai.run('@cf/microsoft/resnet-50', {
  //   image: imageBuffer,
  // });

  // Text embeddings
  // const embeddings = await ai.run('@cf/baai/bge-base-en-v1.5', {
  //   text: 'Generate embeddings for this text',
  // });

  console.log('[AI] AI operations completed');
}

// ============================================================================
// VECTORIZE OPERATIONS
// ============================================================================

async function workWithVectorize(index: VectorizeIndex): Promise<void> {
  console.log('[VECTORIZE] Running vector operations...');

  // Insert vectors
  await index.upsert([
    {
      id: 'doc1',
      values: [0.1, 0.2, 0.3, 0.4, 0.5],
      metadata: { title: 'Document 1', timestamp: Date.now() },
    },
  ]);

  // Query vectors
  const results = await index.query([0.1, 0.2, 0.3, 0.4, 0.5], {
    topK: 5,
    returnValues: true,
    returnMetadata: 'all',
  });

  console.log(`[VECTORIZE] Found ${results.matches.length} similar vectors`);

  console.log('[VECTORIZE] Vector operations completed');
}

// ============================================================================
// QUEUE OPERATIONS
// ============================================================================

async function workWithQueues(queue: Queue): Promise<void> {
  console.log('[QUEUE] Running queue operations...');

  // Send single message
  await queue.send({
    type: 'scheduled_task',
    timestamp: Date.now(),
    data: { task: 'process_batch' },
  });

  // Send batch
  await queue.sendBatch([
    { body: { userId: '1', action: 'email' } },
    { body: { userId: '2', action: 'email' } },
    { body: { userId: '3', action: 'email' } },
  ]);

  // Send with delay
  await queue.send(
    { type: 'delayed_task', task: 'send_reminder' },
    { delaySeconds: 3600 } // 1 hour delay
  );

  console.log('[QUEUE] Messages sent to queue');
}

// ============================================================================
// WORKFLOW OPERATIONS
// ============================================================================

async function workWithWorkflows(workflow: Workflow): Promise<void> {
  console.log('[WORKFLOW] Running workflow operations...');

  // Trigger workflow
  const instance = await workflow.create({
    params: {
      taskType: 'daily_report',
      date: new Date().toISOString().split('T')[0],
    },
  });

  console.log(`[WORKFLOW] Started workflow instance: ${instance.id}`);

  // Get workflow status (if you have the instance ID)
  // const status = await workflow.get(instance.id);
  // console.log('[WORKFLOW] Status:', status);

  console.log('[WORKFLOW] Workflow operations completed');
}

// ============================================================================
// DURABLE OBJECTS OPERATIONS
// ============================================================================

async function workWithDurableObjects(namespace: DurableObjectNamespace): Promise<void> {
  console.log('[DO] Running Durable Object operations...');

  // Get Durable Object instance
  const id = namespace.idFromName('global-rate-limiter');
  const stub = namespace.get(id);

  // Call method on Durable Object
  const response = await stub.fetch('https://fake-host/check-limit', {
    method: 'POST',
    body: JSON.stringify({ key: 'scheduled_tasks' }),
  });

  const result = await response.json();
  console.log('[DO] Rate limit check:', result);

  console.log('[DO] Durable Object operations completed');
}

// ============================================================================
// SECRETS AND ENVIRONMENT VARIABLES
// ============================================================================

async function workWithSecrets(env: Env): Promise<void> {
  console.log('[SECRETS] Using secrets and environment variables...');

  // Use environment variable
  console.log(`[SECRETS] Environment: ${env.ENVIRONMENT}`);

  // Use secret (API key)
  const response = await fetch('https://api.example.com/v1/data', {
    headers: {
      Authorization: `Bearer ${env.API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('[SECRETS] API data fetched successfully');

  console.log('[SECRETS] Secrets operations completed');
}
