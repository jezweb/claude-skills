/**
 * RAG (Retrieval Augmented Generation) Chatbot
 * with Cloudflare Vectorize + Workers AI
 *
 * Use case: Q&A chatbot that retrieves relevant context before generating answers
 *
 * Features:
 * - Semantic search over knowledge base
 * - Context-aware LLM responses
 * - Source citations
 * - Conversation history support
 * - Streaming responses (optional)
 */

export interface Env {
	VECTORIZE_INDEX: VectorizeIndex;
	AI: Ai;
}

interface ChatRequest {
	question: string;
	conversationHistory?: Array<{ role: string; content: string }>;
	topK?: number;
	filter?: Record<string, any>;
	namespace?: string;
}

interface ChatResponse {
	answer: string;
	sources: Array<{
		id: string;
		title: string;
		score: number;
		excerpt: string;
	}>;
	context: string;
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

		// Route: POST /chat - RAG chatbot endpoint
		if (url.pathname === '/chat' && request.method === 'POST') {
			try {
				const body = await request.json() as ChatRequest;
				const {
					question,
					conversationHistory = [],
					topK = 3,
					filter,
					namespace,
				} = body;

				if (!question) {
					return Response.json(
						{ error: 'Missing required field: question' },
						{ status: 400 }
					);
				}

				// Step 1: Generate embedding for user question
				const questionEmbedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
					text: question,
				});

				// Step 2: Search vector database for relevant context
				const searchResults = await env.VECTORIZE_INDEX.query(
					questionEmbedding.data[0],
					{
						topK,
						filter,
						namespace,
						returnMetadata: 'all',
						returnValues: false,
					}
				);

				// Step 3: Build context from retrieved documents
				const contextParts: string[] = [];
				const sources: ChatResponse['sources'] = [];

				for (const match of searchResults.matches) {
					const metadata = match.metadata || {};
					const title = metadata.title || metadata.id || match.id;
					const content = metadata.content || '';

					// Truncate content for context (max ~500 chars per source)
					const excerpt =
						content.length > 500 ? content.slice(0, 497) + '...' : content;

					contextParts.push(`[${title}]\n${content}`);
					sources.push({
						id: match.id,
						title,
						score: match.score,
						excerpt,
					});
				}

				const context = contextParts.join('\n\n---\n\n');

				// Step 4: Build conversation with context
				const messages = [
					{
						role: 'system',
						content: `You are a helpful AI assistant. Answer questions based on the following context. If the context doesn't contain enough information to answer the question, say so honestly.

Context:
${context}`,
					},
					...conversationHistory,
					{
						role: 'user',
						content: question,
					},
				];

