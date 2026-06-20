/**
 * Task 76-17: Unit tests cho WizardProvider
 * Coverage: wizardReducer actions, WizardProvider context, useWizard hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { WizardProvider, useWizard, wizardReducer } from '../WizardProvider';
import type { WizardState, WizardAction } from '@/lib/types/wizard';
import { initialWizardState } from '@/lib/types/wizard';

// Mock fetch cho draft auto-save
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ draftId: 'draft-123' }),
  })
) as any;

// Mock useRouter và useSearchParams
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

/**
 * Whitebox Tests - Test trực tiếp wizardReducer logic
 */
describe('wizardReducer', () => {
  it('SET_STEP: cập nhật step', () => {
    const state: WizardState = { ...initialWizardState };
    const action: WizardAction = { type: 'SET_STEP', payload: 3 };
    const newState = wizardReducer(state, action);
    expect(newState.step).toBe(3);
  });

  it('SET_DOMAIN: cập nhật domainId, reset serviceType và answers', () => {
    const state: WizardState = {
      ...initialWizardState,
      domainId: 'domain-old',
      serviceType: 'service-old',
      answers: { q1: 'answer1' },
    };
    const action: WizardAction = { type: 'SET_DOMAIN', payload: 'domain-new' };
    const newState = wizardReducer(state, action);
    expect(newState.domainId).toBe('domain-new');
    expect(newState.serviceType).toBeNull();
    expect(newState.answers).toEqual({});
    expect(newState.isDirty).toBe(true);
  });

  it('SET_SERVICE: cập nhật serviceType, reset answers', () => {
    const state: WizardState = {
      ...initialWizardState,
      serviceType: 'service-old',
      answers: { q1: 'answer1' },
    };
    const action: WizardAction = { type: 'SET_SERVICE', payload: 'service-new' };
    const newState = wizardReducer(state, action);
    expect(newState.serviceType).toBe('service-new');
    expect(newState.answers).toEqual({});
    expect(newState.isDirty).toBe(true);
  });

  it('SET_ANSWER: thêm/cập nhật câu trả lời', () => {
    const state: WizardState = { ...initialWizardState };
    const action: WizardAction = { type: 'SET_ANSWER', key: 'company_name', value: 'Test Corp' };
    const newState = wizardReducer(state, action);
    expect(newState.answers.company_name).toBe('Test Corp');
    expect(newState.isDirty).toBe(true);
  });

  it('SET_ANSWER: giữ nguyên các câu trả lời khác', () => {
    const state: WizardState = {
      ...initialWizardState,
      answers: { q1: 'answer1' },
    };
    const action: WizardAction = { type: 'SET_ANSWER', key: 'q2', value: 'answer2' };
    const newState = wizardReducer(state, action);
    expect(newState.answers.q1).toBe('answer1');
    expect(newState.answers.q2).toBe('answer2');
  });

  it('ADD_FILE: thêm file vào danh sách', () => {
    const state: WizardState = { ...initialWizardState };
    const file = { vaultFileId: 'vault-1', filename: 'test.pdf', size: 1024 };
    const action: WizardAction = { type: 'ADD_FILE', payload: file };
    const newState = wizardReducer(state, action);
    expect(newState.files).toHaveLength(1);
    expect(newState.files[0].vaultFileId).toBe('vault-1');
    expect(newState.isDirty).toBe(true);
  });

  it('REMOVE_FILE: xóa file khỏi danh sách', () => {
    const state: WizardState = {
      ...initialWizardState,
      files: [
        { vaultFileId: 'vault-1', filename: 'test1.pdf', size: 1024 },
        { vaultFileId: 'vault-2', filename: 'test2.pdf', size: 2048 },
      ],
    };
    const action: WizardAction = { type: 'REMOVE_FILE', payload: 'vault-1' };
    const newState = wizardReducer(state, action);
    expect(newState.files).toHaveLength(1);
    expect(newState.files[0].vaultFileId).toBe('vault-2');
  });

  it('SET_PRIORITY: cập nhật priority', () => {
    const state: WizardState = { ...initialWizardState };
    const action: WizardAction = { type: 'SET_PRIORITY', payload: 'urgent' };
    const newState = wizardReducer(state, action);
    expect(newState.priority).toBe('urgent');
    expect(newState.isDirty).toBe(true);
  });

  it('SET_CONTACT: cập nhật contactInfo với merge', () => {
    const state: WizardState = {
      ...initialWizardState,
      contactInfo: { email: 'old@example.com' },
    };
    const action: WizardAction = { type: 'SET_CONTACT', payload: { email: 'new@example.com', phone: '0123456789' } };
    const newState = wizardReducer(state, action);
    expect(newState.contactInfo.email).toBe('new@example.com');
    expect(newState.contactInfo.phone).toBe('0123456789');
  });

  it('SET_DRAFT_ID: cập nhật draftId và set isDirty = false', () => {
    const state: WizardState = { ...initialWizardState, isDirty: true };
    const action: WizardAction = { type: 'SET_DRAFT_ID', payload: 'draft-456' };
    const newState = wizardReducer(state, action);
    expect(newState.draftId).toBe('draft-456');
    expect(newState.isDirty).toBe(false);
  });

  it('SET_DIRTY: cập nhật isDirty', () => {
    const state: WizardState = { ...initialWizardState, isDirty: false };
    const action: WizardAction = { type: 'SET_DIRTY', payload: true };
    const newState = wizardReducer(state, action);
    expect(newState.isDirty).toBe(true);
  });

  it('RESET: reset về initialWizardState', () => {
    const state: WizardState = {
      ...initialWizardState,
      step: 3,
      domainId: 'domain-1',
      serviceType: 'service-1',
      draftId: 'draft-123',
      isDirty: true,
    };
    const action: WizardAction = { type: 'RESET' };
    const newState = wizardReducer(state, action);
    expect(newState).toEqual(initialWizardState);
  });
});

