'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAppSession } from '@/lib/security/session';
import {
  createFolder,
  createTag,
  moveFileToFolder,
  tagFile,
  untagFile,
} from '@/lib/documents/classification-service';

function isAdminRole(session: { roles: string[] }) {
  return session.roles.includes('coordinator_admin') || session.roles.includes('super_admin');
}

export type CreateFolderState = { errors?: { name?: string; parentId?: string }; message?: string };

export async function createFolderAction(_prev: CreateFolderState, formData: FormData): Promise<CreateFolderState> {
  const session = await requireAppSession();
  if (!isAdminRole(session)) return { message: 'FORBIDDEN' };

  const name = formData.get('name')?.toString().trim() ?? '';
  const parentId = formData.get('parentId')?.toString() || undefined;
  const workspaceId = session.activeWorkspaceId;

  const errors: { name?: string; parentId?: string } = {};
  if (name.length === 0) errors.name = 'Tên thư mục không được trống';
  if (name.length > 80) errors.name = 'Tên thư mục tối đa 80 ký tự';
  if (Object.keys(errors).length > 0) return { errors };

  try {
    await createFolder(session, { workspaceId, name, parentId: parentId ?? null });
    revalidatePath('/admin/vault');
    return {};
  } catch (err) {
    return { message: err instanceof Error ? err.message : 'UNKNOWN_ERROR' };
  }
}

export type CreateTagState = { errors?: { key?: string; label?: string }; message?: string };

export async function createTagAction(_prev: CreateTagState, formData: FormData): Promise<CreateTagState> {
  const session = await requireAppSession();
  if (!isAdminRole(session)) return { message: 'FORBIDDEN' };

  const key = formData.get('key')?.toString().trim() ?? '';
  const label = formData.get('label')?.toString().trim() ?? '';
  const workspaceId = session.activeWorkspaceId;

  const errors: { key?: string; label?: string } = {};
  if (!/^[a-z0-9_-]{1,32}$/.test(key)) errors.key = 'Mã thẻ chỉ gồm chữ thường, số, _, - (1-32 ký tự)';
  if (label.length === 0) errors.label = 'Tên hiển thị không được trống';
  if (label.length > 80) errors.label = 'Tên hiển thị tối đa 80 ký tự';
  if (Object.keys(errors).length > 0) return { errors };

  try {
    await createTag(session, { workspaceId, key, label });
    revalidatePath('/admin/vault');
    return {};
  } catch (err) {
    return { message: err instanceof Error ? err.message : 'UNKNOWN_ERROR' };
  }
}

export async function moveFileToFolderAction(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const session = await requireAppSession();
  if (!isAdminRole(session)) return { error: 'FORBIDDEN' };

  const vaultFileId = formData.get('vaultFileId')?.toString();
  const folderId = formData.get('folderId')?.toString();
  if (!vaultFileId || !folderId) return { error: 'VAULT_FILE_OR_FOLDER_MISSING' };

  try {
    await moveFileToFolder(session, { vaultFileId, folderId });
    revalidatePath('/admin/vault');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'UNKNOWN_ERROR' };
  }
}

export async function tagFileAction(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const session = await requireAppSession();
  if (!isAdminRole(session)) return { error: 'FORBIDDEN' };

  const vaultFileId = formData.get('vaultFileId')?.toString();
  const tagId = formData.get('tagId')?.toString();
  if (!vaultFileId || !tagId) return { error: 'VAULT_FILE_OR_TAG_MISSING' };

  try {
    await tagFile(session, { vaultFileId, tagId });
    revalidatePath('/admin/vault');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'UNKNOWN_ERROR' };
  }
}

export async function untagFileAction(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const session = await requireAppSession();
  if (!isAdminRole(session)) return { error: 'FORBIDDEN' };

  const vaultFileId = formData.get('vaultFileId')?.toString();
  const tagId = formData.get('tagId')?.toString();
  if (!vaultFileId || !tagId) return { error: 'VAULT_FILE_OR_TAG_MISSING' };

  try {
    await untagFile(session, { vaultFileId, tagId });
    revalidatePath('/admin/vault');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'UNKNOWN_ERROR' };
  }
}
