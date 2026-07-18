/**
 * MemberGrid Component Tests
 * Whitebox, Blackbox, Abnormal, Error test cases
 * Focus: admin role display, badge variants, i18n labels
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemberGrid } from '../MemberGrid';
import type { MemberData } from '../MemberGrid';

// ── Mock next-intl ────────────────────────────────────────
const mockTranslations: Record<string, string> = {
  membersTitle: 'Thành viên',
  manage: 'Quản lý',
  permissionsTitle: 'Quyền hạn',
  tenantIsolation: 'Cô lập tenant',
  dataPrivacyNote: 'Dữ liệu hồ sơ và vault chỉ hiển thị trong workspace.',
  yourRole: 'Vai trò của bạn',
  ownerRoleDesc: 'Bạn có toàn quyền quản lý workspace này.',
  auditTitle: 'Audit Trail',
  fileActionsNote: 'Các thao tác được ghi lại bằng metadata an toàn.',
  roleOwner: 'Owner',
  roleFinance: 'Finance',
  roleViewer: 'Legal Contact',
  roleCustomer: 'Khách hàng',
  roleCoordinator: 'Điều phối viên',
  roleSuperAdmin: 'Quản trị viên',
  roleSpecialist: 'Chuyên viên',
  roleReviewer: 'Người kiểm duyệt',
  roleAuditAdmin: 'Kiểm toán viên',
  roleInvited: 'Đã mời',
};

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => mockTranslations[key] || key,
}));

// ── Test helpers ──────────────────────────────────────────
const createMember = (overrides: Partial<MemberData> = {}): MemberData => ({
  id: 'user-1',
  name: 'Nguyễn Văn A',
  email: 'a@example.test',
  role: 'owner',
  isActive: true,
  ...overrides,
});

const renderGrid = (members: MemberData[]) => render(<MemberGrid members={members} />);

/** Find badge element containing text — returns the .badge span */
function getBadgeByText(text: string): HTMLElement | null {
  const all = screen.queryAllByText(text);
  for (const el of all) {
    if (el.closest('.badge')) return el.closest('.badge') as HTMLElement;
  }
  return null;
}

