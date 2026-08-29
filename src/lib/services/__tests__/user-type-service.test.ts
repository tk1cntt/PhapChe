/**
 * User Type Service Tests — organizationId derivation & user type classification
 *
 * Regression test for Finding #12: getUserTypeInfo used to hardcode
 * organizationId: null, so isCorporateCustomer was always false.
 */

import { describe, it, expect } from 'vitest';
import {
  getUserTypeInfo,
  getUserTypeInfoWithOrg,
  isCorporateCustomer,
  isIndividualCustomer,
  getActivityType,
} from '../user-type-service';
import type { WorkspaceMembership } from '@prisma/client';

type Membership = WorkspaceMembership & { workspace?: { organizationId: string | null } };

function membership(overrides: Partial<Membership> = {}): Membership {
  return {
    id: 'm-1',
    userId: 'user-1',
    workspaceId: 'ws-1',
    role: 'customer',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as Membership;
}

describe('getUserTypeInfo — organizationId derivation (Finding #12)', () => {
  it('derives organizationId from the first active membership with a workspace', () => {
    const info = getUserTypeInfo('customer', [
      membership({
        id: 'm-inactive',
        isActive: false,
        role: 'customer',
        workspace: { organizationId: 'org-inactive' },
      }),
      membership({
        id: 'm-1',
        role: 'customer',
        workspace: { organizationId: 'org-1' },
      }),
      membership({
        id: 'm-2',
        role: 'customer',
        workspace: { organizationId: 'org-2' },
      }),
    ]);

    // Inactive membership skipped; first active one with org wins
    expect(info.organizationId).toBe('org-1');
  });

  it('returns null when no active membership carries an organizationId', () => {
    const info = getUserTypeInfo('customer', [
      membership({ role: 'customer', workspace: { organizationId: null } }),
      membership({ role: 'customer', workspace: undefined }),
    ]);

    expect(info.organizationId).toBeNull();
  });

  it('returns null when memberships have no workspace relation joined', () => {
    const info = getUserTypeInfo('customer', [membership({ workspace: undefined })]);

    expect(info.organizationId).toBeNull();
  });

  it('ignores inactive memberships entirely', () => {
    const info = getUserTypeInfo('customer', [
      membership({ isActive: false, role: 'coordinator', workspace: { organizationId: 'org-1' } }),
    ]);

    expect(info.isStaff).toBe(false);
    expect(info.isCustomer).toBe(true);
    expect(info.organizationId).toBeNull();
    expect(info.allRoles).toEqual([]);
  });

  it('isStaff when accountType is staff even without memberships', () => {
    const info = getUserTypeInfo('staff', []);

    expect(info.isStaff).toBe(true);
    expect(info.isCustomer).toBe(false);
    expect(info.organizationId).toBeNull();
  });

  it('isStaff when any active membership has a staff role', () => {
    const info = getUserTypeInfo('customer', [
      membership({ role: 'reviewer', workspace: { organizationId: 'org-1' } }),
    ]);

    expect(info.isStaff).toBe(true);
    expect(info.isCustomer).toBe(false);
    expect(info.organizationId).toBe('org-1');
  });

  it('dedupes roles in allRoles and keeps primaryRole', () => {
    const info = getUserTypeInfo('customer', [
      membership({ id: 'm-1', role: 'customer', workspace: { organizationId: 'org-1' } }),
      membership({ id: 'm-2', role: 'customer', workspace: { organizationId: 'org-1' } }),
      membership({ id: 'm-3', role: 'specialist', workspace: { organizationId: 'org-1' } }),
    ]);

    expect(info.allRoles).toEqual(['customer', 'specialist']);
    expect(info.primaryRole).toBe('customer');
  });
});

describe('getUserTypeInfoWithOrg — alias of getUserTypeInfo', () => {
  it('returns identical results to getUserTypeInfo', () => {
    const memberships = [
      membership({ role: 'customer', workspace: { organizationId: 'org-1' } }),
    ];

    expect(getUserTypeInfoWithOrg('customer', memberships)).toEqual(
      getUserTypeInfo('customer', memberships),
    );
  });
});

describe('isCorporateCustomer / isIndividualCustomer / getActivityType', () => {
  it('corporate customer: customer with organizationId', () => {
    const info = getUserTypeInfo('customer', [
      membership({ role: 'customer', workspace: { organizationId: 'org-1' } }),
    ]);

    expect(isCorporateCustomer(info)).toBe(true);
    expect(isIndividualCustomer(info)).toBe(false);
    expect(getActivityType(info)).toBe('corporate_activity');
  });

  it('individual customer: customer without organizationId', () => {
    const info = getUserTypeInfo('customer', [membership({ workspace: undefined })]);

    expect(isCorporateCustomer(info)).toBe(false);
    expect(isIndividualCustomer(info)).toBe(true);
    expect(getActivityType(info)).toBe('individual_activity');
  });

  it('staff user: staff_activity regardless of organization', () => {
    const info = getUserTypeInfo('staff', []);

    expect(isCorporateCustomer(info)).toBe(false);
    expect(isIndividualCustomer(info)).toBe(false);
    expect(getActivityType(info)).toBe('staff_activity');
  });
});
