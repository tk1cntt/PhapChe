import { NextResponse } from 'next/server';
import { listTemplates } from '@/lib/documents/template-service';
import { requireAppSession } from '@/lib/security/session';

export async function GET() {
  try {
    const session = await requireAppSession();
    const workspaceId = session.activeWorkspaceId;
    const templates = await listTemplates(session, workspaceId ?? '');
    return NextResponse.json(templates);
  } catch {
    return NextResponse.json([]);
  }
}
