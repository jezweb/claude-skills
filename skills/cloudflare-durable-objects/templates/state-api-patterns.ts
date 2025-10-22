/**
 * State API Patterns Example
 *
 * Demonstrates:
 * - SQL API (SQLite backend)
 * - Key-Value API (available on both SQLite and KV backends)
 * - Transactions
 * - Combining SQL and KV storage
 */

import { DurableObject, DurableObjectState, SqlStorage } from 'cloudflare:workers';

interface Env {
  STORAGE_EXAMPLE: DurableObjectNamespace<StorageExample>;
}

export class StorageExample extends DurableObject<Env> {
  sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Access SQL storage
    this.sql = ctx.storage.sql;

    // Create tables on first run
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        message_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    `);
  }

  /**
   * SQL API Example: Insert with RETURNING
   */
  async createUser(email: string, username: string): Promise<number> {
    const cursor = this.sql.exec(
      'INSERT INTO users (email, username, created_at) VALUES (?, ?, ?) RETURNING user_id',
      email,
      username,
      Date.now()
    );

    const row = cursor.one<{ user_id: number }>();
    return row.user_id;
  }

  /**
   * SQL API Example: Query with parameters
   */
  async getUserByEmail(email: string): Promise<any | null> {
    const cursor = this.sql.exec(
      'SELECT * FROM users WHERE email = ?',
      email
    );

    return cursor.one({ allowNone: true });
  }

  /**
   * SQL API Example: Query multiple rows
   */
  async getRecentMessages(limit: number = 50): Promise<any[]> {
    const cursor = this.sql.exec(
      `SELECT m.*, u.username
       FROM messages m
       JOIN users u ON m.user_id = u.user_id
       ORDER BY m.created_at DESC
       LIMIT ?`,
      limit
    );

    return cursor.toArray();
  }

  /**
   * SQL API Example: Transaction (synchronous)
   */
  async createUserWithMessage(email: string, username: string, messageText: string): Promise<void> {
    this.ctx.storage.transactionSync(() => {
      // Insert user
      const userCursor = this.sql.exec(
        'INSERT INTO users (email, username, created_at) VALUES (?, ?, ?) RETURNING user_id',
        email,
        username,
        Date.now()
      );
      const { user_id } = userCursor.one<{ user_id: number }>();

      // Insert message
      this.sql.exec(
        'INSERT INTO messages (user_id, text, created_at) VALUES (?, ?, ?)',
        user_id,
        messageText,
        Date.now()
      );

      // All or nothing - if either fails, both are rolled back
    });
  }

  /**
   * SQL API Example: Iterate cursor
   */
  async getAllUsers(): Promise<string[]> {
    const cursor = this.sql.exec('SELECT username FROM users');

    const usernames: string[] = [];
    for (const row of cursor) {
      usernames.push(row.username as string);
    }

    return usernames;
  }

  /**
   * Key-Value API Example: Get/Put single value
   */
  async setConfig(key: string, value: any): Promise<void> {
    await this.ctx.storage.put(`config:${key}`, value);
  }

  async getConfig(key: string): Promise<any> {
    return await this.ctx.storage.get(`config:${key}`);
  }

  /**
   * Key-Value API Example: Get/Put multiple values
   */
  async setConfigs(configs: Record<string, any>): Promise<void> {
    const entries: Record<string, any> = {};

    for (const [key, value] of Object.entries(configs)) {
      entries[`config:${key}`] = value;
    }

    await this.ctx.storage.put(entries);
  }

  async getConfigs(): Promise<Record<string, any>> {
    const map = await this.ctx.storage.list({ prefix: 'config:' });

    const configs: Record<string, any> = {};
    for (const [key, value] of map.entries()) {
      const configKey = key.replace('config:', '');
      configs[configKey] = value;
    }

    return configs;
  }

  /**
   * Key-Value API Example: Delete
   */
  async deleteConfig(key: string): Promise<void> {
    await this.ctx.storage.delete(`config:${key}`);
  }

  /**
   * Key-Value API Example: List with pagination
   */
  async listKeys(prefix: string, limit: number = 100): Promise<string[]> {
    const map = await this.ctx.storage.list({ prefix, limit });
    return Array.from(map.keys());
  }

  /**
   * Key-Value API Example: Async transaction
   */
  async updateMultipleConfigs(updates: Record<string, any>): Promise<void> {
    await this.ctx.storage.transaction(async (txn) => {
      for (const [key, value] of Object.entries(updates)) {
        await txn.put(`config:${key}`, value);
      }
      // All or nothing
    });
  }

  /**
   * Combining SQL and KV: Mixed storage patterns
   */
  async recordUserActivity(userId: number, activity: string): Promise<void> {
    // Store structured data in SQL
    this.sql.exec(
      'UPDATE users SET last_activity = ? WHERE user_id = ?',
      Date.now(),
      userId
    );

    // Store ephemeral data in KV (faster access)
    await this.ctx.storage.put(`activity:${userId}`, {
      type: activity,
      timestamp: Date.now(),
    });
  }

  /**
   * Delete all storage (DO will cease to exist after shutdown)
   */
  async deleteAllStorage(): Promise<void> {
    // Delete alarm first (if set)
    await this.ctx.storage.deleteAlarm();

    // Delete all storage (atomic on SQLite backend)
    await this.ctx.storage.deleteAll();

    // After this, DO will not exist once it shuts down
  }
}

// CRITICAL: Export the class
export default StorageExample;
