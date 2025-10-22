/**
 * Basic Durable Object Example: Counter
 *
 * Demonstrates:
 * - DurableObject class structure
 * - RPC methods (recommended pattern)
 * - Key-value storage API
 * - State persistence
 */

import { DurableObject, DurableObjectState } from 'cloudflare:workers';

interface Env {
  COUNTER: DurableObjectNamespace<Counter>;
}

export class Counter extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Optional: Initialize from storage
    // Use blockConcurrencyWhile to load before handling requests
    ctx.blockConcurrencyWhile(async () => {
      const value = await ctx.storage.get<number>('value');
      if (value === undefined) {
        // First time initialization
        await ctx.storage.put('value', 0);
      }
    });
  }

  // RPC method: increment counter
  async increment(): Promise<number> {
    let value = await this.ctx.storage.get<number>('value') || 0;
    value += 1;
    await this.ctx.storage.put('value', value);
    return value;
  }

  // RPC method: decrement counter
  async decrement(): Promise<number> {
    let value = await this.ctx.storage.get<number>('value') || 0;
    value -= 1;
    await this.ctx.storage.put('value', value);
    return value;
  }

  // RPC method: get current value
  async get(): Promise<number> {
    return await this.ctx.storage.get<number>('value') || 0;
  }

  // RPC method: reset counter
  async reset(): Promise<void> {
    await this.ctx.storage.put('value', 0);
  }
}

// CRITICAL: Export the class
export default Counter;

/**
 * Worker that uses the Counter DO
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Get DO stub (using named DO for global counter)
    const id = env.COUNTER.idFromName('global-counter');
    const stub = env.COUNTER.get(id);

    // Or use shortcut for named DOs:
    // const stub = env.COUNTER.getByName('global-counter');

    // Route requests
    if (url.pathname === '/increment' && request.method === 'POST') {
      const count = await stub.increment();
      return new Response(JSON.stringify({ count }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    if (url.pathname === '/decrement' && request.method === 'POST') {
      const count = await stub.decrement();
      return new Response(JSON.stringify({ count }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    if (url.pathname === '/reset' && request.method === 'POST') {
      await stub.reset();
      return new Response(JSON.stringify({ count: 0 }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    if (url.pathname === '/get' && request.method === 'GET') {
      const count = await stub.get();
      return new Response(JSON.stringify({ count }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
