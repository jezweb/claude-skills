/**
 * Blocklist Email Worker
 *
 * Reject emails from specific senders or domains. All other emails are forwarded.
 *
 * Use cases:
 * - Block spam senders
 * - Block harassers or abusive senders
 * - Block entire domains (e.g., competitor domains)
 * - Implement custom spam filtering
 *
 * To use:
 * 1. Update BLOCKED_SENDERS with addresses/domains to block
 * 2. Update FORWARD_TO with your verified destination
 * 3. Deploy: npx wrangler deploy
 * 4. Bind to email route in dashboard
 */

interface Env {
  // Optional: Store blocklist in KV for dynamic updates
  // BLOCKLIST?: KVNamespace;
}

// Configuration
const BLOCKED_SENDERS = [
  'spam@example.com',
  'harasser@badactor.com',
  '@suspicious-domain.com', // Block entire domain
  '@competitor.com',
];

const FORWARD_TO = 'your-inbox@example.com'; // Must be verified

export default {
  async email(message, env: Env, ctx) {
    try {
      console.log('Checking blocklist for:', message.from);

      // Check if sender is on blocklist
      const isBlocked = BLOCKED_SENDERS.some(pattern => {
        if (pattern.startsWith('@')) {
          // Domain-level block (e.g., @spam.com)
          return message.from.endsWith(pattern);
        } else {
          // Exact email match
          return message.from === pattern;
        }
      });

      if (isBlocked) {
        console.log('Blocking email from:', message.from);
        message.setReject('Sender blocked');
        return;
      }

      // Forward non-blocked email
      console.log('Forwarding email from:', message.from);
      await message.forward(FORWARD_TO);

      console.log('Email forwarded successfully');
    } catch (error) {
      console.error('Error processing email:', error);
      message.setReject('Unable to process email');
    }
  },
};
