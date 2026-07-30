// ── MarkItDown Python CLI Wrapper ─────────────────────────────
//
// Gọi MarkItDown (Python CLI) qua child_process.execFile để convert
// DOCX/PDF/XLSX → Markdown. Có timeout, error handling, và
// lazy detection của markitdown CLI.

import { execFile } from 'child_process';
import { promisify } from 'util';
import type { MarkItDownResult } from './types';

const execFileAsync = promisify(execFile);

// ── Config ────────────────────────────────────────────────────

/** Timeout mặc định cho markitdown CLI (30s) */
const DEFAULT_TIMEOUT_MS = 30_000;

/** Thời gian giữa các lần re-check CLI availability */
const CLI_CHECK_TTL_MS = 60_000;

// ── CLI Detection ─────────────────────────────────────────────

let cliChecked = false;
let cliAvailable = false;
let cliLastChecked = 0;
let cliCheckPromise: Promise<boolean> | null = null;

/**
 * Kiểm tra markitdown CLI có sẵn không.
 * Cache kết quả trong 60s để tránh spawn liên tục.
 * Mutex via cliCheckPromise prevents concurrent duplicate checks.
 */
export async function isMarkItDownAvailable(): Promise<boolean> {
  const now = Date.now();
  if (cliChecked && now - cliLastChecked < CLI_CHECK_TTL_MS) {
    return cliAvailable;
  }

  // Prevent concurrent checks — reuse the in-flight promise
  if (cliCheckPromise) {
    return cliCheckPromise;
  }

  cliCheckPromise = (async () => {
    try {
      await execFileAsync('markitdown', ['--version'], { timeout: 5_000 });
      cliAvailable = true;
    } catch {
      cliAvailable = false;
    }

    cliChecked = true;
    cliLastChecked = now;
    cliCheckPromise = null;
    return cliAvailable;
  })();

  return cliCheckPromise;
}

/**
 * Reset CLI cache — dùng trong tests.
 */
export function resetCliCache(): void {
  cliChecked = false;
  cliAvailable = false;
  cliLastChecked = 0;
  cliCheckPromise = null;
}

// ── Converter ─────────────────────────────────────────────────

/**
 * Convert file qua MarkItDown Python CLI.
 *
 * @param filePath - Đường dẫn tuyệt đối đến file
 * @param mimeType - MIME type của file (để xác định converter)
 * @param filename - Tên file gốc (để xác định extension)
 * @param timeoutMs - Timeout cho subprocess (default: 30s)
 */
export async function convertWithMarkItDown(
  filePath: string,
  mimeType: string,
  filename: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<MarkItDownResult> {
  // Check CLI availability
  const available = await isMarkItDownAvailable();
  if (!available) {
    return {
      markdown: '',
      success: false,
      error: 'MarkItDown CLI not available. Run: pip install markitdown[pdf,docx,xlsx]',
    };
  }

  // Xác định converter type
  const converter = detectConverter(mimeType, filename);

  try {
    const { stdout } = await execFileAsync(
      'markitdown',
      ['--no-plugins', filePath],
      {
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        encoding: 'utf-8',
        windowsHide: true,
      },
    );

    const markdown = stdout.trim();

    if (!markdown) {
      return {
        markdown: '',
        success: false,
        error: `MarkItDown returned empty output for ${converter} file`,
        converter,
      };
    }

    return {
      markdown,
      success: true,
      converter,
    };
  } catch (err) {
    const error = err as NodeJS.ErrnoException & { killed?: boolean };

    // Handle specific error types
    if (error.killed && error.code === null) {
      return {
        markdown: '',
        success: false,
        error: `MarkItDown timed out after ${timeoutMs}ms for ${converter} file`,
        converter,
      };
    }

    return {
      markdown: '',
      success: false,
      error: `MarkItDown error for ${converter}: ${error.message}`,
      converter,
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * Xác định converter type từ MIME type + filename extension.
 */
function detectConverter(mimeType: string, filename: string): string {
  const mime = mimeType.toLowerCase();
  const ext = filename.toLowerCase();

  if (mime.includes('wordprocessingml') || ext.endsWith('.docx')) return 'docx';
  if (mime === 'application/pdf' || ext.endsWith('.pdf')) return 'pdf';
  if (mime.includes('spreadsheetml') || ext.endsWith('.xlsx')) return 'xlsx';
  if (mime.includes('presentationml') || ext.endsWith('.pptx')) return 'pptx';

  return 'unknown';
}
