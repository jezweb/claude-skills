# Common Scheduled Task Patterns

Real-world use cases and implementation patterns for Cloudflare Cron Triggers.

---

## Database Maintenance

### Pattern: Daily Cleanup

**Use case:** Delete old sessions, expired tokens, soft-deleted records

**Schedule:** Daily at 2am UTC
**Cron:** `0 2 * * *`

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);

    // Delete expired sessions
    const sessions = await env.DB
      .prepare('DELETE FROM sessions WHERE expires_at < ?')
      .bind(Date.now())
      .run();

    // Delete old logs
    const logs = await env.DB
      .prepare('DELETE FROM logs WHERE created_at < ?')
      .bind(thirtyDaysAgo)
      .run();

    // Delete soft-deleted users
    const users = await env.DB
      .prepare('DELETE FROM users WHERE deleted_at < ?')
      .bind(ninetyDaysAgo)
      .run();

    console.log(`Cleanup: ${sessions.meta.changes} sessions, ${logs.meta.changes} logs, ${users.meta.changes} users`);
  },
};
```

---

### Pattern: Database Optimization

**Use case:** Analyze tables, rebuild indexes, vacuum

**Schedule:** Weekly on Sunday at 3am UTC
**Cron:** `0 3 * * 0`

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    // Analyze tables for query optimization
    await env.DB.exec('ANALYZE');

    // Reindex important tables
    await env.DB.exec('REINDEX users_email_idx');
    await env.DB.exec('REINDEX orders_created_at_idx');

    // Vacuum to reclaim space (SQLite)
    await env.DB.exec('VACUUM');

    console.log('Database optimization completed');
  },
};
```

---

## Data Collection

### Pattern: API Polling

**Use case:** Fetch data from external APIs regularly

**Schedule:** Every 15 minutes
**Cron:** `*/15 * * * *`

```typescript
interface Env {
  DB: D1Database;
  API_KEY: string;
}

export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    try {
      // Fetch from external API
      const response = await fetch('https://api.example.com/v1/data', {
        headers: {
          'Authorization': `Bearer ${env.API_KEY}`,
          'User-Agent': 'MyWorker/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      // Store in D1
      const stmt = env.DB.prepare(
        'INSERT OR REPLACE INTO api_data (id, data, fetched_at) VALUES (?, ?, ?)'
      );

      const batch = data.items.map((item: any) =>
        stmt.bind(item.id, JSON.stringify(item), Date.now())
      );

      await env.DB.batch(batch);

      console.log(`Fetched and stored ${data.items.length} items`);
    } catch (error) {
      console.error('API polling failed:', error);
      throw error; // Mark execution as failed
    }
  },
};
```

---

### Pattern: Weather Data Collection

**Use case:** Collect weather data for multiple locations

**Schedule:** Every hour
**Cron:** `0 * * * *`

```typescript
const LOCATIONS = [
  { name: 'New York', lat: 40.7128, lon: -74.0060 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
];

export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    const results = await Promise.allSettled(
      LOCATIONS.map(async (location) => {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${env.WEATHER_API_KEY}`
        );
        const data = await response.json();

        await env.DB.prepare(
          'INSERT INTO weather (location, temperature, conditions, timestamp) VALUES (?, ?, ?, ?)'
        )
          .bind(location.name, data.main.temp, data.weather[0].main, Date.now())
          .run();

        return location.name;
      })
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    console.log(`Weather data collected for ${succeeded}/${LOCATIONS.length} locations`);
  },
};
```

---

## Report Generation

### Pattern: Daily Reports

**Use case:** Generate business reports with yesterday's data

**Schedule:** Daily at 8am UTC
**Cron:** `0 8 * * *`

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const report = await generateDailyReport(env.DB);

    // Store in R2
    const dateStr = new Date().toISOString().split('T')[0];
    await env.MY_BUCKET.put(
      `reports/daily/${dateStr}.json`,
      JSON.stringify(report, null, 2)
    );

    // Send to email or Slack
    ctx.waitUntil(sendReportEmail(report, env));

    console.log('Daily report generated');
  },
};

async function generateDailyReport(db: D1Database) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const startOfDay = yesterday.setHours(0, 0, 0, 0);
  const endOfDay = yesterday.setHours(23, 59, 59, 999);

  const [users, orders, revenue] = await Promise.all([
    db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE created_at BETWEEN ? AND ?
    `).bind(startOfDay, endOfDay).first(),

    db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE created_at BETWEEN ? AND ?
    `).bind(startOfDay, endOfDay).first(),

    db.prepare(`
      SELECT SUM(amount) as total FROM orders WHERE created_at BETWEEN ? AND ?
    `).bind(startOfDay, endOfDay).first(),
  ]);

  return {
    date: yesterday.toISOString().split('T')[0],
    new_users: users.count,
    orders: orders.count,
    revenue: revenue.total,
  };
}
```

