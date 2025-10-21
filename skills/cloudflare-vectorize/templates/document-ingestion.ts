/**
 * Document Ingestion Pipeline for Cloudflare Vectorize
 *
 * Use case: Process large documents, chunk text, generate embeddings, and index
 *
 * Features:
 * - Intelligent text chunking (sentence-based)
 * - Batch embedding generation
 * - Metadata tagging (doc_id, chunk_index, timestamps)
 * - R2 integration for document storage (optional)
 * - Progress tracking and error handling
 */

export interface Env {
	VECTORIZE_INDEX: VectorizeIndex;
	AI: Ai;
	DOCUMENTS_BUCKET?: R2Bucket; // Optional: Store original documents
}

interface Document {
	id: string;
	title: string;
	content: string;
	url?: string;
	author?: string;
	category?: string;
	tags?: string[];
	publishedAt?: number;
	[key: string]: any;
}

interface ChunkMetadata {
	doc_id: string;
	doc_title: string;
	chunk_index: number;
	total_chunks: number;
	content: string;
	[key: string]: any;
}

/**
 * Chunk text into smaller segments while preserving sentence boundaries
 */
function chunkText(text: string, maxChunkSize = 500, overlapSize = 50): string[] {
	// Split into sentences (handles . ! ? with spaces)
	const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [text];
	const chunks: string[] = [];
	let currentChunk = '';

	for (let i = 0; i < sentences.length; i++) {
		const sentence = sentences[i].trim();

		// If adding this sentence exceeds max size and we have content, start new chunk
		if ((currentChunk + ' ' + sentence).length > maxChunkSize && currentChunk) {
			chunks.push(currentChunk.trim());

			// Create overlap by including last few words
			const words = currentChunk.split(' ');
			const overlapWords = words.slice(-Math.floor(overlapSize / 6)); // ~6 chars/word
			currentChunk = overlapWords.join(' ') + ' ' + sentence;
		} else {
			currentChunk += (currentChunk ? ' ' : '') + sentence;
		}
	}

	// Add final chunk
	if (currentChunk.trim()) {
		chunks.push(currentChunk.trim());
	}

	return chunks.length > 0 ? chunks : [text];
}

/**
 * Batch array into smaller arrays of specified size
 */
