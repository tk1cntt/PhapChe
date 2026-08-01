/**
 * AI System Types — v2.3
 *
 * Domain model cho AI integration: LLM Gateway, RAG Vector Store,
 * Agent Skill Framework, Audit Trail cho AI suggestions.
 */

// ── Vector / Embedding ──────────────────────────────────────

export interface DocumentChunk {
  /** Unique chunk ID */
  id: string;
  /** Full document this chunk belongs to */
  documentId: string;
  /** Source document title/reference (e.g. "Luật Doanh nghiệp 2020 — Điều 135") */
  source: string;
  /** Original text content */
  content: string;
  /** Chunk index within document */
  chunkIndex: number;
  /** Embedding vector (dimension depends on model) */
  embedding: number[];
  /** Legal domain tags for filtering */
  domainTags: LegalDomain[];
  /** Document metadata */
  metadata: Record<string, string>;
  /** ISO timestamp when chunk was indexed */
  indexedAt: string;
}

export interface SearchResult {
  chunk: DocumentChunk;
  /** Cosine similarity score (0-1) */
  score: number;
}

export interface SearchQuery {
  /** Natural language query */
  query: string;
  /** Filter by legal domain(s) */
  domainTags?: LegalDomain[];
  /** Max results to return */
  topK?: number;
  /** Minimum similarity threshold (0-1) */
  minScore?: number;
}

// ── LLM Gateway ─────────────────────────────────────────────

export type LlmProvider = 'openai' | 'azure' | 'anthropic' | 'groq' | 'custom';

