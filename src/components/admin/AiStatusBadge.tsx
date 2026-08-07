'use client';

/**
 * AiStatusBadge — Small indicator showing AI system status
 *
 * States:
 * - initializing: animated pulse (blue)
 * - ready: green sparkle
 * - error: red with retry button
 * - unconfigured: gray idle
 */

import React from 'react';
import { Sparkles, Loader2, AlertTriangle, WifiOff } from 'lucide-react';
import { useAiContext } from '@/lib/ai/AiContext';

export function AiStatusBadge() {
  const { isReady, isInitializing, initError, docsIndexed, retryInit } = useAiContext();

  // Initializing
  if (isInitializing) {
    return (
const ICON_SIZE = 12;

// ... then in each icon:
<Loader2 size={ICON_SIZE} className="ai-panel-spinner" />
        <span>AI...</span>
      </div>
    );
  }

  // Ready
  if (isReady) {
    return (
      <div
        className="ai-status-badge ai-status-ready"
        title={`AI sẵn sàng — ${docsIndexed} tài liệu luật đã được lập chỉ mục`}
        data-testid="ai-status-ready"
      >
        <Sparkles size={12} />
        <span>AI</span>
      </div>
    );
  }

  // Error
  if (initError) {
    return (
      <button
        type="button"
        onClick={retryInit}
        className="ai-status-badge ai-status-error"
        title={`Lỗi AI: ${initError}. Nhấn để thử lại.`}
        data-testid="ai-status-error"
      >
        <AlertTriangle size={12} />
        <span>AI</span>
      </button>
    );
  }

  // Not configured / not attempted
  return (
    <div
      className="ai-status-badge ai-status-idle"
      title="AI chưa được khởi tạo"
      data-testid="ai-status-idle"
    >
      <WifiOff size={12} />
      <span>AI</span>
    </div>
  );
}
