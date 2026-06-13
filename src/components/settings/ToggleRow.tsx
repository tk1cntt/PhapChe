'use client';

import React from 'react';

export interface ToggleRowProps {
  label: string;
  description: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export function ToggleRow({ label, description, checked = false, onChange }: ToggleRowProps): React.ReactElement {
  // Support both controlled and uncontrolled modes
  const [internalChecked, setInternalChecked] = React.useState(checked);
  const isControlled = checked !== undefined && checked !== null;
  const isChecked = isControlled ? checked : internalChecked;

  const handleToggle = () => {
    const newValue = !isChecked;
    if (!isControlled) {
      setInternalChecked(newValue);
    }
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
