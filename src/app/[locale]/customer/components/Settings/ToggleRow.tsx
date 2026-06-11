'use client';

import React from 'react';

export interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleRow({ label, description, checked, onChange }: ToggleRowProps): JSX.Element {
  return (
    <div className="toggle-row">
      <div className="toggle-content">
        <div className="toggle-label">{label}</div>
        <div className="toggle-description">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`toggle ${checked ? '' : 'off'}`}
        onClick={() => onChange(!checked)}
      />
    </div>
  );
}
