'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/shared/ui/ThemeProvider';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="tool-btn square"
      type="button"
      title={theme === 'light' ? 'Dark mode' : 'Light mode'}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
