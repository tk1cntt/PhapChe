'use server';

import { revalidatePath } from 'next/cache';
import type { AssignmentKind, Prisma } from '@prisma/client';
import { assignRequest, requireRoutingAdmin, upsertMatterType, upsertRoutingCapability } from '@/lib/routing/routing-service';
import { requireAppSession } from '@/lib/security/session';

const successMessage = 'Đã lưu phân công và ghi nhận lịch sử điều phối.';
const errorMessage = 'Không thể lưu phân công. Kiểm tra chuyên viên, reviewer và lý do phân công rồi thử lại.';

export type RoutingActionResult = {
  ok: boolean;
  message: string;
};

function correlationId() {
  return `routing-${Date.now()}`;
}

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function booleanValue(formData: FormData, key: string) {
  return stringValue(formData, key) === 'true';
}

function routingKind(value: string): AssignmentKind {
  if (value === 'reviewer') return 'reviewer';
  return 'specialist';
}

async function saveMatterType(formData: FormData): Promise<RoutingActionResult> {
  try {
    const session = await requireAppSession();
    const workspaceId = session.activeWorkspaceId || '';
    await requireRoutingAdmin(workspaceId, session.userId);
    await upsertMatterType({
      workspaceId,
      key: stringValue(formData, 'key'),
      label: stringValue(formData, 'label'),
      description: stringValue(formData, 'description'),
      schemaVersion: stringValue(formData, 'schemaVersion') || 'v1',
      questionSchema: [] as Prisma.InputJsonValue,
      isActive: booleanValue(formData, 'isActive'),
    });
    revalidatePath('/admin/routing');
    return { ok: true, message: successMessage };
  } catch {
    return { ok: false, message: errorMessage };
  }
}

async function saveCapability(formData: FormData): Promise<RoutingActionResult> {
  try {
    const session = await requireAppSession();
    const workspaceId = session.activeWorkspaceId || '';
    await requireRoutingAdmin(workspaceId, session.userId);
    await upsertRoutingCapability({
      workspaceId,
      userId: stringValue(formData, 'userId'),
      matterTypeKey: stringValue(formData, 'matterTypeKey'),
      kind: routingKind(stringValue(formData, 'kind')),
      isActive: booleanValue(formData, 'isActive'),
    });
    revalidatePath('/admin/routing');
    return { ok: true, message: successMessage };
  } catch {
    return { ok: false, message: errorMessage };
  }
}

async function assign(formData: FormData): Promise<RoutingActionResult> {
  const assigneeId = stringValue(formData, 'assigneeId');
  const reason = stringValue(formData, 'reason');
  if (!reason) return { ok: false, message: 'Nhập lý do phân công trước khi lưu.' };
  if (!assigneeId) return { ok: false, message: 'Chọn người xử lý trước khi lưu phân công.' };

  try {
    const session = await requireAppSession();
    await assignRequest({
      requestId: stringValue(formData, 'requestId'),
      workspaceId: session.activeWorkspaceId || '',
      actorId: session.userId,
      kind: routingKind(stringValue(formData, 'kind')),
      assigneeId,
      reason,
      correlationId: correlationId(),
    });
    revalidatePath('/admin/routing');
    return { ok: true, message: successMessage };
  } catch {
    return { ok: false, message: errorMessage };
  }
}

export async function saveMatterTypeAction(formData: FormData): Promise<void> {
  await saveMatterType(formData);
}

export async function saveCapabilityAction(formData: FormData): Promise<void> {
  await saveCapability(formData);
}

export async function assignRequestAction(formData: FormData): Promise<void> {
  await assign(formData);
}
