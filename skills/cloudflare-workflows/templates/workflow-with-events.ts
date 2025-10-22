/**
 * Event-Driven Workflow Example
 *
 * Demonstrates:
 * - step.waitForEvent() for external events
 * - instance.sendEvent() to trigger waiting workflows
 * - Timeout handling
 * - Human-in-the-loop patterns
 */

import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

type Env = {
  APPROVAL_WORKFLOW: Workflow;
  DB: D1Database;
};

type ApprovalParams = {
  requestId: string;
  requesterId: string;
  amount: number;
  description: string;
};

type ApprovalEvent = {
  approved: boolean;
  approverId: string;
  comments?: string;
};

/**
 * Approval Workflow with Event Waiting
 *
 * Flow:
 * 1. Create approval request
 * 2. Notify approvers
 * 3. Wait for approval decision (max 7 days)
 * 4. Process decision
 * 5. Execute approved action or reject
 */
export class ApprovalWorkflow extends WorkflowEntrypoint<Env, ApprovalParams> {
  async run(event: WorkflowEvent<ApprovalParams>, step: WorkflowStep) {
    const { requestId, requesterId, amount, description } = event.payload;

    // Step 1: Create approval request in database
    await step.do('create approval request', async () => {
      await this.env.DB.prepare(`
        INSERT INTO approval_requests
        (id, requester_id, amount, description, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        requestId,
        requesterId,
        amount,
        description,
        'pending',
        new Date().toISOString()
      ).run();

      return { created: true };
    });

    // Step 2: Send notification to approvers
    await step.do('notify approvers', async () => {
      // Get list of approvers based on amount
      const approvers = amount > 10000
        ? ['senior-manager@example.com', 'finance@example.com']
        : ['manager@example.com'];

      // Send notification to each approver
      await fetch('https://api.example.com/send-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: approvers,
          subject: `Approval Required: ${description}`,
          body: `
            Request ID: ${requestId}
            Amount: $${amount}
            Description: ${description}
            Requester: ${requesterId}

            Please review and approve/reject at:
            https://app.example.com/approvals/${requestId}
          `,
          data: {
            requestId,
            workflowInstanceId: event.instanceId  // Store for sending event later
          }
        })
      });

      return { notified: true, approvers };
    });

    // Step 3: Wait for approval decision (max 7 days)
    let approvalEvent: ApprovalEvent;

    try {
      approvalEvent = await step.waitForEvent<ApprovalEvent>(
        'wait for approval decision',
        {
          type: 'approval-decision',
          timeout: '7 days'  // Auto-reject after 7 days
        }
      );

      console.log('Approval decision received:', approvalEvent);
    } catch (error) {
      // Timeout occurred - auto-reject
      console.log('Approval timeout - auto-rejecting');

      await step.do('auto-reject due to timeout', async () => {
        await this.env.DB.prepare(`
          UPDATE approval_requests
          SET status = ?, updated_at = ?, rejection_reason = ?
          WHERE id = ?
        `).bind(
          'rejected',
          new Date().toISOString(),
          'Approval timeout - no response within 7 days',
          requestId
        ).run();

        // Notify requester
        await this.notifyRequester(requesterId, requestId, false, 'Approval timeout');

        return { rejected: true, reason: 'timeout' };
      });

      return {
        requestId,
        status: 'rejected',
        reason: 'timeout'
      };
    }

    // Step 4: Process approval decision
    await step.do('process approval decision', async () => {
      await this.env.DB.prepare(`
        UPDATE approval_requests
        SET status = ?, approver_id = ?, comments = ?, updated_at = ?
        WHERE id = ?
      `).bind(
        approvalEvent.approved ? 'approved' : 'rejected',
        approvalEvent.approverId,
        approvalEvent.comments || null,
        new Date().toISOString(),
        requestId
      ).run();

      return { processed: true };
    });

    // Step 5: Notify requester
    await step.do('notify requester', async () => {
      await this.notifyRequester(
        requesterId,
        requestId,
        approvalEvent.approved,
        approvalEvent.comments
      );

      return { notified: true };
    });

    // Step 6: Execute approved action if approved
    if (approvalEvent.approved) {
      await step.do('execute approved action', async () => {
        // Execute the action that was approved
        console.log(`Executing approved action for request ${requestId}`);

        // Example: Process payment, create resource, etc.
        await fetch('https://api.example.com/execute-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId,
            amount,
            description
          })
        });

        return { executed: true };
      });
    }

    return {
      requestId,
      status: approvalEvent.approved ? 'approved' : 'rejected',
      approver: approvalEvent.approverId
    };
  }

  /**
   * Send notification to requester
   */
  private async notifyRequester(
    requesterId: string,
    requestId: string,
    approved: boolean,
    comments?: string
  ) {
    await fetch('https://api.example.com/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: requesterId,
        subject: `Request ${requestId} ${approved ? 'Approved' : 'Rejected'}`,
        body: `
          Your request ${requestId} has been ${approved ? 'approved' : 'rejected'}.
          ${comments ? `\n\nComments: ${comments}` : ''}
        `
      })
    });
  }
}

/**
 * Worker that handles:
 * 1. Creating approval workflows
 * 2. Receiving approval decisions via webhook
 * 3. Sending events to waiting workflows
 */
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname.startsWith('/favicon')) {
      return Response.json({}, { status: 404 });
    }

    // Endpoint: Create new approval request
    if (url.pathname === '/approvals/create' && req.method === 'POST') {
      const body = await req.json<ApprovalParams>();

      // Create workflow instance
      const instance = await env.APPROVAL_WORKFLOW.create({
        params: body
      });

      // Store instance ID for later (when approval decision comes in)
      // In production, store this in DB/KV
      await env.DB.prepare(`
        UPDATE approval_requests
        SET workflow_instance_id = ?
        WHERE id = ?
      `).bind(instance.id, body.requestId).run();

      return Response.json({
        id: instance.id,
        requestId: body.requestId,
        status: await instance.status()
      });
    }

    // Endpoint: Submit approval decision (webhook from approval UI)
    if (url.pathname === '/approvals/decide' && req.method === 'POST') {
      const body = await req.json<{
        requestId: string;
        approved: boolean;
        approverId: string;
        comments?: string;
      }>();

      // Get workflow instance ID from database
      const result = await env.DB.prepare(`
        SELECT workflow_instance_id
        FROM approval_requests
        WHERE id = ?
      `).bind(body.requestId).first<{ workflow_instance_id: string }>();

      if (!result) {
        return Response.json(
          { error: 'Request not found' },
          { status: 404 }
        );
      }

      // Get workflow instance
      const instance = await env.APPROVAL_WORKFLOW.get(result.workflow_instance_id);

      // Send event to waiting workflow
      await instance.sendEvent({
        type: 'approval-decision',
        payload: {
          approved: body.approved,
          approverId: body.approverId,
          comments: body.comments
        }
      });

      return Response.json({
        success: true,
        message: 'Approval decision sent to workflow'
      });
    }

    // Endpoint: Get approval status
    if (url.pathname.startsWith('/approvals/') && req.method === 'GET') {
      const requestId = url.pathname.split('/')[2];

      const result = await env.DB.prepare(`
        SELECT workflow_instance_id, status
        FROM approval_requests
        WHERE id = ?
      `).bind(requestId).first<{ workflow_instance_id: string; status: string }>();

      if (!result) {
        return Response.json(
          { error: 'Request not found' },
          { status: 404 }
        );
      }

      const instance = await env.APPROVAL_WORKFLOW.get(result.workflow_instance_id);
      const workflowStatus = await instance.status();

      return Response.json({
        requestId,
        dbStatus: result.status,
        workflowStatus
      });
    }

    // Default: Show usage
    return Response.json({
      endpoints: {
        'POST /approvals/create': 'Create approval request',
        'POST /approvals/decide': 'Submit approval decision',
        'GET /approvals/:id': 'Get approval status'
      }
    });
  }
};
