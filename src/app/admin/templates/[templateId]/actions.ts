'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAppSession } from '@/lib/security/session';
import { updateTemplate, approveTemplate, publishTemplate, deprecateTemplate, createNewVersion } from '@/lib/documents/template-service';

export async function updateTemplateAction(formData: FormData) {
  const session = await requireAppSession();

  if (!session.roles.includes('coordinator_admin') && !session.roles.includes('super_admin')) {
    return { error: 'FORBIDDEN' };
  }

  const templateId = formData.get('templateId')?.toString();
  const label = formData.get('label')?.toString().trim();
  const description = formData.get('description')?.toString().trim() || undefined;
  const content = formData.get('content')?.toString() || '';

  if (!templateId) return { error: 'TEMPLATE_ID_REQUIRED' };
  if (!label) return { error: 'LABEL_REQUIRED' };
  if (!content.trim()) return { error: 'CONTENT_REQUIRED' };

  try {
    await updateTemplate(session, templateId, { label, description, content });
    revalidatePath('/admin/templates');
    revalidatePath(`/admin/templates/${templateId}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'UNKNOWN_ERROR' };
  }

  return { success: true };
}

export async function approveTemplateAction(formData: FormData) {
  const session = await requireAppSession();

  if (!session.roles.includes('coordinator_admin') && !session.roles.includes('super_admin')) {
    return { error: 'FORBIDDEN' };
  }

  const templateId = formData.get('templateId')?.toString();
  if (!templateId) return { error: 'TEMPLATE_ID_REQUIRED' };

  try {
    await approveTemplate(session, templateId);
    revalidatePath('/admin/templates');
    revalidatePath(`/admin/templates/${templateId}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'UNKNOWN_ERROR' };
  }

  return { success: true };
}

export async function publishTemplateAction(formData: FormData) {
  const session = await requireAppSession();

  if (!session.roles.includes('coordinator_admin') && !session.roles.includes('super_admin')) {
    return { error: 'FORBIDDEN' };
  }

  const templateId = formData.get('templateId')?.toString();
  if (!templateId) return { error: 'TEMPLATE_ID_REQUIRED' };

  try {
    await publishTemplate(session, templateId);
    revalidatePath('/admin/templates');
    revalidatePath(`/admin/templates/${templateId}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'UNKNOWN_ERROR' };
  }

  return { success: true };
}

export async function deprecateTemplateAction(formData: FormData) {
  const session = await requireAppSession();

  if (!session.roles.includes('coordinator_admin') && !session.roles.includes('super_admin')) {
    return { error: 'FORBIDDEN' };
  }

  const templateId = formData.get('templateId')?.toString();
  if (!templateId) return { error: 'TEMPLATE_ID_REQUIRED' };

  try {
    await deprecateTemplate(session, templateId);
    revalidatePath('/admin/templates');
    revalidatePath(`/admin/templates/${templateId}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'UNKNOWN_ERROR' };
  }

  return { success: true };
}

export async function createVersionAction(formData: FormData) {
  const session = await requireAppSession();

  if (!session.roles.includes('coordinator_admin') && !session.roles.includes('super_admin')) {
    return { error: 'FORBIDDEN' };
  }

  const templateId = formData.get('templateId')?.toString();
  const content = formData.get('content')?.toString() || '';

  if (!templateId) return { error: 'TEMPLATE_ID_REQUIRED' };
  if (!content.trim()) return { error: 'CONTENT_REQUIRED' };

  try {
    const newTemplate = await createNewVersion(session, templateId, { content });
    revalidatePath('/admin/templates');
    redirect(`/admin/templates/${newTemplate.id}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'UNKNOWN_ERROR' };
  }

  return { success: true };
}