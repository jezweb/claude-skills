# Cron Expressions Reference

Complete guide to cron expression syntax for Cloudflare Workers.

---

## Five-Field Format

Cloudflare uses the standard **5-field cron format**:

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of Week (0-6, Sunday=0)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of Month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

**IMPORTANT:** Cloudflare does **NOT** support 6-field format with seconds.

---

## Field Values

| Field | Values | Special Characters |
|-------|--------|-------------------|
| **Minute** | 0-59 | `*` `,` `-` `/` |
| **Hour** | 0-23 | `*` `,` `-` `/` |
| **Day of Month** | 1-31 | `*` `,` `-` `/` `?` |
| **Month** | 1-12 | `*` `,` `-` `/` |
| **Day of Week** | 0-6 (0=Sunday) | `*` `,` `-` `/` `?` |

---

## Special Characters

### `*` (Asterisk) - Every

Matches all values in the field.

```bash
* * * * *     # Every minute
0 * * * *     # Every hour (at minute 0)
0 0 * * *     # Every day (at midnight)
0 0 * * 0     # Every Sunday (at midnight)
```

---

### `,` (Comma) - List

Specifies multiple values.

```bash
0,30 * * * *        # Every hour at :00 and :30
0 6,12,18 * * *     # Three times daily (6am, noon, 6pm)
0 9 * * 1,3,5       # Monday, Wednesday, Friday at 9am
```

---

### `-` (Hyphen) - Range

Specifies a range of values.

```bash
0 9-17 * * *        # Every hour from 9am to 5pm
0 0 * * 1-5         # Every weekday at midnight
30 8-18 * * 1-5     # Weekdays, every hour from 8:30am to 6:30pm
```

---

### `/` (Slash) - Step

Specifies step intervals.

```bash
*/5 * * * *         # Every 5 minutes
*/15 * * * *        # Every 15 minutes
0 */2 * * *         # Every 2 hours
0 0 */2 * *         # Every 2 days at midnight
```

**Note:** Steps can be combined with ranges:

```bash
0-30/5 * * * *      # Every 5 minutes from :00 to :30 (:00, :05, :10, :15, :20, :25, :30)
0 9-17/2 * * *      # Every 2 hours from 9am to 5pm (9am, 11am, 1pm, 3pm, 5pm)
```

---

### `?` (Question Mark) - No Specific Value

**NOT SUPPORTED by Cloudflare.** Use `*` instead.

---

## Common Patterns

### Every N Minutes

```bash
* * * * *           # Every minute
*/2 * * * *         # Every 2 minutes
*/5 * * * *         # Every 5 minutes
*/10 * * * *        # Every 10 minutes
*/15 * * * *        # Every 15 minutes
*/30 * * * *        # Every 30 minutes
```

---

### Hourly Patterns

```bash
0 * * * *           # Every hour at :00
30 * * * *          # Every hour at :30
0,30 * * * *        # Twice per hour (:00 and :30)
0 */2 * * *         # Every 2 hours
0 */3 * * *         # Every 3 hours
0 */6 * * *         # Every 6 hours
0 */12 * * *        # Every 12 hours
```

---

### Daily Patterns

```bash
0 0 * * *           # Daily at midnight (00:00 UTC)
0 1 * * *           # Daily at 1am UTC
0 6 * * *           # Daily at 6am UTC
0 12 * * *          # Daily at noon (12:00 UTC)
30 14 * * *         # Daily at 2:30pm UTC
0 23 * * *          # Daily at 11pm UTC
```

---

### Multiple Times Per Day

```bash
0 6,18 * * *        # Twice daily (6am and 6pm)
0 0,6,12,18 * * *   # Four times daily (midnight, 6am, noon, 6pm)
0 */6 * * *         # Every 6 hours (midnight, 6am, noon, 6pm)
30 8,12,17 * * *    # Three times (8:30am, 12:30pm, 5:30pm)
```

---

### Weekly Patterns

```bash
0 0 * * 0           # Every Sunday at midnight
0 9 * * 1           # Every Monday at 9am
0 0 * * 1-5         # Every weekday at midnight
0 9 * * 1-5         # Every weekday at 9am
0 10 * * 0,6        # Every weekend day at 10am
0 0 * * 1,3,5       # Monday, Wednesday, Friday at midnight
```

**Day of Week Reference:**
- `0` = Sunday
- `1` = Monday
- `2` = Tuesday
- `3` = Wednesday
- `4` = Thursday
- `5` = Friday
- `6` = Saturday

---

### Monthly Patterns

```bash
0 0 1 * *           # First day of every month at midnight
0 0 15 * *          # 15th day of every month at midnight
0 0 1,15 * *        # 1st and 15th of every month
0 0 28-31 * *       # Last few days of every month
0 0 * */2 *         # Every 2 months (Jan, Mar, May, Jul, Sep, Nov)
```

---

### Quarterly Patterns

```bash
0 0 1 1,4,7,10 *    # First day of each quarter (Jan 1, Apr 1, Jul 1, Oct 1)
0 0 15 1,4,7,10 *   # 15th day of each quarter
```

---

### Specific Months

```bash
0 0 1 1 *           # Every January 1st at midnight (New Year's Day)
0 0 25 12 *         # Every December 25th at midnight (Christmas)
0 0 * 6-8 *         # Every day in June, July, August (summer)
0 0 1 * 1           # First Monday of every month
```

