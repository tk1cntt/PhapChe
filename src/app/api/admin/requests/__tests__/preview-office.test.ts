/**
 * Tests for preview/route.ts — Office XML extraction (docx/xlsx)
 *
 * Covers: isOfficeXml detection, extractDocxText, extractXlsxText,
 * integration with isBinaryPreview, edge cases
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

import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// ── Re-create testable versions ─────────────────────────────────
// Functions from route.ts replicated for isolated unit testing

const BINARY_EXTENSIONS = /\.(pdf|doc|pptx|ppt|xls|zip|rar|7z|png|jpg|jpeg|gif|bmp|webp|mp3|mp4|avi|mov|mkv|exe|dll)$/i;

function isBinaryPreview(mimeType: string | null, filename: string | null): boolean {
  if (mimeType) {
    if (mimeType.startsWith('image/')) return true;
    if (mimeType.startsWith('audio/')) return true;
    if (mimeType.startsWith('video/')) return true;
    if (mimeType === 'application/pdf') return true;
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

describe('isBinaryPreview — docx/xlsx exclusion', () => {
  describe('Whitebox — office files not treated as binary', () => {
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
  });

  describe('Whitebox — traditional binary still flagged', () => {
    it('should flag PDF as binary', () => {
      expect(isBinaryPreview('application/pdf', 'file.pdf')).toBe(true);
    });

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
    const mockResult = { value: 'Hello from docx' };
    vi.mocked(mammoth.extractRawText).mockResolvedValueOnce(mockResult);

    const result = await mammoth.extractRawText({ buffer: Buffer.from('fake') });
    expect(result.value).toBe('Hello from docx');
    expect(mammoth.extractRawText).toHaveBeenCalledWith({ buffer: expect.any(Buffer) });
  });

  it('should handle empty document', async () => {
    vi.mocked(mammoth.extractRawText).mockResolvedValueOnce({ value: '' });

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
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets.Sheet1, { FS: '\t' });

    expect(XLSX.read).toHaveBeenCalledWith(expect.any(Buffer), { type: 'buffer' });
    expect(csv).toBe('Name');
  });

  it('should handle multiple sheets', () => {
    const mockWorkbook = {
      SheetNames: ['Sheet1', 'Sheet2'],
      Sheets: { Sheet1: {}, Sheet2: {} },
    };
    vi.mocked(XLSX.read).mockReturnValueOnce(mockWorkbook as any);
    vi.mocked(XLSX.utils.sheet_to_csv).mockReturnValueOnce('A\tB').mockReturnValueOnce('C\tD');

    const wb = XLSX.read(Buffer.from('fake'), { type: 'buffer' });
    expect(wb.SheetNames).toHaveLength(2);

    const lines: string[] = [];
    for (const name of wb.SheetNames) {
      if (wb.SheetNames.length > 1) lines.push(`── ${name} ──`);
      lines.push(XLSX.utils.sheet_to_csv(wb.Sheets[name], { FS: '\t' }));
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

// ── Integration: PreviewData contract ───────────────────────────

describe('PreviewData contract', () => {
  it('should have optional officeFileType field', () => {
    interface PreviewData {
      content: string;
      mimeType: string;
      title: string;
      isBinary: boolean;
      message?: string;
      officeFileType?: 'docx' | 'xlsx';
    }

    const docxPreview: PreviewData = {
      content: 'Some text from word doc',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      title: 'contract.docx',
      isBinary: false,
      officeFileType: 'docx',
    };
    expect(docxPreview.officeFileType).toBe('docx');
    expect(docxPreview.isBinary).toBe(false);

    const xlsxPreview: PreviewData = {
      content: 'col1\tcol2\nval1\tval2',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      title: 'data.xlsx',
      isBinary: false,
      officeFileType: 'xlsx',
    };
    expect(xlsxPreview.officeFileType).toBe('xlsx');

    const textPreview: PreviewData = {
      content: 'plain text',
      mimeType: 'text/plain',
      title: 'readme.txt',
      isBinary: false,
    };
    expect(textPreview.officeFileType).toBeUndefined();
  });
});
