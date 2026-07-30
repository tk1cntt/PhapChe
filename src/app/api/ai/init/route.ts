/**
 * GET /api/ai/init — Initialize legal knowledge base
 *
 * Called on first app load to index Vietnamese laws into vector store.
 * Idempotent — skips if already initialized.
 */

import { NextResponse } from 'next/server';
import { initializeLegalKnowledge } from '@/lib/ai/legal-knowledge';
import { isLlmConfigured } from '@/lib/ai/llm-gateway';

export async function GET() {
  try {
    const result = await initializeLegalKnowledge();

    return NextResponse.json({
      success: true,
      data: {
        indexed: result.indexed,
        totalChunks: result.totalChunks,
        sources: result.sources,
        llmReady: isLlmConfigured(),
      },
    });
  } catch (error) {
    console.error('[AI Init Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'AI_INIT_FAILED',
        detail: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
