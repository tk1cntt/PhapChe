'use client';

import React from 'react';

export interface ToggleRowProps {
  label: string;
  description: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export function ToggleRow({ label, description, checked = false, onChange }: ToggleRowProps): React.ReactElement {
  const [isChecked, setIsChecked] = React.useState(checked);

  const handleToggle = () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="toggle-row">
      <div className="toggle-content">
        <div className="toggle-label">{label}</div>
        <div className="toggle-description">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        className={`toggle ${isChecked ? '' : 'off'}`}
        onClick={handleToggle}
      />
    </div>
  );
}

export default ToggleRow;
