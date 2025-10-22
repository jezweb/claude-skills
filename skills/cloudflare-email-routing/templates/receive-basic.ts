/**
 * Basic Email Worker - Simple Forwarding
 *
 * This worker receives emails and forwards them to a verified destination.
 * Use this as a starting point for email processing.
 *
 * Features:
 * - Log sender, recipient, and basic metadata
 * - Forward to verified destination address
 * - Error handling with rejection
 *
 * To use:
 * 1. Install dependencies: npm install postal-mime
 * 2. Deploy: npx wrangler deploy
 * 3. Bind to email route in Cloudflare Dashboard
 */

import PostalMime from 'postal-mime';

interface Env {
  // Add environment bindings here if needed
  // DB?: D1Database;
  // EMAIL_CACHE?: KVNamespace;
}

export default {
  async email(message, env: Env, ctx) {
    try {
      // Log basic email metadata
      console.log('Received email from:', message.from);
      console.log('To:', message.to);
      console.log('Size:', message.rawSize, 'bytes');

      // Parse email to access subject and body
      const parser = new PostalMime.default();
      const email = await parser.parse(
        await new Response(message.raw).arrayBuffer()
      );

      console.log('Subject:', email.subject);
      console.log('Text preview:', email.text?.substring(0, 100));

      // Forward to verified destination
      // IMPORTANT: Replace with your verified destination address
      await message.forward('your-inbox@example.com');

      console.log('Email forwarded successfully');
    } catch (error) {
      // Log error and reject email
      console.error('Error processing email:', error);
      message.setReject('Unable to process email');
    }
  },
};
