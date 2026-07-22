'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import '@/styles/components/dropdown.css';

export interface DropdownItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

interface DropdownMenuProps {
  items: DropdownItem[];
  trigger?: ('click' | 'hover')[];
  placement?: 'topRight' | 'bottomRight' | 'bottomLeft';
  children: React.ReactNode;
}

export function DropdownMenu({
  items,
  trigger = ['click'],
  placement = 'bottomRight',
  children,
}: DropdownMenuProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open, close]);

  const handleTriggerClick = () => {
    if (trigger.includes('click')) {
      setOpen((prev) => !prev);
    }
  };

  const handleItemClick = (item: DropdownItem) => {
    item.onClick?.();
    close();
  };

  return (
    <div
      ref={containerRef}
      className="dropdown-container"
      onClick={handleTriggerClick}
    >
      <span className="dropdown-trigger">{children}</span>

      {open && (
        <div className={`dropdown-menu ${placement}`} role="menu">
          {items.map((item) => (
            <button
              key={item.key}
              className="dropdown-item"
              role="menuitem"
              onClick={() => handleItemClick(item)}
              style={item.danger ? { color: 'var(--color-danger)' } : undefined}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DropdownMenu;
