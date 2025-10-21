// RAG Agent with Vectorize + Workers AI

import { Agent } from "agents";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

interface Env {
  AI: Ai;                      // Workers AI binding
  VECTORIZE: Vectorize;        // Vectorize binding
  OPENAI_API_KEY?: string;     // Optional: OpenAI API key
}

interface RAGState {
  documentsIngested: number;
  queriesProcessed: number;
  lastQuery: string | null;
}

export class RAGAgent extends Agent<Env, RAGState> {
  initialState: RAGState = {
    documentsIngested: 0,
    queriesProcessed: 0,
    lastQuery: null
  };

  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // POST /ingest - Ingest documents
    if (url.pathname === "/ingest") {
      const { documents } = await request.json();
      // documents: Array<{ id: string, text: string, metadata: any }>

      const count = await this.ingestDocuments(documents);

      return Response.json({
        ingested: count,
        total: this.state.documentsIngested + count
      });
    }

    // POST /query - Query knowledge base
    if (url.pathname === "/query") {
      const { query, topK } = await request.json();

      const results = await this.queryKnowledge(query, topK || 5);

      return Response.json({
        query,
        matches: results.matches,
        context: results.context
      });
    }

    // POST /chat - RAG-powered chat
    if (url.pathname === "/chat") {
      const { message } = await request.json();

      const response = await this.chat(message);

      return Response.json(response);
    }

    return new Response("Not Found", { status: 404 });
  }

  // Ingest documents into Vectorize
  async ingestDocuments(documents: Array<{ id: string; text: string; metadata?: any }>) {
    const vectors = [];

    for (const doc of documents) {
      // Generate embedding with Workers AI
      const { data } = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
        text: [doc.text]
      });

      vectors.push({
        id: doc.id,
        values: data[0],
        metadata: {
          text: doc.text,
          ...doc.metadata
        }
      });
    }

    // Upsert into Vectorize (batch operation)
    await this.env.VECTORIZE.upsert(vectors);

    // Update state
    this.setState({
      ...this.state,
      documentsIngested: this.state.documentsIngested + vectors.length
    });

    return vectors.length;
  }

  // Query knowledge base
  async queryKnowledge(userQuery: string, topK: number = 5) {
    // Generate query embedding
    const { data } = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [userQuery]
    });

    // Search Vectorize
    const results = await this.env.VECTORIZE.query(data[0], {
      topK,
      returnMetadata: 'all'
    });

    // Extract context from matches
    const context = results.matches
      .map(match => match.metadata?.text)
      .filter(Boolean)
      .join('\n\n');

    // Update state
    this.setState({
      ...this.state,
      queriesProcessed: this.state.queriesProcessed + 1,
      lastQuery: userQuery
    });

    return {
      matches: results.matches.map(m => ({
        id: m.id,
        score: m.score,
        metadata: m.metadata
      })),
      context
    };
  }

  // RAG-powered chat
  async chat(userMessage: string) {
    // 1. Retrieve relevant context
    const { context } = await this.queryKnowledge(userMessage);

    // 2. Generate response with context
    if (this.env.OPENAI_API_KEY) {
      // Use OpenAI with AI SDK
      const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant. Use the following context to answer questions accurately:\n\n${context}`
          },
          {
            role: 'user',
            content: userMessage
          }
        ]
      });

      return { response: text, context };
    } else {
      // Use Workers AI
      const response = await this.env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant. Use the following context to answer questions:\n\n${context}`
          },
          {
            role: 'user',
            content: userMessage
          }
        ]
      });

      return {
        response: response.response,
        context
      };
    }
  }

  // Query with metadata filtering
  async queryWithFilter(userQuery: string, filters: any) {
    const { data } = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [userQuery]
    });

    const results = await this.env.VECTORIZE.query(data[0], {
      topK: 5,
      filter: filters,  // e.g., { category: { $eq: "docs" } }
      returnMetadata: 'all'
    });

    return results;
  }
}

export default RAGAgent;
