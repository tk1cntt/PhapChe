/**
 * Wizard State Type Definitions
 * TypeScript types for the 6-step create request wizard (Step 0 = guided discovery)
 */

/**
 * Uploaded file in wizard context
 */
export interface UploadedFile {
  vaultFileId: string;
  filename: string;
  size: number;
}

/**
 * Contact information for the request
 */
export interface ContactInfo {
  email: string;
  phone?: string;
  companyName?: string;
  taxCode?: string;
}

/**
 * Wizard state for the 6-step create request flow
 */
export interface WizardState {
  step: 0 | 1 | 2 | 3 | 4 | 5;
  /** Guided scenario key from Step 0 (empty string = skip to all domains) */
  guidedScenario: string | null;
  domainId: string | null;
  /** Suggested domain keys derived from guided scenario (Step 0) */
  suggestedDomainKeys: string[];
  serviceType: string | null;
  answers: Record<string, string>;
  files: UploadedFile[];
  priority: 'normal' | 'urgent';
  contactInfo: ContactInfo;
  draftId: string | null;
  isDirty: boolean;
}

/**
 * Wizard actions for useReducer
 */
export type WizardAction =
  | { type: 'SET_STEP'; payload: 0 | 1 | 2 | 3 | 4 | 5 }
  | { type: 'SET_GUIDED_SCENARIO'; payload: { scenarioKey: string; suggestedDomainKeys: string[] } }
  | { type: 'SET_DOMAIN'; payload: string }
  | { type: 'SET_SERVICE'; payload: string }
  | { type: 'SET_ANSWER'; payload: { key: string; value: string } }
  | { type: 'ADD_FILE'; payload: UploadedFile }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'SET_PRIORITY'; payload: 'normal' | 'urgent' }
  | { type: 'SET_CONTACT'; payload: Partial<ContactInfo> }
  | { type: 'SET_DRAFT_ID'; payload: string }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'RESET' };

/**
 * Initial wizard state
 */
export const initialWizardState: WizardState = {
  step: 0,
  guidedScenario: null,
  domainId: null,
  suggestedDomainKeys: [],
  serviceType: null,
  answers: {},
  files: [],
  priority: 'normal',
  contactInfo: { email: '' },
  draftId: null,
  isDirty: false,
};

/**
 * Validation errors map
 */
export type ValidationErrors = Record<string, string>;

/**
 * Step validation function type
 */
export type StepValidation = (state: WizardState) => ValidationErrors;
