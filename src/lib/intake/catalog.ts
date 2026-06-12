/**
 * Matter type catalog for intake form
 * Backward compatibility layer using seed-multilingual data
 */

import { SEED_MATTER_TYPES } from '../i18n/seed-multilingual';

export type IntakeQuestion = {
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'textarea';
};

export type MatterCatalogItem = {
  key: string;
  label: string;
  description: string;
  schemaVersion: string;
  questions: readonly IntakeQuestion[];
};

/**
 * Matter catalog for backward compatibility
 * Uses label_vi as primary (required) for existing code
 */
export const MATTER_CATALOG = Object.entries(SEED_MATTER_TYPES).map(
  ([key, matterType]) => ({
    key,
    label: matterType.label.vi, // Primary language
    description: matterType.description.vi ?? '',
    schemaVersion: matterType.schemaVersion,
    questions: matterType.questions,
    // Full translations available via SEED_MATTER_TYPES
  })
) as readonly MatterCatalogItem[];

export type MatterTypeKey = MatterCatalogItem['key'];

export function getMatterType(matterTypeKey: string): MatterCatalogItem | null {
  const matterType = MATTER_CATALOG.find((item) => item.key === matterTypeKey);
  return matterType ? { ...matterType, questions: matterType.questions.map((question) => ({ ...question })) } : null;
}

export function getMatterQuestions(matterTypeKey: string): IntakeQuestion[] {
  return getMatterType(matterTypeKey)?.questions.map((question) => ({ ...question })) ?? [];
}

/**
 * Re-export for advanced usage requiring full translations
 */
export { SEED_MATTER_TYPES } from '../i18n/seed-multilingual';
