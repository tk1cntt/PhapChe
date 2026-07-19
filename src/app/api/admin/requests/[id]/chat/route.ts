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
const DEFAULT_MODEL_KEY = 'startup-model';

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

// ── Types ────────────────────────────────────────────────────

interface RequestContext {
  title: string;
  description?: string | null;
  matterTypeKey?: string | null;
  intakeAnswers?: Record<string, unknown> | null;
  documents?: { title: string; content: string }[];
}

// ── Helpers ──────────────────────────────────────────────────

const MAX_CONTEXT_CHARS = 12000; // Giới hạn tổng context để tránh vượt token
const MAX_DOC_CHARS = 2500;      // Giới hạn mỗi tài liệu
const MAX_LLM_RETRIES = 3;

/**
 * Validate LLM response content — detect tool-call format, empty, too-short truncated.
 * Exported for testability.
 */
export function isValidAssistantContent(content: string | null | undefined, totalTokens = 0): {
  valid: boolean;
  reason: 'ok' | 'empty' | 'tool_call_format' | 'too_short' | 'length_capped';
} {
  const text = (content ?? '').trim();

  if (text.length === 0) {
    return { valid: false, reason: 'empty' };
  }

  // Detect tool-call format: [调用...], read_file, search_file, write_to_file, etc.
  if (/\[调用|read_file|search_file|execute_command|list_files|write_to_file|replace_in_file|insert_file|delete_file|preview_url/.test(text)) {
    return { valid: false, reason: 'tool_call_format' };
  }

  // Quá ngắn dù dùng nhiều tokens → model bị lỗi hoặc trả tool-call
  if (text.length < 20 && totalTokens > 100) {
    return { valid: false, reason: 'too_short' };
  }

  // finish_reason="length" — model bị cắt giữa chừng
  if (text.length < 100 && totalTokens > 1000) {
    return { valid: false, reason: 'length_capped' };
  }

  return { valid: true, reason: 'ok' };
}

/**
 * Generate 4-6 suggested questions dựa vào document content + request info.
 * Dùng template-based (không gọi LLM) — nhanh, free.
 */
function generateSuggestedQuestions(context: RequestContext): string[] {
  const questions: string[] = [];
  const allText = [
    context.title,
    context.matterTypeKey ?? '',
    ...(context.documents?.map((d) => d.content) ?? []),
  ].join(' ').toLowerCase();

  const title = context.title;

  // Phân loại câu hỏi theo nội dung document
  if (allText.includes('điều 1') || allText.includes('điều 2') || allText.includes('điều khoản')) {
    questions.push(`Tóm tắt các điều khoản chính trong hồ sơ "${title}"`);
    questions.push('Các điều khoản nào có rủi ro pháp lý cao nhất? Cần sửa thế nào?');
  }

  if (allText.includes('hợp đồng') || allText.includes('lao động') || context.matterTypeKey === 'labor_contract') {
    questions.push('Hợp đồng này có tuân thủ Bộ luật Lao động 2019 không? Liệt kê điểm cần bổ sung.');
    questions.push('Điều khoản chấm dứt hợp đồng và bồi thường đã đủ chặt chẽ chưa?');
  }

  if (allText.includes('bảo mật') || allText.includes('nda') || allText.includes('confidential')) {
    questions.push('Phạm vi bảo mật trong NDA này đã bao quát đủ loại thông tin cần bảo vệ chưa?');
    questions.push('Thời hạn bảo mật và chế tài xử phạt vi phạm đã đủ mạnh chưa?');
  }

  if (allText.includes('dịch vụ') || allText.includes('service') || allText.includes('sla')) {
    questions.push('Điều khoản SLA và phí dịch vụ có công bằng cho cả hai bên không?');
    questions.push('Điều khoản chấm dứt hợp đồng dịch vụ đã bảo vệ đủ quyền lợi khách hàng chưa?');
  }

  if (allText.includes('thành lập') || allText.includes('doanh nghiệp') || allText.includes('công ty')) {
    questions.push('Hồ sơ thành lập đã đủ giấy tờ theo Luật Doanh nghiệp 2025 chưa?');
    questions.push('Ngành nghề đăng ký có cần giấy phép con hoặc điều kiện đặc biệt không?');
  }

  if (allText.includes('nhãn hiệu') || allText.includes('sở hữu trí tuệ') || allText.includes('đăng ký')) {
    questions.push('Nhãn hiệu này có khả năng bị từ chối vì tương tự nhãn hiệu khác không?');
    questions.push('Phân nhóm Nice đã khai báo đủ để bảo hộ toàn diện sản phẩm/dịch vụ chưa?');
    questions.push('Cần chuẩn bị thêm tài liệu gì để tăng khả năng được cấp văn bằng bảo hộ?');
  }

  // Generic questions luôn có
  const genericQuestions = [
    `Phân tích rủi ro pháp lý chính trong hồ sơ "${title}"`,
    'Những quy định pháp luật nào đang chi phối hồ sơ này?',
    'Đề xuất các bước tiếp theo để hoàn thiện và xử lý hồ sơ này.',
    'Soạn thảo email phản hồi khách hàng về tình trạng hồ sơ.',
  ];

  // Điền generic nếu chưa đủ 4 câu
  for (const gq of genericQuestions) {
    if (questions.length >= 6) break;
    if (!questions.includes(gq)) questions.push(gq);
  }

  // Giới hạn 6 câu
  return questions.slice(0, 6);
}

function buildSystemPrompt(skill?: string | null, context?: RequestContext): string {
  const base = `Bạn là trợ lý pháp lý AI cho nền tảng GitNexus Legal, phục vụ chuyên viên pháp lý (specialist) và người kiểm duyệt (reviewer).

QUAN TRỌNG: Bạn KHÔNG có khả năng gọi hàm (function calling) hay công cụ (tools). Tuyệt đối KHÔNG tạo ra các lệnh như [调用...], read_file, search_file, hay bất kỳ tool call nào. Chỉ trả lời TRỰC TIẾP bằng văn bản.

Nguyên tắc:
1. Trả lời bằng tiếng Việt, chuyên nghiệp, chính xác về mặt pháp lý.
2. Luôn trích dẫn căn cứ pháp lý cụ thể (tên luật, điều khoản, nghị định).
3. Nếu không chắc chắn, nêu rõ mức độ tin cậy và đề xuất tham khảo thêm.
4. Phân biệt rõ giữa tư vấn sơ bộ và tư vấn pháp lý chính thức.
5. Không đưa ra lời khuyên pháp lý dứt khoát — luôn khuyến nghị kiểm tra bởi reviewer.`;

  const parts: string[] = [base];

  if (skill) {
    parts.push(`\nBạn đang được yêu cầu thực hiện kỹ năng: "${skill}". Hãy tập trung trả lời theo đúng chuyên môn này.`);
  }

  // Inject request context nếu có
  if (context) {
    parts.push('\n---');
    parts.push('\n## THÔNG TIN YÊU CẦU HIỆN TẠI');
    parts.push(`\n**Tiêu đề:** ${context.title}`);

    if (context.matterTypeKey) {
      parts.push(`**Loại hồ sơ:** ${context.matterTypeKey}`);
    }

    if (context.description) {
      parts.push(`**Mô tả:** ${context.description}`);
    }

    // Intake answers
    if (context.intakeAnswers && Object.keys(context.intakeAnswers).length > 0) {
      parts.push('\n### Thông tin khách hàng cung cấp:');
      for (const [key, value] of Object.entries(context.intakeAnswers)) {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
        parts.push(`- ${label}: ${String(value)}`);
      }
    }

    // Documents
    if (context.documents && context.documents.length > 0) {
      parts.push(`\n### Tài liệu đính kèm (${context.documents.length} tài liệu):`);
      for (let i = 0; i < context.documents.length; i++) {
        const doc = context.documents[i];
        const truncated = doc.content.length > MAX_DOC_CHARS
          ? doc.content.slice(0, MAX_DOC_CHARS) + '\n...[đã cắt]'
          : doc.content;
        parts.push(`\n--- Tài liệu ${i + 1}: ${doc.title} ---`);
        parts.push(truncated);
      }
    }

    parts.push('\n---');
    parts.push('\nHãy sử dụng các thông tin trên để trả lời chính xác và phù hợp với ngữ cảnh của yêu cầu này.');
  }

  const full = parts.join('\n');
  // Truncate toàn bộ system prompt nếu quá dài
  return full.length > MAX_CONTEXT_CHARS
    ? full.slice(0, MAX_CONTEXT_CHARS) + '\n...[system prompt đã cắt để vừa context]'
    : full;
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

    // Verify request exists + fetch context (title, matterType, documents)
    const legalRequest = await prisma.legalRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        workspaceId: true,
        title: true,
        description: true,
        intakeSubmission: {
          select: { matterTypeKey: true, answers: true },
        },
      },
    });
    if (!legalRequest) {
      return NextResponse.json({ error: 'REQUEST_NOT_FOUND' }, { status: 404 });
    }

    // Fetch messages
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

    // Fetch documents để generate suggested questions
    const documents = await prisma.document.findMany({
      where: { requestId, deletedAt: null },
      include: {
        documentVersions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { generatedContent: true, status: true },
        },
      },
    });

    const requestContext: RequestContext = {
      title: legalRequest.title,
      description: legalRequest.description,
      matterTypeKey: legalRequest.intakeSubmission?.matterTypeKey ?? null,
      intakeAnswers: (legalRequest.intakeSubmission?.answers as Record<string, unknown>) ?? null,
      documents: documents
        .map((d) => {
          const latestVersion = d.documentVersions[0];
          return latestVersion
            ? { title: d.title, content: latestVersion.generatedContent }
            : null;
        })
        .filter((d): d is { title: string; content: string } => d !== null),
    };

    const suggestedQuestions = generateSuggestedQuestions(requestContext);

    return NextResponse.json({
      requestId,
      requestTitle: legalRequest.title,
      messages,
      suggestedQuestions,
      ragAvailable: isVectorStoreReady(),
      model: DEFAULT_MODEL_KEY,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[AI Chat GET Error]', msg, error);
    return NextResponse.json({ error: 'Internal server error', detail: msg }, { status: 500 });
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

    // Fetch request with workspace info + intake
    const legalRequest = await prisma.legalRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        workspaceId: true,
        title: true,
        description: true,
        intakeSubmission: {
          select: { matterTypeKey: true, answers: true },
        },
      },
    });

    if (!legalRequest) {
      return NextResponse.json({ error: 'REQUEST_NOT_FOUND' }, { status: 404 });
    }

    // Fetch documents attached to this request (latest version only)
    const documents = await prisma.document.findMany({
      where: { requestId, deletedAt: null },
      include: {
        documentVersions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { generatedContent: true, status: true },
        },
      },
    });

    // Build request context cho LLM
    const requestContext: RequestContext = {
      title: legalRequest.title,
      description: legalRequest.description,
      matterTypeKey: legalRequest.intakeSubmission?.matterTypeKey ?? null,
      intakeAnswers: (legalRequest.intakeSubmission?.answers as Record<string, unknown>) ?? null,
      documents: documents
        .map((d) => {
          const latestVersion = d.documentVersions[0];
          return latestVersion
            ? { title: d.title, content: latestVersion.generatedContent }
            : null;
        })
        .filter((d): d is { title: string; content: string } => d !== null),
    };

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

    // Filter out empty assistant messages (caused by parsing bug) to avoid confusing LLM
    const validPriorMessages = priorMessages.filter(
      (m) => m.role !== 'assistant' || (m.content && m.content.length > 0),
    );

    const chatMessages: ChatMessage[] = [
      { role: 'system', content: buildSystemPrompt(skill, requestContext) },
      ...validPriorMessages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];

    // 4. Call LLM with retry on empty/tool-call content
    const TEMPERATURES = [0.3, 0.6, 0.9]; // Tăng dần để đa dạng hóa response
    let llmResponse: import('@/lib/ai/types').LlmResponse | null = null;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_LLM_RETRIES; attempt++) {
      try {
        const temp = TEMPERATURES[attempt] ?? 0.3;
        llmResponse = await llmComplete({
          model: modelConfig,
          messages: chatMessages,
          temperature: temp,
          maxTokens: modelConfig.maxTokens ?? 4096,
        });

        const validation = isValidAssistantContent(
          llmResponse.content,
          llmResponse.usage?.totalTokens ?? 0,
        );

        if (validation.valid) {
          break; // Valid response, thoát retry loop
        }

        console.warn(
          `[AI Chat] LLM attempt ${attempt + 1}/${MAX_LLM_RETRIES} returned invalid: ` +
          `reason=${validation.reason} tokens=${llmResponse.usage?.totalTokens ?? 0} ` +
          `chars=${(llmResponse.content ?? '').trim().length}` +
          ((llmResponse.content ?? '').length > 0 ? ` preview="${(llmResponse.content ?? '').slice(0, 100)}"` : ''),
        );

        if (attempt < MAX_LLM_RETRIES - 1) {
          // Thêm instruction nhắc LLM trả lời trực tiếp
          chatMessages.push({
            role: 'system' as const,
            content: 'Hệ thống: Bạn đang chat trực tiếp với người dùng. KHÔNG gọi hàm. Chỉ trả lời bằng tiếng Việt trực tiếp vào nội dung câu hỏi pháp lý.',
          });
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[AI Chat] LLM attempt ${attempt + 1} failed:`, lastError.message);
        if (attempt < MAX_LLM_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    if (!llmResponse || !llmResponse.content || llmResponse.content.trim().length === 0) {
      // All retries exhausted — still no content. Return error to frontend.
      const errMsg = lastError?.message ?? 'LLM returned empty content after retries';
      console.error('[AI Chat] All LLM attempts failed:', errMsg);
      return NextResponse.json(
        {
          error: 'AI_EXECUTION_FAILED',
          detail: `Không nhận được phản hồi hợp lệ từ AI sau ${MAX_LLM_RETRIES} lần thử. Vui lòng thử lại.`,
          userMessage: parseMessage(userMessage),
          assistantMessage: null,
        },
        { status: 502 },
      );
    }

    // 5. Store assistant message
    const metadataJson = JSON.stringify({
      model: llmResponse.model,
      tokens: llmResponse.usage?.totalTokens ?? 0,
      latencyMs: llmResponse.latencyMs,
      attempts: llmResponse.usage?.totalTokens ?? 0 > 0 ? 'success' : 'retry',
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
