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

    const serviceLabels = ['folders', 'tags', 'classifications'] as const;

    const results = await Promise.allSettled([
      listFolders(session, workspaceId),
      listTags(session, workspaceId),
      listFileClassifications(session, workspaceId),
    ]);

    const [folders, tags, classifications] = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      console.error(`Vault API: ${serviceLabels[i]} service failed:`, r.reason);
      return [];
    });
      if (r.status === 'fulfilled') return r.value;
      console.error(`Vault API: ${serviceLabels[i]} service failed:`, r.reason);
      return [];
    });
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
