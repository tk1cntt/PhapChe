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
    // Log detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Create draft failed:', errorMessage, errorStack);

    // Return the actual error message to help debugging
    return NextResponse.json(
      { error: 'Failed to create draft', details: errorMessage },
      { status: 500 }
    );
  }
}
