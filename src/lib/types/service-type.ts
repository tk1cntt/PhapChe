/**
 * ServiceType Type Definitions
 * Represents a type of legal service offered
 */

export interface ServiceType {
  id: string;
  key: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceTypeInput {
  key: string;
  name: string;
  description?: string;
  isActive?: boolean;
}
