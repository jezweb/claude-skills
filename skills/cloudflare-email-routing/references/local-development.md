# Local Development for Email Routing

Complete guide to testing Email Workers and Send Email locally with Wrangler.

**Last Updated**: 2025-10-23
**Official Docs**: https://developers.cloudflare.com/email-routing/email-workers/local-development

---

## Overview

Wrangler provides local simulation for email functionality:

1. **Receiving Emails** - Simulate via HTTP POST with raw email format
2. **Sending Emails** - Writes `.eml` files to local filesystem
3. **Limitations** - Not all production features work locally

**Important**: Local development is for testing logic only. Always test with real emails before production deployment.

---

## Setup

### Prerequisites

```bash
# Install dependencies
npm install postal-mime mimetext

# Ensure wrangler is installed
npm install -D wrangler

# Or install globally
npm install -g wrangler
```

### Project Structure

```
email-worker/
├── src/
│   ├── index.ts         # Main worker or email handler
│   └── email.ts         # Email worker (if separate)
├── wrangler.jsonc       # Configuration
├── package.json
└── test-emails/         # Store test email files
    ├── basic.eml
    ├── html.eml
    └── attachment.eml
```

---

## Testing Email Reception (Email Workers)

### Method 1: HTTP POST Simulation

Wrangler simulates email reception by accepting HTTP POST requests with raw email format.

#### Start Dev Server

```bash
npx wrangler dev
```

**Output**:
```
⎔ Starting local server...
[wrangler:inf] Ready on http://localhost:8787
```

#### Send Test Email via curl

**Basic Email**:
```bash
curl http://localhost:8787 -X POST \
  --data-binary @- << 'EOF'
From: sender@example.com
To: recipient@yourdomain.com
Subject: Test Email

This is a test email body.
EOF
```

**HTML Email**:
```bash
curl http://localhost:8787 -X POST \
  --data-binary @- << 'EOF'
From: sender@example.com
To: recipient@yourdomain.com
Subject: HTML Test
Content-Type: text/html

<h1>Test Email</h1>
<p>This is an HTML email.</p>
EOF
```

**Email with Headers**:
```bash
curl http://localhost:8787 -X POST \
  --data-binary @- << 'EOF'
From: sender@example.com
To: recipient@yourdomain.com
Subject: Test with Headers
Message-ID: <12345@example.com>
Date: Mon, 23 Oct 2025 10:00:00 +0000
Content-Type: text/plain

Email body here.
EOF
```

#### View Worker Output

Wrangler logs:
```
[wrangler:inf] Email handler processed message:
  From: sender@example.com
  To: recipient@yourdomain.com
  Subject: Test Email

[wrangler:inf] Email would be forwarded to: inbox@yourdomain.com
```

---

### Method 2: Test Email Files

Store test emails as `.eml` files for reusable testing.

#### Create Test Email

`test-emails/basic.eml`:
```
From: test@example.com
To: hello@yourdomain.com
Subject: Test Email
Message-ID: <test-123@example.com>
Date: Mon, 23 Oct 2025 10:00:00 +0000
Content-Type: text/plain

This is a test email body.

It has multiple lines.

Best regards,
Test Sender
```

#### Send via curl

```bash
curl http://localhost:8787 -X POST \
  --data-binary @test-emails/basic.eml
```

---

### Method 3: Automated Test Script

Create a test script for multiple scenarios.

