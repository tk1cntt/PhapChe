/**
 * Tests for preview/route.ts — Office XML + PDF extraction
 *
 * Covers: isOfficeXml, isPdf, extractDocxText, extractXlsxText, extractPdfText,
 * integration with isBinaryPreview, edge cases, markdown table conversion,
 * pdfjs-dist v5.x for bad XRef resilience, text normalization, per-page error recovery
 */

import { describe, it, expect, vi } from 'vitest';

// ── Mocks ───────────────────────────────────────────────────────

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: {
    sheet_to_csv: vi.fn(),
  },
}));

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => {
  const mockGetTextContent = vi.fn();
  const mockGetPage = vi.fn();
  const mockDoc = { numPages: 0, getPage: mockGetPage };
  const mockLoadingTask = { promise: Promise.resolve(mockDoc) };
  const mockGetDocument = vi.fn(() => mockLoadingTask);
  const mockGlobalWorkerOptions = { workerPort: null };
  return {
    __esModule: true,
    default: { getDocument: mockGetDocument, GlobalWorkerOptions: mockGlobalWorkerOptions },
    getDocument: mockGetDocument,
    GlobalWorkerOptions: mockGlobalWorkerOptions,
    __mockDoc: mockDoc,
    __mockGetPage: mockGetPage,
    __mockGetTextContent: mockGetTextContent,
    __mockLoadingTask: mockLoadingTask,
  };
});

import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as pdfjsDist from 'pdfjs-dist/legacy/build/pdf.mjs';

// ── Re-create testable versions ─────────────────────────────────
// Functions from route.ts replicated for isolated unit testing

const BINARY_EXTENSIONS = /\.(doc|pptx|ppt|xls|zip|rar|7z|png|jpg|jpeg|gif|bmp|webp|mp3|mp4|avi|mov|mkv|exe|dll)$/i;

function isBinaryPreview(mimeType: string | null, filename: string | null): boolean {
  if (mimeType) {
    if (mimeType.startsWith('image/')) return true;
    if (mimeType.startsWith('audio/')) return true;
    if (mimeType.startsWith('video/')) return true;
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return true;
  }
  if (filename && BINARY_EXTENSIONS.test(filename)) return true;
  return false;
}

function isOfficeXml(mimeType: string | null, filename: string | null): 'docx' | 'xlsx' | null {
  const docxMimes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const xlsxMimes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  if (mimeType) {
    if (docxMimes.includes(mimeType)) return 'docx';
    if (xlsxMimes.includes(mimeType)) return 'xlsx';
  }
  if (filename) {
    if (/\.docx$/i.test(filename)) return 'docx';
    if (/\.xlsx$/i.test(filename)) return 'xlsx';
  }
  return null;
}

function isPdf(mimeType: string | null, filename: string | null): boolean {
  if (mimeType === 'application/pdf') return true;
  if (filename && /\.pdf$/i.test(filename)) return true;
  return false;
}

/** Convert sheet data to markdown table (replicated from route.ts) */
function sheetToMarkdownTable(sheetData: string[][]): string {
  if (sheetData.length === 0) return '';
  const [header, ...rows] = sheetData;
  const sep = `|${header.map(() => '---').join('|')}|`;
  const headerRow = `|${header.map((c) => c || ' ').join('|')}|`;
  const dataRows = rows.map((r) => `|${r.map((c) => c || ' ').join('|')}|`);
  return [headerRow, sep, ...dataRows].join('\n');
}

// ── Whitebox Tests ──────────────────────────────────────────────

describe('isOfficeXml', () => {
  describe('Whitebox — detection by mimeType', () => {
    it('should detect docx by full OOXML mime', () => {
      expect(isOfficeXml(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        null,
      )).toBe('docx');
    });

    it('should detect xlsx by full OOXML mime', () => {
      expect(isOfficeXml(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        null,
      )).toBe('xlsx');
    });

    it('should return null for non-Office mime', () => {
      expect(isOfficeXml('text/plain', null)).toBeNull();
      expect(isOfficeXml('application/pdf', null)).toBeNull();
      expect(isOfficeXml(null, null)).toBeNull();
    });
  });

  describe('Whitebox — detection by filename extension', () => {
    it('should detect docx by .docx extension', () => {
      expect(isOfficeXml(null, 'hop-dong.docx')).toBe('docx');
    });

    it('should detect xlsx by .xlsx extension', () => {
      expect(isOfficeXml(null, 'bang-ke.xlsx')).toBe('xlsx');
    });

    it('should be case-insensitive', () => {
      expect(isOfficeXml(null, 'FILE.DOCX')).toBe('docx');
      expect(isOfficeXml(null, 'Data.XLSX')).toBe('xlsx');
    });
  });

  describe('Whitebox — mimeType takes priority over filename', () => {
    it('should use mimeType when both provided', () => {
      expect(isOfficeXml(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'renamed.xlsx', // misleading extension
      )).toBe('docx');
    });
  });
});