function batchArray<T>(array: T[], batchSize: number): T[][] {
	const batches: T[][] = [];
	for (let i = 0; i < array.length; i += batchSize) {
		batches.push(array.slice(i, i + batchSize));
	}
	return batches;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// Handle CORS
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type',
				},
			});
		}

		const url = new URL(request.url);

		// Route: POST /ingest - Process and index document(s)
		if (url.pathname === '/ingest' && request.method === 'POST') {
			try {
				const body = await request.json() as {
					documents: Document[];
					chunkSize?: number;
					overlapSize?: number;
					namespace?: string;
					storeInR2?: boolean;
				};

				const {
					documents,
					chunkSize = 500,
					overlapSize = 50,
					namespace,
					storeInR2 = false,
				} = body;

				if (!documents || !Array.isArray(documents) || documents.length === 0) {
					return Response.json(
						{ error: 'Missing or invalid field: documents (non-empty array)' },
						{ status: 400 }
					);
				}

				const results = {
					success: true,
					processed: 0,
					totalChunks: 0,
					errors: [] as string[],
					documentDetails: [] as any[],
				};

				// Process each document
				for (const doc of documents) {
					try {
						if (!doc.id || !doc.content) {
							results.errors.push(`Document missing id or content: ${JSON.stringify(doc)}`);
							continue;
						}

						// Optional: Store original document in R2
						if (storeInR2 && env.DOCUMENTS_BUCKET) {
							await env.DOCUMENTS_BUCKET.put(
								`documents/${doc.id}.json`,
								JSON.stringify(doc),
								{
									httpMetadata: { contentType: 'application/json' },
									customMetadata: { title: doc.title, indexed_at: Date.now().toString() },
								}
							);
						}

						// Chunk the document
						const chunks = chunkText(doc.content, chunkSize, overlapSize);

						// Generate embeddings for all chunks (batch)
						const embeddings = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
							text: chunks,
						});

						// Prepare vectors with metadata
						const vectors = chunks.map((chunk, index) => ({
							id: `${doc.id}-chunk-${index}`,
							values: embeddings.data[index],
							namespace,
							metadata: {
								doc_id: doc.id,
								doc_title: doc.title,
								chunk_index: index,
								total_chunks: chunks.length,
								content: chunk,
								url: doc.url,
								author: doc.author,
								category: doc.category,
								tags: doc.tags,
								published_at: doc.publishedAt,
								indexed_at: Date.now(),
							} as ChunkMetadata,
						}));

						// Upsert in batches (100 vectors at a time)
						const vectorBatches = batchArray(vectors, 100);
						for (const batch of vectorBatches) {
							await env.VECTORIZE_INDEX.upsert(batch);
						}

						results.processed++;
						results.totalChunks += chunks.length;
						results.documentDetails.push({
							id: doc.id,
							title: doc.title,
							chunks: chunks.length,
						});
					} catch (error) {
						const errorMsg = `Failed to process document ${doc.id}: ${
							error instanceof Error ? error.message : 'Unknown error'
						}`;
						console.error(errorMsg);
						results.errors.push(errorMsg);
					}
				}

				const statusCode = results.errors.length > 0 ? 207 : 200; // 207 Multi-Status

				return Response.json(results, {
					status: statusCode,
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

		// Route: POST /ingest/url - Fetch and ingest from URL (requires Firecrawl or similar)
		if (url.pathname === '/ingest/url' && request.method === 'POST') {
			try {
				const body = await request.json() as {
					url: string;
					id?: string;
					category?: string;
					namespace?: string;
				};

				if (!body.url) {
					return Response.json({ error: 'Missing required field: url' }, { status: 400 });
				}

				// Fetch content (simple fetch - for production use Firecrawl or similar)
				const response = await fetch(body.url);
				const html = await response.text();

				// Simple text extraction (production would use proper HTML parsing)
				const text = html
					.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
					.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
					.replace(/<[^>]+>/g, ' ')
					.replace(/\s+/g, ' ')
					.trim();

				// Create document from fetched content
				const doc: Document = {
					id: body.id || `url-${Date.now()}`,
					title: body.url,
					content: text,
					url: body.url,
					category: body.category || 'web-page',
					publishedAt: Date.now(),
				};

				// Re-use the /ingest logic
				const ingestResponse = await this.fetch(
					new Request(new URL('/ingest', request.url), {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							documents: [doc],
							namespace: body.namespace,
						}),
					}),
					env,
					ctx
				);

				return ingestResponse;
			} catch (error) {
				console.error('URL ingest error:', error);
				return Response.json(
					{
						error: 'URL ingestion failed',
						message: error instanceof Error ? error.message : 'Unknown error',
					},
					{ status: 500 }
				);
			}
		}

		// Route: DELETE /documents/:id - Delete all chunks for a document
		if (url.pathname.startsWith('/documents/') && request.method === 'DELETE') {
			try {
				const docId = url.pathname.split('/')[2];

				if (!docId) {
					return Response.json({ error: 'Missing document ID' }, { status: 400 });
				}

				// List all vector IDs (need to find chunks for this doc)
				// Note: This is inefficient for large indexes. Better to maintain a separate index of doc -> chunk mappings
				const allVectors = await env.VECTORIZE_INDEX.listVectors({ limit: 1000 });

				const chunkIds = allVectors.vectors
					.filter((v) => v.id.startsWith(`${docId}-chunk-`))
					.map((v) => v.id);

				if (chunkIds.length === 0) {
					return Response.json(
						{ error: 'Document not found', id: docId },
						{ status: 404 }
					);
				}

				// Delete in batches
				const idBatches = batchArray(chunkIds, 100);
				for (const batch of idBatches) {
					await env.VECTORIZE_INDEX.deleteByIds(batch);
				}

				// Optional: Delete from R2 if exists
				if (env.DOCUMENTS_BUCKET) {
					await env.DOCUMENTS_BUCKET.delete(`documents/${docId}.json`);
				}

				return Response.json({
					success: true,
					id: docId,
					chunksDeleted: chunkIds.length,
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
			name: 'Document Ingestion Pipeline API',
			endpoints: {
				'POST /ingest': {
					description: 'Process and index documents with chunking',
					body: {
						documents: [
							{
								id: 'string (required)',
								title: 'string (required)',
								content: 'string (required)',
								url: 'string (optional)',
								author: 'string (optional)',
								category: 'string (optional)',
								tags: ['array (optional)'],
								publishedAt: 'number (optional)',
							},
						],
						chunkSize: 'number (optional, default: 500)',
						overlapSize: 'number (optional, default: 50)',
						namespace: 'string (optional)',
						storeInR2: 'boolean (optional, default: false)',
					},
				},
				'POST /ingest/url': {
					description: 'Fetch and ingest document from URL',
					body: {
						url: 'string (required)',
						id: 'string (optional)',
						category: 'string (optional)',
						namespace: 'string (optional)',
					},
				},
				'DELETE /documents/:id': {
					description: 'Delete all chunks for a document',
					example: 'DELETE /documents/doc-123',
				},
			},
		});
	},
};

/**
 * Example Usage:
 *
 * 1. Ingest a single document:
 *
 * curl -X POST https://your-worker.workers.dev/ingest \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "documents": [{
 *       "id": "cloudflare-workers-intro",
 *       "title": "Introduction to Cloudflare Workers",
 *       "content": "Very long document content here...",
 *       "category": "documentation",
 *       "author": "Cloudflare",
 *       "tags": ["workers", "serverless", "edge-computing"]
 *     }],
 *     "chunkSize": 500,
 *     "overlapSize": 50
 *   }'
 *
 * 2. Ingest from URL:
 *
 * curl -X POST https://your-worker.workers.dev/ingest/url \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "url": "https://developers.cloudflare.com/workers/",
 *     "category": "documentation"
 *   }'
 *
 * 3. Delete document:
 *
 * curl -X DELETE https://your-worker.workers.dev/documents/cloudflare-workers-intro
 */
