/**
 * Multi-DO Coordination Example
 *
 * Demonstrates:
 * - Multiple DO instances working together
 * - Inter-DO communication via RPC
 * - Coordinator pattern
 * - Hierarchical DO structures
 */

import { DurableObject, DurableObjectState } from 'cloudflare:workers';

interface Env {
  GAME_COORDINATOR: DurableObjectNamespace<GameCoordinator>;
  GAME_ROOM: DurableObjectNamespace<GameRoom>;
  PLAYER: DurableObjectNamespace<Player>;
}

/**
 * Coordinator DO: Manages multiple game rooms
 */
export class GameCoordinator extends DurableObject<Env> {
  async createGame(gameId: string): Promise<void> {
    // Get game room DO (creates if doesn't exist)
    const gameRoom = this.env.GAME_ROOM.getByName(gameId);

    // Initialize game room
    await gameRoom.initialize();

    // Track in coordinator
    await this.ctx.storage.put(`game:${gameId}`, {
      id: gameId,
      created: Date.now(),
      status: 'waiting',
    });

    console.log(`Game created: ${gameId}`);
  }

  async listGames(): Promise<any[]> {
    const games = await this.ctx.storage.list({ prefix: 'game:' });

    return Array.from(games.values());
  }

  async deleteGame(gameId: string): Promise<void> {
    // Get game room DO
    const gameRoom = this.env.GAME_ROOM.getByName(gameId);

    // Tell game room to clean up
    await gameRoom.cleanup();

    // Remove from coordinator
    await this.ctx.storage.delete(`game:${gameId}`);

    console.log(`Game deleted: ${gameId}`);
  }

  async getGameStatus(gameId: string): Promise<any> {
    const gameRoom = this.env.GAME_ROOM.getByName(gameId);
    return await gameRoom.getStatus();
  }
}

/**
 * Game Room DO: Manages players in a single game
 */
export class GameRoom extends DurableObject<Env> {
  async initialize(): Promise<void> {
    await this.ctx.storage.put('state', {
      players: [],
      started: false,
      created: Date.now(),
    });
  }

  async addPlayer(playerId: string, playerName: string): Promise<void> {
    const state = await this.ctx.storage.get<any>('state');

    if (!state) {
      await this.initialize();
      return this.addPlayer(playerId, playerName);
    }

    // Check if player already in game
    if (state.players.some((p: any) => p.id === playerId)) {
      throw new Error('Player already in game');
    }

    // Add player
    state.players.push({ id: playerId, name: playerName, joined: Date.now() });
    await this.ctx.storage.put('state', state);

    // Notify player DO
    const playerDO = this.env.PLAYER.getByName(playerId);
    await playerDO.joinedGame(this.ctx.id.toString());

    console.log(`Player ${playerName} joined game`);
  }

  async removePlayer(playerId: string): Promise<void> {
    const state = await this.ctx.storage.get<any>('state');

    if (!state) {
      return;
    }

    // Remove player
    state.players = state.players.filter((p: any) => p.id !== playerId);
    await this.ctx.storage.put('state', state);

    // Notify player DO
    const playerDO = this.env.PLAYER.getByName(playerId);
    await playerDO.leftGame(this.ctx.id.toString());

    console.log(`Player ${playerId} left game`);
  }

  async startGame(): Promise<void> {
    const state = await this.ctx.storage.get<any>('state');

    if (!state) {
      throw new Error('Game not initialized');
    }

    if (state.players.length < 2) {
      throw new Error('Not enough players');
    }

    state.started = true;
    state.startedAt = Date.now();
    await this.ctx.storage.put('state', state);

    // Notify all players
    for (const player of state.players) {
      const playerDO = this.env.PLAYER.getByName(player.id);
      await playerDO.gameStarted(this.ctx.id.toString());
    }

    console.log('Game started');
  }

  async getStatus(): Promise<any> {
    const state = await this.ctx.storage.get<any>('state');
    return state || { players: [], started: false };
  }

  async cleanup(): Promise<void> {
    const state = await this.ctx.storage.get<any>('state');

    if (state) {
      // Notify all players
      for (const player of state.players) {
        const playerDO = this.env.PLAYER.getByName(player.id);
        await playerDO.gameEnded(this.ctx.id.toString());
      }
    }

    // Delete all storage
    await this.ctx.storage.deleteAll();

    console.log('Game room cleaned up');
  }
}

/**
 * Player DO: Manages individual player state
 */
export class Player extends DurableObject<Env> {
  async joinedGame(gameId: string): Promise<void> {
    // Track which game player is in
    await this.ctx.storage.put('currentGame', gameId);

    console.log(`Player tracking: joined game ${gameId}`);
  }

  async leftGame(gameId: string): Promise<void> {
    const currentGame = await this.ctx.storage.get<string>('currentGame');

    if (currentGame === gameId) {
      await this.ctx.storage.delete('currentGame');
    }

    console.log(`Player tracking: left game ${gameId}`);
  }

  async gameStarted(gameId: string): Promise<void> {
    console.log(`Player notified: game ${gameId} started`);

    // Update player stats
    const stats = await this.ctx.storage.get<any>('stats') || { gamesPlayed: 0 };
    stats.gamesPlayed += 1;
    await this.ctx.storage.put('stats', stats);
  }

  async gameEnded(gameId: string): Promise<void> {
    console.log(`Player notified: game ${gameId} ended`);

    const currentGame = await this.ctx.storage.get<string>('currentGame');

    if (currentGame === gameId) {
      await this.ctx.storage.delete('currentGame');
    }
  }

  async getStats(): Promise<any> {
    return await this.ctx.storage.get('stats') || { gamesPlayed: 0 };
  }

  async getCurrentGame(): Promise<string | null> {
    return await this.ctx.storage.get<string>('currentGame') || null;
  }
}

// CRITICAL: Export classes
export { GameCoordinator, GameRoom, Player };
export default GameCoordinator;

/**
 * Worker that orchestrates multiple DOs
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Global coordinator (singleton)
    const coordinator = env.GAME_COORDINATOR.getByName('global');

    if (url.pathname === '/games/create' && request.method === 'POST') {
      const { gameId } = await request.json<{ gameId: string }>();

      await coordinator.createGame(gameId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    if (url.pathname === '/games/list' && request.method === 'GET') {
      const games = await coordinator.listGames();

      return new Response(JSON.stringify({ games }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    if (url.pathname.startsWith('/games/') && url.pathname.endsWith('/join')) {
      const gameId = url.pathname.split('/')[2];
      const { playerId, playerName } = await request.json<{ playerId: string; playerName: string }>();

      const gameRoom = env.GAME_ROOM.getByName(gameId);
      await gameRoom.addPlayer(playerId, playerName);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    if (url.pathname.startsWith('/games/') && url.pathname.endsWith('/start')) {
      const gameId = url.pathname.split('/')[2];

      const gameRoom = env.GAME_ROOM.getByName(gameId);
      await gameRoom.startGame();

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    if (url.pathname.startsWith('/players/') && url.pathname.endsWith('/stats')) {
      const playerId = url.pathname.split('/')[2];

      const player = env.PLAYER.getByName(playerId);
      const stats = await player.getStats();

      return new Response(JSON.stringify({ stats }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
