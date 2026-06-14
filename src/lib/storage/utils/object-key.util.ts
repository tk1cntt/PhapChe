/**
 * Object Key Generator Utility
 *
 * Generates consistent object keys for storage, following category-specific paths.
 * Format is consistent across local and S3 storage for seamless migration.
 */

import type { FileCategory } from '../types';
import { FileCategory as FileCategoryEnum } from '../types';

/**
 * Generate a safe object key for a file
 *
 * @param params - Object key generation parameters
 * @returns The generated object key
 */
export function generateObjectKey(params: {
  organizationId: string;
  requestId?: string;
  fileId: string;
  safeFileName: string;
  category: FileCategory;
}): string {
  const { organizationId, requestId, fileId, safeFileName, category } = params;

  switch (category) {
    case FileCategoryEnum.REQUEST_UPLOAD:
      // organizations/{orgId}/requests/{requestId}/uploads/{fileId}/{safeFileName}
      if (!requestId) {
        throw new Error('requestId is required for request_upload category');
      }
      return `organizations/${organizationId}/requests/${requestId}/uploads/${fileId}/${safeFileName}`;

    case FileCategoryEnum.GENERATED_DOCUMENT:
      // organizations/{orgId}/requests/{requestId}/generated-documents/{documentId}/{fileName}
      if (!requestId) {
        throw new Error('requestId is required for generated_document category');
      }
      return `organizations/${organizationId}/requests/${requestId}/generated-documents/${fileId}/${safeFileName}`;

    case FileCategoryEnum.VAULT_FILE:
      // organizations/{orgId}/vault/{fileId}/{fileName}
      return `organizations/${organizationId}/vault/${fileId}/${safeFileName}`;

    case FileCategoryEnum.TEMPLATE:
      // templates/{templateType}/{templateId}/v{version}/{fileName}
      // templateType is derived from organizationId or use 'default'
      return `templates/${organizationId}/${fileId}/${safeFileName}`;

    case FileCategoryEnum.OCR_OUTPUT:
      // organizations/{orgId}/requests/{requestId}/ocr/{fileId}/result.json
      if (!requestId) {
        throw new Error('requestId is required for ocr_output category');
      }
      return `organizations/${organizationId}/requests/${requestId}/ocr/${fileId}/result.json`;

    case FileCategoryEnum.AUDIT_EXPORT:
      // organizations/{orgId}/audit-exports/{exportId}/{fileName}
      return `organizations/${organizationId}/audit-exports/${fileId}/${safeFileName}`;

    default:
      throw new Error(`Unknown file category: ${category}`);
  }
}

/**
 * Parse an object key to extract its components
 *
 * @param objectKey - The object key to parse
 * @returns Parsed components or null if not a valid storage key
 */
export function parseObjectKey(objectKey: string): {
  category: FileCategory;
  organizationId: string;
  requestId?: string;
  fileId: string;
  fileName: string;
} | null {
  const parts = objectKey.split('/');

  // Handle organizations path
  if (parts[0] === 'organizations' && parts.length >= 5) {
    const orgId = parts[1];

    if (parts[2] === 'requests' && parts.length >= 8) {
      const requestId = parts[3];

      if (parts[4] === 'uploads' && parts.length === 7) {
        return {
          category: FileCategoryEnum.REQUEST_UPLOAD,
          organizationId: orgId,
          requestId,
          fileId: parts[5],
          fileName: parts[6],
        };
      }

      if (parts[4] === 'generated-documents' && parts.length === 7) {
        return {
          category: FileCategoryEnum.GENERATED_DOCUMENT,
          organizationId: orgId,
          requestId,
          fileId: parts[5],
          fileName: parts[6],
        };
      }

      if (parts[4] === 'ocr' && parts.length === 7) {
        return {
          category: FileCategoryEnum.OCR_OUTPUT,
          organizationId: orgId,
          requestId,
          fileId: parts[5],
          fileName: parts[6],
        };
      }
    }

    if (parts[2] === 'vault' && parts.length === 5) {
      return {
        category: FileCategoryEnum.VAULT_FILE,
        organizationId: orgId,
        fileId: parts[3],
        fileName: parts[4],
      };
    }

    if (parts[2] === 'audit-exports' && parts.length === 5) {
      return {
        category: FileCategoryEnum.AUDIT_EXPORT,
        organizationId: orgId,
        fileId: parts[3],
        fileName: parts[4],
      };
    }
  }

  // Handle templates path
  if (parts[0] === 'templates' && parts.length === 3) {
    return {
      category: FileCategoryEnum.TEMPLATE,
      organizationId: parts[1],
      fileId: parts[2],
      fileName: '', // Templates don't have a file name in the key
    };
  }

  return null;
}

/**
 * Get the category from an object key
 */
export function getCategoryFromKey(objectKey: string): FileCategory | null {
  const parsed = parseObjectKey(objectKey);
  return parsed?.category ?? null;
}
