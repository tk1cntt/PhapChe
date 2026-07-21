// ── Normalizer Pipeline Orchestrator ──────────────────────────
//
// normalizeMarkdown() kết nối 3 phases:
//   Phase 1 (clean) → Phase 2 (detect) → Phase 3 (format)
//
// Có cache lookup: nếu raw content đã normalize trước đó,
// trả về cached result (keyed by SHA-256).

import { NormalizeOptions, DEFAULT_OPTIONS, NormalizeResult, NormalizePhase } from '../types';
import { normalizeCache } from '../cache';
import { phase1Clean } from './cleaners';
import { phase2Detect } from './detectors';
import { phase3Format } from './formatters';
import { createHash } from 'crypto';

// ── Helpers ───────────────────────────────────────────────────

/**
 * Compute SHA-256 hash cho cache key.
 * Dùng Node.js crypto (nhanh, không async).
 */
function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf-8').digest('hex');
}

/**
 * Ước lượng token count (1 token ≈ 4 characters cho tiếng Việt).
 */
function estimateTokens(charCount: number): number {
  return Math.ceil(charCount / 4);
}

// ── Main ──────────────────────────────────────────────────────

/**
 * Chuẩn hóa markdown thô thành markdown sạch, có cấu trúc pháp lý.
 *
 * Pipeline: clean → detect → format
 *
 * @param raw - Raw markdown/text từ converter (mammoth, pdf.js, markitdown...)
 * @param options - Tùy chỉnh các phase và detectors
 * @returns NormalizeResult với content đã normalize + metadata
 */
export function normalizeMarkdown(
  raw: string,
  options?: Partial<NormalizeOptions>,
): NormalizeResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalChars = raw.length;

  // Early exit: empty input
  if (!raw || raw.trim().length === 0) {
    return {
      content: '',
      detected: { articles: [], sections: [], errors: [] },
      stats: { originalChars: 0, normalizedChars: 0, estimatedTokens: 0 },
    };
  }

  // Cache lookup
  const hash = sha256(raw);
  const cached = normalizeCache.get(hash);
  if (cached !== null) {
    return {
      content: cached,
      detected: { articles: [], sections: [], errors: [] },
      stats: {
        originalChars,
        normalizedChars: cached.length,
        estimatedTokens: estimateTokens(cached.length),
      },
    };
  }

  // Determine active phases
  const activePhases: Set<NormalizePhase> = new Set(opts.phases ?? DEFAULT_OPTIONS.phases);

  // Phase 1: Clean
  let result = activePhases.has('clean')
    ? phase1Clean(raw, {
        lineEndings: true,
        noise: true,
        trailing: opts.trimTrailing,
        blankLines: opts.collapseBlankLines,
        unicode: opts.normalizeUnicode,
        controlChars: true,
      })
    : raw;

  // Phase 2: Detect
  let articles: string[] = [];
  let sections: string[] = [];
  const detectErrors: string[] = [];

  if (activePhases.has('detect')) {
    const detectResult = phase2Detect(result, {
      articles: opts.detectArticles,
      sections: opts.detectSections,
      subItems: opts.detectSubItems,
      lists: opts.normalizeLists,
      allCapsHeadings: true,
    });
    result = detectResult.transformed;
    articles = detectResult.articles;
    sections = detectResult.sections;
  }

  // Phase 3: Format
  if (activePhases.has('format')) {
    result = phase3Format(result, {
      headingHierarchy: true,
      listMarkers: true,
      blankLineSpacing: true,
      htmlEntities: true,
    });
  }

  // Truncate nếu vượt maxLength
  const maxLen = opts.maxLength && opts.maxLength > 0 ? opts.maxLength : Infinity;
  if (result.length > maxLen) {
    result = result.slice(0, maxLen) + '\n\n... [đã cắt bớt]';
    detectErrors.push(`Content truncated from ${result.length} to ${maxLen} characters`);
  }

  // Ensure trailing newline
  if (result && !result.endsWith('\n')) {
    result += '\n';
  }

  const normalizedChars = result.length;

  // Cache result
  normalizeCache.set(hash, result);

  return {
    content: result,
    detected: { articles, sections, errors: detectErrors },
    stats: {
      originalChars,
      normalizedChars,
      estimatedTokens: estimateTokens(normalizedChars),
    },
  };
}
