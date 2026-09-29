# Archive

Skills retired from the plugins. Nothing here is loaded: plugins read only `plugins/<name>/skills/` and `plugins/<name>/commands/`.

## SKILLCUT, September 2026

A review of every skill against 2,144 recorded loads (24 Aug to 23 Sep 2026) found these seven with zero or near-zero use.

| Skill | Why | Now |
|---|---|---|
| `cloudflare-api` | The Cloudflare MCP covers bulk and fleet operations | Cloudflare MCP |
| `cloudflare-worker-builder` | Overlaps `vite-flare-starter` | `vite-flare-starter` |
| `d1-drizzle-schema` | Generic scaffolding a current model writes unaided | none needed |
| `db-seed` | Generic seed-script advice | none needed |
| `hono-api-scaffolder` | Generic scaffolding | none needed |
| `tanstack-start` | Not the stack in use | none needed |
| `d1-migration` | Its traps (table-recreation SQL, stuck migrations, parameter cap) were merged into a Worker gotchas skill | Worker gotchas skill |

To restore one: `git mv archive/plugins/cloudflare/skills/<name> plugins/cloudflare/skills/<name>` and the matching `commands/<name>.md`.