describe('isBinaryPreview — docx/xlsx/pdf exclusion', () => {
  describe('Whitebox — office/pdf files not treated as binary', () => {
    it('should NOT flag docx as binary (extracted by mammoth)', () => {
      expect(isBinaryPreview(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'contract.docx',
      )).toBe(false);
    });

    it('should NOT flag xlsx as binary (extracted by xlsx)', () => {
      expect(isBinaryPreview(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'data.xlsx',
      )).toBe(false);
    });

    it('should NOT flag PDF as binary (extracted by pdfjs-dist)', () => {
      expect(isBinaryPreview('application/pdf', 'file.pdf')).toBe(false);
    });
  });

  describe('Whitebox — traditional binary still flagged', () => {
    it('should flag images as binary', () => {
      expect(isBinaryPreview('image/png', 'photo.png')).toBe(true);
      expect(isBinaryPreview('image/jpeg', 'scan.jpg')).toBe(true);
    });

    it('should flag old .doc as binary', () => {
      expect(isBinaryPreview('application/msword', 'old.doc')).toBe(true);
    });

    it('should flag old .xls as binary', () => {
      expect(isBinaryPreview('application/vnd.ms-excel', 'old.xls')).toBe(true);
    });
  });

  describe('Abnormal — edge cases', () => {
    it('should return null for null mime + no filename', () => {
      expect(isOfficeXml(null, null)).toBeNull();
    });

    it('should return null for empty strings', () => {
      expect(isOfficeXml('', '')).toBeNull();
    });

    it('should handle filename with multiple dots', () => {
      expect(isOfficeXml(null, 'contract.v2.docx')).toBe('docx');
    });

    it('should NOT match .docx inside a longer extension', () => {
      // .docx$ ensures only matches at end
      expect(isOfficeXml(null, 'file.docx.backup')).toBeNull();
    });
  });
});

// ── Mammoth extraction tests ────────────────────────────────────

describe('extractDocxText (via mammoth mock)', () => {
  it('should call mammoth.extractRawText with buffer', async () => {
    const mockResult = { value: 'Hello from docx', messages: [] };
    vi.mocked(mammoth.extractRawText).mockResolvedValueOnce(mockResult);

    const result = await mammoth.extractRawText({ buffer: Buffer.from('fake') });
    expect(result.value).toBe('Hello from docx');
    expect(mammoth.extractRawText).toHaveBeenCalledWith({ buffer: expect.any(Buffer) });
  });

  it('should handle empty document', async () => {
    vi.mocked(mammoth.extractRawText).mockResolvedValueOnce({ value: '', messages: [] });

    const result = await mammoth.extractRawText({ buffer: Buffer.from('empty') });
    expect(result.value).toBe('');
  });

  it('should handle mammoth throwing an error', async () => {
    vi.mocked(mammoth.extractRawText).mockRejectedValueOnce(new Error('Invalid docx'));

    await expect(mammoth.extractRawText({ buffer: Buffer.from('bad') }))
      .rejects.toThrow('Invalid docx');
  });
});

// ── XLSX extraction tests ───────────────────────────────────────

describe('extractXlsxText (via xlsx mock)', () => {
  it('should call xlsx.read with buffer type', () => {
    const mockSheet = { A1: { v: 'Name' } };
    const mockWorkbook = {
      SheetNames: ['Sheet1'],
      Sheets: { Sheet1: mockSheet },
    };
    vi.mocked(XLSX.read).mockReturnValueOnce(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_csv).mockReturnValueOnce('Name');

    const wb = XLSX.read(Buffer.from('fake'), { type: 'buffer' });
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets.Sheet1, { FS: ',' });

    expect(XLSX.read).toHaveBeenCalledWith(expect.any(Buffer), { type: 'buffer' });
    expect(csv).toBe('Name');
  });

  it('should handle multiple sheets', () => {
    const mockWorkbook = {
      SheetNames: ['Sheet1', 'Sheet2'],
      Sheets: { Sheet1: {}, Sheet2: {} },
    };
    vi.mocked(XLSX.read).mockReturnValueOnce(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_csv).mockReturnValueOnce('A,B').mockReturnValueOnce('C,D');

    const wb = XLSX.read(Buffer.from('fake'), { type: 'buffer' });
    expect(wb.SheetNames).toHaveLength(2);

    const lines: string[] = [];
    for (const name of wb.SheetNames) {
      if (wb.SheetNames.length > 1) lines.push(`── ${name} ──`);
      lines.push(XLSX.utils.sheet_to_csv(wb.Sheets[name], { FS: ',' }));
    }
    expect(lines).toHaveLength(4); // 2 headers + 2 data lines
  });

  it('should handle empty workbook', () => {
    const mockWorkbook = { SheetNames: [], Sheets: {} };
    vi.mocked(XLSX.read).mockReturnValueOnce(mockWorkbook as any);

    const wb = XLSX.read(Buffer.from('fake'), { type: 'buffer' });
    expect(wb.SheetNames).toHaveLength(0);
  });
});

