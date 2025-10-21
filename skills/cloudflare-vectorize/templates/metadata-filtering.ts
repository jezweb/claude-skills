/**
 * Advanced Metadata Filtering Examples for Cloudflare Vectorize
 *
 * Use case: Multi-tenant apps, complex filtering, range queries, nested metadata
 *
 * Features:
 * - All filter operators ($eq, $ne, $in, $nin, $lt, $lte, $gt, $gte)
 * - Nested metadata with dot notation
 * - Namespace-based isolation
 * - Combined filters (implicit AND)
 * - Range queries on numbers and strings
 * - Performance optimization tips
 */

export interface Env {
	VECTORIZE_INDEX: VectorizeIndex;
	AI: Ai;
}

interface FilterExample {
	name: string;
	description: string;
	filter: Record<string, any>;
	namespace?: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// Handle CORS
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type',
				},
			});
		}

		const url = new URL(request.url);

		// Route: GET /examples - Show all filter examples
		if (url.pathname === '/examples' && request.method === 'GET') {
			const examples: FilterExample[] = [
				{
					name: 'Equality (implicit)',
					description: 'Find vectors with exact category match',
					filter: { category: 'documentation' },
				},
				{
					name: 'Equality (explicit)',
					description: 'Explicit $eq operator',
					filter: { category: { $eq: 'documentation' } },
				},
				{
					name: 'Not Equals',
					description: 'Exclude archived documents',
					filter: { status: { $ne: 'archived' } },
				},
				{
					name: 'In Array',
					description: 'Match any of multiple categories',
					filter: { category: { $in: ['docs', 'tutorials', 'guides'] } },
				},
				{
					name: 'Not In Array',
					description: 'Exclude multiple statuses',
					filter: { status: { $nin: ['archived', 'draft', 'deleted'] } },
				},
				{
					name: 'Greater Than',
					description: 'Documents published after date',
					filter: { published_at: { $gt: 1704067200 } }, // Jan 1, 2024
				},
				{
					name: 'Less Than or Equal',
					description: 'Documents published before or on date',
					filter: { published_at: { $lte: 1735689600 } }, // Jan 1, 2025
				},
				{
					name: 'Range Query (numbers)',
					description: 'Documents published in 2024',
					filter: {
						published_at: {
							$gte: 1704067200, // >= Jan 1, 2024
							$lt: 1735689600, // < Jan 1, 2025
						},
					},
				},
				{
					name: 'Range Query (strings - prefix search)',
					description: 'URLs starting with /docs/workers/',
					filter: {
						url: {
							$gte: '/docs/workers/',
							$lt: '/docs/workersz', // 'z' is after all possible chars
						},
					},
				},
				{
					name: 'Nested Metadata',
					description: 'Filter by nested author ID',
					filter: { 'author.id': 'user123' },
				},
				{
					name: 'Combined Filters (AND)',
					description: 'Multiple conditions (implicit AND)',
					filter: {
						category: 'docs',
						language: 'en',
						published: true,
						published_at: { $gte: 1704067200 },
					},
				},
				{
					name: 'Multi-tenant (namespace)',
					description: 'Isolate by customer ID using namespace',
					namespace: 'customer-abc123',
					filter: { type: 'support_ticket' },
				},
				{
					name: 'Boolean Filter',
					description: 'Published documents only',
					filter: { published: true },
				},
				{
					name: 'Complex Multi-field',
					description: 'Docs in English, published in 2024, not archived',
					filter: {
						category: { $in: ['docs', 'tutorials'] },
						language: 'en',
						status: { $ne: 'archived' },
						published_at: { $gte: 1704067200, $lt: 1735689600 },
						'author.verified': true,
					},
				},
			];

			return Response.json({ examples });
		}

		// Route: POST /search/filtered - Execute filtered search
		if (url.pathname === '/search/filtered' && request.method === 'POST') {
			try {
				const body = await request.json() as {
					query: string;
					exampleName?: string;
					filter?: Record<string, any>;
					namespace?: string;
					topK?: number;
				};

				const { query, exampleName, filter, namespace, topK = 5 } = body;

				if (!query) {
					return Response.json({ error: 'Missing required field: query' }, { status: 400 });
				}

				// If exampleName provided, use pre-defined filter
				let finalFilter = filter;
				let finalNamespace = namespace;

				if (exampleName) {
					const examplesResponse = await this.fetch(
						new Request(new URL('/examples', request.url)),
						env,
						ctx
					);
					const { examples } = (await examplesResponse.json()) as { examples: FilterExample[] };

					const example = examples.find((ex) => ex.name === exampleName);
					if (example) {
						finalFilter = example.filter;
						finalNamespace = example.namespace || namespace;
					}
				}

				// Generate embedding
				const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
					text: query,
				});

				// Query with filter
				const results = await env.VECTORIZE_INDEX.query(embedding.data[0], {
					topK,
					filter: finalFilter,
					namespace: finalNamespace,
					returnMetadata: 'all',
					returnValues: false,
				});

				return Response.json({
					query,
					filter: finalFilter,
					namespace: finalNamespace,
					results: results.matches.map((m) => ({
						id: m.id,
						score: m.score,
						metadata: m.metadata,
					})),
					count: results.count,
				}, {
					headers: { 'Access-Control-Allow-Origin': '*' },
				});
			} catch (error) {
				console.error('Filtered search error:', error);
				return Response.json(
					{
						error: 'Filtered search failed',
						message: error instanceof Error ? error.message : 'Unknown error',
					},
					{ status: 500 }
				);
			}
		}

		// Route: POST /seed - Seed example data with rich metadata
		if (url.pathname === '/seed' && request.method === 'POST') {
			try {
				// Sample documents with diverse metadata
				const sampleDocs = [
					{
						content: 'Cloudflare Workers are serverless functions that run on the edge.',
						metadata: {
							category: 'documentation',
							language: 'en',
							status: 'published',
							published_at: 1704153600, // Jan 2, 2024
							published: true,
							url: '/docs/workers/intro',
							author: { id: 'user123', name: 'John Doe', verified: true },
							tags: ['workers', 'serverless', 'edge'],
						},
					},
					{
						content: 'Vectorize is a globally distributed vector database.',
						metadata: {
							category: 'documentation',
							language: 'en',
							status: 'published',
							published_at: 1720310400, // Jul 7, 2024
							published: true,
							url: '/docs/vectorize/intro',
							author: { id: 'user456', name: 'Jane Smith', verified: true },
							tags: ['vectorize', 'database', 'ai'],
						},
					},
					{
						content: 'D1 is Cloudflare\'s serverless SQL database.',
						metadata: {
							category: 'tutorials',
							language: 'en',
							status: 'draft',
							published_at: 1735603200, // Dec 31, 2024
							published: false,
							url: '/tutorials/d1/getting-started',
							author: { id: 'user123', name: 'John Doe', verified: true },
							tags: ['d1', 'database', 'sql'],
						},
					},
					{
						content: 'R2 provides S3-compatible object storage without egress fees.',
						metadata: {
							category: 'guides',
							language: 'en',
							status: 'published',
							published_at: 1712880000, // Apr 12, 2024
							published: true,
							url: '/docs/r2/overview',
							author: { id: 'user789', name: 'Bob Wilson', verified: false },
							tags: ['r2', 'storage', 'object-storage'],
						},
					},
					{
						content: 'Workers KV is a key-value store for edge applications.',
						metadata: {
							category: 'documentation',
							language: 'en',
							status: 'archived',
							published_at: 1640995200, // Jan 1, 2022
							published: true,
							url: '/docs/kv/intro',
							author: { id: 'user456', name: 'Jane Smith', verified: true },
							tags: ['kv', 'storage', 'edge'],
						},
					},
				];

				// Generate embeddings
				const texts = sampleDocs.map((doc) => doc.content);
				const embeddings = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: texts });

				// Prepare vectors
				const vectors = sampleDocs.map((doc, i) => ({
					id: `sample-${i + 1}`,
					values: embeddings.data[i],
					metadata: {
						content: doc.content,
						...doc.metadata,
						indexed_at: Date.now(),
					},
				}));

				// Upsert all
				await env.VECTORIZE_INDEX.upsert(vectors);

				return Response.json({
					success: true,
					message: 'Seeded 5 sample documents with rich metadata',
					count: vectors.length,
				}, {
					headers: { 'Access-Control-Allow-Origin': '*' },
				});
			} catch (error) {
				console.error('Seed error:', error);
				return Response.json(
					{
						error: 'Seeding failed',
						message: error instanceof Error ? error.message : 'Unknown error',
					},
					{ status: 500 }
				);
			}
		}

		// Default: API documentation
		return Response.json({
			name: 'Metadata Filtering Examples API',
			endpoints: {
				'GET /examples': {
					description: 'List all filter examples with syntax',
				},
				'POST /search/filtered': {
					description: 'Execute filtered vector search',
					body: {
						query: 'string (required)',
						exampleName: 'string (optional) - use pre-defined filter',
						filter: 'object (optional) - custom filter',
						namespace: 'string (optional)',
						topK: 'number (optional, default: 5)',
					},
					example: {
						query: 'serverless database',
						exampleName: 'Range Query (numbers)',
					},
				},
				'POST /seed': {
					description: 'Seed database with example documents',
					note: 'Creates 5 sample documents with rich metadata for testing',
				},
			},
			filterOperators: {
				$eq: 'Equals',
				$ne: 'Not equals',
				$in: 'In array',
				$nin: 'Not in array',
				$lt: 'Less than',
				$lte: 'Less than or equal',
				$gt: 'Greater than',
				$gte: 'Greater than or equal',
			},
			notes: {
				'Metadata Keys': 'Cannot be empty, contain dots (.), quotes ("), or start with $',
				'Filter Size': 'Max 2048 bytes (compact JSON)',
				'Cardinality': 'High cardinality in range queries can impact performance',
				'Namespace': 'Applied BEFORE metadata filters',
			},
		});
	},
};

