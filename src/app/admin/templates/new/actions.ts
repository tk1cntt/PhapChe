'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { createTemplate } from '@/lib/documents/template-service';

export type CreateTemplateState = {
  errors?: {
    label?: string;
    matterTypeKey?: string;
    content?: string;
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
    const template = await createTemplate(session, {
      workspaceId: session.activeWorkspaceId,
      matterTypeKey,
      label,
      description,
      variableSchema: [],
      content,
    });

    revalidatePath('/admin/templates');
    redirect(`/admin/templates/${template.id}`);
  } catch (err) {
    return { message: err instanceof Error ? err.message : 'UNKNOWN_ERROR' };
  }
}