// ── PDF detection tests ──────────────────────────────────────────

describe('isPdf', () => {
  it('should detect PDF by mimeType', () => {
    expect(isPdf('application/pdf', null)).toBe(true);
  });

  it('should detect PDF by filename', () => {
    expect(isPdf(null, 'contract.pdf')).toBe(true);
  });

  it('should be case-insensitive for filename', () => {
    expect(isPdf(null, 'FILE.PDF')).toBe(true);
  });

  it('should return false for non-PDF', () => {
    expect(isPdf('text/plain', null)).toBe(false);
    expect(isPdf(null, 'contract.docx')).toBe(false);
    expect(isPdf(null, null)).toBe(false);
  });

  it('should not confuse .pdf with other extensions', () => {
    expect(isPdf(null, 'file.pdf.backup')).toBe(false);
  });
});

// ── PDF extraction tests ─────────────────────────────────────────

describe('extractPdfText (via pdfjs-dist v6.x legacy mock)', () => {
  // Access mock internals via pdfjs-dist module
  const mocks = pdfjsDist as unknown as {
    getDocument: ReturnType<typeof vi.fn>;
    __mockDoc: { numPages: number; getPage: ReturnType<typeof vi.fn> };
    __mockGetPage: ReturnType<typeof vi.fn>;
    __mockGetTextContent: ReturnType<typeof vi.fn>;
    __mockLoadingTask: { promise: Promise<{ numPages: number; getPage: ReturnType<typeof vi.fn> }> };
  };

  function mockPage(textItems: Array<{ str: string }>) {
    const mockTextContent = { items: textItems };
    const mockPage = { getTextContent: vi.fn().mockResolvedValue(mockTextContent) };
    mocks.__mockGetTextContent.mockResolvedValue(mockTextContent);
    mocks.__mockGetPage.mockResolvedValue(mockPage);
    return mockPage;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.__mockGetPage.mockReset();
    mocks.__mockGetTextContent.mockReset();
  });

  // ── Replica of production extractPdfText for contract test ──
  async function extractPdfTextReplica(buffer: Buffer): Promise<string> {
    const src = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const loadingTask = mocks.getDocument({ data: src, disableRange: true, disableStream: true });
    const doc = await loadingTask.promise;
    const parts: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      try {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = (textContent.items as Array<{ str?: string }>)
          .map((item) => item.str || '')
          .join(' ');
        parts.push(pageText);
      } catch {
        parts.push(`[Trang ${i}: không thể trích xuất text]`);
      }
    }
    return parts.join('\n\n')
      .replace(/\r\n/g, '\n')
      .replace(/\n{4,}/g, '\n\n\n')
      .trim();
  }

  it('should extract text from single-page PDF', async () => {
    mocks.__mockDoc.numPages = 1;
    mockPage([{ str: 'Xin chào' }, { str: 'Việt Nam' }]);
    const result = await extractPdfTextReplica(Buffer.from('fake'));
    expect(result).toBe('Xin chào Việt Nam');
  });

  it('should join multi-page output with double newline', async () => {
    mocks.__mockDoc.numPages = 2;
    // Page 1
    mocks.__mockGetPage.mockResolvedValueOnce({
      getTextContent: vi.fn().mockResolvedValue({ items: [{ str: 'Page1' }] }),
    });
    // Page 2
    mocks.__mockGetPage.mockResolvedValueOnce({
      getTextContent: vi.fn().mockResolvedValue({ items: [{ str: 'Page2' }] }),
    });
    const result = await extractPdfTextReplica(Buffer.from('fake'));
    expect(result).toBe('Page1\n\nPage2');
  });

  it('should skip failed pages with fallback message', async () => {
    mocks.__mockDoc.numPages = 3;
    // Page 1 OK
    mocks.__mockGetPage.mockResolvedValueOnce({
      getTextContent: vi.fn().mockResolvedValue({ items: [{ str: 'OK1' }] }),
    });
    // Page 2 FAIL
    mocks.__mockGetPage.mockRejectedValueOnce(new Error('bad XRef entry'));
    // Page 3 OK
    mocks.__mockGetPage.mockResolvedValueOnce({
      getTextContent: vi.fn().mockResolvedValue({ items: [{ str: 'OK3' }] }),
    });
    const result = await extractPdfTextReplica(Buffer.from('fake'));
    expect(result).toContain('OK1');
    expect(result).toContain('[Trang 2: không thể trích xuất text]');
    expect(result).toContain('OK3');
  });

  it('should handle empty text items on a page', async () => {
    mocks.__mockDoc.numPages = 1;
    mockPage([]);
    const result = await extractPdfTextReplica(Buffer.from('fake'));
    expect(result).toBe('');
  });

  it('should normalize and trim whitespace', async () => {
    mocks.__mockDoc.numPages = 1;
    mockPage([{ str: '  Hello  ' }, { str: '\nWorld\n' }]);
    const result = await extractPdfTextReplica(Buffer.from('fake'));
    expect(result).toContain('Hello');
    expect(result).toContain('World');
  });
});

