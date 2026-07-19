/**
 * GET /api/ai/status — Check AI system availability
 *
 * Returns: model list, RAG status, available skills
 */

import { NextResponse } from 'next/server';
import { isLlmConfigured, getAvailableModels } from '@/lib/ai/llm-gateway';
import { isVectorStoreReady, getIndexStats } from '@/lib/ai/vector-store';
import { getAllSkills } from '@/lib/ai/system-prompts';
import { DOMAIN_SKILL_MAP } from '@/lib/ai/types';

export async function GET() {
  const llmReady = isLlmConfigured();
  const ragReady = isVectorStoreReady();
  const models = llmReady ? getAvailableModels() : [];
  const skills = getAllSkills();
  const ragStats = getIndexStats();

  return NextResponse.json({
    status: llmReady ? 'available' : 'not_configured',
    llm: {
      configured: llmReady,
      availableModels: models.map((m) => ({
        id: m.modelId,
        provider: m.provider,
        maxTokens: m.maxTokens,
      })),
    },
    rag: {
      ready: ragReady,
      chunkCount: ragStats.chunkCount,
      documentCount: ragStats.documentCount,
      sources: ragStats.sources,
    },
    skills: {
      total: skills.length,
      list: skills,
      byDomain: Object.fromEntries(
        Object.entries(DOMAIN_SKILL_MAP).map(([domain, dSkills]) => [domain, dSkills]),
      ),
    },
  });
}
