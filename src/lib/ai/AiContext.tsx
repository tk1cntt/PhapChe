'use client';

/**
 * AI Context — Global AI readiness state for admin layout
 *
 * Provides isAiReady, ragStats, initializing state to all admin components.
 * Calls /api/ai/init on first mount to index legal knowledge.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AiContextValue {
  /** Whether AI (LLM + RAG) is ready to use */
  isReady: boolean;
  /** Whether knowledge base initialization is in progress */
  isInitializing: boolean;
  /** Last initialization error if any */
  initError: string | null;
  /** Number of legal documents indexed */
  docsIndexed: number;
  /** Retry initialization */
  retryInit: () => void;
}

const AiContext = createContext<AiContextValue>({
  isReady: false,
  isInitializing: false,
  initError: null,
  docsIndexed: 0,
  retryInit: () => {},
});

export function useAiContext() {
  return useContext(AiContext);
}

export function AiProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [docsIndexed, setDocsIndexed] = useState(0);
  const [hasAttempted, setHasAttempted] = useState(false);

  const init = useCallback(async () => {
    if (isInitializing) return;
    setIsInitializing(true);
    setInitError(null);

    const controller = new AbortController();
    try {
      const res = await fetch('/api/ai/init', { signal: controller.signal }); // TODO: extract to shared constant or env variable
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      if (json.success) {
        setIsReady(true);
        setDocsIndexed(json.data?.indexed ?? 0);
      } else {
        setInitError(json.detail ?? 'AI khởi tạo thất bại');
      }
    } catch (e) {
      setInitError(e instanceof Error ? e.message : 'Lỗi khởi tạo AI');
    } finally {
      setIsInitializing(false);
      setHasAttempted(true);
    }
  }, [isInitializing]);

  useEffect(() => {
    if (!hasAttempted) {
      init();
    }
  }, [hasAttempted, init]);

  return (
    <AiContext.Provider
      value={{
        isReady,
        isInitializing,
        initError,
        docsIndexed,
        retryInit: init,
      }}
    >
      {children}
    </AiContext.Provider>
  );
}