// ── WHITEBOX TESTS — getRoleDisplay / getRoleBadgeText / getRoleBadgeVariant ─
describe('MemberGrid Whitebox — Admin Role Logic', () => {
  describe('getRoleDisplay — subtitle shows translated role', () => {
    it('shows "Điều phối viên" for coordinator_admin', () => {
      renderGrid([createMember({ id: 'c1', role: 'coordinator_admin', name: 'Cô Vân' })]);
      // Badge shows exact test, subtitle shows "Điều phối viên · email" (substring)
      expect(screen.getByText('Điều phối viên')).toBeDefined();
    });

    it('shows "Quản trị viên" for super_admin', () => {
      renderGrid([createMember({ id: 's1', role: 'super_admin', name: 'Admin Tổng' })]);
      expect(screen.getByText('Quản trị viên')).toBeDefined();
    });

    it('shows "Chuyên viên" for specialist', () => {
      renderGrid([createMember({ id: 'sp1', role: 'specialist', name: 'Lê Văn B' })]);
      expect(screen.getByText('Chuyên viên')).toBeDefined();
    });

    it('shows "Người kiểm duyệt" for reviewer', () => {
      renderGrid([createMember({ id: 'r1', role: 'reviewer', name: 'Trần Thị C' })]);
      expect(screen.getByText('Người kiểm duyệt')).toBeDefined();
    });

    it('shows "Kiểm toán viên" for audit_admin', () => {
      renderGrid([createMember({ id: 'a1', role: 'audit_admin', name: 'Phạm Văn D' })]);
      expect(screen.getByText('Kiểm toán viên')).toBeDefined();
    });

    it('falls back to raw role string for unknown role', () => {
      renderGrid([createMember({ id: 'u1', role: 'unknown_custom_role', name: 'Test' })]);
      expect(screen.getByText('unknown_custom_role')).toBeDefined();
    });
  });

  describe('getRoleBadgeText — badge shows translated label', () => {
    it('coordinator_admin badge text is "Điều phối viên"', () => {
      renderGrid([createMember({ id: 'c1', role: 'coordinator_admin' })]);
      const badge = getBadgeByText('Điều phối viên');
      expect(badge).toBeDefined();
      expect(badge!.tagName).toBe('SPAN');
    });

    it('super_admin badge text is "Quản trị viên"', () => {
      renderGrid([createMember({ id: 's1', role: 'super_admin' })]);
      const badge = getBadgeByText('Quản trị viên');
      expect(badge).toBeDefined();
    });

    it('specialist badge text is "Chuyên viên"', () => {
      renderGrid([createMember({ id: 'sp1', role: 'specialist' })]);
      const badge = getBadgeByText('Chuyên viên');
      expect(badge).toBeDefined();
    });

    it('reviewer badge text is "Người kiểm duyệt"', () => {
      renderGrid([createMember({ id: 'r1', role: 'reviewer' })]);
      const badge = getBadgeByText('Người kiểm duyệt');
      expect(badge).toBeDefined();
    });

    it('audit_admin badge text is "Kiểm toán viên"', () => {
      renderGrid([createMember({ id: 'a1', role: 'audit_admin' })]);
      const badge = getBadgeByText('Kiểm toán viên');
      expect(badge).toBeDefined();
    });
  });

  describe('getRoleBadgeVariant — CSS class mapping', () => {
    it('coordinator_admin gets badge-red', () => {
      renderGrid([createMember({ id: 'c1', role: 'coordinator_admin' })]);
      const badge = getBadgeByText('Điều phối viên');
      expect(badge?.className).toContain('badge-red');
    });

    it('super_admin gets badge-purple', () => {
      renderGrid([createMember({ id: 's1', role: 'super_admin' })]);
      const badge = getBadgeByText('Quản trị viên');
      expect(badge?.className).toContain('badge-purple');
    });

    it('specialist gets badge-green', () => {
      renderGrid([createMember({ id: 'sp1', role: 'specialist' })]);
      const badge = getBadgeByText('Chuyên viên');
      expect(badge?.className).toContain('badge-green');
    });

    it('reviewer gets badge-blue', () => {
      renderGrid([createMember({ id: 'r1', role: 'reviewer' })]);
      const badge = getBadgeByText('Người kiểm duyệt');
      expect(badge?.className).toContain('badge-blue');
    });

    it('audit_admin gets badge-orange', () => {
      renderGrid([createMember({ id: 'a1', role: 'audit_admin' })]);
      const badge = getBadgeByText('Kiểm toán viên');
      expect(badge?.className).toContain('badge-orange');
    });

    it('unknown active role falls back to badge-orange', () => {
      renderGrid([createMember({ id: 'u1', role: 'custom-xyz', isActive: true })]);
      const badge = getBadgeByText('custom-xyz');
      expect(badge?.className).toContain('badge-orange');
    });
  });
});

// ── BLACKBOX TESTS — Full rendering integration ──────────────
describe('MemberGrid Blackbox — Admin Role Rendering', () => {
  it('renders all 5 admin role members with distinct badge variants', () => {
    const adminMembers: MemberData[] = [
      { id: '1', name: 'Admin Tổng', email: 'admin@test.com', role: 'super_admin', isActive: true },
      { id: '2', name: 'Cô Vân', email: 'van@test.com', role: 'coordinator_admin', isActive: true },
      { id: '3', name: 'Luật sư B', email: 'b@test.com', role: 'specialist', isActive: true },
      { id: '4', name: 'Reviewer C', email: 'c@test.com', role: 'reviewer', isActive: true },
      { id: '5', name: 'Auditor D', email: 'd@test.com', role: 'audit_admin', isActive: true },
    ];
    renderGrid(adminMembers);

    // Translated labels visible (using getAllByText since text appears in both subtitle + badge)
    expect(screen.getAllByText('Quản trị viên').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Điều phối viên').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Chuyên viên').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Người kiểm duyệt').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Kiểm toán viên').length).toBeGreaterThanOrEqual(1);

    // No raw role codes visible
    expect(screen.queryByText('coordinator_admin')).toBeNull();
    expect(screen.queryByText('super_admin')).toBeNull();
    expect(screen.queryByText('audit_admin')).toBeNull();

    // Badge variants are distinct
    const badges = document.querySelectorAll('.badge');
    const variantClasses = Array.from(badges).map(b => {
      if (b.classList.contains('badge-purple')) return 'purple';
      if (b.classList.contains('badge-red')) return 'red';
      if (b.classList.contains('badge-green')) return 'green';
      if (b.classList.contains('badge-blue')) return 'blue';
      if (b.classList.contains('badge-orange')) return 'orange';
      return 'unknown';
    });
    expect(variantClasses).toContain('purple');
    expect(variantClasses).toContain('red');
    expect(variantClasses).toContain('green');
    expect(variantClasses).toContain('blue');
    expect(variantClasses).toContain('orange');
  });

  it('renders subtitle line with translated role and email', () => {
    renderGrid([createMember({ id: 'c1', role: 'coordinator_admin', email: 'van@test.com', name: 'Cô Vân' })]);
    const memberElement = screen.getByText('Cô Vân').closest('.member');
    expect(memberElement?.textContent).toContain('Điều phối viên');
    expect(memberElement?.textContent).toContain('van@test.com');
  });
});

