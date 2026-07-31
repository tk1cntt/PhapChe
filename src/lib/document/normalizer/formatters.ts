// ── Phase 3: Markdown Formatters ──────────────────────────────
//
// Format cuối cùng: chuẩn hóa heading hierarchy, list markers,
// blank line spacing, HTML entities.

export interface FormatOptions {
  headingHierarchy?: boolean;
  listMarkers?: boolean;
  blankLineSpacing?: boolean;
  htmlEntities?: boolean;
}

const DEFAULT_FORMAT_OPTIONS: Required<FormatOptions> = {
  headingHierarchy: true,
  listMarkers: true,
  blankLineSpacing: true,
  htmlEntities: true,
};

/**
 * Đảm bảo heading hierarchy hợp lý:
 * - Heading đầu tiên trong doc → ## (level 2)
 * - Bỏ heading level 1 (#) nếu không phải title duy nhất
 * - Điều chỉnh ### nếu chỉ có ## duy nhất
 */
export function formatHeadingHierarchy(text: string): string {
  const lines = text.split('\n');

  let hasH1 = false;
  let hasH2 = false;
  let hasH3 = false;

  for (const line of lines) {
    if (/^#\s/.test(line)) hasH1 = true;
    if (/^##\s/.test(line)) hasH2 = true;
    if (/^###\s/.test(line)) hasH3 = true;
  }

  // If only ### exists without ## and # → upgrade ### → ##
  if (hasH3 && !hasH2 && !hasH1) {
    return lines.map((l) =>
      /^###\s/.test(l) ? l.replace(/^###/, '##') : l,
    ).join('\n');
  }

  // If # exists alongside other headings, demote # → ##
  if (hasH1 && (hasH2 || hasH3)) {
    return lines.map((l) =>
      /^#\s/.test(l) ? l.replace(/^#\s/, '## ') : l,
    ).join('\n');
  }

  return text;
}

/**
 * Chuẩn hóa list markers:
 * - `- ` cho unordered items
 * - `1. ` cho ordered items
 * - Loại bỏ các marker không chuẩn (* → -)
 */
export function formatListMarkers(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      // * item → - item
      if (/^\s*\*\s+/.test(line) && !/^\s*\*\s*\*/.test(line)) {
        return line.replace(/^\s*\*\s+/, (m) => m.replace(/\*/, '-'));
      }
      return line;
    })
    .join('\n');
}

/**
 * Đảm bảo blank line trước và sau headings và lists.
 * - Trước heading (##, ###, #): ít nhất 1 blank line
 * - Sau heading: 1 blank line
 * - Trước list block: 1 blank line
 */
export function formatBlankLineSpacing(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prevNonEmpty = i > 0 && lines[i - 1].trim() !== '';
    const isHeading = /^#{1,3}\s/.test(line);
    const isListItem = /^\s*[-*+]\s/.test(line) || /^\s*\d+[.)]\s/.test(line);
    const prevIsBlank = i > 0 && lines[i - 1].trim() === '';
    const prevIsHeading = i > 0 && /^#{1,3}\s/.test(lines[i - 1]);

    // Add blank line before heading if previous line is not blank and not heading
    if (isHeading && prevNonEmpty && !prevIsBlank && !prevIsHeading) {
      result.push('');
    }

    // Add blank line before list start (when previous is not blank and not list)
    if (isListItem && prevNonEmpty && !prevIsBlank) {
      const prevIsList = /^\s*[-*+]\s/.test(lines[i - 1]) || /^\s*\d+[.)]\s/.test(lines[i - 1]);
      if (!prevIsList && !prevIsHeading) {
        result.push('');
      }
    }

    result.push(line);
  }

  return result.join('\n');
}

/**
 * Escape HTML entities thường gặp trong text.
 */
export function escapeHtmlEntities(text: string): string {
  return text
    .replace(/&(?!amp;|lt;|gt;|quot;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Orchestrator ──────────────────────────────────────────────

/**
 * Chạy toàn bộ Phase 3 formatters.
 */
export function phase3Format(text: string, options?: FormatOptions): string {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  let result = text;

  if (opts.htmlEntities) result = escapeHtmlEntities(result);
  if (opts.headingHierarchy) result = formatHeadingHierarchy(result);
  if (opts.listMarkers) result = formatListMarkers(result);
  if (opts.blankLineSpacing) result = formatBlankLineSpacing(result);

  return result;
}
