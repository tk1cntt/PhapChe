'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAppSession } from '@/lib/security/session';
import { createTemplate, type TemplateVariable } from '@/lib/documents/template-service';

export type CreateTemplateState = {
  errors?: {
    label?: string;
    matterTypeKey?: string;
    content?: string;
    variableSchema?: string;
  };
  message?: string;
};

export async function createTemplateAction(prevState: CreateTemplateState, formData: FormData) {
  const session = await requireAppSession();

  if (!session.roles.includes('coordinator_admin') && !session.roles.includes('super_admin')) {
    return { message: 'FORBIDDEN' };
  }

  const label = formData.get('label')?.toString().trim();
  const matterTypeKey = formData.get('matterTypeKey')?.toString().trim();
  const description = formData.get('description')?.toString().trim() || undefined;
  const content = formData.get('content')?.toString() || '';

  const errors: CreateTemplateState['errors'] = {};
  if (!label) errors.label = 'Vui lòng nhập tên mẫu';
  if (!matterTypeKey) errors.matterTypeKey = 'Vui lòng chọn loại vụ việc';
  if (!content.trim()) errors.content = 'Vui lòng nhập nội dung mẫu';

  if (Object.keys(errors).length > 0) return { errors };

  try {
    const rawSchema = formData.get('variableSchema')?.toString() || '[]';
    let variableSchema: unknown;
    try {
      variableSchema = JSON.parse(rawSchema);
      if (!Array.isArray(variableSchema)) throw new Error();
      for (const v of variableSchema as Record<string, unknown>[]) {
        if (typeof v.key !== 'string' || typeof v.label !== 'string' || typeof v.required !== 'boolean' || typeof v.type !== 'string') {
          throw new Error();
        }
      }
    } catch {
      return { errors: { variableSchema: 'Biến mẫu không hợp lệ' } };
    }

    const template = await createTemplate(session, {
      workspaceId: session.activeWorkspaceId,
      matterTypeKey: matterTypeKey!,
      label: label!,
      description,
      variableSchema: variableSchema as TemplateVariable[],
      content,
    });

    revalidatePath('/admin/templates');
    redirect(`/admin/templates/${template.id}`);
  } catch (err) {
    return { message: err instanceof Error ? err.message : 'UNKNOWN_ERROR' };
  }
}