**`test-emails.sh`**:
```bash
#!/bin/bash

BASE_URL="http://localhost:8787"

echo "=== Testing Email Worker ==="
echo ""

# Test 1: Basic email
echo "Test 1: Basic email forwarding"
curl -s $BASE_URL -X POST --data-binary @- << 'EOF'
From: basic@example.com
To: test@yourdomain.com
Subject: Basic Test

Basic email body.
EOF
echo ""
echo ""

# Test 2: Email from allowlist
echo "Test 2: Allowlisted sender"
curl -s $BASE_URL -X POST --data-binary @- << 'EOF'
From: friend@example.com
To: test@yourdomain.com
Subject: From Friend

This should pass allowlist.
EOF
echo ""
echo ""

# Test 3: Email from blocklist
echo "Test 3: Blocked sender"
curl -s $BASE_URL -X POST --data-binary @- << 'EOF'
From: spam@badactor.com
To: test@yourdomain.com
Subject: Spam

This should be rejected.
EOF
echo ""
echo ""

# Test 4: HTML email
echo "Test 4: HTML email"
curl -s $BASE_URL -X POST --data-binary @- << 'EOF'
From: html@example.com
To: test@yourdomain.com
Subject: HTML Test
Content-Type: text/html

<h1>HTML Email</h1>
<p>Testing HTML content.</p>
EOF
echo ""
```

**Usage**:
```bash
# Make executable
chmod +x test-emails.sh

# Start wrangler dev in one terminal
npx wrangler dev

# Run tests in another terminal
./test-emails.sh
```

---

## Testing Email Sending (Send Email Binding)

Wrangler simulates `send_email` bindings by writing emails to local `.eml` files.

### Worker Code Example

```typescript
import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

interface Env {
  EMAIL: {
    send(message: EmailMessage): Promise<void>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const msg = createMimeMessage();
    msg.setSender({ name: 'Test App', addr: 'noreply@yourdomain.com' });
    msg.setRecipient('user@example.com');
    msg.setSubject('Test Email from Local Dev');
    msg.addMessage({
      contentType: 'text/plain',
      data: 'This email was sent from local development.',
    });

    const email = new EmailMessage(
      'noreply@yourdomain.com',
      'user@example.com',
      msg.asRaw()
    );

    await env.EMAIL.send(email);

    return new Response('Email sent!');
  },
};
```

### Configuration

**`wrangler.jsonc`**:
```jsonc
{
  "name": "email-sender",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-11",
  "send_email": [
    {
      "name": "EMAIL",
      "destination_address": "test@yourdomain.com"
    }
  ]
}
```

### Test Locally

```bash
# Start dev server
npx wrangler dev

# Trigger email send
curl http://localhost:8787
```

**Output**:
```
[wrangler:inf] send_email binding called with the following message:
  /tmp/miniflare-abc123/files/email/message-xyz789.eml
```

### View Sent Email

```bash
# View the email file
cat /tmp/miniflare-abc123/files/email/message-xyz789.eml
```

**Example `.eml` content**:
```
Date: Mon, 23 Oct 2025 10:15:32 +0000
From: =?utf-8?B?VGVzdCBBcHA=?= <noreply@yourdomain.com>
To: <user@example.com>
Message-ID: <xyz789@example.com>
Subject: =?utf-8?B?VGVzdCBFbWFpbCBmcm9tIExvY2FsIERldg==?=
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 7bit

This email was sent from local development.
```

### Automated File Checking

**`check-sent-emails.sh`**:
```bash
#!/bin/bash

# Find and display all sent emails
EMAIL_DIR="/tmp/miniflare-*/files/email"

echo "=== Sent Emails ==="
echo ""

for file in $EMAIL_DIR/*.eml; do
  if [ -f "$file" ]; then
    echo "File: $file"
    echo "---"
    cat "$file"
    echo ""
    echo "========================================"
    echo ""
  fi
done
```

---

## Complete Example: Email Receive + Reply + Send

This example demonstrates all email capabilities in one worker.

### Worker Code

