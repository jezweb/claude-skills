---
description: Hit the Cloudflare REST API for bulk, fleet, and operations wrangler can't do
argument-hint: "[dns|hostname|email|cache|waf|redirect|settings|routes|analytics] [domain]"
---

Load the `cloudflare-api` skill.

Parse $ARGUMENTS for operation type and target domain:
- `dns example.com` — bulk DNS operations
- `hostname example.com` — custom hostname management
- `email example.com` — email routing rules
- `cache example.com` — cache purge
- `waf example.com` — WAF/firewall rules
- `redirect example.com` — redirect rules
- `settings` — zone settings (fleet-wide)
- `routes example.com` — Worker route management
- `analytics example.com` — GraphQL analytics query

If no type specified, ask what they need. If no domain, use the current project's domain from wrangler.jsonc.
