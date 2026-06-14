/**
 * Partner Type Definitions
 * Represents a partner organization (law firm, consultancy, individual)
 */

export type PartnerType = 'law_firm' | 'consultancy' | 'individual';
export type PartnerStatus = 'active' | 'inactive' | 'pending';

/**
 * Partner entity - service provider organization
 */
export interface Partner {
  id: string;
  name: string;
  slug: string;
  type: PartnerType;
  contactEmail?: string;
  phone?: string;
  address?: string;
  status: PartnerStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a partner
 */
export interface CreatePartnerInput {
  name: string;
  slug: string;
  type?: PartnerType;
  contactEmail?: string;
  phone?: string;
  address?: string;
}

/**
 * Input for updating a partner
 */
export interface UpdatePartnerInput {
  name?: string;
  type?: PartnerType;
  contactEmail?: string;
  phone?: string;
  address?: string;
  status?: PartnerStatus;
}