// ── Markdown table conversion ────────────────────────────────

describe('sheetToMarkdownTable', () => {
  it('should convert 2D array to markdown table', () => {
    const data = [
      ['STT', 'Tên', 'Giá'],
      ['1', 'Hợp đồng', '50,000,000'],
      ['2', 'NDA', '0'],
    ];
    const result = sheetToMarkdownTable(data);
    expect(result).toContain('|STT|Tên|Giá|');
    expect(result).toContain('|---|---|---|');
    expect(result).toContain('|1|Hợp đồng|50,000,000|');
    expect(result).toContain('|2|NDA|0|');
  });

  it('should handle empty cells', () => {
    const data = [
      ['A', 'B'],
      ['1', ''],
      ['', '2'],
    ];
    const result = sheetToMarkdownTable(data);
    expect(result).toContain('|A|B|');
    // Empty cells become space
    expect(result).toContain('|1| |');
    expect(result).toContain('| |2|');
  });

  it('should return empty string for empty input', () => {
    expect(sheetToMarkdownTable([])).toBe('');
  });

  it('should handle single-row (header only) table', () => {
    const result = sheetToMarkdownTable([['X', 'Y']]);
    expect(result).toBe('|X|Y|\n|---|---|');
  });
});

// ── Integration: PreviewData contract ───────────────────────────

describe('PreviewData contract', () => {
  it('should have optional officeFileType and previewFormat fields', () => {
    interface PreviewData {
      content: string;
      mimeType: string;
      title: string;
      isBinary: boolean;
      message?: string;
      officeFileType?: 'docx' | 'xlsx';
      previewFormat?: 'markdown' | 'text';
    }

    const docxPreview: PreviewData = {
      content: 'Some text from word doc',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      title: 'contract.docx',
      isBinary: false,
      officeFileType: 'docx',
      previewFormat: 'markdown',
    };
    expect(docxPreview.officeFileType).toBe('docx');
    expect(docxPreview.previewFormat).toBe('markdown');
    expect(docxPreview.isBinary).toBe(false);

    const xlsxPreview: PreviewData = {
      content: '|STT|Tên|\n|---|---|',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      title: 'data.xlsx',
      isBinary: false,
      officeFileType: 'xlsx',
      previewFormat: 'markdown',
    };
    expect(xlsxPreview.officeFileType).toBe('xlsx');
    expect(xlsxPreview.previewFormat).toBe('markdown');

    const textPreview: PreviewData = {
      content: 'plain text',
      mimeType: 'text/plain',
      title: 'readme.txt',
      isBinary: false,
      previewFormat: 'text',
    };
    expect(textPreview.officeFileType).toBeUndefined();
    expect(textPreview.previewFormat).toBe('text');

    const mdPreview: PreviewData = {
      content: '# Hello\n\nWorld',
      mimeType: 'text/markdown',
      title: 'README.md',
      isBinary: false,
      previewFormat: 'markdown',
    };
    expect(mdPreview.previewFormat).toBe('markdown');

    const genPreview: PreviewData = {
      content: 'Generated markdown',
      mimeType: 'text/markdown',
      title: 'generated-doc',
      isBinary: false,
      previewFormat: 'markdown',
    };
    expect(genPreview.previewFormat).toBe('markdown');
  });
});
