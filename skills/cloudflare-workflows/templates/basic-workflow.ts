/**
 * Basic Cloudflare Workflow Example
 *
 * Demonstrates:
 * - WorkflowEntrypoint class
 * - step.do() for executing work
 * - step.sleep() for delays
 * - Accessing environment bindings
 * - Returning state from workflow
 */

import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

// Define environment bindings
type Env = {
  MY_WORKFLOW: Workflow;
  // Add your bindings here:
  // MY_KV: KVNamespace;
  // DB: D1Database;
  // MY_BUCKET: R2Bucket;
};

// Define workflow parameters
type Params = {
  userId: string;
  email: string;
};

/**
 * Basic Workflow
 *
 * Three-step workflow that:
 * 1. Fetches user data
 * 2. Processes user data
 * 3. Sends notification
 */
export class BasicWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    // Access parameters from event.payload
    const { userId, email } = event.payload;

    console.log(`Starting workflow for user ${userId}`);

    // Step 1: Fetch user data
    const userData = await step.do('fetch user data', async () => {
      // Example: Fetch from external API
      const response = await fetch(`https://api.example.com/users/${userId}`);
      const data = await response.json();

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        preferences: data.preferences
      };
    });

    console.log(`Fetched user: ${userData.name}`);

    // Step 2: Process user data
    const processedData = await step.do('process user data', async () => {
      // Example: Perform some computation
      return {
        userId: userData.id,
        processedAt: new Date().toISOString(),
        status: 'processed'
      };
    });

    // Step 3: Wait before sending notification
    await step.sleep('wait before notification', '5 minutes');

    // Step 4: Send notification
    await step.do('send notification', async () => {
      // Example: Send email or push notification
      await fetch('https://api.example.com/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: 'Processing Complete',
          body: `Your data has been processed at ${processedData.processedAt}`
        })
      });

      return { sent: true, timestamp: Date.now() };
    });

    // Return final state (must be serializable)
    return {
      userId,
      status: 'complete',
      processedAt: processedData.processedAt
    };
  }
}

/**
 * Worker that triggers the workflow
 */
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    // Handle favicon
    if (url.pathname.startsWith('/favicon')) {
      return Response.json({}, { status: 404 });
    }

    // Get instance status if ID provided
    const instanceId = url.searchParams.get('instanceId');
    if (instanceId) {
      const instance = await env.MY_WORKFLOW.get(instanceId);
      const status = await instance.status();

      return Response.json({
        id: instanceId,
        status
      });
    }

    // Create new workflow instance
    const instance = await env.MY_WORKFLOW.create({
      params: {
        userId: '123',
        email: 'user@example.com'
      }
    });

    return Response.json({
      id: instance.id,
      details: await instance.status(),
      statusUrl: `${url.origin}?instanceId=${instance.id}`
    });
  }
};
