/**
 * GET/POST /api/admin/requests/[id]/chat — AI Chat Activity for request processing
 *
 * GET  — Load chat history (paginated)
 * POST — Send message + get AI response
 *
 * Authentication: super_admin, coordinator_admin, specialist, reviewer
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
import { llmComplete, isLlmConfigured, DEFAULT_MODELS } from '@/lib/ai/llm-gateway';
import { isVectorStoreReady } from '@/lib/ai/vector-store';
import type { ChatMessage } from '@/lib/ai/types';

const ALLOWED_ROLES = ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'] as const;
const DEFAULT_MODEL_KEY = 'gpt-4o-mini';

// ── Types ────────────────────────────────────────────────────

interface ChatMessageResponse {
  id: string;
  role: string;
  content: string;
  skill: string | null;
  citations: string[];
  metadata: {
    model?: string;
    tokens?: number;
    latencyMs?: number;
    confidence?: number;
  } | null;
  createdAt: string;
}

function parseMessage(msg: {
  id: string;
  role: string;
  content: string;
  skill: string | null;
  citations: string | null;
  metadata: string | null;
  createdAt: Date;
}): ChatMessageResponse {
  let citations: string[] = [];
  let meta: ChatMessageResponse['metadata'] = null;

  try {
    if (msg.citations) citations = JSON.parse(msg.citations);
  } catch { /* keep empty */ }

  try {
    if (msg.metadata) meta = JSON.parse(msg.metadata);
  } catch { /* keep null */ }

  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    skill: msg.skill,
    citations,
    metadata: meta,
    createdAt: msg.createdAt.toISOString(),
  };
}

// ── Helpers ──────────────────────────────────────────────────

function buildSystemPrompt(skill?: string | null): string {
  const base = `Bạn là trợ lý pháp lý AI cho nền tảng GitNexus Legal, phục vụ chuyên viên pháp lý (specialist) và người kiểm duyệt (reviewer).

Nguyên tắc:
1. Trả lời bằng tiếng Việt, chuyên nghiệp, chính xác về mặt pháp lý.
2. Luôn trích dẫn căn cứ pháp lý cụ thể (tên luật, điều khoản, nghị định).
3. Nếu không chắc chắn, nêu rõ mức độ tin cậy và đề xuất tham khảo thêm.
4. Phân biệt rõ giữa tư vấn sơ bộ và tư vấn pháp lý chính thức.
5. Không đưa ra lời khuyên pháp lý dứt khoát — luôn khuyến nghị kiểm tra bởi reviewer.`;

  if (skill) {
    return `${base}\n\nBạn đang được yêu cầu thực hiện kỹ năng: "${skill}". Hãy tập trung trả lời theo đúng chuyên môn này.`;
  }

  return base;
}

// ── GET ──────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAppSession();
    const hasRole = ALLOWED_ROLES.some((r) => (session.roles as string[]).includes(r));
    if (!hasRole) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { id: requestId } = await params;
    if (!requestId) {
      return NextResponse.json({ error: 'VALIDATION: missing request id' }, { status: 400 });
    }

    // Verify request exists
    const legalRequest = await prisma.legalRequest.findUnique({
      where: { id: requestId },
      select: { id: true, workspaceId: true, title: true },
    });
    if (!legalRequest) {
      return NextResponse.json({ error: 'REQUEST_NOT_FOUND' }, { status: 404 });
    }

    const rawMessages = await prisma.aiChatMessage.findMany({
      where: { requestId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        skill: true,
        citations: true,
        metadata: true,
        createdAt: true,
      },
    });

    const messages = rawMessages.map(parseMessage);

    return NextResponse.json({
      requestId,
      requestTitle: legalRequest.title,
      messages,
      ragAvailable: isVectorStoreReady(),
      model: DEFAULT_MODEL_KEY,
    });
  } catch (error) {
    console.error('[AI Chat GET Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST ─────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Auth
    const session = await requireAppSession();
    const hasRole = ALLOWED_ROLES.some((r) => (session.roles as string[]).includes(r));
    if (!hasRole) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { id: requestId } = await params;

    // Parse body
    const body = (await request.json().catch(() => null)) as {
      content?: string;
      skill?: string | null;
    } | null;

    if (!body?.content || !body.content.trim()) {
      return NextResponse.json(
        { error: 'VALIDATION: Thiếu nội dung tin nhắn' },
        { status: 400 },
      );
    }

    const content = body.content.trim();
    const skill = body.skill ?? null;

    // Fetch request with workspace info
    const legalRequest = await prisma.legalRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        workspaceId: true,
        title: true,
        intakeSubmission: {
          select: { matterTypeKey: true, answers: true },
        },
      },
    });

    if (!legalRequest) {
      return NextResponse.json({ error: 'REQUEST_NOT_FOUND' }, { status: 404 });
    }

    // 1. Store user message
    const userMessage = await prisma.aiChatMessage.create({
      data: {
        requestId,
        userId: session.userId,
        role: 'user',
        content,
        skill,
      },
    });

    // 2. Check AI availability
    if (!isLlmConfigured()) {
      return NextResponse.json(
        {
          error: 'AI_NOT_CONFIGURED',
          detail: 'Chưa cấu hình API key cho LLM. Cần OPENAI_API_KEY trong .env.',
          userMessage: parseMessage(userMessage),
          assistantMessage: null,
        },
        { status: 503 },
      );
    }

    // 3. Build LLM context
    const modelConfig = DEFAULT_MODELS[DEFAULT_MODEL_KEY];

    // Get prior history (last 20 messages)
    const priorMessages = await prisma.aiChatMessage.findMany({
      where: { requestId },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true },
      take: 20,
    });

    const chatMessages: ChatMessage[] = [
      { role: 'system', content: buildSystemPrompt(skill) },
      ...priorMessages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];

    // 4. Call LLM
    const llmResponse = await llmComplete({
      model: modelConfig,
      messages: chatMessages,
      temperature: 0.3,
      maxTokens: modelConfig.maxTokens ?? 4096,
    });

    // 5. Store assistant message
    const metadataJson = JSON.stringify({
      model: llmResponse.model,
      tokens: llmResponse.usage?.totalTokens ?? 0,
      latencyMs: llmResponse.latencyMs,
    });

    const assistantMessage = await prisma.aiChatMessage.create({
      data: {
        requestId,
        userId: session.userId,
        role: 'assistant',
        content: llmResponse.content,
        skill,
        metadata: metadataJson,
      },
    });

    // 6. Audit trail
    const metadataSummary = `[${skill ?? 'general'}] User: "${content.slice(0, 80)}" → AI: ${llmResponse.content.length} chars | Model: ${llmResponse.model}`;
    try {
      await recordAuditEvent({
        actorId: session.userId,
        workspaceId: legalRequest.workspaceId,
        action: 'ai.chat.message',
        targetType: 'REQUEST',
        targetId: requestId,
        requestId,
        correlationId: `ai-chat-${requestId}-${Date.now()}`,
        metadataSummary: metadataSummary.slice(0, 500),
      });
    } catch (auditErr) {
      console.error('[AI Chat Audit Error]', auditErr);
      // Non-fatal: audit failure shouldn't break the response
    }

    return NextResponse.json({
      userMessage: parseMessage(userMessage),
      assistantMessage: parseMessage(assistantMessage),
      ragAvailable: isVectorStoreReady(),
      model: llmResponse.model,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

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

    console.error('[AI Chat POST Error]', error);
    return NextResponse.json(
      { error: 'AI_EXECUTION_FAILED', detail: message },
      { status: 500 },
    );
  }
}
