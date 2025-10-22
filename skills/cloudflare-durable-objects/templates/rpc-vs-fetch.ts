/**
 * RPC vs HTTP Fetch Patterns
 *
 * Demonstrates:
 * - RPC methods (recommended for compat_date >= 2024-04-03)
 * - HTTP fetch handler (for HTTP flows or legacy compatibility)
 * - When to use each pattern
 */

import { DurableObject, DurableObjectState } from 'cloudflare:workers';

interface Env {
  RPC_EXAMPLE: DurableObjectNamespace<RpcExample>;
  FETCH_EXAMPLE: DurableObjectNamespace<FetchExample>;
}

/**
 * Pattern 1: RPC Methods (Recommended)
 *
 * ✅ Use when:
 * - New project (compat_date >= 2024-04-03)
 * - Type safety is important
 * - Simple method calls (not HTTP-specific logic)
 * - Auto-serialization of structured data
 */
export class RpcExample extends DurableObject<Env> {
  count: number = 0;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    ctx.blockConcurrencyWhile(async () => {
      this.count = await ctx.storage.get<number>('count') || 0;
    });
  }

  // Public RPC methods (automatically exposed)
  async increment(): Promise<number> {
    this.count += 1;
    await this.ctx.storage.put('count', this.count);
    return this.count;
  }

  async decrement(): Promise<number> {
    this.count -= 1;
    await this.ctx.storage.put('count', this.count);
    return this.count;
  }

  async get(): Promise<number> {
    return this.count;
  }

  async reset(): Promise<void> {
    this.count = 0;
    await this.ctx.storage.put('count', 0);
  }

  // Complex return types work seamlessly
  async getStats(): Promise<{ count: number; timestamp: number }> {
    return {
      count: this.count,
      timestamp: Date.now(),
    };
  }

  // Methods can accept complex parameters
  async addMultiple(numbers: number[]): Promise<number> {
    const sum = numbers.reduce((acc, n) => acc + n, 0);
    this.count += sum;
    await this.ctx.storage.put('count', this.count);
    return this.count;
  }
}

/**
 * Worker using RPC pattern
 */
const rpcWorker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Get stub
    const stub = env.RPC_EXAMPLE.getByName('my-counter');

    // Call RPC methods directly (type-safe)
    const count = await stub.increment();
    const stats = await stub.getStats();

    return new Response(JSON.stringify({ count, stats }), {
      headers: { 'content-type': 'application/json' },
    });
  },
};

/**
 * Pattern 2: HTTP Fetch Handler (Legacy / HTTP-specific flows)
 *
 * ✅ Use when:
 * - Need HTTP request/response pattern
 * - Complex routing logic
 * - WebSocket upgrade (requires fetch)
 * - Legacy compatibility (pre-2024-04-03)
 */
export class FetchExample extends DurableObject<Env> {
  count: number = 0;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    ctx.blockConcurrencyWhile(async () => {
      this.count = await ctx.storage.get<number>('count') || 0;
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Route based on path
    if (url.pathname === '/increment' && request.method === 'POST') {
      this.count += 1;
      await this.ctx.storage.put('count', this.count);

      return new Response(JSON.stringify({ count: this.count }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    if (url.pathname === '/decrement' && request.method === 'POST') {
      this.count -= 1;
      await this.ctx.storage.put('count', this.count);

      return new Response(JSON.stringify({ count: this.count }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    if (url.pathname === '/get' && request.method === 'GET') {
      return new Response(JSON.stringify({ count: this.count }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    if (url.pathname === '/reset' && request.method === 'POST') {
      this.count = 0;
      await this.ctx.storage.put('count', 0);

      return new Response(JSON.stringify({ count: 0 }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    // Complex HTTP logic (headers, cookies, etc.)
    if (url.pathname === '/stats' && request.method === 'GET') {
      const authHeader = request.headers.get('Authorization');

      if (!authHeader) {
        return new Response('Unauthorized', { status: 401 });
      }

      return new Response(JSON.stringify({
        count: this.count,
        timestamp: Date.now(),
      }), {
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-cache',
        },
      });
    }

    return new Response('Not found', { status: 404 });
  }
}

/**
 * Worker using HTTP fetch pattern
 */
const fetchWorker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Get stub
    const stub = env.FETCH_EXAMPLE.getByName('my-counter');

    // Call fetch method (HTTP-style)
    const response = await stub.fetch('https://fake-host/increment', {
      method: 'POST',
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { 'content-type': 'application/json' },
    });
  },
};

/**
 * Pattern 3: Hybrid (RPC + Fetch)
 *
 * Use both patterns in the same DO:
 * - RPC for simple method calls
 * - fetch() for WebSocket upgrades or HTTP-specific logic
 */
export class HybridExample extends DurableObject<Env> {
  // RPC method
  async getStatus(): Promise<{ active: boolean; connections: number }> {
    return {
      active: true,
      connections: this.ctx.getWebSockets().length,
    };
  }

  // HTTP fetch for WebSocket upgrade
  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');

    if (upgradeHeader === 'websocket') {
      // WebSocket upgrade logic
      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);

      this.ctx.acceptWebSocket(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    return new Response('Not found', { status: 404 });
  }
}

// CRITICAL: Export classes
export default RpcExample;
