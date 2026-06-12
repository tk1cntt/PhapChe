import { NextResponse } from 'next/server';
import { submitIntake } from '@/lib/intake/intake-service';
import { requireAppSession } from '@/lib/security/session';

export async function POST(request: Request) {
  try {
    const session = await requireAppSession();
    const body = await request.json();
    const { requestId } = body;

    if (!requestId || typeof requestId !== 'string') {
      return NextResponse.json(
        { error: 'REQUEST_ID_REQUIRED', message: 'requestId is required' },
        { status: 400 }
      );
    }

    const result = await submitIntake({
      session,
      requestId,
      correlationId: `v2-submit-${Date.now()}`,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Submit intake failed:', message);

    if (message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Access denied' },
        { status: 403 }
      );
    }
    if (message === 'INTAKE_NOT_DRAFT') {
      return NextResponse.json(
        { error: 'NOT_DRAFT', message: 'Request is not in draft status' },
        { status: 400 }
      );
    }
    if (message.startsWith('INTAKE_REQUIRED_ANSWERS_MISSING:')) {
      const missingFields = message.split(':')[1] || '';
      return NextResponse.json(
        { error: 'MISSING_ANSWERS', message: 'Required answers are missing', missingFields: missingFields.split(',') },
        { status: 400 }
      );
    }
    if (message === 'INTAKE_SUBMISSION_NOT_FOUND') {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Intake submission not found' },
        { status: 404 }
      );
    }
    if (message === 'COORDINATOR_REQUIRED_FOR_TRIAGE') {
      return NextResponse.json(
        { error: 'COORDINATOR_REQUIRED', message: 'A coordinator is required to process this request' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'SUBMIT_FAILED', message: 'Failed to submit request' },
      { status: 500 }
    );
  }
}
