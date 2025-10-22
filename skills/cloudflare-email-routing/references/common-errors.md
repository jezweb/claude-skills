# Common Email Routing Errors

This document provides detailed troubleshooting for all 8 known issues with Cloudflare Email Routing.

**Last Updated**: 2025-10-23
**Sources**: GitHub issues, Cloudflare Community, production experience

---

## Issue #1: "Email Trigger not available to this workers"

### Error Message
```
Email Trigger not available to this workers
```

### Source
- **GitHub**: [workers-sdk #3751](https://github.com/cloudflare/workers-sdk/issues/3751)
- **Reported**: August 2023
- **Status**: Unresolved (as of 2025-10-23)

### Why It Happens
Wrangler dev doesn't fully support email triggers in local development. The email handler is not properly initialized when running locally.

### How to Fix

#### Solution 1: Deploy and Test (Recommended)
```bash
# Deploy your email worker
npx wrangler deploy

# Test with real email
# Send email to your configured route (e.g., test@yourdomain.com)

# Monitor logs
npx wrangler tail --format pretty
```

#### Solution 2: Use HTTP Simulation
```bash
# Start dev server
npx wrangler dev

# In another terminal, simulate email
curl http://localhost:8787 -X POST \
  --data-binary @- << EOF
From: sender@example.com
To: recipient@yourdomain.com
Subject: Test Email

This is a test email body.
EOF
```

#### Solution 3: Dashboard Testing
1. Deploy worker: `npx wrangler deploy`
2. Go to Cloudflare Dashboard → Email → Email Routing → Email Workers
3. Select your worker → Test Email Event
4. Note: This feature may also have bugs (see Issue #7)

### Prevention
- Always deploy email workers before production testing
- Use `wrangler tail` for debugging deployed workers
- Don't rely on local email simulation for final testing

---

## Issue #2: Destination Address Verification Bug

### Error Message
```
Destination address not verified
```
or email silently fails to forward

### Source
- **Cloudflare Community**: [Email Worker Free Reliability](https://community.cloudflare.com/t/email-worker-free-reliability/486680)
- **Reported**: Multiple community reports 2024-2025
- **Status**: Intermittent bug

### Why It Happens
Bug in Cloudflare dashboard where destination addresses show as "unverified" in Email Workers unless they're also used in a regular routing rule. The verification system has a race condition.

### How to Fix

#### Solution: Create Regular Forward Rule First
1. Go to Email → Email Routing → Routing Rules
2. Create a regular forward rule:
   - Custom address: `temp@yourdomain.com`
   - Destination: `your-email@example.com`
3. Verify the destination address via email
4. Now use `your-email@example.com` in Email Workers
5. Delete the temporary routing rule if desired (verification persists)

#### Alternative: Re-verify Address
1. Go to Email → Email Routing → Destination Addresses
2. Find your address
3. If showing as unverified, click "Resend Verification"
4. Check your email and verify again

### Prevention
- Always verify destination addresses BEFORE deploying Email Workers
- Create regular routing rules for all destinations first
- Check verification status in dashboard before deploying
- Test with real emails after deployment

---

## Issue #3: Gmail Rate Limiting (Error 421)

### Error Message
```
421: Our system has detected an unusual rate of unsolicited mail originating from your IP address
```

### Source
- **Cloudflare Community**: Multiple reports 2023-2025
- **Gmail Documentation**: Standard anti-spam measure

### Why It Happens
Gmail flags Cloudflare's shared IP ranges as suspicious when:
- Sending too many emails in short time
- Sending to many non-existent addresses
- Sending without proper SPF/DKIM/DMARC
- Shared IP has poor reputation from other users

### How to Fix

#### Immediate Fix: Slow Down
```typescript
// Add rate limiting to your worker
const EMAIL_RATE_LIMIT = 50; // emails per hour
const RATE_WINDOW = 3600; // 1 hour in seconds

export default {
  async email(message, env, ctx) {
    // Check rate limit in KV
    const rateKey = `rate:${new Date().getHours()}`;
    const count = await env.EMAIL_CACHE.get(rateKey);

    if (count && parseInt(count) >= EMAIL_RATE_LIMIT) {
      message.setReject('Rate limit exceeded');
      return;
    }

    // Process email...
    await message.forward('inbox@gmail.com');

    // Increment counter
    await env.EMAIL_CACHE.put(
      rateKey,
      String((count ? parseInt(count) : 0) + 1),
      { expirationTtl: RATE_WINDOW }
    );
  },
};
```

#### Long-term Fix: Verify DNS Records
1. Check SPF record includes Cloudflare:
   ```
   v=spf1 include:_spf.mx.cloudflare.net ~all
   ```

2. Verify DKIM is configured (automatic with Email Routing)

3. Add DMARC record:
   ```
   _dmarc.yourdomain.com. TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
   ```

### Prevention
- Limit sending to 50-100 emails/hour for personal use
- Don't send bulk emails through Email Routing
- Use transactional email services (SendGrid, Mailgun, Postmark) for high volume
- Verify SPF, DKIM, and DMARC are configured
- Don't send unsolicited emails

---

## Issue #4: SPF Permerror with MailChannels

### Error Message
```
SPF: permerror (permanent error)
```

### Source
- **Cloudflare Community**: [Worker MailChannels Email Routing SPF Permerror](https://community.cloudflare.com/t/worker-mailchannels-email-routing-spf-permerror/637766)
- **Reported**: 2024
- **Status**: Configuration issue

### Why It Happens
The SPF record chain breaks when forwarding emails through multiple services:
1. Original sender → Your domain (Email Routing)
2. Your domain → MailChannels (Worker)
3. MailChannels → Final recipient

Each hop needs proper SPF authorization, creating a complex chain that can break.

### How to Fix

#### Solution 1: Use Native Email Routing (Recommended)
Stop using MailChannels and use Cloudflare's native send email binding:

```typescript
// Instead of MailChannels:
// await fetch('https://api.mailchannels.net/tx/v1/send', ...)

// Use native binding:
import { EmailMessage } from 'cloudflare:email';
await env.EMAIL.send(message);
```

#### Solution 2: Fix SPF Chain
If you must use MailChannels:

1. Add MailChannels to SPF:
   ```
   v=spf1 include:_spf.mx.cloudflare.net include:relay.mailchannels.net ~all
   ```

2. Configure MailChannels SPF domain lock:
   ```
   // In your worker
   headers: {
     'X-MC-SPF-Domain': 'yourdomain.com',
   }
   ```

### Prevention
- Use Cloudflare's native send email binding instead of MailChannels
- Test SPF with [MXToolbox SPF Checker](https://mxtoolbox.com/spf.aspx)
- Keep SPF record under 10 DNS lookups (SPF limit)
- Don't chain multiple forwarding services

---

## Issue #5: Limited Logging on Free Plan

### Error Message
No specific error, but cannot see:
- Worker logs in dashboard
- Email processing details
- Debugging information

### Source
- **Cloudflare Community**: Multiple reports
- **Cloudflare Docs**: Free plan limitations documented

### Why It Happens
Free Workers plan has:
- Limited log retention (24 hours)
- No log streaming in dashboard
- Limited observability features

### How to Fix

#### Solution 1: Use Wrangler Tail (Free)
```bash
# Live tail logs from deployed worker
npx wrangler tail --format pretty

# Filter for specific messages
npx wrangler tail --format pretty | grep "email"

# Save logs to file
npx wrangler tail --format pretty > email-logs.txt
```

#### Solution 2: Store Logs in D1 (Free)
```typescript
export default {
  async email(message, env, ctx) {
    try {
      // Log to D1
      await env.DB.prepare(
        'INSERT INTO email_logs (from_addr, to_addr, subject, processed_at, status) VALUES (?, ?, ?, ?, ?)'
      ).bind(
        message.from,
        message.to,
        'subject here',
        new Date().toISOString(),
        'processing'
      ).run();

      // Process email
      await message.forward('inbox@example.com');

      // Update status
      await env.DB.prepare(
        'UPDATE email_logs SET status = ? WHERE from_addr = ? AND to_addr = ?'
      ).bind('forwarded', message.from, message.to).run();
    } catch (error) {
      // Log error
      await env.DB.prepare(
        'INSERT INTO email_logs (from_addr, to_addr, error, processed_at) VALUES (?, ?, ?, ?)'
      ).bind(message.from, message.to, String(error), new Date().toISOString()).run();
    }
  },
};
```

#### Solution 3: Upgrade to Paid Plan ($5/month)
Paid plan includes:
- 3-day log retention
- Dashboard log streaming
- Real-time log search
- Better observability

### Prevention
- Use `wrangler tail` during development
- Add comprehensive console.log statements
- Store critical logs in D1 or KV
- Consider paid plan if logs are essential

---

## Issue #6: Activity Log Discrepancies

### Error Message
Dashboard shows:
```
Status: Dropped
```
But email was actually forwarded successfully.

### Source
- **Cloudflare Community**: Multiple reports 2024-2025
- **Status**: Dashboard display bug

### Why It Happens
Bug in Cloudflare dashboard where Activity Log shows incorrect status for emails processed by Email Workers. The actual delivery succeeds, but the dashboard shows "Dropped."

### How to Fix

#### Solution: Don't Trust Dashboard Status
1. Test actual email delivery instead:
   ```bash
   # Send test email to your route
   # Check if it arrives at destination
   ```

2. Use `wrangler tail` to verify processing:
   ```bash
   npx wrangler tail --format pretty
   # Send test email
   # Look for logs showing successful forward
   ```

3. Implement your own tracking:
   ```typescript
   export default {
     async email(message, env, ctx) {
       // Track in D1
       await env.DB.prepare(
         'INSERT INTO email_activity (from_addr, to_addr, status, timestamp) VALUES (?, ?, ?, ?)'
       ).bind(message.from, message.to, 'forwarded', new Date().toISOString()).run();

       await message.forward('inbox@example.com');
     },
   };
   ```

### Prevention
- Don't rely on dashboard Activity Log for Email Workers
- Verify actual email delivery to final destination
- Implement your own logging/tracking
- Use `wrangler tail` for real-time monitoring

---

## Issue #7: Test Email Event Loading Indefinitely

### Error Message
Dashboard "Test Email Event" button shows loading spinner forever, with error in console:
```
Network error or timeout
```

### Source
- **GitHub**: [workers-sdk #9195](https://github.com/cloudflare/workers-sdk/issues/9195)
- **Reported**: May 2025
- **Status**: Unresolved dashboard bug

### Why It Happens
Bug in Cloudflare dashboard testing interface. The test feature fails to properly simulate email events and times out.

### How to Fix

#### Solution 1: Test with Real Emails (Recommended)
```bash
# 1. Deploy worker
npx wrangler deploy

# 2. Send real email to your route
# Use your personal email to send to: test@yourdomain.com

# 3. Monitor processing
npx wrangler tail --format pretty
```

#### Solution 2: Local HTTP Simulation
```bash
# Start dev server
npx wrangler dev

# Simulate email with curl
curl http://localhost:8787 -X POST \
  --data-binary @- << EOF
From: sender@example.com
To: recipient@yourdomain.com
Subject: Test Email
Content-Type: text/plain

This is a test email body.
EOF
```

#### Solution 3: Use Email Testing Service
Use services like:
- [MailHog](https://github.com/mailhog/MailHog) (local SMTP)
- [Mailtrap](https://mailtrap.io/) (email testing platform)
- [SendGrid Sandbox](https://sendgrid.com/docs/for-developers/sending-email/sandbox-mode/)

### Prevention
- Don't rely on dashboard "Test Email Event" feature
- Always test with real email delivery
- Use `wrangler tail` for debugging
- Set up email testing infrastructure early

---

## Issue #8: Worker Call Failures

### Error Message
```
Rejected reason: Unknown error: failed to call worker: Worker call failed for 3 times, aborting…
```

### Source
- **GitHub**: [workers-sdk #9069](https://github.com/cloudflare/workers-sdk/issues/9069)
- **Cloudflare Community**: [Email Workers Returning Error](https://community.cloudflare.com/t/cloudflare-email-workers-returning-error-response-no-matter-what/757041)
- **Reported**: April 2025
- **Status**: Runtime errors in worker

### Why It Happens
Worker crashes or fails during email processing due to:
- Unhandled exceptions
- Timeout errors (CPU limit exceeded)
- Memory limit exceeded
- External API call failures
- Malformed email parsing

### How to Fix

#### Solution: Add Comprehensive Error Handling
```typescript
export default {
  async email(message, env, ctx) {
    try {
      // Set timeout for external operations
      const timeoutMs = 25000; // 25 seconds (Worker limit is 30s)

      // Parse email with timeout
      const parsePromise = (async () => {
        const parser = new PostalMime.default();
        return await parser.parse(await new Response(message.raw).arrayBuffer());
      })();

      const email = await Promise.race([
        parsePromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Parse timeout')), timeoutMs)
        ),
      ]);

      // Log for debugging
      console.log('Email processed:', {
        from: message.from,
        to: message.to,
        subject: email.subject,
        size: message.rawSize,
      });

      // Forward with error handling
      await message.forward('inbox@example.com');

      console.log('Email forwarded successfully');
    } catch (error) {
      // Log detailed error
      console.error('Email processing failed:', {
        error: String(error),
        from: message.from,
        to: message.to,
        size: message.rawSize,
      });

      // Store error in D1 for later analysis
      if (env.DB) {
        try {
          await env.DB.prepare(
            'INSERT INTO email_errors (from_addr, error, timestamp) VALUES (?, ?, ?)'
          ).bind(message.from, String(error), new Date().toISOString()).run();
        } catch (dbError) {
          console.error('Failed to log error to D1:', dbError);
        }
      }

      // Reject with clear reason
      message.setReject(`Processing error: ${error.message || 'Unknown error'}`);
    }
  },
};
```

#### Additional Fixes:

**Fix 1: Test with Various Email Formats**
```bash
# Test with plain text
# Test with HTML
# Test with attachments
# Test with large emails (>1MB)
# Test with malformed emails
```

**Fix 2: Use ctx.waitUntil for Non-Critical Operations**
```typescript
export default {
  async email(message, env, ctx) {
    // Forward email (critical)
    await message.forward('inbox@example.com');

    // Log to analytics (non-critical)
    ctx.waitUntil(
      env.ANALYTICS.writeDataPoint({
        blobs: [message.from, message.to],
        indexes: ['email-received'],
      })
    );
  },
};
```

**Fix 3: Check Resource Limits**
```typescript
// Keep worker lean
// Don't load large libraries
// Stream large emails instead of loading into memory
// Use lazy imports for parsing libraries
```

### Prevention
- Wrap all operations in try/catch
- Set timeouts for external API calls
- Test with various email formats before production
- Monitor worker CPU and memory usage
- Use `ctx.waitUntil()` for non-blocking operations
- Keep worker code minimal and efficient
- Log errors to D1/KV for analysis

---

## General Troubleshooting Checklist

When encountering Email Routing errors:

- [ ] Verify Email Routing is enabled on domain
- [ ] Check MX records are pointing to Cloudflare
- [ ] Verify all destination addresses in dashboard
- [ ] Deploy worker before testing: `npx wrangler deploy`
- [ ] Check worker is bound to correct email route
- [ ] Use `wrangler tail` to see live logs
- [ ] Test with real email, not just dashboard
- [ ] Check SPF/DKIM records are configured
- [ ] Verify code has proper error handling
- [ ] Review worker CPU/memory usage in dashboard
- [ ] Test with different email formats (plain, HTML, attachments)
- [ ] Check Activity Log (but don't trust status completely)
- [ ] Review Cloudflare status page for outages

---

## Additional Resources

- **Workers SDK Issues**: https://github.com/cloudflare/workers-sdk/issues
- **Cloudflare Community**: https://community.cloudflare.com/c/developers/workers/40
- **Email Routing Docs**: https://developers.cloudflare.com/email-routing/
- **MXToolbox**: https://mxtoolbox.com/ (DNS/Email testing)
- **Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler/

---

**Last Updated**: 2025-10-23
**Skill Version**: 1.0.0
