/**
 * Auto-Reply Email Worker
 *
 * Automatically reply to incoming emails with a custom message.
 * Useful for out-of-office replies, support acknowledgments, etc.
 *
 * Features:
 * - Parse incoming email subject and body
 * - Send automatic reply with custom message
 * - Forward original email to team inbox
 * - Preserve email threading with In-Reply-To header
 *
 * To use:
 * 1. Install dependencies: npm install postal-mime mimetext
 * 2. Update REPLY_CONFIG with your settings
 * 3. Deploy: npx wrangler deploy
 * 4. Bind to email route in dashboard
 */

import PostalMime from 'postal-mime';
import { createMimeMessage } from 'mimetext';
import { EmailMessage } from 'cloudflare:email';

interface Env {
  // Add environment bindings here if needed
  // DB?: D1Database;
}

// Configuration
const REPLY_CONFIG = {
  senderName: 'Support Team',
  senderEmail: 'support@yourdomain.com',
  forwardTo: 'team@yourdomain.com', // Where to forward original email
  replyTemplate: (subject: string, fromEmail: string) => `
Thank you for your email regarding "${subject}".

We have received your message and will respond within 24 hours.
Your message has been logged with our support team.

Best regards,
Support Team
  `.trim(),
};

export default {
  async email(message, env: Env, ctx) {
    try {
      console.log('Processing email from:', message.from);

      // Parse incoming email
      const parser = new PostalMime.default();
      const email = await parser.parse(
        await new Response(message.raw).arrayBuffer()
      );

      console.log('Subject:', email.subject);

      // Create auto-reply message
      const msg = createMimeMessage();
      msg.setSender({
        name: REPLY_CONFIG.senderName,
        addr: REPLY_CONFIG.senderEmail,
      });
      msg.setRecipient(message.from);

      // Preserve email thread with In-Reply-To header
      const messageId = message.headers.get('Message-ID');
      if (messageId) {
        msg.setHeader('In-Reply-To', messageId);
      }

      msg.setSubject(`Re: ${email.subject}`);
      msg.addMessage({
        contentType: 'text/plain',
        data: REPLY_CONFIG.replyTemplate(email.subject, message.from),
      });

      // Send reply
      const replyMessage = new EmailMessage(
        REPLY_CONFIG.senderEmail,
        message.from,
        msg.asRaw()
      );

      await message.reply(replyMessage);
      console.log('Auto-reply sent to:', message.from);

      // Forward original email to team
      await message.forward(REPLY_CONFIG.forwardTo);
      console.log('Original email forwarded to team');
    } catch (error) {
      console.error('Error processing email:', error);
      message.setReject('Unable to process email');
    }
  },
};