---

### Pattern: Weekly Summary

**Use case:** Aggregate weekly statistics

**Schedule:** Every Monday at 9am UTC
**Cron:** `0 9 * * 1`

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const stats = await env.DB.prepare(`
      SELECT
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) as total_actions,
        AVG(duration) as avg_duration
      FROM user_actions
      WHERE timestamp >= ?
    `).bind(lastWeek.getTime()).first();

    // Store weekly summary
    await env.DB.prepare(
      'INSERT INTO weekly_summaries (week_start, active_users, total_actions, avg_duration) VALUES (?, ?, ?, ?)'
    )
      .bind(lastWeek.toISOString(), stats.active_users, stats.total_actions, stats.avg_duration)
      .run();

    console.log('Weekly summary generated');
  },
};
```

---

## Cache Management

### Pattern: Cache Warming

**Use case:** Pre-warm cache with popular content

**Schedule:** Every hour
**Cron:** `0 * * * *`

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    // Get top 100 popular pages
    const pages = await env.DB
      .prepare('SELECT url FROM pages ORDER BY views DESC LIMIT 100')
      .all();

    // Fetch each page to warm cache
    const requests = pages.results.map((page) =>
      fetch(`https://example.com${page.url}`, {
        cf: {
          cacheTtl: 3600,
          cacheEverything: true,
        },
      })
    );

    await Promise.allSettled(requests);

    console.log(`Cache warmed for ${pages.results.length} pages`);
  },
};
```

---

### Pattern: Cache Invalidation

**Use case:** Clear stale cache entries

**Schedule:** Every 6 hours
**Cron:** `0 */6 * * *`

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    // Get list of stale cache keys
    const staleKeys = await env.KV_NAMESPACE.list({ prefix: 'cache:' });

    let deletedCount = 0;

    for (const key of staleKeys.keys) {
      const metadata = key.metadata as any;

      // Check if cache is stale
      if (metadata && metadata.expires_at < Date.now()) {
        await env.KV_NAMESPACE.delete(key.name);
        deletedCount++;
      }
    }

    console.log(`Invalidated ${deletedCount} stale cache entries`);
  },
};
```

---

## Monitoring & Health Checks

### Pattern: System Health Check

**Use case:** Check health of services and send alerts if issues

**Schedule:** Every 5 minutes
**Cron:** `*/5 * * * *`

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    const checks = await Promise.allSettled([
      checkDatabase(env.DB),
      checkAPI(env.API_KEY),
      checkStorage(env.MY_BUCKET),
      checkKV(env.KV_NAMESPACE),
    ]);

    const failures = checks.filter((check) => check.status === 'rejected');

    if (failures.length > 0) {
      await sendAlert({
        type: 'health_check_failed',
        failures: failures.map((f) => ({
          reason: f.status === 'rejected' ? f.reason : 'Unknown',
        })),
        timestamp: new Date().toISOString(),
      });
    }

    // Update last check time
    await env.KV_NAMESPACE.put('last_health_check', Date.now().toString());
  },
};

async function checkDatabase(db: D1Database): Promise<void> {
  const result = await db.prepare('SELECT 1 as health').first();
  if (!result || result.health !== 1) {
    throw new Error('Database health check failed');
  }
}

async function checkAPI(apiKey: string): Promise<void> {
  const response = await fetch('https://api.example.com/health', {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    throw new Error(`API health check failed: ${response.status}`);
  }
}
```

---

### Pattern: Uptime Monitoring

**Use case:** Monitor external services uptime

**Schedule:** Every minute
**Cron:** `* * * * *`

```typescript
const SERVICES = [
  { name: 'Main API', url: 'https://api.example.com/health' },
  { name: 'Website', url: 'https://example.com' },
  { name: 'CDN', url: 'https://cdn.example.com/health' },
];

export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    const results = await Promise.allSettled(
      SERVICES.map(async (service) => {
        const start = Date.now();
        const response = await fetch(service.url, { method: 'HEAD' });
        const duration = Date.now() - start;

        await env.DB.prepare(
          'INSERT INTO uptime_checks (service, status, duration, timestamp) VALUES (?, ?, ?, ?)'
        )
          .bind(service.name, response.status, duration, Date.now())
          .run();

        if (!response.ok) {
          throw new Error(`${service.name} returned ${response.status}`);
        }

        return { service: service.name, duration };
      })
    );

    // Alert on any failures
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      await sendAlert({
        type: 'service_down',
        services: failures.map((f) => f.reason),
      });
    }
  },
};
```

---

## Notifications

### Pattern: Scheduled Reminders

**Use case:** Send daily reminders to users

**Schedule:** Daily at 10am UTC
**Cron:** `0 10 * * *`

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    // Get users who need reminders
    const users = await env.DB.prepare(`
      SELECT email, name FROM users
      WHERE reminder_enabled = 1
      AND last_reminder < ?
    `).bind(Date.now() - (24 * 60 * 60 * 1000)).all();

    // Send reminders in batches
    for (const user of users.results) {
      await env.MY_QUEUE.send({
        type: 'send_reminder',
        email: user.email,
        name: user.name,
      });
    }

    console.log(`Queued ${users.results.length} reminders`);
  },
};
```

