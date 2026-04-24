---
name: google-chat-messages
description: "Send Google Chat messages via webhook — text, rich cards (cardsV2), threaded replies. Includes TypeScript types, card builder utility, and widget reference."
compatibility: Designed for Claude Code (or similar products)
---

# Google Chat Messages

Send messages to Google Chat spaces via incoming webhooks. Produces text messages, rich cards (cardsV2), and threaded replies.

## What You Produce

- Text messages with Google Chat formatting
- Rich card messages (cardsV2) with headers, sections, widgets
- Threaded conversations
- Reusable webhook sender utility

## Workflow

### Step 1: Get Webhook URL

In Google Chat:
1. Open a Space > click space name > **Manage webhooks**
2. Create webhook (name it, optionally add avatar URL)
3. Copy the webhook URL

Store the URL as an environment variable or in your secrets manager — never hardcode.

### Step 2: Choose Message Type

| Need | Type | Complexity |
|------|------|------------|
| Simple notification | Text message | Low |
| Structured info (status, digest) | Card message (cardsV2) | Medium |
| Ongoing updates | Threaded replies | Medium |
| Action buttons (open URL) | Card with buttonList | Medium |

### Step 3: Send the Message

Use `assets/webhook-sender.ts` for the sender utility. Use `assets/card-builder.ts` for structured card construction.

## Text Formatting

Google Chat does NOT use standard Markdown.

| Format | Syntax | Example |
|--------|--------|---------|
| Bold | `*text*` | `*important*` |
| Italic | `_text_` | `_emphasis_` |
| Strikethrough | `~text~` | `~removed~` |
| Monospace | `` `text` `` | `` `code` `` |
| Code block | ` ```text``` ` | Multi-line code |
| Link | `<url\|text>` | `<https://example.com\|Click here>` |
| Mention user | `<users/USER_ID>` | `<users/123456>` |
| Mention all | `<users/all>` | `<users/all>` |

**Not supported**: `**double asterisks**`, headings (`###`), blockquotes, tables, images inline.

### Text Message Example

```typescript
await sendText(webhookUrl, '*Build Complete*\n\nBranch: `main`\nStatus: Passed\n<https://ci.example.com/123|View Build>');
```

## cardsV2 Structure

Cards use the cardsV2 format (recommended over legacy cards).

```typescript
const message = {
  cardsV2: [{
    cardId: 'unique-id',
    card: {
      header: {
        title: 'Card Title',
        subtitle: 'Optional subtitle',
        imageUrl: 'https://example.com/icon.png',
        imageType: 'CIRCLE'  // or 'SQUARE'
      },
      sections: [{
        header: 'Section Title',  // optional
        widgets: [
          // widgets go here
        ]
      }]
    }
  }]
};
```

## Widget Reference

All widget types available in cardsV2 sections.

### textParagraph

Formatted text block. Supports Google Chat formatting (`*bold*`, `_italic_`, `<url|text>`).

```typescript
{
  textParagraph: {
    text: '*Status*: All systems operational\n_Last checked_: 5 minutes ago'
  }
}
```

### decoratedText

Labelled value with optional icons. Most versatile widget for key-value data.

**Basic:**
```typescript
{
  decoratedText: {
    topLabel: 'Environment',
    text: 'Production',
    bottomLabel: 'Last deployed 2h ago'
  }
}
```

**With start icon:**
```typescript
{
  decoratedText: {
    topLabel: 'Status',
    text: 'Healthy',
    startIcon: { knownIcon: 'STAR' }
  }
}
```

**With custom icon URL:**
```typescript
{
  decoratedText: {
    topLabel: 'GitHub',
    text: 'PR #142 merged',
    startIcon: {
      iconUrl: 'https://github.githubassets.com/favicons/favicon.svg',
      altText: 'GitHub'
    }
  }
}
```

**With button:**
```typescript
{
  decoratedText: {
    topLabel: 'Alert',
    text: 'CPU at 95%',
    button: {
      text: 'View',
      onClick: { openLink: { url: 'https://monitoring.example.com' } }
    }
  }
}
```

**Clickable (whole widget):**
```typescript
{
  decoratedText: {
    text: 'View full report',
    wrapText: true,
    onClick: { openLink: { url: 'https://reports.example.com' } }
  }
}
```

**With wrap text:**
```typescript
{
  decoratedText: {
    topLabel: 'Description',
    text: 'This is a longer description that should wrap to multiple lines instead of being truncated',
    wrapText: true
  }
}
```

### buttonList

One or more action buttons. Buttons open URLs or trigger actions.

**Single button:**
```typescript
{
  buttonList: {
    buttons: [{
      text: 'Open Dashboard',
      onClick: { openLink: { url: 'https://dashboard.example.com' } }
    }]
  }
}
```

**Multiple buttons:**
```typescript
{
  buttonList: {
    buttons: [
      {
        text: 'Approve',
        onClick: { openLink: { url: 'https://app.example.com/approve/123' } },
        color: { red: 0, green: 0.5, blue: 0, alpha: 1 }
      },
      {
        text: 'Reject',
        onClick: { openLink: { url: 'https://app.example.com/reject/123' } }
      }
    ]
  }
}
```

