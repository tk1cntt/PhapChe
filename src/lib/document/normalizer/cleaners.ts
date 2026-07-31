// ── Phase 1: Text Cleaners ─────────────────────────────────────
//
// 6 low-level text cleaning functions.
// Chạy trước khi detect cấu trúc pháp lý.
// Mỗi function là pure — không phụ thuộc state ngoài.

/**
 * Chuẩn hóa line endings: \r\n → \n, \r → \n.
 */
export function normalizeLineEndings(text: string): string {
  if (text == null) return '';
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Xóa BOM, zero-width characters, non-breaking spaces, soft hyphens.
 */
export function stripNoise(text: string): string {
  return text
    .replace(/^﻿/, '')            // BOM
    .replace(/​/g, '')            // Zero-width space
    .replace(/‌/g, '')            // Zero-width non-joiner
    .replace(/‍/g, '')            // Zero-width joiner
    .replace(/­/g, '')            // Soft hyphen
    .replace(/ /g, ' ')           // Non-breaking space → regular
    .replace(/ /g, ' ')           // Narrow non-breaking space → regular
    .replace(/﻿/g, '')            // BOM (anywhere)
    .replace(/‎/g, '')            // LTR mark
    .replace(/‏/g, '');           // RTL mark
}

/**
 * Trim trailing spaces mỗi dòng.
 */
export function trimTrailingWhitespace(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');
}

/**
 * Gộp quá nhiều blank lines:
 * - ≥3 blank lines → 2 blank lines (1 paragraph gap)
 * - Trim blank lines ở đầu và cuối text
 */
export function collapseBlankLines(text: string): string {
  if (text == null) return '';
  const result = text
    .replace(/\n{4,}/g, '\n\n\n')      // 4+ → 3
    .replace(/\n{3,}/g, '\n\n')        // 3 → 2
    .replace(/^\n+/, '')               // trim leading blank lines
    .replace(/\n+$/, '');              // trim trailing blank lines
  return result ? result + '\n' : result;
}

/**
 * Unicode NFC normalization cho tiếng Việt.
 * Tổ hợp dấu (NFD) → dựng sẵn (NFC).
 */
export function normalizeUnicode(text: string): string {
  return text.normalize('NFC');
}

/**
 * Xóa control characters không printable
 * (giữ lại newline, tab, carriage return).
 */
export function stripControlChars(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
}

// ── Orchestrator ──────────────────────────────────────────────

export interface CleanOptions {
  lineEndings?: boolean;
  noise?: boolean;
  trailing?: boolean;
  blankLines?: boolean;
  unicode?: boolean;
  controlChars?: boolean;
}

const DEFAULT_CLEAN_OPTIONS: Required<CleanOptions> = {
  lineEndings: true,
  noise: true,
  trailing: true,
  blankLines: true,
  unicode: true,
  controlChars: true,
};

/**
 * Chạy toàn bộ Phase 1 cleaners theo thứ tự tối ưu.
 */
export function phase1Clean(text: string, options?: CleanOptions): string {
  if (text == null || typeof text !== 'string') return '';
  const opts = { ...DEFAULT_CLEAN_OPTIONS, ...options };

  let result = text;

  if (opts.lineEndings) result = normalizeLineEndings(result);
  if (opts.noise) result = stripNoise(result);
  if (opts.unicode) result = normalizeUnicode(result);
  if (opts.controlChars) result = stripControlChars(result);
  if (opts.trailing) result = trimTrailingWhitespace(result);
  if (opts.blankLines) result = collapseBlankLines(result);

  return result;
}
