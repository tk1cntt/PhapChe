'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';

export interface ComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

function Composer({ onSend, disabled = false }: ComposerProps): React.ReactElement {
  const t = useTranslations('UserMessages');
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
        placeholder={t('messagePlaceholder')}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label={t('messagePlaceholder')}
      />
      <button
        className="create-btn"
        onClick={handleSend}
        disabled={!input.trim() || disabled}
        aria-label={t('send')}
      >
        {t('send')}
      </button>
    </div>
  );
}

export default Composer;
