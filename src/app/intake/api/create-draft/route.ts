import { NextResponse } from 'next/server';
import { createDraftIntake } from '@/lib/intake/intake-service';
import { requireAppSession } from '@/lib/security/session';

export async function POST(request: Request) {
  try {
    const session = await requireAppSession();
    const formData = await request.formData();
    const matterTypeKey = formData.get('matterTypeKey');

    if (!matterTypeKey || typeof matterTypeKey !== 'string') {
      return NextResponse.json({ error: 'matterTypeKey is required' }, { status: 400 });
    }

    const draft = await createDraftIntake({
      session,
      matterTypeKey,
      correlationId: `intake-${Date.now()}`,
    });

    return NextResponse.json({ requestId: draft.id });
  } catch (error) {
    console.error('Create draft failed:', error);
    return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 });
  }
}
