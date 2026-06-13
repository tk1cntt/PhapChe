import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

// Default notification preferences
const DEFAULT_PREFERENCES = {
  emailOnReply: true,
  slaReminder: true,
  weeklySummary: false,
};

export async function GET() {
  try {
    const session = await requireAppSession();
    const userId = session.userId;

    // Fetch user preferences or return defaults
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId }
    });

    if (!preferences) {
      return NextResponse.json({
        success: true,
        data: DEFAULT_PREFERENCES
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        emailOnReply: preferences.emailOnReply,
        slaReminder: preferences.slaReminder,
        weeklySummary: preferences.weeklySummary,
      }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Get notification preferences failed:', message);

    if (message === 'UNAUTHENTICATED') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'FETCH_FAILED', message: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireAppSession();
    const userId = session.userId;

    const body = await request.json();
    const { emailOnReply, slaReminder, weeklySummary } = body;

    // Validate boolean fields
    const preferences: {
      emailOnReply?: boolean;
      slaReminder?: boolean;
      weeklySummary?: boolean;
    } = {};

    if (typeof emailOnReply === 'boolean') {
      preferences.emailOnReply = emailOnReply;
    }
    if (typeof slaReminder === 'boolean') {
      preferences.slaReminder = slaReminder;
    }
    if (typeof weeklySummary === 'boolean') {
      preferences.weeklySummary = weeklySummary;
    }

    // Upsert preferences
    const updatedPreferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: preferences,
      create: {
        userId,
        emailOnReply: preferences.emailOnReply ?? DEFAULT_PREFERENCES.emailOnReply,
        slaReminder: preferences.slaReminder ?? DEFAULT_PREFERENCES.slaReminder,
        weeklySummary: preferences.weeklySummary ?? DEFAULT_PREFERENCES.weeklySummary,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        emailOnReply: updatedPreferences.emailOnReply,
        slaReminder: updatedPreferences.slaReminder,
        weeklySummary: updatedPreferences.weeklySummary,
      }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Update notification preferences failed:', message);

    if (message === 'UNAUTHENTICATED') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'UPDATE_FAILED', message: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