export interface LlmModelConfig {
  provider: LlmProvider;
  modelId: string;
  /** API base URL (for custom endpoints) */
  baseUrl?: string;
  /** API key (loaded from env) */
  apiKeyEnv: string;
  /** Default max tokens */
  maxTokens?: number;
  /** Default temperature */
  temperature?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmRequest {
  /** Model config to use */
  model: LlmModelConfig;
  /** Messages (system + user + history) */
  messages: ChatMessage[];
  /** Override default temperature */
  temperature?: number;
  /** Override default max tokens */
  maxTokens?: number;
  /** JSON mode (structured output) */
  responseFormat?: 'text' | 'json_object';
  /** Enable streaming */
  stream?: boolean;
}

export interface LlmResponse {
  /** Full response text */
  content: string;
  /** Token usage */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Model used */
  model: string;
  /** Whether response was from cache */
  cached?: boolean;
  /** Latency in ms */
  latencyMs: number;
}

export interface LlmStreamChunk {
  /** Partial content delta */
  delta: string;
  /** Whether this is the final chunk */
  done: boolean;
}

// ── Agent Skill Framework ───────────────────────────────────

/** 13 legal domains matching SEED_LEGAL_DOMAINS */
export type LegalDomain =
  | 'commercial-legal'
  | 'corporate-legal'
  | 'employment-legal'
  | 'privacy-legal'
  | 'product-legal'
  | 'regulatory-legal'
  | 'ai-governance-legal'
  | 'ip-legal'
  | 'litigation-legal'
  | 'legal-clinic'
  | 'law-student'
  | 'legal-builder-hub'
  | 'external-plugins';

/** Agent skill types — each maps to a matter type workflow step */
// Phase 1 (P0): Commercial + Corporate
// Phase 2 (P0): Employment + Privacy
// Phase 3 (P1): IP + Litigation
// Phase 4 (P2): Product + Regulatory + AI Governance + Clinic
export type AgentSkill =
  // ── Commercial Legal ──
  | 'commercial-contract-drafter'
  | 'commercial-contract-reviewer'
  | 'nda-reviewer'
  | 'vendor-contract-reviewer'
  // ── Corporate Legal ──
  | 'corporate-doc-generator'
  | 'corporate-compliance-checker'
  | 'board-resolution-drafter'
  | 'entity-compliance-checker'
  // ── Employment Legal ──
  | 'employment-contract-reviewer'
  | 'employment-policy-checker'
  | 'labor-discipline-checker'
  | 'internal-regulation-drafter'
  // ── Privacy Legal ──
  | 'privacy-compliance-checker'
  | 'privacy-dpia-generator'
  | 'dsar-response-drafter'
  // ── IP Legal ──
  | 'ip-trademark-search'
  | 'ip-patent-analyzer'
  | 'trademark-clearance'
  | 'cease-desist-drafter'
  // ── Litigation ──
  | 'litigation-risk-scorer'
  | 'demand-letter-drafter'
  | 'litigation-strategist'
  // ── Product Legal ──
  | 'tos-generator'
  // ── Regulatory ──
  | 'regulatory-gap-analyzer'
  | 'compliance-gap-analyzer'
  // ── AI Governance ──
  | 'ai-governance-assessor'
  | 'ai-impact-assessment'
  // ── Legal Clinic ──
  | 'client-letter-drafter'
  | 'legal-memo-drafter'
  // ── Generic ──
  | 'general-legal-researcher'
  | 'document-issue-analyzer';

/** Maps legal domain → agent skills */
export const DOMAIN_SKILL_MAP: Record<LegalDomain, AgentSkill[]> = {
  'commercial-legal': ['nda-reviewer', 'vendor-contract-reviewer', 'commercial-contract-drafter', 'commercial-contract-reviewer'],
  'corporate-legal': ['board-resolution-drafter', 'entity-compliance-checker', 'corporate-doc-generator', 'corporate-compliance-checker'],
  'employment-legal': ['labor-discipline-checker', 'internal-regulation-drafter', 'employment-contract-reviewer', 'employment-policy-checker'],
  'privacy-legal': ['dsar-response-drafter', 'privacy-compliance-checker', 'privacy-dpia-generator'],
  'product-legal': ['tos-generator', 'regulatory-gap-analyzer'],
  'regulatory-legal': ['compliance-gap-analyzer', 'regulatory-gap-analyzer', 'general-legal-researcher'],
  'ai-governance-legal': ['ai-impact-assessment', 'ai-governance-assessor'],
  'ip-legal': ['trademark-clearance', 'cease-desist-drafter', 'ip-trademark-search', 'ip-patent-analyzer'],
  'litigation-legal': ['demand-letter-drafter', 'litigation-strategist', 'litigation-risk-scorer'],
  'legal-clinic': ['client-letter-drafter', 'legal-memo-drafter', 'general-legal-researcher'],
  'law-student': ['general-legal-researcher'],
  'legal-builder-hub': ['general-legal-researcher', 'commercial-contract-drafter'],
  'external-plugins': ['general-legal-researcher'],
  // Note: 'document-issue-analyzer' is intentionally omitted from DOMAIN_SKILL_MAP
  // as it is a generic fallback skill used when no domain-specific skill matches.
};

export interface SkillContext {
  /** Which matter type is being handled */
  matterTypeKey: string;
  /** Legal domain */
  domain: LegalDomain;
  /** Request context (title, description, intake answers) */
  requestContext: {
    title: string;
    description?: string;
    intakeAnswers?: Record<string, string>;
    documentContent?: string;  // line-numbered document content for inline AI review
  };
  /** Optional RAG search results for legal grounding */
  legalContext?: SearchResult[];
  /** Optional document IDs to analyze */
  documentIds?: string[];
  /** Language for output */
  locale: 'vi' | 'en' | 'zh' | 'ja';
}

export interface SkillResult {
  /** Structured output from agent */
  output: Record<string, unknown>;
  /** Human-readable summary */
  summary: string;
  /** List of legal references cited */
  citations: string[];
  /** Confidence score (0-1) */
  confidence: number;
  /** Tokens used */
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
  /** Agent skill used */
  skill: AgentSkill;
  /** Timestamp */
  executedAt: string;
}

export interface SkillResultStream {
  /** Partial output chunk */
  chunk: SkillResult | null;
  /** Streaming delta text */
  delta: string;
  /** Human-readable status message */
  status: string;
  /** Whether this is the final chunk */
  done: boolean;
}

// ── AI Audit Trail ──────────────────────────────────────────

export interface AiSuggestion {
  id: string;
  requestId: string;
  skill: AgentSkill;
  /** The AI-generated output (before human modification) */
  aiOutput: string;
  /** Final output after human review */
  finalOutput: string | null;
  /** Whether human approved/rejected/modified */
  decision: 'pending' | 'approved' | 'rejected' | 'modified';
  /** Who made the decision */
  decidedById: string | null;
  /** Decision notes */
  decisionNotes: string | null;
  /** Link to RAG citations used */
  citations: string[];
  /** Model used */
  model: string;
  /** Tokens + latency */
  usage: {
    promptTokens: number;
    completionTokens: number;
    latencyMs: number;
  };
  createdAt: string;
  decidedAt: string | null;
}

// ── System Prompt Templates ─────────────────────────────────

export interface SystemPromptTemplate {
  /** Agent skill */
  skill: AgentSkill;
  /** System prompt (with {{variable}} placeholders) */
  template: string;
  /** Description of what this prompt does */
  description: string;
  /** Expected output format */
  outputFormat: 'text' | 'json_object';
  /** Variables that must be filled */
  requiredVariables: string[];
}
