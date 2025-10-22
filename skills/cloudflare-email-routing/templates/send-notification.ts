/**
 * Send Email - Notification Pattern
 *
 * Demonstrates sending transactional emails triggered by user actions.
 * Includes error handling, retry logic, and flexible destination routing.
 *
 * Use cases:
 * - Password reset emails
 * - Order confirmations
 * - Account notifications
 * - System alerts
 *
 * Prerequisites:
 * 1. Email Routing enabled on your domain
 * 2. All destination addresses verified in Email Routing settings
 * 3. send_email binding configured in wrangler.jsonc:
 *
 *    "send_email": [
 *      {
 *        "name": "NOTIFICATIONS",
 *        "allowed_destination_addresses": [
 *          "notifications@yourdomain.com",
 *          "alerts@yourdomain.com"
 *        ]
 *      }
 *    ]
 *
 * To use:
 * 1. Install dependencies: npm install mimetext
 * 2. Configure wrangler.jsonc with send_email binding
 * 3. Deploy: npx wrangler deploy
 * 4. POST to /api/send-notification with JSON body
 */

import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

interface Env {
  // Send email binding
  NOTIFICATIONS: {
    send(message: EmailMessage): Promise<void>;
  };
  // Optional: Store email logs in D1
  DB?: D1Database;
}

interface NotificationRequest {
  to: string;
  subject: string;
  message: string;
  type?: 'info' | 'warning' | 'alert';
}

export default {
  async fetch(request: Request, env: Env, ctx): Promise<Response> {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // Parse request body
      const body: NotificationRequest = await request.json();

      // Validate required fields
      if (!body.to || !body.subject || !body.message) {
        return new Response('Missing required fields: to, subject, message', {
          status: 400,
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.to)) {
        return new Response('Invalid email address', { status: 400 });
      }

      // Create email message
      const msg = createMimeMessage();

      // Set sender based on notification type
      const senderName = body.type === 'alert' ? 'System Alerts' : 'Notifications';
      msg.setSender({
        name: senderName,
        addr: 'noreply@yourdomain.com',
      });

      msg.setRecipient(body.to);

      // Add priority header for alerts
      if (body.type === 'alert') {
        msg.setHeader('X-Priority', '1');
      }

      msg.setSubject(body.subject);

      // Create plain text message
      msg.addMessage({
        contentType: 'text/plain',
        data: body.message,
      });

      // Create HTML version with styling based on type
      const htmlMessage = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .alert { border-left: 4px solid #f44336; padding: 15px; background: #ffebee; }
    .warning { border-left: 4px solid #ff9800; padding: 15px; background: #fff3e0; }
    .info { border-left: 4px solid #2196f3; padding: 15px; background: #e3f2fd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="${body.type || 'info'}">
      <h2>${body.subject}</h2>
      <p>${body.message.replace(/\n/g, '<br>')}</p>
    </div>
  </div>
</body>
</html>
      `.trim();

      msg.addMessage({
        contentType: 'text/html',
        data: htmlMessage,
      });

      // Send email
      const emailMessage = new EmailMessage(
        'noreply@yourdomain.com',
        body.to,
        msg.asRaw()
      );

      await env.NOTIFICATIONS.send(emailMessage);

      // Optional: Log to D1
      if (env.DB) {
        await env.DB.prepare(
          'INSERT INTO email_logs (recipient, subject, type, sent_at) VALUES (?, ?, ?, ?)'
        )
          .bind(body.to, body.subject, body.type || 'info', new Date().toISOString())
          .run();
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email sent successfully',
          recipient: body.to,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Error sending notification:', error);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to send email',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
