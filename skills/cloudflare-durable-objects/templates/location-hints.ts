/**
 * Location Hints and Geographic Routing
 *
 * Demonstrates:
 * - Location hints for geographic routing
 * - Jurisdiction restrictions (EU, FedRAMP)
 * - When to use each approach
 * - Limitations and best practices
 */

import { DurableObject, DurableObjectState } from 'cloudflare:workers';

interface Env {
  USER_DATA: DurableObjectNamespace<UserDataDO>;
}

export class UserDataDO extends DurableObject<Env> {
  async storeUserData(data: any): Promise<void> {
    await this.ctx.storage.put('userData', data);
  }

  async getUserData(): Promise<any> {
    return await this.ctx.storage.get('userData');
  }
}

// CRITICAL: Export the class
export default UserDataDO;

/**
 * Worker demonstrating location hints and jurisdiction
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response('Missing userId', { status: 400 });
    }

    // Pattern 1: Location Hints (Best-Effort)
    // Use when you want to create DO near user's location for lower latency

    // Get user's location from request
    const userRegion = request.cf?.continent as string || 'NA';

    // Map continent to location hint
    const locationHint = getLocationHint(userRegion);

    // Create DO with location hint
    const id = env.USER_DATA.idFromName(userId);
    const stub = env.USER_DATA.get(id, { locationHint });

    // ⚠️ Location hint only affects FIRST creation
    // Subsequent access uses existing DO location

    await stub.storeUserData({ userId, region: userRegion });

    return new Response(JSON.stringify({ success: true, locationHint }), {
      headers: { 'content-type': 'application/json' },
    });
  },
};

/**
 * Map user region to Cloudflare location hint
 */
function getLocationHint(continent: string): string {
  switch (continent) {
    case 'NA':
      return 'enam';  // Eastern North America
    case 'EU':
      return 'weur';  // Western Europe
    case 'AS':
      return 'apac';  // Asia-Pacific
    case 'SA':
      return 'sam';   // South America
    case 'AF':
      return 'afr';   // Africa
    case 'OC':
      return 'oc';    // Oceania
    default:
      return 'enam';  // Default
  }
}

/**
 * Available location hints:
 *
 * - 'wnam' - Western North America
 * - 'enam' - Eastern North America
 * - 'sam'  - South America
 * - 'weur' - Western Europe
 * - 'eeur' - Eastern Europe
 * - 'apac' - Asia-Pacific
 * - 'oc'   - Oceania
 * - 'afr'  - Africa
 * - 'me'   - Middle East
 */

/**
 * Pattern 2: Jurisdiction Restriction (Strictly Enforced)
 * Use for regulatory compliance (GDPR, FedRAMP)
 */
export const jurisdictionWorker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const requireEU = url.searchParams.get('requireEU') === 'true';

    if (!userId) {
      return new Response('Missing userId', { status: 400 });
    }

    if (requireEU) {
      // STRICT: DO MUST stay in EU
      // Cannot combine jurisdiction with location hints
      const euId = env.USER_DATA.newUniqueId({ jurisdiction: 'eu' });
      const stub = env.USER_DATA.get(euId);

      // Store ID for future access
      // await env.KV.put(`user:${userId}`, euId.toString());

      await stub.storeUserData({ userId, jurisdiction: 'eu' });

      return new Response(JSON.stringify({
        success: true,
        jurisdiction: 'eu',
        id: euId.toString(),
      }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    // Non-EU user: use location hint
    const id = env.USER_DATA.idFromName(userId);
    const stub = env.USER_DATA.get(id, { locationHint: 'enam' });

    await stub.storeUserData({ userId });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'content-type': 'application/json' },
    });
  },
};

/**
 * Available jurisdictions:
 *
 * - 'eu' - European Union (GDPR compliance)
 * - 'fedramp' - FedRAMP (US government)
 */

/**
 * Location Hints vs Jurisdiction: Decision Matrix
 *
 * | Requirement | Use |
 * |-------------|-----|
 * | Lower latency (nice-to-have) | Location hints |
 * | Data residency (MUST) | Jurisdiction |
 * | Regulatory compliance (GDPR, FedRAMP) | Jurisdiction |
 * | Optimize for user location | Location hints |
 * | Strict data sovereignty | Jurisdiction |
 * | Performance optimization | Location hints |
 */

/**
 * CRITICAL Limitations:
 *
 * ❌ Location hints are BEST-EFFORT (not guaranteed)
 * ❌ Location hints only affect FIRST creation
 * ❌ Cannot move existing DOs to new location
 * ❌ Cannot combine jurisdiction with location hints
 *
 * ✅ Jurisdiction is STRICTLY ENFORCED
 * ✅ Jurisdiction guarantees data never leaves region
 */

/**
 * Example: Multi-region routing based on user IP
 */
export const multiRegionWorker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const userId = new URL(request.url).searchParams.get('userId');

    if (!userId) {
      return new Response('Missing userId', { status: 400 });
    }

    // Get user's country from request
    const country = request.cf?.country as string;

    // Determine if user is in EU
    const euCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PL', 'PT', 'GR', /* ... */];
    const isEU = euCountries.includes(country);

    if (isEU) {
      // EU user: MUST use jurisdiction
      const euId = env.USER_DATA.newUniqueId({ jurisdiction: 'eu' });
      const stub = env.USER_DATA.get(euId);

      // Store ID for future access
      // await env.DB.prepare('INSERT INTO user_do_ids (user_id, do_id) VALUES (?, ?)')
      //   .bind(userId, euId.toString())
      //   .run();

      await stub.storeUserData({ userId, jurisdiction: 'eu' });

      return new Response(JSON.stringify({ region: 'EU', id: euId.toString() }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    // Non-EU user: use location hint for optimization
    const locationHint = getLocationHintFromCountry(country);
    const id = env.USER_DATA.idFromName(userId);
    const stub = env.USER_DATA.get(id, { locationHint });

    await stub.storeUserData({ userId });

    return new Response(JSON.stringify({ region: locationHint }), {
      headers: { 'content-type': 'application/json' },
    });
  },
};

function getLocationHintFromCountry(country: string): string {
  // Simplified mapping - expand as needed
  if (['US', 'CA', 'MX'].includes(country)) return 'enam';
  if (['GB', 'FR', 'DE', 'ES', 'IT'].includes(country)) return 'weur';
  if (['CN', 'JP', 'KR', 'SG', 'IN'].includes(country)) return 'apac';
  if (['BR', 'AR', 'CL'].includes(country)) return 'sam';
  if (['AU', 'NZ'].includes(country)) return 'oc';
  if (['ZA', 'EG', 'KE'].includes(country)) return 'afr';

  return 'enam';  // Default
}
