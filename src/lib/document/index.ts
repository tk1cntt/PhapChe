// ── Document Conversion & Normalization ───────────────────────
//
// Tầng 1: MarkItDown Python CLI wrapper — convert DOCX/PDF/XLSX → Markdown
// Tầng 2: Normalizer pipeline — clean → detect structure → format
//
// Usage:
//   import { normalizeMarkdown, convertWithMarkItDown } from '@/lib/document';

export { normalizeMarkdown } from './normalizer/pipeline';
export { convertWithMarkItDown, isMarkItDownAvailable, resetCliCache } from './markitdown';
export { normalizeCache } from './cache';
export type {
  NormalizeOptions,
  NormalizeResult,
  NormalizePhase,
  CacheEntry,
  MarkItDownResult,
} from './types';
