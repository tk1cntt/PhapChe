/**
 * Structured error handling utilities.
 *
 * Provides a safe, typed alternative to `catch (e: unknown)` blocks.
 * Instead of guessing what properties a caught error has, use these helpers
 * to narrow the error type and produce consistent error responses.
 */

/** A structured, intentionally-thrown error with a known status code and optional detail. */
export interface AppError extends Error {
  status: number;
  error: string;
  detail?: string;
}

/** Narrow an unknown caught value to an AppError. Returns false for anything that isn't one. */
export function isAppError(value: unknown): value is AppError {
  if (!(value instanceof Error)) return false;
  const err = value as AppError;
  return typeof err.status === 'number' && typeof err.error === 'string';
}

/** Try to extract an HTTP status code from any caught value. Returns 500 for unidentifiable errors. */
export function errorStatusCode(value: unknown): number {
  if (isAppError(value)) return value.status;
  if (value instanceof Error && 'statusCode' in value && typeof (value as Record<string, unknown>).statusCode === 'number') {
    return (value as Record<string, number>).statusCode;
  }
  return 500;
}

/** Try to extract a user-safe error code from any caught value. Returns 'INTERNAL_ERROR' as fallback. */
export function errorCode(value: unknown): string {
  if (isAppError(value)) return value.error;
  return 'INTERNAL_ERROR';
}

/** Try to extract a safe message from any caught value. NEVER exposes raw error.message in production. */
export function safeErrorMessage(value: unknown): string {
  if (isAppError(value)) return value.error;
  return 'Internal server error';
}

/** Build a sanitized JSON response body for a caught error. */
export function errorResponseBody(value: unknown): { error: string; detail?: string } {
  if (isAppError(value)) {
    return { error: value.error, detail: value.detail };
  }
  console.error('Unhandled error:', value instanceof Error ? value.message : String(value));
  return { error: 'INTERNAL_ERROR', detail: 'Internal server error' };
}

/** Create an AppError that can be thrown intentionally. */
export function appError(status: number, error: string, detail?: string): AppError {
  return Object.assign(new Error(error), { status, error, detail }) as AppError;
}

/**
 * Narrow an unknown caught value to a structured error shape.
 * Works with both plain-object throws (`throw { status, error }`) and
 * AppError instances (`Object.assign(new Error(...), { status, error })`).
 */
export function isStructuredError(value: unknown): value is { status: number; error: string; detail?: string; message?: string } {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.status === 'number' && typeof obj.error === 'string';
}
