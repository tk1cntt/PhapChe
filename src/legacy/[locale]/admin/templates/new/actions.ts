'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAppSession } from '@/lib/security/session';
import { createTemplate, type TemplateVariable } from '@/lib/documents/template-service';

export async function createTemplateAction(formData: FormData): Promise<void> {
  const session = await requireAppSession();

  if (!session.roles.includes('coordinator_admin') && !session.roles.includes('super_admin')) {
    redirect('/admin');
  }

  const label = formData.get('label')?.toString().trim();
  const matterTypeKey = formData.get('matterTypeKey')?.toString().trim();
  const description = formData.get('description')?.toString().trim() || undefined;
  const content = formData.get('content')?.toString() || '';

  if (!label || !matterTypeKey || !content.trim()) {
    redirect('/admin/templates/new');
  }

  const rawSchema = formData.get('variableSchema')?.toString() || '[]';
  let variableSchema: TemplateVariable[] = [];
  try {
    const parsed = JSON.parse(rawSchema);
    if (!Array.isArray(parsed)) throw new Error();
    for (const v of parsed as Record<string, unknown>[]) {
      if (typeof v.key !== 'string' || typeof v.label !== 'string' || typeof v.required !== 'boolean' || typeof v.type !== 'string') {
        throw new Error();
      }
      variableSchema.push(v as TemplateVariable);
    }
  } catch {
    redirect('/admin/templates/new');
  }

  const template = await createTemplate(session, {
    workspaceId: session.activeWorkspaceId!,
    matterTypeKey,
    label,
    description,
    variableSchema,
    content,
  });

  revalidatePath('/admin/templates');
  redirect(`/admin/templates/${template.id}`);
}
