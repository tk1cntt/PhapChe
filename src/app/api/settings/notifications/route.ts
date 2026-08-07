import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

// Default notification preferences
const DEFAULT_PREFERENCES = {
  emailOnReply: true,
  slaReminder: true,
  weeklySummary: false,
};

// Wraps an authenticated handler with session extraction and uniform error handling
function withAuth(
  handler: (userId: string) => Promise<NextResponse>,
  errorCode: string,
  errorMessage: string,
) {
  return async () => {
    const session = await requireAppSession();
    try {
      return await handler(session.userId);
    } catch (error) {
      return errorResponse(errorCode, errorMessage, error);
    }
  };
}

// Usage:
// export const GET = withAuth(async (userId) => { … }, 'FETCH_FAILED', 'Failed to fetch preferences');
// export const PUT = withAuth(async (userId) => { … }, 'UPDATE_FAILED', 'Failed to update preferences');
      return await handler(session.userId);
    } catch (error) {
      return errorResponse(errorCode, errorMessage, error);
    }
  };
}

// Usage:
// export const GET = withAuth(async (userId) => { … }, 'FETCH_FAILED', 'Failed to fetch preferences');
// export const PUT = withAuth(async (userId) => { … }, 'UPDATE_FAILED', 'Failed to update preferences');
  emailOnReply: boolean;
  slaReminder: boolean;
  weeklySummary: boolean;
}) {
  return {
    emailOnReply: prefs.emailOnReply,
    slaReminder: prefs.slaReminder,
    weeklySummary: prefs.weeklySummary,
  };
}

// GET handler usage:
//   data: toPreferencesResponse(preferences)
// PUT handler usage:
//   data: toPreferencesResponse(updatedPreferences)
    slaReminder: prefs.slaReminder,
    weeklySummary: prefs.weeklySummary,
  };
}

// GET handler usage:
//   data: toPreferencesResponse(preferences)
// PUT handler usage:
//   data: toPreferencesResponse(updatedPreferences)
    error instanceof Error ? error.message : String(error),
  );
  return NextResponse.json({ error: errorCode, message }, { status: 500 });
}

// GET catch usage:
//   return errorResponse('FETCH_FAILED', 'Failed to fetch preferences', error);
// PUT catch usage:
//   return errorResponse('UPDATE_FAILED', 'Failed to update preferences', error);
    error instanceof Error ? error.message : String(error),
  );
  return NextResponse.json({ error: errorCode, message }, { status: 500 });
}

// GET catch usage:
//   return errorResponse('FETCH_FAILED', 'Failed to fetch preferences', error);
// PUT catch usage:
//   return errorResponse('UPDATE_FAILED', 'Failed to update preferences', error);

    // Validate boolean fields
    const preferences: {
      emailOnReply?: boolean;
      slaReminder?: boolean;
      weeklySummary?: boolean;
    } = {};

    // Validate and collect invalid fields
    const invalidFields: string[] = [];

    if (emailOnReply !== undefined) {
      if (typeof emailOnReply === 'boolean') preferences.emailOnReply = emailOnReply;
      else invalidFields.push('emailOnReply');
    }
    if (slaReminder !== undefined) {
      if (typeof slaReminder === 'boolean') preferences.slaReminder = slaReminder;
      else invalidFields.push('slaReminder');
    }
    if (weeklySummary !== undefined) {
      if (typeof weeklySummary === 'boolean') preferences.weeklySummary = weeklySummary;
      else invalidFields.push('weeklySummary');
    }

    if (invalidFields.length > 0) {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', message: 'Invalid boolean values', fields: invalidFields },
        { status: 400 },
      );
    }
      else invalidFields.push('slaReminder');
    }
    if (weeklySummary !== undefined) {
      if (typeof weeklySummary === 'boolean') preferences.weeklySummary = weeklySummary;
      else invalidFields.push('weeklySummary');
    }

    if (invalidFields.length > 0) {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', message: 'Invalid boolean values', fields: invalidFields },
        { status: 400 },
      );
    }
    return NextResponse.json({
      success: true,
      data: {
        emailOnReply: updatedPreferences.emailOnReply,
        slaReminder: updatedPreferences.slaReminder,
        weeklySummary: updatedPreferences.weeklySummary,
      }
    });

  } catch (error) {
    console.error('Update notification preferences failed:', error instanceof Error ? error.message : String(error));

    return NextResponse.json(
      { error: 'UPDATE_FAILED', message: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
