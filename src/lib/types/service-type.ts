/**
 * ServiceType Type Definitions
 * Represents a type of legal service offered
 */

export interface ServiceType {
  id: string;
  /** Machine-readable unique identifier (e.g., kebab-case, no special chars). Must be unique across all service types. */
  key: string;
  /** User-facing display name. Must be unique. */
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceTypeInput {
  /** Machine-readable unique identifier (e.g., kebab-case, no special chars) */
  key: string;
  /** User-facing display name */
  name: string;
  description?: string;
  /** @default true when not provided */
  isActive?: boolean;
}
