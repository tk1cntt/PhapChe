// ── Phase 2: Legal Document Structure Detectors ───────────────
//
// Phát hiện và transform cấu trúc đặc thù văn bản pháp lý Việt Nam:
// Điều, Chương, Mục, Phần, Khoản, Điểm, danh sách.

export interface DetectResult {
  /** Text đã transform */
  transformed: string;
  /** Các Điều đã phát hiện */
  articles: string[];
  /** Các Chương/Mục/Phần đã phát hiện */
  sections: string[];
}

export interface DetectOptions {
  articles?: boolean;
  sections?: boolean;
  subItems?: boolean;
  lists?: boolean;
  allCapsHeadings?: boolean;
}

const DEFAULT_DETECT_OPTIONS: Required<DetectOptions> = {
  articles: true,
  sections: true,
  subItems: true,
  lists: true,
  allCapsHeadings: true,
};

// ── Patterns ──────────────────────────────────────────────────

/** Điều X hoặc ĐIỀU X: text — phổ biến nhất trong hợp đồng */
const ARTICLE_RE = /^(ĐIỀU|Điều|điều)\s+(\d+)\s*[:.\-–—]?\s*(.+)$/gim;

/** Chương, Mục, Phần — dùng số La Mã hoặc Ả Rập */
const SECTION_RE = /^(CHƯƠNG|Chương|chương|MỤC|Mục|mục|PHẦN|Phần|phần)\s+([IVXLCDM\d]+)\s*[:.]?\s*(.+)$/gim;

/** Khoản X hoặc khoản X */
const SUBSECTION_RE = /^(Khoản|khoản)\s+(\d+)[.:]?(?:\s|$)/gim;

/** Điểm a), b), c) hoặc a), b), c) — đã được detect từ đầu dòng */
const POINT_RE = /^(\s*)[a-đ]\)\s+/gim;

/** Số thứ tự 1., 2., 3. — sau heading (ordered list) */
const NUMBERED_LIST_RE = /^(\s*)(\d+)[.)]\s+(?!\d)/gm;

/** ALL CAPS heading: dòng ngắn (8-70 chars), toàn chữ in hoa tiếng Việt */
const ALL_CAPS_RE = /^([A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶĐÈÉẺẼẸÊỀẾỂỄỆÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ\s\d][^a-zàáảãạâầấẩẫậăằắẳẵặđèéẻẽẹêềếểễệòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]+)$/gm;

// ── Detectors ─────────────────────────────────────────────────

/**
 * Phát hiện Điều X: tạo ## heading.
 * VD: "ĐIỀU 2 :   THỜI HẠN" → "## Điều 2: THỜI HẠN"
 */
export function detectArticles(text: string): { transformed: string; articles: string[] } {
  const articles: string[] = [];

  const transformed = text.replace(ARTICLE_RE, (_match, _prefix, num, title) => {
    const label = `Điều ${num}: ${title.trim()}`;
    articles.push(label);
    return `## ${label}`;
  });

  return { transformed, articles };
}

/**
 * Phát hiện Chương/Mục/Phần: tạo ## heading.
 * VD: "CHƯƠNG I: QUY ĐỊNH CHUNG" → "## Chương I: QUY ĐỊNH CHUNG"
 */
export function detectSections(text: string): { transformed: string; sections: string[] } {
  const sections: string[] = [];

  const transformed = text.replace(SECTION_RE, (_match, prefix, num, title) => {
    const label = `${prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase()} ${num.toUpperCase()}: ${title.trim()}`;
    sections.push(label);
    return `## ${label}`;
  });

  return { transformed, sections };
}

/**
 * Phát hiện Khoản X: tạo ### heading.
 * VD: "Khoản 1" hoặc "khoản 2." → "### Khoản 1"
 */
export function detectSubItems(text: string): string {
  return text.replace(SUBSECTION_RE, (_match, prefix, num) => {
    const label = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
    return `### ${label} ${num}`;
  });
}

/**
 * Phát hiện Điểm a), b), c)... → bullet list.
 * VD: "a) Nội dung..." → "- Nội dung..."
 */
export function detectPoints(text: string): string {
  return text.replace(POINT_RE, '$1- ');
}

/**
 * Chuẩn hóa số thứ tự thành ordered list.
 * Chỉ áp dụng cho dòng bắt đầu bằng số (sau heading).
 */
export function normalizeLists(text: string): string {
  return text.replace(NUMBERED_LIST_RE, '$1$2. ');
}

/**
 * ALL CAPS heading → ### heading nếu dòng ngắn và chưa có #.
 * Chỉ transform nếu dòng KHÔNG đã có markdown heading.
 */
export function detectAllCapsHeadings(text: string): string {
  return text.replace(ALL_CAPS_RE, (match) => {
    const trimmed = match.trim();
    // Bỏ qua nếu đã là heading markdown
    if (trimmed.startsWith('#')) return match;
    // Bỏ qua nếu quá ngắn (< 8 chars) hoặc quá dài (> 70 chars)
    if (trimmed.length < 8 || trimmed.length > 70) return match;
    return `### ${trimmed}`;
  });
}

// ── Orchestrator ──────────────────────────────────────────────

/**
 * Chạy toàn bộ Phase 2 detectors.
 * Thứ tự: articles → sections → subItems → points → lists → allCaps
 */
export function phase2Detect(text: string, options?: DetectOptions): DetectResult {
  const opts = { ...DEFAULT_DETECT_OPTIONS, ...options };
  let result = text;
  let articles: string[] = [];
  let sections: string[] = [];

  if (opts.articles) {
    const r = detectArticles(result);
    result = r.transformed;
    articles = r.articles;
  }

  if (opts.sections) {
    const r = detectSections(result);
    result = r.transformed;
    sections = r.sections;
  }

  if (opts.subItems) {
    result = detectSubItems(result);
    result = detectPoints(result);
  }

  if (opts.lists) {
    result = normalizeLists(result);
  }

  if (opts.allCapsHeadings) {
    result = detectAllCapsHeadings(result);
  }

  return { transformed: result, articles, sections };
}
