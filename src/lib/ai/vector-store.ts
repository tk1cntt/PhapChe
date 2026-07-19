/**
 * Vector Store — In-process semantic search for RAG
 *
 * Uses cosine similarity with in-memory vector index.
 * For production, migrate to PGVector when moving to PostgreSQL.
 *
 * Components:
 *   1. Document chunker — splits legal docs into overlapping chunks
 *   2. Embedder — calls LLM Gateway embedding API
 *   3. Indexer — stores chunks with vectors + metadata
 *   4. Searcher — cosine similarity search with domain filtering
 */

import type { DocumentChunk, SearchResult, SearchQuery, LegalDomain } from './types';

// ── Document Chunker ────────────────────────────────────────

const DEFAULT_CHUNK_SIZE = 800; // characters
const DEFAULT_CHUNK_OVERLAP = 100; // overlap between chunks

interface ChunkResult {
  content: string;
  index: number;
}

/**
 * Split text into overlapping chunks by paragraph boundaries.
 * Tries to split on paragraph breaks first, then sentence breaks, then word breaks.
 */
export function chunkDocument(
  text: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_CHUNK_OVERLAP,
): ChunkResult[] {
  if (!text || typeof text !== 'string') return [];
  const chunks: ChunkResult[] = [];
  const paragraphs = text.split(/\n\n+/);

  let currentChunk = '';
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    // If adding this paragraph exceeds chunk size, flush current chunk
    if (currentChunk.length + trimmed.length > chunkSize && currentChunk.length > 0) {
      chunks.push({ content: currentChunk.trim(), index: chunkIndex++ });

      // Keep overlap portion for next chunk
      if (overlap > 0 && currentChunk.length > overlap) {
        currentChunk = currentChunk.slice(-overlap) + '\n\n' + trimmed;
      } else {
        currentChunk = trimmed;
      }
    } else {
      if (currentChunk) currentChunk += '\n\n';
      currentChunk += trimmed;
    }
  }

  // Flush remaining
  if (currentChunk.trim()) {
    chunks.push({ content: currentChunk.trim(), index: chunkIndex++ });
  }

  return chunks;
}

// ── Cosine Similarity ───────────────────────────────────────

function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

function magnitude(v: number[]): number {
  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    sum += v[i] * v[i];
  }
  return Math.sqrt(sum);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  const dot = dotProduct(a, b);
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

// ── In-Memory Vector Index ──────────────────────────────────

class VectorIndex {
  private chunks: DocumentChunk[] = [];

  /** Add a chunk to the index */
  add(chunk: DocumentChunk): void {
    // Replace existing chunk with same ID
    const existingIdx = this.chunks.findIndex((c) => c.id === chunk.id);
    if (existingIdx >= 0) {
      this.chunks[existingIdx] = chunk;
    } else {
      this.chunks.push(chunk);
    }
  }

  /** Add multiple chunks at once */
  addBatch(chunks: DocumentChunk[]): void {
    for (const chunk of chunks) {
      this.add(chunk);
    }
  }

  /** Remove all chunks for a document */
  removeDocument(documentId: string): number {
    const before = this.chunks.length;
    this.chunks = this.chunks.filter((c) => c.documentId !== documentId);
    return before - this.chunks.length;
  }

  /** Search by embedding vector */
  search(
    queryEmbedding: number[],
    topK: number = 10,
    minScore: number = 0.5,
    domainTags?: LegalDomain[],
  ): SearchResult[] {
    const results: SearchResult[] = [];

    for (const chunk of this.chunks) {
      // Domain filter
      if (domainTags && domainTags.length > 0) {
        const hasTag = domainTags.some((t) => chunk.domainTags.includes(t));
        if (!hasTag) continue;
      }

      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      if (score >= minScore) {
        results.push({ chunk, score });
      }
    }

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /** Get total chunk count */
  get size(): number {
    return this.chunks.length;
  }

  /** Get document count */
  get documentCount(): number {
    const ids = new Set(this.chunks.map((c) => c.documentId));
    return ids.size;
  }

  /** List all indexed document sources */
  getSources(): Array<{ documentId: string; source: string; chunkCount: number }> {
    const map = new Map<string, { source: string; count: number }>();
    for (const chunk of this.chunks) {
      const entry = map.get(chunk.documentId);
      if (entry) {
        entry.count++;
      } else {
        map.set(chunk.documentId, { source: chunk.source, count: 1 });
      }
    }
    return Array.from(map.entries()).map(([documentId, { source, count }]) => ({
      documentId,
      source,
      chunkCount: count,
    }));
  }

  /** Clear all data */
  clear(): void {
    this.chunks = [];
  }
}

// Singleton instance
export const vectorIndex = new VectorIndex();
export { VectorIndex };

// ── Embedder ────────────────────────────────────────────────

/**
 * Generate embedding vector from text using the LLM Gateway's embedding API.
 * Falls back to a simple bag-of-words pseudo-embedding if no API configured.
 *
 * Pseudo-embedding is NOT for production — it's a dev-only fallback
 * that enables the system to work without API keys.
 */
export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';

