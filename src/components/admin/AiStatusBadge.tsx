'use client';

/**
 * AiStatusBadge — Small indicator showing AI system status
 *
 * States:
 * - initializing: animated pulse (blue)
 * - ready: green dot
 * - error: red dot with tooltip
 * - unconfigured: gray dot
 */

import React from 'react';
import { Sparkles, Loader2, AlertTriangle, WifiOff } from 'lucide-react';
import { useAiContext } from '@/lib/ai/AiContext';

export function AiStatusBadge() {
  const { isReady, isInitializing, initError, docsIndexed, retryInit } = useAiContext();

  // Initializing
  if (isInitializing) {
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-1 text-xs text-blue-600 dark:text-blue-400"
        title="Đang khởi tạo AI..."
        data-testid="ai-status-initializing"
      >
        <Loader2 size={12} className="animate-spin" />
        <span>AI...</span>
      </div>
    );
  }

  // Ready
  if (isReady) {
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-1 text-xs text-green-600 dark:text-green-400"
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
        className="flex items-center gap-1.5 px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:underline"
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
      className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 dark:text-gray-500"
      title="AI chưa được khởi tạo"
      data-testid="ai-status-idle"
    >
      <WifiOff size={12} />
      <span>AI</span>
    </div>
  );
}
