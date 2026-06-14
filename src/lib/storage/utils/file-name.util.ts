/**
 * File Name Utility
 *
 * Sanitizes and generates safe file names for storage.
 * Never trust original file names from users.
 */

import { isAllowedMimeType, type AllowedMimeType } from '../types';

/**
 * Characters that are always removed from file names
 */
const FORBIDDEN_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;

/**
 * Reserved Windows file names (without extension)
 */
const WINDOWS_RESERVED_NAMES = new Set([
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
]);

/**
 * Sanitize a file name by removing dangerous characters and reserved names.
 *
 * @param originalName - The original file name from user upload
 * @returns Sanitized file name safe for storage
 */
export function sanitizeFileName(originalName: string): string {
  if (!originalName || typeof originalName !== 'string') {
    return 'unnamed_file';
  }

  // Remove forbidden characters
  let sanitized = originalName.replace(FORBIDDEN_CHARS, '_');

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '');

  // Replace multiple consecutive spaces/underscores with single
  sanitized = sanitized.replace(/[\s_]+/g, '_');

  // Truncate if too long (Windows MAX_PATH consideration)
  if (sanitized.length > 200) {
    const ext = getFileExtension(sanitized);
    const nameWithoutExt = sanitized.slice(0, 200 - ext.length);
    sanitized = nameWithoutExt + ext;
  }

  // Handle empty result
  if (!sanitized || sanitized === '') {
    return 'unnamed_file';
  }

  // Check for Windows reserved names
  const nameWithoutExt = sanitized.replace(/\.[^.]+$/, '').toUpperCase();
  if (WINDOWS_RESERVED_NAMES.has(nameWithoutExt)) {
    sanitized = `_${sanitized}`;
  }

  return sanitized;
}

/**
 * Generate a safe file name with file ID appended to avoid collisions.
 *
 * @param originalName - The original file name
 * @param fileId - The unique file ID
 * @returns Safe file name with ID
 */
export function generateSafeFileName(originalName: string, fileId: string): string {
  const sanitized = sanitizeFileName(originalName);
  const extension = getFileExtension(sanitized);
  const nameWithoutExt = sanitized.replace(/\.[^.]+$/, '');

  // Truncate name if too long (leave room for UUID and extension)
  const maxNameLength = 200 - fileId.length - extension.length - 1;
  const truncatedName = nameWithoutExt.slice(0, Math.max(1, maxNameLength));

  return `${truncatedName}_${fileId}${extension}`;
}

/**
 * Extract file extension from a file name.
 *
 * @param fileName - The file name
 * @returns The extension including the dot (e.g., '.pdf')
 */
export function getFileExtension(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }

  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1 || lastDot === fileName.length - 1) {
    return '';
  }

  return fileName.slice(lastDot);
}

/**
 * Get MIME type from file extension.
 *
 * @param extension - File extension (with or without dot)
 * @returns MIME type or null if unknown
 */
export function getMimeTypeFromExtension(extension: string): string | null {
  const ext = extension.startsWith('.') ? extension.slice(1).toLowerCase() : extension.toLowerCase();

  const mimeTypes: Record<string, string> = {
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    csv: 'text/csv',
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    // Archives
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    // Other
    json: 'application/json',
    xml: 'application/xml',
  };

  return mimeTypes[ext] ?? null;
}

/**
 * Validate if a MIME type is allowed for upload.
 *
 * @param mimeType - The MIME type to validate
 * @returns true if allowed, false otherwise
 */
export function validateMimeType(mimeType: string): boolean {
  return isAllowedMimeType(mimeType);
}

/**
 * Validate if a file extension is allowed.
 *
 * @param extension - File extension to validate
 * @returns true if allowed, false otherwise
 */
export function validateFileExtension(extension: string): boolean {
  const mimeType = getMimeTypeFromExtension(extension);
  if (!mimeType) {
    return false;
  }
  return isAllowedMimeType(mimeType);
}