  if (apiKey) {
    try {
      const response = await fetch(`${baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          data: Array<{ embedding: number[] }>;
        };
        return data.data[0]?.embedding ?? pseudoEmbed(text);
      }
    } catch {
      // Fall through to pseudo-embedding
    }
  }

  return pseudoEmbed(text);
}

/**
 * Batch embed multiple texts (saves API calls).
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';

  if (apiKey) {
    try {
      const response = await fetch(`${baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: texts,
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          data: Array<{ embedding: number[]; index: number }>;
        };
        return data.data
          .sort((a, b) => a.index - b.index)
          .map((d) => d.embedding);
      }
    } catch {
      // Fall through
    }
  }

  return Promise.all(texts.map(pseudoEmbed));
}

/**
 * Pseudo-embedding — simple TF-IDF-like vector for dev/testing.
 * NOT semantically meaningful. Only for development without API keys.
 * Dimension: 256 (reduced from word count via hashing).
 */
function pseudoEmbed(text: string): number[] {
  const dim = 256;
  const vec = new Array(dim).fill(0);

  // Normalize: lowercase, remove punctuation
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);

  // Simple hashing: each word contributes to multiple positions
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash * 31 + word.charCodeAt(i)) & 0xffffffff;
    }

    // Spread hash across vector positions (like feature hashing)
    vec[Math.abs(hash) % dim] += 1;
    vec[Math.abs(hash * 7) % dim] += 0.5;
    vec[Math.abs(hash * 13) % dim] += 0.3;
  }

  // Normalize to unit vector
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (mag > 0) {
    for (let i = 0; i < dim; i++) {
      vec[i] /= mag;
    }
  }

  return vec;
}

// ── High-level Indexer API ──────────────────────────────────

/**
 * Index a document into the vector store.
 */
export async function indexDocument(
  documentId: string,
  source: string,
  content: string,
  domainTags: LegalDomain[],
  metadata: Record<string, string> = {},
): Promise<number> {
  const chunks = chunkDocument(content);
  const texts = chunks.map((c) => c.content);
  const embeddings = await embedBatch(texts);

  const now = new Date().toISOString();
  const docChunks: DocumentChunk[] = chunks.map((chunk, i) => ({
    id: `${documentId}:chunk:${chunk.index}`,
    documentId,
    source,
    content: chunk.content,
    chunkIndex: chunk.index,
    embedding: embeddings[i],
    domainTags,
    metadata,
    indexedAt: now,
  }));

  vectorIndex.addBatch(docChunks);
  return docChunks.length;
}

/**
 * Semantic search across indexed documents.
 * First embeds the query, then searches the vector index.
 */
export async function semanticSearch(query: SearchQuery): Promise<SearchResult[]> {
  const queryEmbedding = await embedText(query.query);
  return vectorIndex.search(
    queryEmbedding,
    query.topK ?? 5,
    query.minScore ?? 0.3,
    query.domainTags,
  );
}

/**
 * Get index statistics.
 */
export function getIndexStats(): {
  chunkCount: number;
  documentCount: number;
  sources: Array<{ documentId: string; source: string; chunkCount: number }>;
} {
  return {
    chunkCount: vectorIndex.size,
    documentCount: vectorIndex.documentCount,
    sources: vectorIndex.getSources(),
  };
}

/**
 * Check if vector store has any indexed data.
 */
export function isVectorStoreReady(): boolean {
  return vectorIndex.size > 0;
}