---

### Pattern: Digest Emails

**Use case:** Send weekly digest of activity

**Schedule:** Every Friday at 9am UTC
**Cron:** `0 9 * * 5`

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    // Get users who want weekly digests
    const users = await env.DB.prepare(
      'SELECT id, email FROM users WHERE weekly_digest = 1'
    ).all();

    for (const user of users.results) {
      // Generate personalized digest
      const activities = await env.DB.prepare(`
        SELECT * FROM activities
        WHERE user_id = ?
        AND timestamp >= ?
        ORDER BY timestamp DESC
      `).bind(user.id, Date.now() - (7 * 24 * 60 * 60 * 1000)).all();

      // Queue email
      await env.MY_QUEUE.send({
        type: 'weekly_digest',
        email: user.email,
        activities: activities.results,
      });
    }

    console.log(`Queued ${users.results.length} digest emails`);
  },
};
```

---

## Workflow Triggers

### Pattern: Scheduled Workflow Execution

**Use case:** Trigger complex, multi-step workflows on schedule

**Schedule:** Daily at 2am UTC
**Cron:** `0 2 * * *`

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    // Trigger workflow that can run for hours
    const instance = await env.DAILY_WORKFLOW.create({
      params: {
        date: new Date().toISOString().split('T')[0],
        tasks: ['generate_reports', 'send_emails', 'cleanup_data'],
      },
    });

    console.log(`Workflow started: ${instance.id}`);
  },
};
```

---

## Backup & Archival

### Pattern: Daily Backups

**Use case:** Export database to R2 for backup

**Schedule:** Daily at 3am UTC
**Cron:** `0 3 * * *`

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    // Export all critical tables
    const tables = ['users', 'orders', 'products'];

    for (const table of tables) {
      const data = await env.DB.prepare(`SELECT * FROM ${table}`).all();

      const dateStr = new Date().toISOString().split('T')[0];
      await env.MY_BUCKET.put(
        `backups/${dateStr}/${table}.json`,
        JSON.stringify(data.results, null, 2)
      );
    }

    console.log(`Backed up ${tables.length} tables to R2`);
  },
};
```

---

### Pattern: Archive Old Data

**Use case:** Move old records to archive storage

**Schedule:** Weekly on Sunday at 4am UTC
**Cron:** `0 4 * * 0`

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);

    // Get old orders
    const oldOrders = await env.DB.prepare(
      'SELECT * FROM orders WHERE created_at < ?'
    ).bind(sixMonthsAgo).all();

    if (oldOrders.results.length > 0) {
      // Archive to R2
      const dateStr = new Date().toISOString().split('T')[0];
      await env.MY_BUCKET.put(
        `archives/orders/${dateStr}.json`,
        JSON.stringify(oldOrders.results, null, 2)
      );

      // Delete from database
      await env.DB.prepare('DELETE FROM orders WHERE created_at < ?')
        .bind(sixMonthsAgo)
        .run();

      console.log(`Archived ${oldOrders.results.length} old orders`);
    }
  },
};
```

---

## Rate Limit Reset

### Pattern: Daily Rate Limit Reset

**Use case:** Reset API rate limits daily

**Schedule:** Daily at midnight UTC
**Cron:** `0 0 * * *`

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    // Reset daily API quotas
    await env.DB.exec('UPDATE users SET daily_api_calls = 0');

    // Clear rate limit cache
    const keys = await env.KV_NAMESPACE.list({ prefix: 'ratelimit:' });

    for (const key of keys.keys) {
      await env.KV_NAMESPACE.delete(key.name);
    }

    console.log('Rate limits reset');
  },
};
```

---

## External Resources

- **Cloudflare Cron Triggers**: https://developers.cloudflare.com/workers/configuration/cron-triggers/
- **Cron Expression Validator**: https://crontab.guru/
- **Time Zone Converter**: https://www.timeanddate.com/worldclock/converter.html

---

**Last Updated**: 2025-10-23
