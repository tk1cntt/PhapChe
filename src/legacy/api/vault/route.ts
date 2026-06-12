import { NextResponse } from 'next/server';
import { listFolders, listTags, listFileClassifications } from '@/lib/documents/classification-service';
import { requireAppSession } from '@/lib/security/session';

export async function GET() {
  try {
    const session = await requireAppSession();
    const workspaceId = session.activeWorkspaceId;
    if (!workspaceId) {
      return NextResponse.json({ folders: [], tags: [], classifications: [] });
    }

    const [folders, tags, classifications] = await Promise.all([
      listFolders(session, workspaceId),
      listTags(session, workspaceId),
      listFileClassifications(session, workspaceId),
    ]);

    return NextResponse.json({ folders, tags, classifications });
  } catch {
    return NextResponse.json({ folders: [], tags: [], classifications: [] });
  }
}
