'use client';

import React from 'react';

export interface ToggleRowProps {
  label: string;
  description: string;
  defaultChecked?: boolean;
}

export function ToggleRow({ label, description, defaultChecked = false }: ToggleRowProps): React.ReactElement {
  const [checked, setChecked] = React.useState(defaultChecked);

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
        onClick={() => setChecked(!checked)}
      />
    </div>
  );
}

export default ToggleRow;