/**
 * Blackbox Tests - Test WizardProvider context và useWizard hook
 */
describe('WizardProvider & useWizard', () => {
  function TestConsumer() {
    const { state, actions } = useWizard();
    return (
      <div>
        <div data-testid="step">{state.step}</div>
        <div data-testid="domain">{state.domainId || 'none'}</div>
        <div data-testid="service">{state.serviceType || 'none'}</div>
        <div data-testid="dirty">{state.isDirty ? 'true' : 'false'}</div>
        <button onClick={() => actions.setDomain('domain-1')}>Set Domain</button>
        <button onClick={() => actions.nextStep()}>Next Step</button>
        <button onClick={() => actions.prevStep()}>Prev Step</button>
        <button onClick={() => actions.goToStep(4)}>Go Step 4</button>
        <button onClick={() => actions.reset()}>Reset</button>
      </div>
    );
  }

  it('cung cấp state và actions qua context', () => {
    render(
      <WizardProvider>
        <TestConsumer />
      </WizardProvider>
    );
    expect(screen.getByTestId('step')).toHaveTextContent('1');
    expect(screen.getByTestId('domain')).toHaveTextContent('none');
  });

  it('dispatch setDomain qua context', async () => {
    render(
      <WizardProvider>
        <TestConsumer />
      </WizardProvider>
    );
    await act(async () => {
      fireEvent.click(screen.getByText('Set Domain'));
    });
    expect(screen.getByTestId('domain')).toHaveTextContent('domain-1');
    expect(screen.getByTestId('dirty')).toHaveTextContent('true');
  });

  it('nextStep increment step (max 5)', async () => {
    render(
      <WizardProvider>
        <TestConsumer />
      </WizardProvider>
    );
    await act(async () => {
      fireEvent.click(screen.getByText('Next Step'));
    });
    expect(screen.getByTestId('step')).toHaveTextContent('2');
  });

  it('prevStep decrement step (min 1)', async () => {
    render(
      <WizardProvider initialDraft={{ step: 3 }}>
        <TestConsumer />
      </WizardProvider>
    );
    await act(async () => {
      fireEvent.click(screen.getByText('Prev Step'));
    });
    expect(screen.getByTestId('step')).toHaveTextContent('2');
  });

  it('goToStep set step trực tiếp', async () => {
    render(
      <WizardProvider>
        <TestConsumer />
      </WizardProvider>
    );
    await act(async () => {
      fireEvent.click(screen.getByText('Go Step 4'));
    });
    expect(screen.getByTestId('step')).toHaveTextContent('4');
  });

  it('accept initialDraft prop', () => {
    const initialDraft = { step: 3 as const, domainId: 'domain-initial' };
    render(
      <WizardProvider initialDraft={initialDraft}>
        <TestConsumer />
      </WizardProvider>
    );
    expect(screen.getByTestId('step')).toHaveTextContent('3');
    expect(screen.getByTestId('domain')).toHaveTextContent('domain-initial');
  });

  it('reset trả về initial state', async () => {
    render(
      <WizardProvider initialDraft={{ step: 3, domainId: 'domain-initial' }}>
        <TestConsumer />
      </WizardProvider>
    );
    await act(async () => {
      fireEvent.click(screen.getByText('Reset'));
    });
    expect(screen.getByTestId('step')).toHaveTextContent('1');
    expect(screen.getByTestId('domain')).toHaveTextContent('none');
  });
});

/**
 * Error Tests - useWizard outside provider
 */
describe('useWizard error handling', () => {
  it('throw error khi gọi ngoài WizardProvider', () => {
    function InvalidConsumer() {
      useWizard();
      return null;
    }
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<InvalidConsumer />)).toThrow('useWizard must be used within a WizardProvider');
    consoleSpy.mockRestore();
  });
});