**Button with icon:**
```typescript
{
  buttonList: {
    buttons: [{
      text: 'View on GitHub',
      icon: { knownIcon: 'BOOKMARK' },
      onClick: { openLink: { url: 'https://github.com/org/repo/pull/42' } }
    }]
  }
}
```

### image

Standalone image widget.

```typescript
{
  image: {
    imageUrl: 'https://example.com/chart.png',
    altText: 'Monthly usage chart'
  }
}
```

### divider

Horizontal line separator between widgets.

```typescript
{ divider: {} }
```

### Collapsible Sections

Sections can be collapsed with only the first N widgets visible:

```typescript
{
  header: 'Details',
  collapsible: true,
  uncollapsibleWidgetsCount: 2,  // Show first 2, collapse rest
  widgets: [
    { decoratedText: { topLabel: 'Status', text: 'Active' } },
    { decoratedText: { topLabel: 'Region', text: 'AU' } },
    // These start collapsed
    { decoratedText: { topLabel: 'Instance', text: 'prod-01' } },
    { decoratedText: { topLabel: 'Memory', text: '2.1 GB' } },
    { decoratedText: { topLabel: 'CPU', text: '45%' } }
  ]
}
```

## Known Icons

Icons available via `knownIcon` in decoratedText and button widgets.

```typescript
{ startIcon: { knownIcon: 'STAR' } }
// or
{ icon: { knownIcon: 'EMAIL' } }
```

| Icon Name | Use For |
|-----------|---------|
| `AIRPLANE` | Travel, flights |
| `BOOKMARK` | Save, reference, links |
| `BUS` | Transport, transit |
| `CAR` | Driving, transport |
| `CLOCK` | Time, duration, schedule |
| `CONFIRMATION_NUMBER_ICON` | Tickets, bookings |
| `DESCRIPTION` | Documents, files |
| `DOLLAR` | Money, pricing, cost |
| `EMAIL` | Email, messages |
| `INVITE` | Invitations |
| `MAP_PIN` | Location, address |
| `MEMBERSHIP` | Members, users |
| `MULTIPLE_PEOPLE` | Teams, groups |
| `OFFER` | Deals, promotions |
| `PERSON` | Individual user |
| `PHONE` | Phone number, calls |
| `SHOPPING_CART` | Commerce, purchases |
| `STAR` | Rating, favourite, important |
| `STORE` | Shop, retail |
| `TICKET` | Tickets, events |
| `VIDEO_CAMERA` | Video, meetings |

For icons not in the list, use `iconUrl` with any publicly accessible image (square, ideally 24x24 or 48x48 pixels).

## Threading

Thread messages together using `threadKey`:

```typescript
// First message — creates thread
const response = await sendCard(webhookUrl, card, {
  threadKey: 'deploy-2026-02-16'
});

// Reply to thread — append &messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD
const threadUrl = `${webhookUrl}&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD`;
await sendCard(threadUrl, replyCard, {
  threadKey: 'deploy-2026-02-16'
});
```

The `threadKey` is a client-assigned string. Use consistent keys for related messages (e.g., `deploy-{date}`, `alert-{id}`).

## Common Patterns

### Notification Card

```typescript
import { buildCard, sendCard } from './assets/card-builder';
import { sendWebhook } from './assets/webhook-sender';

const card = buildCard({
  cardId: 'deploy-notification',
  title: 'Deployment Complete',
  subtitle: 'production - v2.1.0',
  imageUrl: 'https://example.com/your-icon.png',
  sections: [{
    widgets: [
      { decoratedText: { topLabel: 'Environment', text: 'Production' } },
      { decoratedText: { topLabel: 'Version', text: 'v2.1.0' } },
      { decoratedText: { topLabel: 'Status', text: '*Healthy*', startIcon: { knownIcon: 'STAR' } } },
      { buttonList: { buttons: [{ text: 'View Deployment', onClick: { openLink: { url: 'https://dash.example.com' } } }] } }
    ]
  }]
});
```

### Digest Card (Weekly Summary)

```typescript
const digest = buildCard({
  cardId: 'weekly-digest',
  title: 'Weekly Summary',
  subtitle: `${count} updates this week`,
  sections: [
    {
      header: 'Highlights',
      widgets: items.map(item => ({
        decoratedText: { text: item.title, bottomLabel: item.date }
      }))
    },
    {
      widgets: [{
        buttonList: {
          buttons: [{ text: 'View All', onClick: { openLink: { url: dashboardUrl } } }]
        }
      }]
    }
  ]
});
```

## Error Prevention

| Mistake | Fix |
|---------|-----|
| `**bold**` in text | Use `*bold*` (single asterisks) |
| `[text](url)` links | Use `<url\|text>` format |
| Missing `cardsV2` wrapper | Wrap card in `{ cardsV2: [{ cardId, card }] }` |
| Thread replies not threading | Append `&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD` to webhook URL |
| Webhook returns 400 | Check JSON structure — common issue is missing `text` or `cardsV2` at top level |
| Card not showing | Ensure `sections` has at least one widget |

## Asset Files

| File | Purpose |
|------|---------|
| `assets/types.ts` | TypeScript type definitions for cardsV2 |
| `assets/card-builder.ts` | Utility to build card messages |
| `assets/webhook-sender.ts` | POST to webhook with error handling |
