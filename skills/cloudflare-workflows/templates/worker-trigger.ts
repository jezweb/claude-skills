/**
 * Worker that Triggers and Manages Workflows
 *
 * Demonstrates:
 * - Creating workflow instances
 * - Querying workflow status
 * - Sending events to workflows
 * - Pausing/resuming workflows
 * - Terminating workflows
 */

import { Hono } from 'hono';

type Bindings = {
  MY_WORKFLOW: Workflow;
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

/**
 * Create new workflow instance
 */
app.post('/workflows/create', async (c) => {
  const body = await c.req.json<{
    userId: string;
    email: string;
    [key: string]: any;
  }>();

  try {
    // Create workflow instance with parameters
    const instance = await c.env.MY_WORKFLOW.create({
      params: body
    });

    // Optionally store instance ID for later reference
    await c.env.DB.prepare(`
      INSERT INTO workflow_instances (id, user_id, status, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(
      instance.id,
      body.userId,
      'queued',
      new Date().toISOString()
    ).run();

    return c.json({
      id: instance.id,
      status: await instance.status(),
      createdAt: new Date().toISOString()
    }, 201);
  } catch (error) {
    return c.json({
      error: 'Failed to create workflow',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get workflow instance status
 */
app.get('/workflows/:id', async (c) => {
  const instanceId = c.req.param('id');

  try {
    const instance = await c.env.MY_WORKFLOW.get(instanceId);
    const status = await instance.status();

    return c.json({
      id: instanceId,
      ...status
    });
  } catch (error) {
    return c.json({
      error: 'Workflow not found',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 404);
  }
});

/**
 * Send event to waiting workflow
 */
app.post('/workflows/:id/events', async (c) => {
  const instanceId = c.req.param('id');
  const body = await c.req.json<{
    type: string;
    payload: any;
  }>();

  try {
    const instance = await c.env.MY_WORKFLOW.get(instanceId);

    await instance.sendEvent({
      type: body.type,
      payload: body.payload
    });

    return c.json({
      success: true,
      message: 'Event sent to workflow'
    });
  } catch (error) {
    return c.json({
      error: 'Failed to send event',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Pause workflow instance
 */
app.post('/workflows/:id/pause', async (c) => {
  const instanceId = c.req.param('id');

  try {
    const instance = await c.env.MY_WORKFLOW.get(instanceId);
    await instance.pause();

    // Update database
    await c.env.DB.prepare(`
      UPDATE workflow_instances SET status = ? WHERE id = ?
    `).bind('paused', instanceId).run();

    return c.json({
      success: true,
      message: 'Workflow paused'
    });
  } catch (error) {
    return c.json({
      error: 'Failed to pause workflow',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Resume paused workflow instance
 */
app.post('/workflows/:id/resume', async (c) => {
  const instanceId = c.req.param('id');

  try {
    const instance = await c.env.MY_WORKFLOW.get(instanceId);
    await instance.resume();

    // Update database
    await c.env.DB.prepare(`
      UPDATE workflow_instances SET status = ? WHERE id = ?
    `).bind('running', instanceId).run();

    return c.json({
      success: true,
      message: 'Workflow resumed'
    });
  } catch (error) {
    return c.json({
      error: 'Failed to resume workflow',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Terminate workflow instance
 */
app.post('/workflows/:id/terminate', async (c) => {
  const instanceId = c.req.param('id');

  try {
    const instance = await c.env.MY_WORKFLOW.get(instanceId);
    await instance.terminate();

    // Update database
    await c.env.DB.prepare(`
      UPDATE workflow_instances SET status = ? WHERE id = ?
    `).bind('terminated', instanceId).run();

    return c.json({
      success: true,
      message: 'Workflow terminated'
    });
  } catch (error) {
    return c.json({
      error: 'Failed to terminate workflow',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * List all workflow instances (with filtering)
 */
app.get('/workflows', async (c) => {
  const status = c.req.query('status');
  const userId = c.req.query('userId');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');

  let query = 'SELECT * FROM workflow_instances WHERE 1=1';
  const params: any[] = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (userId) {
    query += ' AND user_id = ?';
    params.push(userId);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  try {
    const results = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      workflows: results.results,
      limit,
      offset,
      total: results.results.length
    });
  } catch (error) {
    return c.json({
      error: 'Failed to list workflows',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Health check
 */
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

/**
 * API documentation
 */
app.get('/', (c) => {
  return c.json({
    name: 'Workflow Management API',
    version: '1.0.0',
    endpoints: {
      'POST /workflows/create': {
        description: 'Create new workflow instance',
        body: { userId: 'string', email: 'string', ...params: 'any' }
      },
      'GET /workflows/:id': {
        description: 'Get workflow status',
        params: { id: 'workflow instance ID' }
      },
      'POST /workflows/:id/events': {
        description: 'Send event to workflow',
        params: { id: 'workflow instance ID' },
        body: { type: 'string', payload: 'any' }
      },
      'POST /workflows/:id/pause': {
        description: 'Pause workflow',
        params: { id: 'workflow instance ID' }
      },
      'POST /workflows/:id/resume': {
        description: 'Resume paused workflow',
        params: { id: 'workflow instance ID' }
      },
      'POST /workflows/:id/terminate': {
        description: 'Terminate workflow',
        params: { id: 'workflow instance ID' }
      },
      'GET /workflows': {
        description: 'List workflows',
        query: { status: 'string (optional)', userId: 'string (optional)', limit: 'number', offset: 'number' }
      }
    }
  });
});

export default app;
