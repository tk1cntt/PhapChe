/**
 * AI Module — Barrel Export
 *
 * v2.3 AI System: LLM Gateway + RAG Vector Store + Agent Skill Framework
 */

// Types
export type {
  DocumentChunk,
  SearchResult,
  SearchQuery,
  ChatMessage,
  LlmRequest,
  LlmResponse,
  LlmStreamChunk,
  LlmModelConfig,
  LlmProvider,
  LegalDomain,
  AgentSkill,
  SkillContext,
  SkillResult,
  SkillResultStream,
  AiSuggestion,
  SystemPromptTemplate,
} from './types';

export { DOMAIN_SKILL_MAP } from './types';

// LLM Gateway
export {
  llmComplete,
  llmStream,
  isLlmConfigured,
  getAvailableModels,
  DEFAULT_MODELS,
} from './llm-gateway';

// Vector Store
export {
  chunkDocument,
  cosineSimilarity,
  embedText,
  embedBatch,
  indexDocument,
  semanticSearch,
  getIndexStats,
  isVectorStoreReady,
  vectorIndex,
} from './vector-store';

// System Prompts
export {
  getSystemPrompt,
  getAllSkills,
  getSkillsForDomain,
  renderSystemPrompt,
} from './system-prompts';

// Domain Resolver
export {
  suggestSkills,
  matterTypeToDomain,
  getPrimarySkill,
} from './domain-resolver';

// Legal Knowledge
export {
  initializeLegalKnowledge,
  getDocumentText,
  listLegalDocuments,
  luatDoanhNghiep2020,
  boLuatLaoDong2019,
  boLuatDanSu2015,
} from './legal-knowledge';
export type { LegalKnowledgeDoc, LegalArticle, LegalChapter } from './legal-knowledge';
