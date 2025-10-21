/**
 * Basic Semantic Search with Cloudflare Vectorize + Workers AI
 *
 * Use case: Simple semantic search over documents, FAQs, or product catalog
 *
 * Features:
 * - Workers AI embeddings (@cf/baai/bge-base-en-v1.5)
 * - Vectorize query with topK results
 * - Metadata filtering
 * - Simple JSON API
 */

export interface Env {
	VECTORIZE_INDEX: VectorizeIndex;
	AI: Ai;
}

interface SearchRequest {
	query: string;
	topK?: number;
	filter?: Record<string, any>;
	namespace?: string;
}

interface SearchResult {
	id: string;
	score: number;
	metadata: Record<string, any>;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// Handle CORS preflight
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

		// Route: POST /search - Semantic search endpoint
		if (url.pathname === '/search' && request.method === 'POST') {
			try {
				const body = await request.json() as SearchRequest;
				const { query, topK = 5, filter, namespace } = body;

				if (!query) {
					return Response.json(
						{ error: 'Missing required field: query' },
						{ status: 400 }
					);
				}

				// Generate embedding for search query
				const queryEmbedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
					text: query,
				});

				// Search vector database
				const results = await env.VECTORIZE_INDEX.query(queryEmbedding.data[0], {
					topK,
					filter,
					namespace,
					returnMetadata: 'all',
					returnValues: false, // Save bandwidth
				});

				// Format results
				const searchResults: SearchResult[] = results.matches.map((match) => ({
					id: match.id,
					score: match.score,
					metadata: match.metadata || {},
				}));

				return Response.json({
					query,
					results: searchResults,
					count: results.count,
				}, {
					headers: { 'Access-Control-Allow-Origin': '*' },
				});
			} catch (error) {
				console.error('Search error:', error);
				return Response.json(
					{
						error: 'Search failed',
						message: error instanceof Error ? error.message : 'Unknown error',
					},
					{ status: 500 }
				);
			}
		}

		// Route: POST /index - Add document to index
		if (url.pathname === '/index' && request.method === 'POST') {
			try {
				const body = await request.json() as {
					id: string;
					content: string;
					metadata?: Record<string, any>;
					namespace?: string;
				};

				if (!body.id || !body.content) {
					return Response.json(
						{ error: 'Missing required fields: id, content' },
						{ status: 400 }
					);
				}

				// Generate embedding for document
				const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
					text: body.content,
				});

				// Upsert vector (overwrites if exists)
				await env.VECTORIZE_INDEX.upsert([
					{
						id: body.id,
						values: embedding.data[0],
						namespace: body.namespace,
						metadata: {
							...body.metadata,
							content: body.content,
							indexed_at: Date.now(),
						},
					},
				]);

				return Response.json({
					success: true,
					id: body.id,
					message: 'Document indexed successfully',
				}, {
					headers: { 'Access-Control-Allow-Origin': '*' },
				});
			} catch (error) {
				console.error('Index error:', error);
				return Response.json(
					{
						error: 'Indexing failed',
						message: error instanceof Error ? error.message : 'Unknown error',
					},
					{ status: 500 }
				);
			}
		}

		// Route: DELETE /index/:id - Remove document from index
		if (url.pathname.startsWith('/index/') && request.method === 'DELETE') {
			try {
				const id = url.pathname.split('/')[2];

				if (!id) {
					return Response.json(
						{ error: 'Missing document ID' },
						{ status: 400 }
					);
				}

				await env.VECTORIZE_INDEX.deleteByIds([id]);

				return Response.json({
					success: true,
					id,
					message: 'Document removed from index',
				}, {
					headers: { 'Access-Control-Allow-Origin': '*' },
				});
			} catch (error) {
				console.error('Delete error:', error);
				return Response.json(
					{
						error: 'Delete failed',
						message: error instanceof Error ? error.message : 'Unknown error',
					},
					{ status: 500 }
				);
			}
		}

		// Default: API documentation
		return Response.json({
			name: 'Vectorize Semantic Search API',
			endpoints: {
				'POST /search': {
					description: 'Semantic search over indexed documents',
					body: {
						query: 'string (required)',
						topK: 'number (optional, default: 5)',
						filter: 'object (optional)',
						namespace: 'string (optional)',
					},
					example: {
						query: 'How do I deploy a Worker?',
						topK: 3,
						filter: { category: 'documentation' },
					},
				},
				'POST /index': {
					description: 'Add or update document in index',
					body: {
						id: 'string (required)',
						content: 'string (required)',
						metadata: 'object (optional)',
						namespace: 'string (optional)',
					},
					example: {
						id: 'doc-123',
						content: 'Cloudflare Workers are serverless functions...',
						metadata: { category: 'documentation', author: 'Cloudflare' },
					},
				},
				'DELETE /index/:id': {
					description: 'Remove document from index',
					example: 'DELETE /index/doc-123',
				},
			},
		});
	},
};

/**
 * Example Usage:
 *
 * 1. Index a document:
 *
 * curl -X POST https://your-worker.workers.dev/index \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "id": "doc-1",
 *     "content": "Cloudflare Workers allow you to deploy serverless code globally.",
 *     "metadata": { "category": "docs", "section": "workers" }
 *   }'
 *
 * 2. Search:
 *
 * curl -X POST https://your-worker.workers.dev/search \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "query": "How do I deploy serverless functions?",
 *     "topK": 5,
 *     "filter": { "category": "docs" }
 *   }'
 *
 * 3. Delete:
 *
 * curl -X DELETE https://your-worker.workers.dev/index/doc-1
 */
