/**
 * Allowlist Email Worker
 *
 * Only accept emails from approved senders. All other emails are rejected.
 *
 * Use cases:
 * - Private email addresses
 * - Team inboxes restricted to organization members
 * - Contact forms with pre-approved senders
 * - Support tickets from verified customers
 *
 * To use:
 * 1. Update ALLOWED_SENDERS with approved email addresses
 * 2. Update FORWARD_TO with your verified destination
 * 3. Deploy: npx wrangler deploy
 * 4. Bind to email route in dashboard
 */

interface Env {
  // Add environment bindings here if needed
  // DB?: D1Database;
}

// Configuration
const ALLOWED_SENDERS = [
  'friend@example.com',
  'coworker@company.com',
  'support@vendor.com',
  '@trusted-domain.com', // Allow entire domain
];

const FORWARD_TO = 'your-inbox@example.com'; // Must be verified

export default {
  async email(message, env: Env, ctx) {
    try {
      console.log('Checking allowlist for:', message.from);

      // Check if sender is on allowlist
      const isAllowed = ALLOWED_SENDERS.some(pattern => {
        if (pattern.startsWith('@')) {
          // Domain-level allowlist (e.g., @company.com)
          return message.from.endsWith(pattern);
        } else {
          // Exact email match
          return message.from === pattern;
        }
      });

      if (!isAllowed) {
        console.log('Rejecting email from:', message.from);
        message.setReject('Sender not on allowlist');
        return;
      }

      // Forward allowed email
      console.log('Forwarding allowed email from:', message.from);
      await message.forward(FORWARD_TO);

      console.log('Email forwarded successfully');
    } catch (error) {
      console.error('Error processing email:', error);
      message.setReject('Unable to process email');
    }
  },
};
