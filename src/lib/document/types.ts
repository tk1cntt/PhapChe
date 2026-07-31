// ── Document Normalizer Types ──────────────────────────────────

/**
 * Các phase của normalization pipeline.
 */
export type NormalizePhase = 'clean' | 'detect' | 'format';

/**
 * Options điều khiển normalizeMarkdown().
 */
export interface NormalizeOptions {
  /** Các phase cần chạy. Mặc định: ['clean', 'detect', 'format'] */
  phases?: NormalizePhase[];

  /** Phát hiện Điều 1, Điều 2 → ## heading. Mặc định: true */
  detectArticles?: boolean;

  /** Phát hiện Chương, Mục, Phần. Mặc định: true */
  detectSections?: boolean;

  /** Phát hiện Khoản, Điểm. Mặc định: true */
  detectSubItems?: boolean;

  /** Chuẩn hóa list: 1. → ordered, a) → bullet. Mặc định: true */
  normalizeLists?: boolean;

  /** Gộp ≥3 blank lines → 2. Mặc định: true */
  collapseBlankLines?: boolean;

  /** Trim trailing spaces mỗi dòng. Mặc định: true */
  trimTrailing?: boolean;

  /** Unicode NFC normalization. Mặc định: true */
  normalizeUnicode?: boolean;

  /** Giới hạn độ dài output (characters). Không giới hạn nếu undefined. */
  maxLength?: number;
}

/**
 * Kết quả từ normalizeMarkdown().
 */
export interface NormalizeResult {
  /** Markdown đã normalize */
  content: string;

  /** Các pattern đã phát hiện */
  detected: {
    /** Danh sách các Điều đã detect (VD: "Điều 1: NỘI DUNG CÔNG VIỆC") */
    articles: string[];
    /** Danh sách các Chương/Mục/Phần đã detect */
    sections: string[];
    /** Cảnh báo từ quá trình detect */
    warnings: string[];
  };

  /** Thống kê */
  stats: {
    /** Số ký tự input gốc */
    originalChars: number;
    /** Số ký tự sau normalize */
    normalizedChars: number;
    /** Ước lượng token (1 token ≈ 4 chars) */
    estimatedTokens: number;
  };
}

/**
 * Cache entry cho normalized content.
 */
export interface CacheEntry {
  /** SHA-256 hash của raw content */
  hash: string;
  /** Kết quả normalize đầy đủ */
  result: NormalizeResult;
  /** Timestamp khi cache được tạo */
  createdAt: number;
}

/**
 * Kết quả từ MarkItDown converter.
 */
export interface MarkItDownResult {
  /** Markdown output từ MarkItDown */
  markdown: string;
  /** true nếu convert thành công */
  success: boolean;
  /** Thông báo lỗi nếu thất bại */
  error?: string;
  /** Loại converter đã dùng (docx / pdf / xlsx) */
  converter?: string;
}

/**
 * Options mặc định.
 */
export const DEFAULT_OPTIONS: Required<NormalizeOptions> = {
  phases: ['clean', 'detect', 'format'],
  detectArticles: true,
  detectSections: true,
  detectSubItems: true,
  normalizeLists: true,
  collapseBlankLines: true,
  trimTrailing: true,
  normalizeUnicode: true,
  maxLength: 0, // 0 = không giới hạn
};
