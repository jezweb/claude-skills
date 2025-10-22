/**
 * Workflow with Advanced Retry Configuration
 *
 * Demonstrates:
 * - Custom retry limits
 * - Exponential, linear, and constant backoff
 * - Step timeouts
 * - NonRetryableError for terminal failures
 * - Error handling with try-catch
 */

import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';

type Env = {
  MY_WORKFLOW: Workflow;
};

type PaymentParams = {
  orderId: string;
  amount: number;
  customerId: string;
};

/**
 * Payment Processing Workflow with Retries
 *
 * Handles payment processing with:
 * - Validation with NonRetryableError
 * - Retry logic for payment gateway
 * - Fallback to backup gateway
 * - Graceful error handling
 */
export class PaymentWorkflow extends WorkflowEntrypoint<Env, PaymentParams> {
  async run(event: WorkflowEvent<PaymentParams>, step: WorkflowStep) {
    const { orderId, amount, customerId } = event.payload;

    // Step 1: Validate input (no retries - fail fast)
    await step.do(
      'validate payment request',
      {
        retries: {
          limit: 0  // No retries for validation
        }
      },
      async () => {
        if (!orderId || !customerId) {
          throw new NonRetryableError('Missing required fields: orderId or customerId');
        }

        if (amount <= 0) {
          throw new NonRetryableError(`Invalid amount: ${amount}`);
        }

        if (amount > 100000) {
          throw new NonRetryableError(`Amount exceeds limit: ${amount}`);
        }

        return { valid: true };
      }
    );

    // Step 2: Call primary payment gateway (exponential backoff)
    let paymentResult;

    try {
      paymentResult = await step.do(
        'charge primary payment gateway',
        {
          retries: {
            limit: 5,                  // Max 5 retry attempts
            delay: '10 seconds',       // Start at 10 seconds
            backoff: 'exponential'     // 10s, 20s, 40s, 80s, 160s
          },
          timeout: '2 minutes'         // Each attempt times out after 2 minutes
        },
        async () => {
          const response = await fetch('https://primary-payment-gateway.example.com/charge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              amount,
              customerId
            })
          });

          if (!response.ok) {
            // Check if error is retryable
            if (response.status === 401 || response.status === 403) {
              throw new NonRetryableError('Authentication failed with payment gateway');
            }

            throw new Error(`Payment gateway error: ${response.status}`);
          }

          const data = await response.json();
          return {
            transactionId: data.transactionId,
            status: data.status,
            gateway: 'primary'
          };
        }
      );
    } catch (error) {
      console.error('Primary gateway failed:', error);

      // Step 3: Fallback to backup gateway (linear backoff)
      paymentResult = await step.do(
        'charge backup payment gateway',
        {
          retries: {
            limit: 3,
            delay: '30 seconds',
            backoff: 'linear'  // 30s, 60s, 90s
          },
          timeout: '3 minutes'
        },
        async () => {
          const response = await fetch('https://backup-payment-gateway.example.com/charge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              amount,
              customerId
            })
          });

          if (!response.ok) {
            throw new Error(`Backup gateway error: ${response.status}`);
          }

          const data = await response.json();
          return {
            transactionId: data.transactionId,
            status: data.status,
            gateway: 'backup'
          };
        }
      );
    }

    // Step 4: Update order status (constant backoff)
    await step.do(
      'update order status',
      {
        retries: {
          limit: 10,
          delay: '5 seconds',
          backoff: 'constant'  // Always 5 seconds between retries
        },
        timeout: '30 seconds'
      },
      async () => {
        const response = await fetch(`https://api.example.com/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'paid',
            transactionId: paymentResult.transactionId,
            gateway: paymentResult.gateway
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update order status');
        }

        return { updated: true };
      }
    );

    // Step 5: Send confirmation (optional - don't fail workflow if this fails)
    try {
      await step.do(
        'send payment confirmation',
        {
          retries: {
            limit: 3,
            delay: '10 seconds',
            backoff: 'exponential'
          }
        },
        async () => {
          await fetch('https://api.example.com/notifications/payment-confirmed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              customerId,
              amount
            })
          });

          return { sent: true };
        }
      );
    } catch (error) {
      // Log but don't fail workflow
      console.error('Failed to send confirmation:', error);
    }

    return {
      orderId,
      transactionId: paymentResult.transactionId,
      gateway: paymentResult.gateway,
      status: 'complete'
    };
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname.startsWith('/favicon')) {
      return Response.json({}, { status: 404 });
    }

    // Create payment workflow
    const instance = await env.MY_WORKFLOW.create({
      params: {
        orderId: 'ORD-' + Date.now(),
        amount: 99.99,
        customerId: 'CUST-123'
      }
    });

    return Response.json({
      id: instance.id,
      status: await instance.status()
    });
  }
};
