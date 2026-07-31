/**
 * Legal Knowledge Barrel + Auto-Indexer
 *
 * Exports all legal documents and provides startup initialization
 * that indexes them into the vector store for RAG.
 */

import type { LegalKnowledgeDoc } from './types';
import { luatDoanhNghiep2020 } from './luat-doanh-nghiep-2020';
import { boLuatLaoDong2019 } from './bo-luat-lao-dong-2019';
import { boLuatDanSu2015 } from './bo-luat-dan-su-2015';
import { indexDocument, getIndexStats } from '../vector-store';

export type { LegalKnowledgeDoc, LegalArticle, LegalChapter } from './types';

export {
  luatDoanhNghiep2020,
  boLuatLaoDong2019,
  boLuatDanSu2015,
};

/** All registered legal knowledge documents */
const ALL_DOCUMENTS: LegalKnowledgeDoc[] = [
  luatDoanhNghiep2020,
  boLuatLaoDong2019,
  boLuatDanSu2015,
];

/**
 * Build full text from a legal knowledge document for indexing.
 * Each article becomes searchable text with its article number + title + content.
 */
function buildDocumentText(doc: LegalKnowledgeDoc): string {
  const parts: string[] = [];
  for (const chapter of doc.chapters) {
    parts.push(chapter.title);
    for (const article of chapter.articles) {
      parts.push(`${article.number}. ${article.title}: ${article.content}`);
    }
  }
  return parts.join('\n\n');
}

/** Dedup: prevents concurrent initialization calls */
let _initPromise: Promise<{
  indexed: number;
  totalChunks: number;
  sources: string[];
}> | null = null;

/**
 * Initialize legal knowledge base by indexing all registered laws
 * into the vector store. Called once at app startup.
 *
 * Returns summary of what was indexed.
 */
export async function initializeLegalKnowledge(): Promise<{
  indexed: number;
  totalChunks: number;
  sources: string[];
}> {
  // Deduplicate concurrent initialization calls
  if (_initPromise) return _initPromise;

  // Check which documents still need indexing
  const stats = getIndexStats();
  const indexedIds = new Set(stats.sources.map((s) => s.documentId));
  const pending = ALL_DOCUMENTS.filter((d) => !indexedIds.has(d.id));
  if (pending.length === 0) {
    return {
      indexed: stats.documentCount,
      totalChunks: stats.chunkCount,
      sources: stats.sources.map((s) => s.source),
    };
  }

  _initPromise = doInitialize(pending);
  return _initPromise;
}

async function doInitialize(docs: LegalKnowledgeDoc[]): Promise<{
  indexed: number;
  totalChunks: number;
  sources: string[];
}> {
  const errors: Array<{ docId: string; error: string }> = [];
  const results = await Promise.allSettled(
    docs.map(async (doc) => {
      const text = buildDocumentText(doc);
      const chunks = await indexDocument(
        doc.id,
        doc.source,
        text,
        doc.domainTags,
        { version: doc.version },
      );
      return { doc, chunks };
    }),
  );

  let totalChunks = 0;
  const sources: string[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      totalChunks += result.value.chunks;
      sources.push(result.value.doc.source);
    } else {
      errors.push({
        docId: '',
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  }

  if (errors.length > 0) {
    console.error('[LegalKnowledge] Some documents failed to index:', errors);
  }

  return {
    indexed: results.filter((r) => r.status === 'fulfilled').length,
    totalChunks,
    sources,
  };
}

/**
 * Get the pre-built text content for a specific law document.
 * Useful for direct lookups without vector search.
 */
export function getDocumentText(docId: string): string | null {
  const doc = ALL_DOCUMENTS.find((d) => d.id === docId);
  if (!doc) return null;
  return buildDocumentText(doc);
}

/**
 * List all available legal knowledge documents.
 */
export function listLegalDocuments(): Array<{
  id: string;
  source: string;
  domainTags: string[];
  version: string;
  articleCount: number;
}> {
  return ALL_DOCUMENTS.map((doc) => ({
    id: doc.id,
    source: doc.source,
    domainTags: doc.domainTags,
    version: doc.version,
    articleCount: doc.chapters.reduce((sum, ch) => sum + ch.articles.length, 0),
  }));
}
