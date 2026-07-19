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
import { indexDocument, getIndexStats, isVectorStoreReady, vectorIndex } from '../vector-store';

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
  // Skip if already initialized
  if (isVectorStoreReady()) {
    const stats = getIndexStats();
    return {
      indexed: stats.documentCount,
      totalChunks: stats.chunkCount,
      sources: stats.sources.map((s) => s.source),
    };
  }

  let totalChunks = 0;
  const sources: string[] = [];

  for (const doc of ALL_DOCUMENTS) {
    // Remove existing index for this doc first (in case of re-init)
    vectorIndex.removeDocument(doc.id);

    const text = buildDocumentText(doc);
    const chunks = await indexDocument(
      doc.id,
      doc.source,
      text,
      doc.domainTags,
      { version: doc.version },
    );

    totalChunks += chunks;
    sources.push(doc.source);
  }

  return {
    indexed: ALL_DOCUMENTS.length,
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
