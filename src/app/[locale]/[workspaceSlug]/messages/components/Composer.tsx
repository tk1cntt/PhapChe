'use client';

import React, { useState } from 'react';

export interface ComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

/**
 * Composer component - input field with send button
 * Styling matches template (D-24, D-25, D-26):
 * - .composer: border-top 1px solid var(--border), padding 16px, display flex, gap 12px
 * - .composer-input: flex 1, height 44px, border 1px solid var(--border), border-radius 8px, padding 0 14px
 * - .create-btn: height 45px, padding 0 18px, border none, border-radius 8px, teal gradient
 */
function Composer({ onSend, disabled = false }: ComposerProps): JSX.Element {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="composer">
      <input
        className="composer-input"
        type="text"
        placeholder="Nhập tin nhắn cho chuyên viên..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="Nhập tin nhắn"
      />
      <button
        className="create-btn"
        onClick={handleSend}
        disabled={!input.trim() || disabled}
        aria-label="Gửi tin nhắn"
      >
        Gửi
      </button>
    </div>
  );
}

export default Composer;