```typescript
import PostalMime from 'postal-mime';
import { createMimeMessage } from 'mimetext';
import { EmailMessage } from 'cloudflare:email';

interface Env {
  NOTIFICATIONS: {
    send(message: EmailMessage): Promise<void>;
  };
}

export default {
  async email(message, env: Env, ctx) {
    console.log('=== Received Email ===');
    console.log('From:', message.from);
    console.log('To:', message.to);

    // Parse email
    const parser = new PostalMime.default();
    const email = await parser.parse(
      await new Response(message.raw).arrayBuffer()
    );

    console.log('Subject:', email.subject);
    console.log('Body preview:', email.text?.substring(0, 100));

    // Send auto-reply
    const reply = createMimeMessage();
    reply.setSender({ name: 'Auto Reply', addr: 'noreply@yourdomain.com' });
    reply.setRecipient(message.from);
    reply.setHeader('In-Reply-To', message.headers.get('Message-ID'));
    reply.setSubject(`Re: ${email.subject}`);
    reply.addMessage({
      contentType: 'text/plain',
      data: 'Thank you for your email. We will respond soon.',
    });

    await message.reply(
      new EmailMessage('noreply@yourdomain.com', message.from, reply.asRaw())
    );

    console.log('=== Sent Auto-Reply ===');

    // Send notification to team
    const notification = createMimeMessage();
    notification.setSender({ name: 'Email System', addr: 'system@yourdomain.com' });
    notification.setRecipient('team@yourdomain.com');
    notification.setSubject(`New email from ${message.from}`);
    notification.addMessage({
      contentType: 'text/plain',
      data: `New email received:\n\nFrom: ${message.from}\nSubject: ${email.subject}\n\n${email.text}`,
    });

    await env.NOTIFICATIONS.send(
      new EmailMessage('system@yourdomain.com', 'team@yourdomain.com', notification.asRaw())
    );

    console.log('=== Sent Team Notification ===');

    // Forward to inbox
    await message.forward('inbox@yourdomain.com');

    console.log('=== Forwarded to Inbox ===');
  },
};
```

### Test It

```bash
# Start dev server
npx wrangler dev

# Send test email
curl http://localhost:8787 -X POST --data-binary @- << 'EOF'
From: customer@example.com
To: support@yourdomain.com
Subject: Need help with order

Hello, I need help with my order #12345.

Thanks,
Customer
EOF
```

**Expected Output**:
```
[wrangler:inf] === Received Email ===
[wrangler:inf] From: customer@example.com
[wrangler:inf] To: support@yourdomain.com
[wrangler:inf] Subject: Need help with order
[wrangler:inf] Body preview: Hello, I need help with my order #12345.

[wrangler:inf] Email handler replied to sender with the following message:
  /tmp/miniflare-abc123/files/email/reply-xyz.eml

[wrangler:inf] === Sent Auto-Reply ===

[wrangler:inf] send_email binding called with the following message:
  /tmp/miniflare-abc123/files/email/notification-abc.eml

[wrangler:inf] === Sent Team Notification ===

[wrangler:inf] Email would be forwarded to: inbox@yourdomain.com

[wrangler:inf] === Forwarded to Inbox ===
```

---

## Debugging Tips

### Enable Verbose Logging

```bash
# Start wrangler with verbose output
npx wrangler dev --log-level debug
```

### Inspect Email Parsing

```typescript
export default {
  async email(message, env, ctx) {
    // Log all headers
    console.log('=== All Headers ===');
    for (const [key, value] of message.headers) {
      console.log(`${key}: ${value}`);
    }

    // Log raw size
    console.log('Raw size:', message.rawSize, 'bytes');

    // Parse and log full email structure
    const parser = new PostalMime.default();
    const email = await parser.parse(
      await new Response(message.raw).arrayBuffer()
    );

    console.log('=== Parsed Email ===');
    console.log('From:', email.from);
    console.log('To:', email.to);
    console.log('Subject:', email.subject);
    console.log('Text:', email.text);
    console.log('HTML:', email.html);
    console.log('Attachments:', email.attachments?.length || 0);

    // Forward
    await message.forward('inbox@yourdomain.com');
  },
};
```

### Test Error Handling

