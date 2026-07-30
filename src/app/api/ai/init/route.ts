/**
 * GET /api/ai/init — Initialize legal knowledge base
 *
 * Called on first app load to index Vietnamese laws into vector store.
 * Idempotent — skips if already initialized.
 */

import { NextResponse } from 'next/server';
import { initializeLegalKnowledge } from '@/lib/ai/legal-knowledge';
import { isLlmConfigured } from '@/lib/ai/llm-gateway';

// Module-level lock to prevent concurrent initialization (race condition)
let initPromise: Promise<{ indexed: number; totalChunks: number; sources: string[] }> | null = null;

export async function GET() {
  try {
    // Reuse the existing in-flight promise to avoid duplicate indexing
    if (!initPromise) {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI_INIT_TIMEOUT')), 50_000),
      );
      initPromise = Promise.race([initializeLegalKnowledge(), timeoutPromise]);
    }

    const result = await initPromise;

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
    // Reset lock on failure so next request can retry
    initPromise = null;
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