---

### Business Hours

```bash
0 9-17 * * 1-5      # Every hour during business hours (9am-5pm, weekdays)
*/30 9-17 * * 1-5   # Every 30 min during business hours
*/15 9-17 * * 1-5   # Every 15 min during business hours
0 9,17 * * 1-5      # Start and end of business hours
```

---

## Advanced Patterns

### Complex Combinations

```bash
# Every 15 minutes during business hours on weekdays
*/15 9-17 * * 1-5

# Every hour outside business hours (evenings and nights)
0 0-8,18-23 * * *

# Every 30 minutes on weekdays, hourly on weekends
*/30 * * * 1-5
0 * * * 0,6

# First Monday of every month at 9am
0 9 1-7 * 1

# Last Sunday of every month
0 0 25-31 * 0
```

---

### Testing Patterns

```bash
# For development/testing
* * * * *           # Every minute (expensive - use sparingly!)
*/2 * * * *         # Every 2 minutes
*/5 * * * *         # Every 5 minutes

# For staging
*/15 * * * *        # Every 15 minutes
*/30 * * * *        # Every 30 minutes

# For production
0 * * * *           # Every hour
0 */6 * * *         # Every 6 hours
```

---

## UTC Timezone Conversion

**CRITICAL:** All cron times are **UTC only**. You must convert your local time to UTC.

### Common Conversions (Standard Time)

| Local Time | Offset | UTC Time |
|------------|--------|----------|
| **9am PST** | UTC-8 | 5pm (17:00) UTC |
| **9am EST** | UTC-5 | 2pm (14:00) UTC |
| **9am CST** | UTC-6 | 3pm (15:00) UTC |
| **9am MST** | UTC-7 | 4pm (16:00) UTC |
| **9am GMT** | UTC+0 | 9am (09:00) UTC |
| **9am CET** | UTC+1 | 8am (08:00) UTC |
| **9am IST** | UTC+5:30 | 3:30am (03:30) UTC |
| **9am JST** | UTC+9 | Midnight (00:00) UTC |
| **9am AEST** | UTC+10 | 11pm previous day (23:00) UTC |

### DST (Daylight Saving Time)

Remember to adjust for daylight saving time:

- **PST → PDT**: UTC-8 → UTC-7
- **EST → EDT**: UTC-5 → UTC-4
- **CST → CDT**: UTC-6 → UTC-5
- **MST → MDT**: UTC-7 → UTC-6

**Example:**
- Want to run at 9am Pacific Time?
- Winter (PST): `0 17 * * *` (5pm UTC)
- Summer (PDT): `0 16 * * *` (4pm UTC)

**Recommendation:** Pick one and stick with it, or manually update when DST changes.

---

## Validation

### Online Validators

1. **Crontab Guru**: https://crontab.guru/
   - Visual cron expression tester
   - Shows next execution times
   - Explains expression in English

2. **Crontab.cronhub.io**: https://crontab.cronhub.io/
   - Similar to Crontab Guru
   - Additional features

### Testing Locally

```bash
# Start dev server with scheduled testing
npx wrangler dev --test-scheduled

# In another terminal, test your expression
curl "http://localhost:8787/__scheduled?cron=0+*+*+*+*"
```

---

## Common Mistakes

### ❌ Using 6 Fields (with seconds)

```bash
# ❌ Wrong: 6 fields not supported
0 * * * * *

# ✅ Correct: 5 fields only
* * * * *
```

---

### ❌ Wrong Day of Week Range

```bash
# ❌ Wrong: Day 7 doesn't exist
0 0 * * 7

# ✅ Correct: Use 0 for Sunday
0 0 * * 0
```

---

### ❌ Forgetting UTC

```bash
# ❌ Wrong: Assuming local timezone
"0 9 * * *"  # Might think this is 9am local time

# ✅ Correct: Convert to UTC
"0 17 * * *"  # 9am PST = 5pm UTC
```

---

### ❌ Invalid Minute Range

```bash
# ❌ Wrong: Minute can't be 60+
"65 * * * *"

# ✅ Correct: Minute is 0-59
"0 * * * *"
```

---

### ❌ Whitespace Sensitive

```bash
# ❌ Wrong: Extra spaces
"0  *  *  *  *"

# ✅ Correct: Single space between fields
"0 * * * *"
```

---

## Quick Reference Cheat Sheet

| When | Expression |
|------|------------|
| Every minute | `* * * * *` |
| Every 5 minutes | `*/5 * * * *` |
| Every 15 minutes | `*/15 * * * *` |
| Every 30 minutes | `*/30 * * * *` |
| Every hour | `0 * * * *` |
| Every 6 hours | `0 */6 * * *` |
| Daily at midnight | `0 0 * * *` |
| Daily at noon | `0 12 * * *` |
| Every weekday 9am | `0 9 * * 1-5` |
| Every Monday 9am | `0 9 * * 1` |
| First of month | `0 0 1 * *` |
| Twice daily | `0 6,18 * * *` |

---

## External Resources

- **Crontab Guru**: https://crontab.guru/ (Best validation tool)
- **Crontab Format**: https://en.wikipedia.org/wiki/Cron#CRON_expression
- **Time Zone Converter**: https://www.timeanddate.com/worldclock/converter.html
- **Cloudflare Docs**: https://developers.cloudflare.com/workers/configuration/cron-triggers/

---

**Last Updated**: 2025-10-23
