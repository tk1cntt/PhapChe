/**
 * POST /api/ai/analyze — Execute AI agent skill on a request
 *
 * Body: { requestId: string, skill: AgentSkill }
 * Returns: SkillResult with structured output
 *
 * Authentication: Requires session (super_admin, coordinator, specialist, reviewer)
 * Rate limited to 60 requests/minute via LLM Gateway
 */

import { NextResponse } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';
import { getSkillExecutor, isAiReady } from '@/lib/ai/skill-executor';
import { getSystemPrompt } from '@/lib/ai/system-prompts';
import { isVectorStoreReady } from '@/lib/ai/vector-store';
import { DOMAIN_SKILL_MAP } from '@/lib/ai/types';
import type { AgentSkill, LegalDomain, SkillContext } from '@/lib/ai/types';

const ALLOWED_ROLES = ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'] as const;

export async function POST(request: Request) {
  try {
    // Auth
    const session = await requireAppSession();
    const hasRole = (ALLOWED_ROLES as readonly string[]).some((r) => session.roles.includes(r as never));
    if (!hasRole) {
      return NextResponse.json({ error: 'FORBIDDEN: Chỉ admin, coordinator, specialist, reviewer được dùng AI' }, { status: 403 });
    }

    // Parse body
    const body = (await request.json().catch(() => null)) as {
      requestId?: string;
      skill?: AgentSkill;
    } | null;

    if (!body?.requestId || !body?.skill) {
      return NextResponse.json(
        { error: 'VALIDATION: Thiếu requestId hoặc skill' },
        { status: 400 },
      );
    }

    const { requestId, skill } = body;

    // Check AI availability
    if (!isAiReady()) {
      return NextResponse.json(
        {
          error: 'AI_NOT_CONFIGURED',
          detail: 'Chưa cấu hình API key cho LLM. Cần OPENAI_API_KEY hoặc LLM_GATEWAY_KEY trong .env.',
          available: false,
        },
        { status: 503 },
      );
    }

    // Fetch request data
    const legalRequest = await prisma.legalRequest.findUnique({
      where: { id: requestId },
      include: {
        intakeSubmission: {
          select: {
            matterTypeKey: true,
            answers: true,
          },
        },
      },
    });

    if (!legalRequest) {
      return NextResponse.json({ error: 'REQUEST_NOT_FOUND' }, { status: 404 });
    }

    // Resource-level authorization: verify user is assigned to this request
    const isAssigned = legalRequest.assignedSpecialistId === session.userId
      || legalRequest.assignedReviewerId === session.userId
      || legalRequest.createdById === session.userId;
    const isAdmin = session.roles?.some((r: string) => ['super_admin', 'coordinator_admin'].includes(r));

    if (!isAssigned && !isAdmin) {
      return NextResponse.json(
        { error: 'FORBIDDEN: Not authorized to access this request' },
        { status: 403 },
      );
    }

    // Determine legal domain from matter type
    const matterTypeKey = legalRequest.intakeSubmission?.matterTypeKey ?? 'unsupported';
    let domain: LegalDomain = 'commercial-legal';
    for (const [d, skills] of Object.entries(DOMAIN_SKILL_MAP)) {
      if (skills.includes(skill)) {
        domain = d as LegalDomain;
        break;
      }
    }

    // Parse intake answers
    let intakeAnswers: Record<string, string> | undefined;
    if (legalRequest.intakeSubmission?.answers) {
      try {
        intakeAnswers = typeof legalRequest.intakeSubmission.answers === 'string'
          ? JSON.parse(legalRequest.intakeSubmission.answers)
          : legalRequest.intakeSubmission.answers;
      } catch {
        intakeAnswers = undefined;
      }
    }

    // Build context
    const context: SkillContext = {
      matterTypeKey,
      domain,
      requestContext: {
        title: legalRequest.title,
        description: intakeAnswers ? JSON.stringify(intakeAnswers) : undefined,
        intakeAnswers,
      },
      locale: 'vi',
    };

    // Execute skill
    const executor = getSkillExecutor();
    const result = await executor.execute(skill, context);

    // Record suggestion for audit (await to ensure audit integrity)
    try {
      await executor.recordSuggestion(requestId, skill, result, session.userId);
    } catch (auditError) {
      console.error('[AI Audit Error] Failed to record suggestion:', auditError);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        ragAvailable: isVectorStoreReady(),
        model: process.env.LLM_MODEL ?? 'gpt-4o-mini',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Handle authentication/session errors explicitly
    if (message === 'UNAUTHENTICATED' || message.includes('SESSION')) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', detail: 'Invalid or expired session.' },
        { status: 401 },
      );
    }

    // Re-throw Next.js redirect errors
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }

    if (message === 'LLM_API_KEY_MISSING' || message.includes('LLM_API_KEY_MISSING')) {
      return NextResponse.json(
        {
          error: 'AI_NOT_CONFIGURED',
          detail: 'Chưa cấu hình API key cho LLM. Thêm OPENAI_API_KEY vào .env.',
        },
        { status: 503 },
      );
    }

    if (message === 'LLM_RATE_LIMIT') {
      return NextResponse.json(
        { error: 'RATE_LIMITED', detail: 'Quá nhiều yêu cầu. Thử lại sau 1 phút.' },
        { status: 429 },
      );
    }

    console.error('[AI Analyze Error]', error);
    return NextResponse.json(
      {
        error: 'AI_EXECUTION_FAILED',
        detail: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
