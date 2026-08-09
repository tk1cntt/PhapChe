/**
 * Partner Auth Login API
 * POST /api/partner/auth/login
 *
 * Partner-specific login that returns session with partner context
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getPermissionsForRole } from '@/lib/services/partner-auth-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Sign in with better-auth
    const signInResult = await auth.api.signInEmail({
      body: {
        email: email.toLowerCase(),
        password,
      },
    });

    if (!signInResult?.user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: signInResult.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is inactive' },
        { status: 403 }
      );
    }

    // Check if user is an active partner member
    const member = await prisma.partnerMember.findFirst({
      where: {
        userId: user.id,
        isActive: true,
        partner: {
          status: 'active',
        },
      },
      include: {
        partner: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'User is not a partner member' },
        { status: 403 }
      );
    }

    // Get permissions for the role
    const permissions = getPermissionsForRole(member.role);

    // Generate session token (using better-auth session)
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    // Calculate expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      partner: {
        id: member.partner.id,
        name: member.partner.name,
        type: member.partner.type,
      },
      partnerMember: {
        id: member.id,
        role: member.role,
        permissions,
      },
      session: {
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Partner login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
