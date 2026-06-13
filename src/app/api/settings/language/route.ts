import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

// Valid locale values
const VALID_LOCALES = ['vi', 'en', 'zh', 'ja'] as const;
type Locale = typeof VALID_LOCALES[number];

export async function PUT(request: Request) {
  try {
    const session = await requireAppSession();
    const userId = session.userId;

    const body = await request.json();
    const { locale } = body;

    // Validate locale
    if (!locale || typeof locale !== 'string') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Locale is required' },
        { status: 400 }
      );
    }

    if (!VALID_LOCALES.includes(locale as Locale)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: `Locale must be one of: ${VALID_LOCALES.join(', ')}` },
        { status: 400 }
      );
    }

    // Update user locale
    await prisma.user.update({
      where: { id: userId },
      data: { locale: locale as string }
    });

    return NextResponse.json({
      success: true,
      locale
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Language update failed:', message);

    if (message === 'UNAUTHENTICATED') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'UPDATE_FAILED', message: 'Failed to update language preference' },
      { status: 500 }
    );
  }
}
