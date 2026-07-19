/**
 * Legal Knowledge Types
 *
 * Type definitions for structured legal documents used in RAG.
 */

import type { LegalDomain } from '../types';

export interface LegalArticle {
  /** Article number (e.g. "Điều 117") */
  number: string;
  /** Article title */
  title: string;
  /** Full article content (plain Vietnamese text) */
  content: string;
}

export interface LegalChapter {
  /** Chapter title (e.g. "Chương VII — Giao dịch dân sự") */
  title: string;
  /** Articles within this chapter */
  articles: LegalArticle[];
}

export interface LegalKnowledgeDoc {
  /** Unique document identifier */
  id: string;
  /** Source law name */
  source: string;
  /** Legal domains this document covers */
  domainTags: LegalDomain[];
  /** Law version/edition */
  version: string;
  /** Chapters containing articles */
  chapters: LegalChapter[];
}
