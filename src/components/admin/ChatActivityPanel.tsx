'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Send, Bot, User, AlertTriangle, ChevronDown, Sparkles, Info, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '@/styles/pages/admin/chat-activity.css';

// ── Types ────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
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

export interface ChatActivityPanelProps {
  requestId: string;
  requestTitle: string;
  matterTypeKey?: string | null;
  model?: string;
  onBack?: () => void;
}

// ── Quick-access skill chips ──

const QUICK_SKILLS = [
  { key: 'general-legal-researcher', labelKey: 'skillGeneralResearch' },
  { key: 'commercial-contract-drafter', labelKey: 'skillContractDraft' },
  { key: 'commercial-contract-reviewer', labelKey: 'skillContractReview' },
  { key: 'corporate-compliance-checker', labelKey: 'skillComplianceCheck' },
];

// ── Helpers ──────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return time;
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  return `${date} ${time}`;
}

// ── Component ────────────────────────────────────────────────

export function ChatActivityPanel({
  requestId,
  requestTitle,
  matterTypeKey,
  model = 'gpt-4o-mini',
  onBack,
}: ChatActivityPanelProps) {
  const t = useTranslations('ChatActivity');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [composerInput, setComposerInput] = useState('');
  const [aiNotConfigured, setAiNotConfigured] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  const listRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Auto-scroll ────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ── Load history ───────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`/api/admin/requests/${requestId}/chat`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load chat history');
        }

        const data = await res.json();
        if (cancelled) return;

        setMessages(data.messages ?? []);
        setSuggestedQuestions(data.suggestedQuestions ?? []);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadHistory();
    return () => { cancelled = true; };
  }, [requestId]);

  // ── Send message ───────────────────────────────────────────

  const handleSend = useCallback(async (presetTextOrEvent?: string | React.MouseEvent) => {
    const presetText = typeof presetTextOrEvent === 'string' ? presetTextOrEvent : undefined;
    const content = (presetText ?? composerInput).trim();
    if (!content || isSending) return;

    setComposerInput('');
    // Clear suggestions sau khi bắt đầu chat
    setSuggestedQuestions([]);
    setIsSending(true);
    setError(null);
    setAiNotConfigured(false);

    // Optimistic user message
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      role: 'user',
      content,
      skill: selectedSkill,
      citations: [],
      metadata: null,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`/api/admin/requests/${requestId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          skill: selectedSkill,
        }),
      });

      const body = await res.json();

      if (!res.ok && body.error !== 'AI_NOT_CONFIGURED') {
        throw new Error(body.detail || body.error || 'Failed to send message');
      }

      // Replace optimistic message with real one
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== optimisticId);
        const newMsgs: ChatMessage[] = [];
        if (body.userMessage) newMsgs.push(body.userMessage);
        if (body.assistantMessage) newMsgs.push(body.assistantMessage);
        return [...filtered, ...newMsgs];
      });

      if (body.error === 'AI_NOT_CONFIGURED') {
        setAiNotConfigured(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      // Keep optimistic message on error
    } finally {
      setIsSending(false);
      // Refocus composer
      composerRef.current?.focus();
    }
  }, [composerInput, isSending, requestId, selectedSkill]);

  // ── Keyboard handlers ──────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // ── Retry after error ──────────────────────────────────────

  const handleRetryLoad = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetch(`/api/admin/requests/${requestId}/chat`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages ?? []);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      });
  }, [requestId]);

  // ── Render: loading ──────────────────────────────────────

  if (isLoading) {
    return (
      <div className="chat-activity-page" data-testid="chat-activity-page">
        <div className="chat-activity-header">
          <div className="chat-activity-header-left">
            {onBack && (
              <button
                type="button"
                className="chat-activity-back-btn"
                onClick={onBack}
                data-testid="chat-activity-back"
              >
                <ArrowLeft size={16} />
                {t('backLink')}
              </button>
            )}
            <span className="chat-activity-header-title">{requestTitle}</span>
          </div>
        </div>

        <div className="chat-activity-loading" data-testid="chat-activity-loading">
          <div className="chat-activity-skeleton-msg left">
            <div className="chat-activity-skeleton-bubble" />
            <div className="chat-activity-skeleton-meta" />
          </div>
          <div className="chat-activity-skeleton-msg right" style={{ marginLeft: 'auto' }}>
            <div className="chat-activity-skeleton-bubble" />
            <div className="chat-activity-skeleton-meta" />
          </div>
          <div className="chat-activity-skeleton-msg left" style={{ width: '40%' }}>
            <div className="chat-activity-skeleton-bubble" />
            <div className="chat-activity-skeleton-meta" />
          </div>
        </div>
      </div>
    );
  }

  // ── Render: main ─────────────────────────────────────────

  return (
    <div className="chat-activity-page" data-testid="chat-activity-page">
      {/* Header */}
      <div className="chat-activity-header">
        <div className="chat-activity-header-left">
          {onBack && (
            <button
              type="button"
              className="chat-activity-back-btn"
              onClick={onBack}
              data-testid="chat-activity-back"
            >
              <ArrowLeft size={16} />
              {t('backLink')}
            </button>
          )}
          <span className="chat-activity-header-title">{requestTitle}</span>
        </div>
        <div className="chat-activity-header-badges">
          <span className="chat-activity-model-badge" data-testid="chat-activity-model-badge">
            <Sparkles size={10} />
            {model}
          </span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="chat-activity-error" data-testid="chat-activity-error">
          <span className="chat-activity-error-text">
            <AlertTriangle size={14} />
            {error}
          </span>
          <button
            type="button"
            className="chat-activity-error-retry"
            onClick={handleRetryLoad}
            data-testid="chat-activity-retry"
          >
            {t('retry')}
          </button>
        </div>
      )}

      {/* Message list or empty state with suggestions */}
      {messages.length === 0 && !isSending ? (
        <div className="chat-activity-empty" data-testid="chat-activity-empty">
          <div className="chat-activity-empty-icon">
            <Bot size={48} />
          </div>
          <p className="chat-activity-empty-title">{t('emptyTitle')}</p>
          <p className="chat-activity-empty-desc">{t('emptyDesc')}</p>

          {/* Suggested questions */}
          {suggestedQuestions.length > 0 && (
            <div className="chat-activity-suggestions" data-testid="chat-activity-suggestions">
              <p className="chat-activity-suggestions-title">
                <Lightbulb size={14} />
                {t('suggestionsTitle')}
              </p>
              <div className="chat-activity-suggestions-list">
                {suggestedQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="chat-activity-suggestion-pill"
                    onClick={() => handleSend(question)}
                    data-testid={`chat-suggestion-${idx}`}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="chat-activity-list" ref={listRef} data-testid="chat-activity-list">
          {messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              t={t}
            />
          ))}
          {isSending && (
            <div className="chat-activity-typing" data-testid="chat-activity-typing">
              <span className="chat-activity-typing-dot" />
              <span className="chat-activity-typing-dot" />
              <span className="chat-activity-typing-dot" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* AI not configured info */}
      {aiNotConfigured && (
        <div className="chat-activity-error" style={{ background: 'var(--color-info-muted)', border: '1px solid oklch(0.88 0.06 260)', color: 'var(--color-info)', marginTop: 0 }}>
          <span className="chat-activity-error-text">
            <Info size={14} />
            {t('errorAiNotConfigured')}
          </span>
        </div>
      )}

      {/* Composer */}
      <div className="chat-activity-composer" data-testid="chat-activity-composer">
        <div className="chat-activity-composer-inner">
          {/* Skill chips */}
          <div className="chat-activity-skill-chips" data-testid="chat-activity-skill-chips">
            <span className="chat-activity-skill-label">{t('skillLabel')}:</span>
            <button
              type="button"
              className={`chat-activity-skill-chip none-chip${!selectedSkill ? ' active' : ''}`}
              onClick={() => setSelectedSkill(null)}
              data-testid="chat-activity-skill-none"
            >
              {t('skillNone')}
            </button>
            {QUICK_SKILLS.map((sk) => (
              <button
                key={sk.key}
                type="button"
                className={`chat-activity-skill-chip${selectedSkill === sk.key ? ' active' : ''}`}
                onClick={() => setSelectedSkill((prev) => (prev === sk.key ? null : sk.key))}
                data-testid={`chat-activity-skill-${sk.key}`}
              >
                {t(sk.labelKey)}
              </button>
            ))}
          </div>

          {/* Input */}
          <textarea
            ref={composerRef}
            className="chat-activity-composer-input"
            value={composerInput}
            onChange={(e) => setComposerInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('inputPlaceholder')}
            disabled={isSending}
            rows={1}
            data-testid="chat-activity-input"
          />
        </div>

        <button
          type="button"
          className="chat-activity-send-btn"
          onClick={handleSend}
          disabled={!composerInput.trim() || isSending}
          aria-label={t('send')}
          data-testid="chat-activity-send"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Message Bubble Sub-component ───────────────────────────

function ChatMessageBubble({
  message,
  t,
}: {
  message: ChatMessage;
  t: ReturnType<typeof useTranslations<'ChatActivity'>>;
}) {
  const [showCitations, setShowCitations] = useState(false);

  // System messages: centered, muted
  if (message.role === 'system') {
    return (
      <div className="chat-activity-msg chat-activity-msg--system" data-testid={`chat-msg-${message.id}`}>
        <div className="chat-activity-msg-bubble">{message.content}</div>
      </div>
    );
  }

  const isUser = message.role === 'user';

  return (
    <div
      className={`chat-activity-msg ${isUser ? 'chat-activity-msg--user' : 'chat-activity-msg--assistant'}`}
      data-testid={`chat-msg-${message.id}`}
      data-role={message.role}
    >
      {/* Label */}
      <span className="chat-activity-msg-label">
        {isUser ? (
          t('youLabel')
        ) : (
          <>
            <Bot size={10} />
            {t('aiLabel')}
          </>
        )}
      </span>

      {/* Bubble */}
      <div className="chat-activity-msg-bubble">
        {isUser ? (
          message.content
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        )}
      </div>

      {/* Meta: time, skill, tokens */}
      <div className="chat-activity-msg-meta">
        <span className="chat-activity-msg-time">{formatTime(message.createdAt)}</span>
        {message.skill && (
          <span className="chat-activity-msg-skill-badge">{message.skill}</span>
        )}
        {message.metadata?.tokens && (
          <span className="chat-activity-msg-tokens" title={`${message.metadata.latencyMs ?? 0}ms`}>
            ~{message.metadata.tokens} tokens
          </span>
        )}
      </div>

      {/* Citations (assistant only) */}
      {!isUser && message.citations.length > 0 && (
        <div className="chat-activity-msg-citations" data-testid={`chat-citations-${message.id}`}>
          <button
            type="button"
            className={`chat-activity-citations-toggle${showCitations ? ' open' : ''}`}
            onClick={() => setShowCitations(!showCitations)}
            data-testid={`chat-citations-toggle-${message.id}`}
          >
            {t('citationsLabel')} ({message.citations.length})
            <ChevronDown size={12} />
          </button>
          {showCitations && (
            <div className="chat-activity-citations-list">
              {message.citations.map((c, i) => (
                <span key={i} className="chat-activity-citation-tag">
                  📜 {c}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
