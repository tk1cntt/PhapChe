/**
 * Annotation Content Parser — Parse AI review content into structured sections.
 *
 * AI returns content in markdown format:
 *   **Vấn đề:** <text>
 *   **Đề xuất:** <text>
 *   **Căn cứ:** <text>
 *
 * This parser handles multi-line content, missing sections, and edge cases.
 */

export interface AiAnnotationSection {
  key: string;
  label: string;
  content: string;
}

export interface ParsedAnnotation {
  sections: AiAnnotationSection[];
  /** Raw content if parsing fails */
  raw?: string;
}

const SECTION_META: Record<string, { label: string; order: number }> = {
  'Vấn đề':    { label: 'Vấn đề', order: 0 },
  'Issue':     { label: 'Issue', order: 0 },
  'Đề xuất':    { label: 'Đề xuất', order: 1 },
  'Recommendation': { label: 'Recommendation', order: 1 },
  'Căn cứ':     { label: 'Căn cứ pháp lý', order: 2 },
  'Legal Basis':   { label: 'Legal Basis', order: 2 },
};

/**
 * Parse raw annotation content into structured sections.
 * Handles markdown bold markers (**Section:** text),
 * sections spanning multiple lines, and mixed languages.
 */
function buildSectionRegex(): RegExp {
  const labelPattern = Object.keys(SECTION_META).join('|');
  return new RegExp(`\\*{2}(${labelPattern})\\*{0,2}:\\s*`, 'gi');
}

export function parseAiAnnotationContent(content: string): ParsedAnnotation {
  if (!content || !content.trim()) {
    return { sections: [], raw: content || '' };
  }

  // Match sections: **Label:** followed by content until next **Label:** or EOL
  const sectionRegex = buildSectionRegex();
  const matches: Array<{ label: string; index: number; end: number }> = [];
  let m: RegExpExecArray | null;

  // Collect all section markers
  while ((m = sectionRegex.exec(content)) !== null) {
    matches.push({
      label: m[1],
      index: m.index,
      end: m.index + m[0].length,
    });
  }

  // No section markers found → raw text
  if (matches.length === 0) {
    return { sections: [], raw: content.trim() };
  }

  // Extract text between markers
  const sections: Array<AiAnnotationSection & { _order: number }> = [];

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextMarker = matches[i + 1];
    const contentStart = current.end;
    const contentEnd = nextMarker ? nextMarker.index : content.length;

    let sectionText = content.slice(contentStart, contentEnd).trim();

    // Clean up leading/trailing markers/separators
    sectionText = sectionText.replace(/^\*{1,2}\s*/, '').replace(/\s*\*{1,2}\s*$/, '').trim();

    if (sectionText) {
      const meta = SECTION_META[current.label] || { label: current.label, order: 99 };
      sections.push({
        key: current.label.toLowerCase().replace(/\s+/g, '-'),
        label: meta.label,
        content: sectionText,
        _order: meta.order,
      });
    }
  }

  // Sort by defined order (stored during construction — O(1) per compare)
  sections.sort((a, b) => a._order - b._order);

  return { sections, raw: content };
}

/**
 * Extract the main issue text from content — used for tooltips/summaries.
 */
export function extractIssueSummary(content: string, maxLen = 100): string {
  const parsed = parseAiAnnotationContent(content);
  const issueSection = parsed.sections.find(
    s => s.label === 'Vấn đề' || s.label === 'Issue'
  );
  const text = issueSection?.content || parsed.raw || content;
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}
