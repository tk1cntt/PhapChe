/**
 * Position Mapper — Map AI-returned text positions to actual document lines.
 *
 * Used in the inline AI review flow:
 *   1. splitMarkdownToLines() — add line numbers for AI consumption
 *   2. fuzzyMatchPosition() — verify AI-returned positions against real document
 */

// ── Line Numbering ─────────────────────────────────────────────

/**
 * Prefix each line with a line number for AI consumption.
 * Format: "1| content..." (1-indexed)
 *
 * Empty lines are preserved (content is empty string after "| ").
 */
export function splitMarkdownToLines(md: string): string {
  if (!md) return '';
  const lines = md.split('\n');
  return lines.map((line, i) => `${i + 1}| ${line}`).join('\n');
}

/**
 * Split numbered output back to raw lines array for position mapping.
 */
export function getLinesArray(md: string): string[] {
  if (!md) return [];
  return md.split('\n');
}

// ── Levenshtein Distance ───────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Use single-row optimization for memory
  const prev = Array.from({ length: n + 1 }, (_, i) => i);
  const curr = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,        // deletion
        curr[j - 1] + 1,    // insertion
        prev[j - 1] + cost, // substitution
      );
    }
    // Swap rows
    for (let j = 0; j <= n; j++) {
      prev[j] = curr[j];
    }
  }

  return prev[n];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// ── Fuzzy Position Matching ────────────────────────────────────

export interface MappedPosition {
  lineStart: number;     // 1-indexed
  lineEnd: number;       // 1-indexed
  confidence: number;    // 0-1
  matchedText: string;   // The actual text found in the document
}

/**
 * Fuzzy-match AI-returned snippet against document lines.
 *
 * Strategy:
 *   1. Try exact match at AI-suggested lineStart
 *   2. Try substring containment within ±20 lines
 *   3. Fall back to best Levenshtein similarity within ±20 lines
 *
 * @param snippet  - The matchedText returned by the AI
 * @param lines    - All document lines (without line number prefix)
 * @param aiLineStart - 1-indexed line start suggested by AI
 * @returns MappedPosition with confidence score
 */
export function fuzzyMatchPosition(
  snippet: string,
  lines: string[],
  aiLineStart: number,
): MappedPosition {
  if (!snippet || lines.length === 0) {
    return { lineStart: 1, lineEnd: 1, confidence: 0, matchedText: '' };
  }

  const normalizedSnippet = snippet.trim();
  if (normalizedSnippet.length === 0) {
    return { lineStart: 1, lineEnd: 1, confidence: 0, matchedText: '' };
  }

  const totalLines = lines.length;

  // Clamp aiLineStart to valid range
  const searchCenter = Math.max(1, Math.min(aiLineStart, totalLines));
  const SEARCH_WINDOW = 20;

  // ── Strategy 1: Exact match at AI-suggested line ──
  const idx = searchCenter - 1; // convert to 0-indexed
  if (idx < totalLines && lines[idx].includes(normalizedSnippet)) {
    return {
      lineStart: searchCenter,
      lineEnd: searchCenter,
      confidence: 1.0,
      matchedText: lines[idx],
    };
  }

  // ── Strategy 2: Substring containment within search window ──
  const searchStart = Math.max(0, idx - SEARCH_WINDOW);
  const searchEnd = Math.min(totalLines, idx + SEARCH_WINDOW + 1);

  for (let i = searchStart; i < searchEnd; i++) {
    if (lines[i].includes(normalizedSnippet)) {
      return {
        lineStart: i + 1,
        lineEnd: i + 1,
        confidence: 0.9,
        matchedText: lines[i],
      };
    }
  }

  // ── Strategy 2b: Multi-line match ──
  // Try matching snippet across consecutive lines
  for (let i = searchStart; i < searchEnd - 1; i++) {
    const twoLines = lines[i] + ' ' + lines[i + 1];
    if (twoLines.includes(normalizedSnippet)) {
      return {
        lineStart: i + 1,
        lineEnd: i + 2,
        confidence: 0.85,
        matchedText: twoLines.substring(0, 200),
      };
    }
    const threeLines = lines[i] + ' ' + lines[i + 1] + ' ' + lines[i + 2];
    if (i < searchEnd - 2 && threeLines.includes(normalizedSnippet)) {
      return {
        lineStart: i + 1,
        lineEnd: i + 3,
        confidence: 0.8,
        matchedText: threeLines.substring(0, 200),
      };
    }
  }

  // ── Strategy 3: Best Levenshtein similarity within window ──
  let bestScore = 0;
  let bestIdx = idx;
  let bestText = '';

  for (let i = searchStart; i < searchEnd; i++) {
    // Only try lines that have some character overlap
    const sim = similarity(normalizedSnippet, lines[i]);
    if (sim > bestScore) {
      bestScore = sim;
      bestIdx = i;
      bestText = lines[i];
    }
  }

  // Require minimum similarity to accept
  const MIN_SIMILARITY = 0.3;
  if (bestScore >= MIN_SIMILARITY) {
    return {
      lineStart: bestIdx + 1,
      lineEnd: bestIdx + 1,
      confidence: Math.round(bestScore * 100) / 100,
      matchedText: bestText,
    };
  }

  // ── Fallback: return AI suggestion with zero confidence ──
  return {
    lineStart: searchCenter,
    lineEnd: searchCenter,
    confidence: 0,
    matchedText: lines[idx] ?? '',
  };
}
