/**
 * Feature Flags Configuration
 *
 * Feature flags control code paths during database migration phases.
 * Set via environment variables with DB_MIGRATION_PHASE* prefix.
 *
 * Usage:
 *   import { isEnabled, FEATURE_FLAGS } from '@/lib/config/feature-flags';
 *
 *   if (isEnabled('DB_MIGRATION_PHASE4')) {
 *     // Use new FK columns
 *   } else {
 *     // Use old columns
 *   }
 */

export const FEATURE_FLAGS = {
  // Database Migration Phase 4 (BREAKING CHANGES)
  // Set to 'true' only after all services are updated to use new FK columns
  DB_MIGRATION_PHASE4: process.env.DB_MIGRATION_PHASE4 === 'true',

  // Database Migration Phase 3 (Data backfill)
  // Set to 'true' during data migration from old to new columns
  DB_MIGRATION_PHASE3: process.env.DB_MIGRATION_PHASE3 === 'true',

  // Database Migration Phase 2 (Add new columns)
  // Set to 'true' to start using new columns (backward compatible)
  DB_MIGRATION_PHASE2: process.env.DB_MIGRATION_PHASE2 === 'true',
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Check if a feature flag is enabled
 */
export function isEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Get all feature flags (for debugging/admin)
 */
export function getAllFlags(): Readonly<typeof FEATURE_FLAGS> {
  return FEATURE_FLAGS;
}