/**
 * Example Usage:
 *
 * 1. Seed example data:
 *
 * curl -X POST https://your-worker.workers.dev/seed
 *
 * 2. List filter examples:
 *
 * curl https://your-worker.workers.dev/examples
 *
 * 3. Search with pre-defined filter:
 *
 * curl -X POST https://your-worker.workers.dev/search/filtered \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "query": "database storage",
 *     "exampleName": "Range Query (numbers)"
 *   }'
 *
 * 4. Search with custom filter:
 *
 * curl -X POST https://your-worker.workers.dev/search/filtered \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "query": "edge computing",
 *     "filter": {
 *       "category": { "$in": ["docs", "tutorials"] },
 *       "language": "en",
 *       "status": { "$ne": "archived" },
 *       "author.verified": true
 *     },
 *     "topK": 3
 *   }'
 *
 * Performance Tips:
 *
 * 1. Low Cardinality for Range Queries:
 *    ✅ Good: published_at (timestamps in seconds, not milliseconds)
 *    ❌ Bad: user_id (millions of unique values in range)
 *
 * 2. Namespace First:
 *    Use namespace for partition key (customer_id, tenant_id)
 *    Then use metadata filters for finer-grained filtering
 *
 * 3. Filter Size:
 *    Keep filters under 2048 bytes
 *    If hitting limit, split into multiple queries
 *
 * 4. Indexed Metadata:
 *    Create metadata indexes BEFORE inserting vectors:
 *    npx wrangler vectorize create-metadata-index my-index \
 *      --property-name=category --type=string
 */
