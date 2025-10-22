/**
 * Send Email - Basic Example
 *
 * This Worker demonstrates sending emails using the send_email binding.
 *
 * Prerequisites:
 * 1. Email Routing enabled on your domain
 * 2. Destination address verified in Email Routing settings
 * 3. send_email binding configured in wrangler.jsonc:
 *
 *    "send_email": [
 *      {
 *        "name": "EMAIL",
 *        "destination_address": "notifications@yourdomain.com"
 *      }
 *    ]
 *
 * To use:
 * 1. Install dependencies: npm install mimetext
 * 2. Configure wrangler.jsonc with send_email binding
 * 3. Deploy: npx wrangler deploy
 * 4. Visit worker URL or trigger via fetch()
 */

import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

interface Env {
  // Send email binding (configured in wrangler.jsonc)
  EMAIL: {
    send(message: EmailMessage): Promise<void>;
  };
}

export default {
  async fetch(request: Request, env: Env, ctx): Promise<Response> {
    try {
      // Create email message
      const msg = createMimeMessage();

      // Set sender (must be from your domain with Email Routing enabled)
      msg.setSender({
        name: 'My Application',
        addr: 'noreply@yourdomain.com',
      });

      // Set recipient
      msg.setRecipient('user@example.com');

      // Set subject
      msg.setSubject('Welcome to My Application');

      // Add plain text message
      msg.addMessage({
        contentType: 'text/plain',
        data: 'Thank you for signing up! We are excited to have you on board.',
      });

      // Optional: Add HTML version
      msg.addMessage({
        contentType: 'text/html',
        data: '<h1>Welcome!</h1><p>Thank you for signing up!</p>',
      });

      // Create EmailMessage and send
      const emailMessage = new EmailMessage(
        'noreply@yourdomain.com',
        'user@example.com',
        msg.asRaw()
      );

      await env.EMAIL.send(emailMessage);

      return new Response('Email sent successfully!', { status: 200 });
    } catch (error) {
      console.error('Error sending email:', error);
      return new Response('Failed to send email', { status: 500 });
    }
  },
};
