/**
 * Checksum Utility
 *
 * Computes file checksums for integrity verification.
 * Uses crypto module (Node.js built-in).
 */

import { createHash } from 'crypto';

export type ChecksumAlgorithm = 'md5' | 'sha256';

/**
 * Compute checksum of a buffer using specified algorithm.
 *
 * @param buffer - The data buffer to checksum
 * @param algorithm - Hash algorithm to use (default: sha256)
 * @returns Hex-encoded checksum string
 */
export function computeChecksum(buffer: Buffer, algorithm: ChecksumAlgorithm = 'sha256'): string {
  const hash = createHash(algorithm);
  hash.update(buffer);
  return hash.digest('hex');
}

/**
 * Compute MD5 checksum of a buffer (for S3 ETag compatibility).
 *
 * @param buffer - The data buffer
 * @returns Hex-encoded MD5 checksum
 */
export function computeMd5(buffer: Buffer): string {
  return computeChecksum(buffer, 'md5');
}

/**
 * Compute SHA256 checksum of a buffer (recommended for security).
 *
 * @param buffer - The data buffer
 * @returns Hex-encoded SHA256 checksum
 */
export function computeSha256(buffer: Buffer): string {
  return computeChecksum(buffer, 'sha256');
}

/**
 * Verify that a buffer's checksum matches expected value.
 *
 * @param buffer - The data buffer
 * @param expectedChecksum - Expected checksum value
 * @param algorithm - Algorithm used for the expected checksum
 * @returns true if checksums match, false otherwise
 */
export function verifyChecksum(
  buffer: Buffer,
  expectedChecksum: string,
  algorithm: ChecksumAlgorithm = 'sha256'
): boolean {
  const actualChecksum = computeChecksum(buffer, algorithm);
  return actualChecksum === expectedChecksum;
}
