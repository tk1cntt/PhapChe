'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, type Dispatch, type ReactNode } from 'react';
import type { WizardState, WizardAction } from '@/lib/types/wizard';
import { initialWizardState } from '@/lib/types/wizard';

/**
 * Action helpers exposed via context
 */
interface WizardActions {
  goToStep: (step: 1 | 2 | 3 | 4 | 5) => void;
  nextStep: () => void;
  prevStep: () => void;
  setDomain: (domainId: string) => void;
  setService: (serviceType: string) => void;
  setAnswer: (key: string, value: string) => void;
  addFile: (file: { vaultFileId: string; filename: string; size: number }) => void;
  removeFile: (vaultFileId: string) => void;
  setPriority: (priority: 'normal' | 'urgent') => void;
  setContact: (contact: Partial<WizardState['contactInfo']>) => void;
  setDraftId: (draftId: string) => void;
  setDirty: (dirty: boolean) => void;
  reset: () => void;
}

interface WizardContextValue {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  actions: WizardActions;
}

const WizardContext = createContext<WizardContextValue | null>(null);

/**
 * Wizard reducer handling all state transitions
 */
export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'SET_DOMAIN':
      return { ...state, domainId: action.payload, serviceType: null, answers: {}, isDirty: true };
    case 'SET_SERVICE':
      return { ...state, serviceType: action.payload, answers: {}, isDirty: true };
    case 'SET_ANSWER':
      return { ...state, answers: { ...state.answers, [action.key]: action.value }, isDirty: true };
    case 'ADD_FILE':
      return { ...state, files: [...state.files, action.payload], isDirty: true };
    case 'REMOVE_FILE':
      return { ...state, files: state.files.filter((f) => f.vaultFileId !== action.payload), isDirty: true };
    case 'SET_PRIORITY':
      return { ...state, priority: action.payload, isDirty: true };
    case 'SET_CONTACT':
      return { ...state, contactInfo: { ...state.contactInfo, ...action.payload }, isDirty: true };
    case 'SET_DRAFT_ID':
      return { ...state, draftId: action.payload, isDirty: false };
    case 'SET_DIRTY':
      return { ...state, isDirty: action.payload };
    case 'RESET':
      return initialWizardState;
    default:
      return state;
  }
}

interface WizardProviderProps {
  children: ReactNode;
  initialDraft?: Partial<WizardState>;
}

/**
 * Wizard context provider with useReducer
 */
export function WizardProvider({ children, initialDraft }: WizardProviderProps) {
  const initialState: WizardState = initialDraft
    ? { ...initialWizardState, ...initialDraft }
    : initialWizardState;

  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const actions: WizardActions = {
    goToStep: useCallback((step: 1 | 2 | 3 | 4 | 5) => {
      dispatch({ type: 'SET_STEP', payload: step });
    }, []),
    nextStep: useCallback(() => {
      const next = Math.min(state.step + 1, 5) as 1 | 2 | 3 | 4 | 5;
      dispatch({ type: 'SET_STEP', payload: next });
    }, [state.step]),
    prevStep: useCallback(() => {
      const prev = Math.max(state.step - 1, 1) as 1 | 2 | 3 | 4 | 5;
      dispatch({ type: 'SET_STEP', payload: prev });
    }, [state.step]),
    setDomain: useCallback((domainId: string) => {
      dispatch({ type: 'SET_DOMAIN', payload: domainId });
    }, []),
    setService: useCallback((serviceType: string) => {
      dispatch({ type: 'SET_SERVICE', payload: serviceType });
    }, []),
    setAnswer: useCallback((key: string, value: string) => {
      dispatch({ type: 'SET_ANSWER', key, value });
    }, []),
    addFile: useCallback((file: { vaultFileId: string; filename: string; size: number }) => {
      dispatch({ type: 'ADD_FILE', payload: file });
    }, []),
    removeFile: useCallback((vaultFileId: string) => {
      dispatch({ type: 'REMOVE_FILE', payload: vaultFileId });
    }, []),
    setPriority: useCallback((priority: 'normal' | 'urgent') => {
      dispatch({ type: 'SET_PRIORITY', payload: priority });
    }, []),
    setContact: useCallback((contact: Partial<WizardState['contactInfo']>) => {
      dispatch({ type: 'SET_CONTACT', payload: contact });
    }, []),
    setDraftId: useCallback((draftId: string) => {
      dispatch({ type: 'SET_DRAFT_ID', payload: draftId });
    }, []),
    setDirty: useCallback((dirty: boolean) => {
      dispatch({ type: 'SET_DIRTY', payload: dirty });
    }, []),
    reset: useCallback(() => {
      dispatch({ type: 'RESET' });
    }, []),
  };

  // Draft auto-save: trigger when step changes and state is dirty
  useEffect(() => {
    if (!state.isDirty || state.step === 1) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const saveDraft = async () => {
      try {
        const response = await fetch('/api/intake/draft/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            draftId: state.draftId || undefined,
            domainId: state.domainId,
            serviceType: state.serviceType,
            answers: state.answers,
            files: state.files,
            priority: state.priority,
            contactInfo: state.contactInfo,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.draftId && data.draftId !== state.draftId) {
            dispatch({ type: 'SET_DRAFT_ID', payload: data.draftId });
          } else {
            dispatch({ type: 'SET_DIRTY', payload: false });
          }
        }
      } catch {
        // Non-blocking: draft save failure doesn't prevent navigation
      }
    };

    // Debounce: 500ms
    timeoutId = setTimeout(saveDraft, 500);
    return () => clearTimeout(timeoutId);
  }, [state.step, state.isDirty, state.draftId, state.domainId, state.serviceType, state.answers, state.files, state.priority, state.contactInfo]);

  return (
    <WizardContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </WizardContext.Provider>
  );
}

/**
 * Hook to access wizard context
 * @throws Error if used outside WizardProvider
 */
export function useWizard(): WizardContextValue {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}
