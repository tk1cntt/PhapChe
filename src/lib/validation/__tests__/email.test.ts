/**
 * isValidEmail — Unit Tests
 *
 * Battery mirrors scratch-regex-check3.mjs (task t_589c751c): 26 cases
 * verified against the strict regex, plus type-safety edge cases.
 */
import { describe, it, expect } from 'vitest';
import { isValidEmail } from '../email';

// ── 26-case battery (from FINDING-6-REVIEW.md / scratch-regex-check3.mjs) ──
const BATTERY: Array<[string, boolean]> = [
  // valid
  ['user@example.com', true],
  ['user+tag@example.co.uk', true],
  ['first.last@sub.domain.org', true],
  ['UPPER@Example.COM', true],
  ['user@exa-mple.com', true],
  ['user@xn--bcher-kva.example', true],
  ['a@b.co', true],
  // invalid per finding
  ['user@localhost', false],
  ['user@.com', false],
  ['user@example..com', false],
  ['user@example.c', false],
  ['user@-example.com', false],
  ['user@example-.com', false],
  ['user..name@example.com', false],
  ['user.@example.com', false],
  ['.user@example.com', false],
  ['tést@exämple.com', false],
  [' user@example.com', false],
  ['user@example.com ', false],
  ['user@example.com.', false],
  ['a@b.c', false],
  ['', false],
  ['not-an-email', false],
  ['user@example_com', false],
  ['user@@example.com', false],
  ['user@example..com.', false],
];

describe('isValidEmail — 26-case battery', () => {
  it.each(BATTERY)('validates %s → %s', (input, expected) => {
    expect(isValidEmail(input)).toBe(expected);
  });
});

// ── Mandatory cases from the fix task ──
describe('isValidEmail — mandatory cases', () => {
  const invalid = [
    'tést@exämple.com', // unicode/IDN
    'user@example..com', // consecutive dots in domain
    'user@example.c', // TLD 1 char
    'user@-example.com', // label starts with hyphen
    'user@example.com.', // trailing dot
    'a@b.c', // TLD 1 char
  ];
  const valid = [
    'user@example.com',
    'user+tag@example.co.uk',
    'first.last@sub.domain.org',
  ];

  it.each(invalid)('rejects invalid %s', (input) => {
    expect(isValidEmail(input)).toBe(false);
  });

  it.each(valid)('accepts valid %s', (input) => {
    expect(isValidEmail(input)).toBe(true);
  });
});

// ── Type-safety / edge ──
describe('isValidEmail — edge cases', () => {
  it('rejects non-string inputs (as any)', () => {
    expect(isValidEmail(123 as unknown as string)).toBe(false);
    expect(isValidEmail(null as unknown as string)).toBe(false);
    expect(isValidEmail(undefined as unknown as string)).toBe(false);
    expect(isValidEmail({} as unknown as string)).toBe(false);
  });

  it('rejects over-length emails (> 254 chars)', () => {
    const local = 'a'.repeat(200);
    const domain = 'b'.repeat(60);
    expect(isValidEmail(`${local}@${domain}.com`)).toBe(false);
  });

  it('accepts a 254-char email at the limit', () => {
    // 64-char local + @ + domain = 189 chars (63 + . + 63 + . + 61-char TLD)
    const local = 'a'.repeat(64);
    const domain = 'b'.repeat(63);
    const sub = 'c'.repeat(63);
    const tld = 'd'.repeat(61);
    const email = `${local}@${domain}.${sub}.${tld}`;
    expect(email.length).toBe(254);
    expect(isValidEmail(email)).toBe(true);
  });

  it('accepts 63-char TLD (max)', () => {
    expect(isValidEmail(`user@example.${'a'.repeat(63)}`)).toBe(true);
  });

  it('rejects 64-char TLD', () => {
    expect(isValidEmail(`user@example.${'a'.repeat(64)}`)).toBe(false);
  });
});