```typescript
export default {
  async email(message, env, ctx) {
    try {
      // Simulate error
      if (message.from === 'error@example.com') {
        throw new Error('Simulated error for testing');
      }

      await message.forward('inbox@yourdomain.com');
    } catch (error) {
      console.error('=== ERROR ===');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      message.setReject(`Error: ${error.message}`);
    }
  },
};
```

**Test**:
```bash
curl http://localhost:8787 -X POST --data-binary @- << 'EOF'
From: error@example.com
To: test@yourdomain.com
Subject: Error Test

This should trigger an error.
EOF
```

---

## Limitations of Local Development

### What Works
✅ Email parsing with postal-mime
✅ Creating emails with mimetext
✅ Testing forwarding logic (logs destination)
✅ Testing reply logic (writes .eml file)
✅ Testing send email binding (writes .eml file)
✅ Error handling and logging
✅ Accessing env bindings (D1, KV, etc.)

### What Doesn't Work
❌ Actual email delivery (simulation only)
❌ DNS verification of sender domains
❌ SPF/DKIM/DMARC checking
❌ Attachment handling edge cases
❌ Large email handling (>10MB)
❌ Email threading and conversation tracking
❌ Delivery reports and bounces

### Solution: Always Test in Production
```bash
# 1. Test locally to validate logic
npx wrangler dev
./test-emails.sh

# 2. Deploy to staging or test worker
npx wrangler deploy --name email-worker-test

# 3. Test with real emails
# Send email to: test@yourdomain.com

# 4. Monitor with wrangler tail
npx wrangler tail email-worker-test --format pretty

# 5. Deploy to production when validated
npx wrangler deploy --name email-worker
```

---

## Testing Checklist

Before deploying Email Workers to production:

### Local Testing
- [ ] Worker receives and parses basic emails
- [ ] Allowlist/blocklist logic works correctly
- [ ] Forwarding logic selects correct destinations
- [ ] Auto-reply messages are well-formatted
- [ ] Error handling catches all exceptions
- [ ] Logs provide useful debugging information
- [ ] Send email binding creates valid .eml files

### Production Testing
- [ ] Deploy to test worker first
- [ ] Send emails from various providers (Gmail, Outlook, etc.)
- [ ] Test with plain text, HTML, and attachments
- [ ] Verify emails arrive at destination addresses
- [ ] Check SPF/DKIM pass on received emails
- [ ] Monitor worker logs with `wrangler tail`
- [ ] Test error scenarios (invalid emails, rate limits)
- [ ] Verify dashboard Activity Log (with awareness of Issue #6)

---

## Troubleshooting Local Development

### Problem: Worker not receiving emails via curl

**Solution**:
- Check worker is running: `npx wrangler dev`
- Verify URL is correct: `http://localhost:8787`
- Ensure email format is valid (From, To, Subject headers)
- Check for typos in curl command

---

### Problem: postal-mime parse errors

**Solution**:
```typescript
try {
  const parser = new PostalMime.default();
  const email = await parser.parse(
    await new Response(message.raw).arrayBuffer()
  );
} catch (error) {
  console.error('Parse error:', error);
  // Log raw email for debugging
  console.error('Raw email:', await new Response(message.raw).text());
  message.setReject('Invalid email format');
}
```

---

### Problem: Can't find sent .eml files

**Solution**:
```bash
# Find miniflare temp directory
find /tmp -name "miniflare-*" -type d 2>/dev/null

# List all .eml files
find /tmp/miniflare-*/files/email -name "*.eml" 2>/dev/null
```

---

## Additional Resources

- **Wrangler Dev Docs**: https://developers.cloudflare.com/workers/wrangler/commands/#dev
- **Email Workers Local Development**: https://developers.cloudflare.com/email-routing/email-workers/local-development/
- **postal-mime**: https://www.npmjs.com/package/postal-mime
- **mimetext**: https://www.npmjs.com/package/mimetext
- **Email Message Format (RFC 5322)**: https://datatracker.ietf.org/doc/html/rfc5322

---

**Last Updated**: 2025-10-23
**Skill Version**: 1.0.0
