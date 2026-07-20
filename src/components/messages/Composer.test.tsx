import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Composer from './Composer';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// ═══════════════════════════════════════════════════════════
// WHITEBOX: component structure, props, states
// ═══════════════════════════════════════════════════════════
describe('Composer — Whitebox', () => {
  it('renders input and send button', () => {
    render(<Composer onSend={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('send button is disabled when input is empty', () => {
    render(<Composer onSend={vi.fn()} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('send button is disabled when disabled prop is true', () => {
    render(<Composer onSend={vi.fn()} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('input has placeholder and aria-label', () => {
    render(<Composer onSend={vi.fn()} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'messagePlaceholder');
    expect(input).toHaveAttribute('aria-label', 'messagePlaceholder');
  });

  it('send button has aria-label', () => {
    render(<Composer onSend={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'send');
  });
});

// ═══════════════════════════════════════════════════════════
// BLACKBOX: user interactions
// ═══════════════════════════════════════════════════════════
describe('Composer — Blackbox', () => {
  it('calls onSend with trimmed content and clears input on button click', () => {
    const onSend = vi.fn();
    const { container } = render(<Composer onSend={onSend} />);

    const input = container.querySelector('.composer-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '  Hello world  ' } });
    fireEvent.click(screen.getByRole('button'));

    expect(onSend).toHaveBeenCalledWith('Hello world');
    expect(input.value).toBe('');
  });

  it('calls onSend on Enter key and clears input', () => {
    const onSend = vi.fn();
    const { container } = render(<Composer onSend={onSend} />);

    const input = container.querySelector('.composer-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSend).toHaveBeenCalledWith('Test message');
    expect(input.value).toBe('');
  });

  it('does not call onSend on Shift+Enter', () => {
    const onSend = vi.fn();
    const { container } = render(<Composer onSend={onSend} />);

    const input = container.querySelector('.composer-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not call onSend when input is only whitespace', () => {
    const onSend = vi.fn();
    const { container } = render(<Composer onSend={onSend} />);

    const input = container.querySelector('.composer-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button'));

    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not call onSend on Enter when disabled', () => {
    const onSend = vi.fn();
    const { container } = render(<Composer onSend={onSend} disabled />);

    const input = container.querySelector('.composer-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSend).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════
// ABNORMAL: edge cases
// ═══════════════════════════════════════════════════════════
describe('Composer — Abnormal', () => {
  it('handles rapid Enter presses (only sends once)', () => {
    const onSend = vi.fn();
    const { container } = render(<Composer onSend={onSend} />);

    const input = container.querySelector('.composer-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Input cleared after first send; subsequent Enter should be no-ops
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('handles very long message', () => {
    const onSend = vi.fn();
    const longText = 'A'.repeat(10000);
    const { container } = render(<Composer onSend={onSend} />);

    const input = container.querySelector('.composer-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: longText } });
    fireEvent.click(screen.getByRole('button'));

    expect(onSend).toHaveBeenCalledWith(longText);
    expect(input.value).toBe('');
  });

  it('handles special characters and emoji', () => {
    const onSend = vi.fn();
    const { container } = render(<Composer onSend={onSend} />);

    const input = container.querySelector('.composer-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '🚀 <b>bold</b> & "quotes"' } });
    fireEvent.click(screen.getByRole('button'));

    expect(onSend).toHaveBeenCalledWith('🚀 <b>bold</b> & "quotes"');
  });

  it('handles leading/trailing newlines (trimmed)', () => {
    const onSend = vi.fn();
    const { container } = render(<Composer onSend={onSend} />);

    const input = container.querySelector('.composer-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '\n  Hello  \n' } });
    fireEvent.click(screen.getByRole('button'));

    expect(onSend).toHaveBeenCalledWith('Hello');
  });
});