// ── ABNORMAL TESTS — Edge cases ──────────────────────────────
describe('MemberGrid Abnormal — Edge Cases', () => {
  it('inactive admin member shows "Đã mời" badge regardless of admin role', () => {
    renderGrid([createMember({ id: 'c1', role: 'coordinator_admin', isActive: false })]);
    const badge = screen.getByText('Đã mời');
    expect(badge).toBeDefined();
    expect(badge.closest('.badge')?.className).toContain('badge-orange');
  });

  it('inactive super_admin shows orange badge not purple', () => {
    renderGrid([createMember({ id: 's1', role: 'super_admin', isActive: false })]);
    const badge = screen.getByText('Đã mời').closest('.badge');
    expect(badge?.className).toContain('badge-orange');
    expect(badge?.className).not.toContain('badge-purple');
  });

  it('role COORDINATOR_ADMIN (uppercase) maps correctly', () => {
    renderGrid([createMember({ id: 'c1', role: 'COORDINATOR_ADMIN' as any, name: 'Test' })]);
    expect(screen.getAllByText('Điều phối viên').length).toBeGreaterThanOrEqual(1);
  });

  it('role Super_Admin (mixed case) maps correctly', () => {
    renderGrid([createMember({ id: 's1', role: 'Super_Admin' as any, name: 'Test' })]);
    expect(screen.getAllByText('Quản trị viên').length).toBeGreaterThanOrEqual(1);
  });

  it('empty members array renders no role labels', () => {
    renderGrid([]);
    expect(screen.queryByText('Điều phối viên')).toBeNull();
    expect(screen.queryByText('Quản trị viên')).toBeNull();
    // Panels still render
    expect(screen.getByText('Thành viên')).toBeDefined();
  });

  it('member with empty name shows "U" initials', () => {
    renderGrid([createMember({ id: 'e1', name: '', role: 'specialist' })]);
    expect(screen.getByText('U')).toBeDefined();
  });

  it('member with empty email renders without separator dot', () => {
    renderGrid([createMember({ id: 'e1', email: '', role: 'reviewer', name: 'Test' })]);
    const memberEl = screen.getByText('Test').closest('.member');
    expect(memberEl?.textContent).not.toContain(' · ');
  });

  it('mixed active/inactive admin roles render correctly side by side', () => {
    renderGrid([
      createMember({ id: '1', role: 'super_admin', name: 'Admin', isActive: true }),
      createMember({ id: '2', role: 'specialist', name: 'LS', isActive: false }),
      createMember({ id: '3', role: 'audit_admin', name: 'KT', isActive: true }),
    ]);
    expect(screen.getAllByText('Quản trị viên').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Kiểm toán viên').length).toBeGreaterThanOrEqual(1);
    const invitedBadges = screen.getAllByText('Đã mời');
    expect(invitedBadges.length).toBe(1);
  });
});

// ── ERROR TESTS — null/undefined/edge inputs ────────────────
describe('MemberGrid Error — Missing/Broken Scenarios', () => {
  it('undefined role does not crash (renders empty string)', () => {
    const m = createMember({ role: undefined as any });
    renderGrid([m]);
    expect(screen.getByText('Nguyễn Văn A')).toBeDefined();
    // Badge should show empty/default role text
    const badge = screen.getByText('Nguyễn Văn A').closest('.member')?.querySelector('.badge');
    expect(badge).toBeDefined();
  });

  it('null role does not crash', () => {
    const m = createMember({ role: null as any });
    renderGrid([m]);
    expect(screen.getByText('Nguyễn Văn A')).toBeDefined();
  });

  it('very long role string does not break layout', () => {
    const longRole = 'a'.repeat(200);
    renderGrid([createMember({ role: longRole, name: 'Test' })]);
    expect(screen.getByText(longRole)).toBeDefined();
  });
});
