'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAppSession } from '@/lib/security/session';
import { updateTemplate, approveTemplate, publishTemplate, deprecateTemplate, createNewVersion } from '@/lib/documents/template-service';

export async function updateTemplateAction(formData: FormData): Promise<void> {
  const session = await requireAppSession();

  if (!session.roles.includes('coordinator_admin') && !session.roles.includes('super_admin')) {
    redirect('/admin');
  }

  const templateId = formData.get('templateId')?.toString();
  const label = formData.get('label')?.toString().trim();
  const description = formData.get('description')?.toString().trim() || undefined;
  const content = formData.get('content')?.toString() || '';

  if (!templateId || !label || !content.trim()) {
    redirect(`/admin/templates/${templateId}`);
  }

  await updateTemplate(session, templateId, { label, description, content });
  revalidatePath('/admin/templates');
  revalidatePath(`/admin/templates/${templateId}`);
}

export async function approveTemplateAction(formData: FormData): Promise<void> {
  const session = await requireAppSession();

  if (!session.roles.includes('coordinator_admin') && !session.roles.includes('super_admin')) {
    redirect('/admin');
  }

  const templateId = formData.get('templateId')?.toString();
  if (!templateId) redirect('/admin/templates');

  await approveTemplate(session, templateId);
  revalidatePath('/admin/templates');
  revalidatePath(`/admin/templates/${templateId}`);
}

export async function publishTemplateAction(formData: FormData): Promise<void> {
  const session = await requireAppSession();

  if (!session.roles.includes('coordinator_admin') && !session.roles.includes('super_admin')) {
    redirect('/admin');
  }

  const templateId = formData.get('templateId')?.toString();
  if (!templateId) redirect('/admin/templates');

  await publishTemplate(session, templateId);
  revalidatePath('/admin/templates');
  revalidatePath(`/admin/templates/${templateId}`);
}

export async function deprecateTemplateAction(formData: FormData): Promise<void> {
  const session = await requireAppSession();

  if (!session.roles.includes('coordinator_admin') && !session.roles.includes('super_admin')) {
    redirect('/admin');
  }

  const templateId = formData.get('templateId')?.toString();
  if (!templateId) redirect('/admin/templates');

  await deprecateTemplate(session, templateId);
  revalidatePath('/admin/templates');
  revalidatePath(`/admin/templates/${templateId}`);
}

export async function createVersionAction(formData: FormData): Promise<void> {
  const session = await requireAppSession();

  if (!session.roles.includes('coordinator_admin') && !session.roles.includes('super_admin')) {
    redirect('/admin');
  }

  const templateId = formData.get('templateId')?.toString();
  const content = formData.get('content')?.toString() || '';

  if (!templateId || !content.trim()) {
    redirect(templateId ? `/admin/templates/${templateId}` : '/admin/templates');
  }

  const newTemplate = await createNewVersion(session, templateId, { content });
  revalidatePath('/admin/templates');
  redirect(`/admin/templates/${newTemplate.id}`);
}
