/**
 * Alarms API Example: Batcher
 *
 * Demonstrates:
 * - storage.setAlarm() to schedule future tasks
 * - alarm() handler method
 * - Guaranteed at-least-once execution
 * - Retry behavior
 * - Idempotent alarm patterns
 */

import { DurableObject, DurableObjectState } from 'cloudflare:workers';

interface Env {
  BATCHER: DurableObjectNamespace<Batcher>;
  // Example: API to send batch to
  // API_ENDPOINT: string;
}

interface AlarmInfo {
  retryCount: number;
  isRetry: boolean;
}

export class Batcher extends DurableObject<Env> {
  buffer: string[];

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Restore buffer from storage
    ctx.blockConcurrencyWhile(async () => {
      this.buffer = await ctx.storage.get<string[]>('buffer') || [];
      console.log(`Batcher constructor: restored ${this.buffer.length} items`);
    });
  }

  /**
   * Add item to batch
   */
  async addItem(item: string): Promise<void> {
    this.buffer.push(item);
    await this.ctx.storage.put('buffer', this.buffer);

    // Schedule alarm for 10 seconds from now (if not already set)
    const currentAlarm = await this.ctx.storage.getAlarm();

    if (currentAlarm === null) {
      // No alarm set - schedule one
      await this.ctx.storage.setAlarm(Date.now() + 10000);
      console.log(`Alarm scheduled for ${new Date(Date.now() + 10000).toISOString()}`);
    } else {
      console.log(`Alarm already scheduled for ${new Date(currentAlarm).toISOString()}`);
    }
  }

  /**
   * Alarm handler - called when alarm fires
   *
   * CRITICAL:
   * - Guaranteed at-least-once execution
   * - Retried up to 6 times with exponential backoff (2s, 4s, 8s, ...)
   * - Implement idempotent operations
   */
  async alarm(alarmInfo: AlarmInfo): Promise<void> {
    console.log(`Alarm fired (retry: ${alarmInfo.isRetry}, count: ${alarmInfo.retryCount})`);

    // Reload buffer from storage (may have changed since constructor)
    this.buffer = await this.ctx.storage.get<string[]>('buffer') || [];

    if (this.buffer.length === 0) {
      console.log('No items to process');
      return;  // Alarm will be deleted automatically
    }

    // Limit retries
    if (alarmInfo.retryCount > 3) {
      console.error('Alarm failed after 3 retries, giving up');
      // Still clear buffer to avoid infinite retries
      this.buffer = [];
      await this.ctx.storage.put('buffer', []);
      return;
    }

    try {
      // Process batch (idempotent operation)
      await this.processBatch(this.buffer);

      // Clear buffer after successful processing
      this.buffer = [];
      await this.ctx.storage.put('buffer', []);

      console.log('Batch processed successfully');

      // Alarm is automatically deleted after successful execution

    } catch (error) {
      console.error('Batch processing failed:', error);
      // Throwing error will trigger retry
      throw error;
    }
  }

  /**
   * Process batch - idempotent operation
   */
  private async processBatch(items: string[]): Promise<void> {
    console.log(`Processing batch of ${items.length} items:`, items);

    // Example: Send to external API
    // const response = await fetch(this.env.API_ENDPOINT, {
    //   method: 'POST',
    //   headers: { 'content-type': 'application/json' },
    //   body: JSON.stringify({ items }),
    // });
    //
    // if (!response.ok) {
    //   throw new Error(`API error: ${response.status}`);
    // }

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Get current alarm time (if set)
   */
  async getAlarmTime(): Promise<number | null> {
    return await this.ctx.storage.getAlarm();
  }

  /**
   * Cancel alarm
   */
  async cancelAlarm(): Promise<void> {
    await this.ctx.storage.deleteAlarm();
    console.log('Alarm cancelled');
  }
}

// CRITICAL: Export the class
export default Batcher;

/**
 * Alternative pattern: Periodic cleanup with alarms
 */
export class PeriodicCleaner extends DurableObject {
  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);

    // Schedule alarm on first run
    ctx.blockConcurrencyWhile(async () => {
      const alarm = await ctx.storage.getAlarm();
      if (alarm === null) {
        // Schedule first cleanup in 1 hour
        await ctx.storage.setAlarm(Date.now() + 3600000);
      }
    });
  }

  /**
   * Periodic cleanup alarm
   */
  async alarm(): Promise<void> {
    console.log('Running periodic cleanup');

    try {
      // Cleanup expired data
      await this.cleanup();

      // Schedule next cleanup in 1 hour
      await this.ctx.storage.setAlarm(Date.now() + 3600000);

    } catch (error) {
      console.error('Cleanup failed:', error);
      throw error;  // Will retry
    }
  }

  private async cleanup(): Promise<void> {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // Get all keys
    const map = await this.ctx.storage.list();

    // Delete old entries
    const keysToDelete: string[] = [];

    for (const [key, value] of map.entries()) {
      if (typeof value === 'object' && value !== null && 'timestamp' in value) {
        if ((value as any).timestamp < oneDayAgo) {
          keysToDelete.push(key);
        }
      }
    }

    if (keysToDelete.length > 0) {
      await this.ctx.storage.delete(keysToDelete);
      console.log(`Deleted ${keysToDelete.length} old entries`);
    }
  }
}

/**
 * Alternative pattern: Reminder/notification with alarms
 */
export class ReminderDO extends DurableObject {
  async setReminder(message: string, fireAt: Date): Promise<void> {
    // Store reminder data
    await this.ctx.storage.put('reminder', { message, fireAt: fireAt.getTime() });

    // Schedule alarm
    await this.ctx.storage.setAlarm(fireAt);

    console.log(`Reminder set for ${fireAt.toISOString()}`);
  }

  async alarm(): Promise<void> {
    const reminder = await this.ctx.storage.get<{ message: string; fireAt: number }>('reminder');

    if (reminder) {
      console.log(`REMINDER: ${reminder.message}`);

      // Send notification (e.g., via email, webhook, etc.)
      // await this.sendNotification(reminder.message);

      // Clear reminder
      await this.ctx.storage.delete('reminder');
    }
  }
}