				// Step 5: Generate answer with LLM
				const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
					messages,
				});

				const answer = aiResponse.response || 'Sorry, I could not generate a response.';

				// Return response with sources
				return Response.json({
					answer,
					sources,
					context: context.slice(0, 1000), // Include truncated context for debugging
				} as ChatResponse, {
					headers: { 'Access-Control-Allow-Origin': '*' },
				});
			} catch (error) {
				console.error('Chat error:', error);
				return Response.json(
					{
						error: 'Chat failed',
						message: error instanceof Error ? error.message : 'Unknown error',
					},
					{ status: 500 }
				);
			}
		}

		// Route: POST /chat/stream - Streaming RAG responses
		if (url.pathname === '/chat/stream' && request.method === 'POST') {
			try {
				const body = await request.json() as ChatRequest;
				const { question, topK = 3, filter, namespace } = body;

				if (!question) {
					return Response.json(
						{ error: 'Missing required field: question' },
						{ status: 400 }
					);
				}

				// Retrieve context (same as above)
				const questionEmbedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
					text: question,
				});

				const searchResults = await env.VECTORIZE_INDEX.query(
					questionEmbedding.data[0],
					{ topK, filter, namespace, returnMetadata: 'all', returnValues: false }
				);

				const contextParts = searchResults.matches.map(
					(m) => `[${m.metadata?.title || m.id}]\n${m.metadata?.content || ''}`
				);
				const context = contextParts.join('\n\n---\n\n');

				// Stream LLM response
				const stream = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
					messages: [
						{
							role: 'system',
							content: `Answer based on context:\n\n${context}`,
						},
						{ role: 'user', content: question },
					],
					stream: true,
				});

				return new Response(stream, {
					headers: {
						'Content-Type': 'text/event-stream',
						'Access-Control-Allow-Origin': '*',
					},
				});
			} catch (error) {
				console.error('Stream error:', error);
				return Response.json(
					{
						error: 'Streaming failed',
						message: error instanceof Error ? error.message : 'Unknown error',
					},
					{ status: 500 }
				);
			}
		}

		// Route: POST /ingest - Add knowledge base content
		if (url.pathname === '/ingest' && request.method === 'POST') {
			try {
				const body = await request.json() as {
					documents: Array<{
						id: string;
						title: string;
						content: string;
						metadata?: Record<string, any>;
					}>;
					namespace?: string;
				};

				if (!body.documents || !Array.isArray(body.documents)) {
					return Response.json(
						{ error: 'Missing or invalid field: documents (array)' },
						{ status: 400 }
					);
				}

				// Generate embeddings for all documents
				const texts = body.documents.map((doc) => doc.content);
				const embeddings = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
					text: texts,
				});

				// Prepare vectors for upsert
				const vectors = body.documents.map((doc, i) => ({
					id: doc.id,
					values: embeddings.data[i],
					namespace: body.namespace,
					metadata: {
						title: doc.title,
						content: doc.content,
						...doc.metadata,
						indexed_at: Date.now(),
					},
				}));

				// Batch upsert
				await env.VECTORIZE_INDEX.upsert(vectors);

				return Response.json({
					success: true,
					count: vectors.length,
					message: `Successfully indexed ${vectors.length} documents`,
				}, {
					headers: { 'Access-Control-Allow-Origin': '*' },
				});
			} catch (error) {
				console.error('Ingest error:', error);
				return Response.json(
					{
						error: 'Ingestion failed',
						message: error instanceof Error ? error.message : 'Unknown error',
					},
					{ status: 500 }
				);
			}
		}

		// Default: API documentation
		return Response.json({
			name: 'RAG Chatbot API',
			endpoints: {
				'POST /chat': {
					description: 'Ask questions with context retrieval',
					body: {
						question: 'string (required)',
						conversationHistory: 'array (optional)',
						topK: 'number (optional, default: 3)',
						filter: 'object (optional)',
						namespace: 'string (optional)',
					},
					example: {
						question: 'How do I deploy a Cloudflare Worker?',
						topK: 3,
						filter: { category: 'documentation' },
					},
				},
				'POST /chat/stream': {
					description: 'Streaming responses',
					body: 'Same as /chat',
				},
				'POST /ingest': {
					description: 'Add documents to knowledge base',
					body: {
						documents: [
							{
								id: 'doc-1',
								title: 'Document Title',
								content: 'Document content...',
								metadata: { category: 'docs' },
							},
						],
						namespace: 'string (optional)',
					},
				},
			},
		});
	},
};

/**
 * Example Usage:
 *
 * 1. Ingest knowledge base:
 *
 * curl -X POST https://your-worker.workers.dev/ingest \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "documents": [
 *       {
 *         "id": "workers-intro",
 *         "title": "Introduction to Workers",
 *         "content": "Cloudflare Workers allow you to deploy serverless code globally...",
 *         "metadata": { "category": "docs", "section": "workers" }
 *       }
 *     ]
 *   }'
 *
 * 2. Ask a question:
 *
 * curl -X POST https://your-worker.workers.dev/chat \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "question": "How do I deploy serverless code?",
 *     "topK": 3,
 *     "filter": { "category": "docs" }
 *   }'
 *
 * 3. Streaming response:
 *
 * curl -X POST https://your-worker.workers.dev/chat/stream \
 *   -H "Content-Type: application/json" \
 *   -d '{ "question": "What is a Worker?" }'
 */
