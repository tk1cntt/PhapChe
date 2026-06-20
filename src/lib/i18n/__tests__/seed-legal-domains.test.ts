/**
 * Unit tests for seed-legal-domains.ts
 * Validates 13 legal domains, 30+ service types, and helper functions
 */

import { describe, it, expect } from 'vitest';
import {
  SEED_LEGAL_DOMAINS,
  SEED_MATTER_TYPES,
  getLegalDomains,
  getDomainByServiceType,
  getServiceTypesByDomain,
  getMatterQuestions,
  getServiceType,
  type LegalDomainDefinition,
  type ServiceTypeDefinition,
} from '../seed-legal-domains';

describe('seed-legal-domains', () => {
  describe('SEED_LEGAL_DOMAINS', () => {
    it('should contain exactly 13 legal domains', () => {
      const domainKeys = Object.keys(SEED_LEGAL_DOMAINS);
      expect(domainKeys).toHaveLength(13);
    });

    it('should contain all required domain keys', () => {
      const expectedDomains = [
        'commercial-legal',
        'corporate-legal',
        'employment-legal',
        'privacy-legal',
        'product-legal',
        'regulatory-legal',
        'ai-governance-legal',
        'ip-legal',
        'litigation-legal',
        'legal-clinic',
        'law-student',
        'legal-builder-hub',
        'external-plugins',
      ];

      expectedDomains.forEach((domain) => {
        expect(SEED_LEGAL_DOMAINS).toHaveProperty(domain);
      });
    });

    it('should have multilingual labels for all domains (vi/en/zh/ja)', () => {
      Object.values(SEED_LEGAL_DOMAINS).forEach((domain) => {
        expect(domain.label).toHaveProperty('vi');
        expect(domain.label).toHaveProperty('en');
        expect(domain.label).toHaveProperty('zh');
        expect(domain.label).toHaveProperty('ja');
        expect(typeof domain.label.vi).toBe('string');
        expect(typeof domain.label.en).toBe('string');
        expect(typeof domain.label.zh).toBe('string');
        expect(typeof domain.label.ja).toBe('string');
      });
    });

    it('should have icon names for all domains', () => {
      const validIcons = [
        'Briefcase',
        'Building',
        'Users',
        'Shield',
        'Package',
        'FileCheck',
        'Bot',
        'Lightbulb',
        'Scale',
        'Heart',
        'GraduationCap',
        'Hammer',
        'Plug',
      ];

      Object.values(SEED_LEGAL_DOMAINS).forEach((domain) => {
        expect(domain.icon).toBeDefined();
        expect(validIcons).toContain(domain.icon);
      });
    });

    it('should have matterTypeKeys array for all domains', () => {
      Object.values(SEED_LEGAL_DOMAINS).forEach((domain) => {
        expect(Array.isArray(domain.matterTypeKeys)).toBe(true);
        expect(domain.matterTypeKeys.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should have at least 2 service types per domain', () => {
      Object.values(SEED_LEGAL_DOMAINS).forEach((domain) => {
        expect(domain.matterTypeKeys.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('SEED_MATTER_TYPES', () => {
    it('should contain 32+ service types (expanded from 4)', () => {
      const typeCount = Object.keys(SEED_MATTER_TYPES).length;
      expect(typeCount).toBeGreaterThanOrEqual(32);
    });

    it('should preserve existing service types (labor_contract, agency_contract, trademark_registration, unsupported)', () => {
      const existingTypes = [
        'labor_contract',
        'agency_contract',
        'trademark_registration',
        'unsupported',
      ];

      existingTypes.forEach((type) => {
        expect(SEED_MATTER_TYPES).toHaveProperty(type);
      });
    });

    it('should have multilingual labels for all service types', () => {
      Object.values(SEED_MATTER_TYPES).forEach((serviceType) => {
        expect(serviceType.label).toHaveProperty('vi');
        expect(serviceType.label).toHaveProperty('en');
        expect(serviceType.label).toHaveProperty('zh');
        expect(serviceType.label).toHaveProperty('ja');
      });
    });

    it('should have questions array for all service types', () => {
      Object.values(SEED_MATTER_TYPES).forEach((serviceType) => {
        expect(Array.isArray(serviceType.questions)).toBe(true);
        expect(serviceType.questions.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should have proper question structure with key, label, required, type', () => {
      Object.values(SEED_MATTER_TYPES).forEach((serviceType) => {
        serviceType.questions.forEach((question) => {
          expect(question).toHaveProperty('key');
          expect(question).toHaveProperty('label');
          expect(question).toHaveProperty('required');
          expect(question).toHaveProperty('type');
          expect(typeof question.key).toBe('string');
          expect(typeof question.label).toBe('string');
          expect(typeof question.required).toBe('boolean');
          expect(['text', 'textarea']).toContain(question.type);
        });
      });
    });

    it('should have key property matching the object key', () => {
      Object.entries(SEED_MATTER_TYPES).forEach(([key, serviceType]) => {
        expect(serviceType.key).toBe(key);
      });
    });
  });

  describe('getLegalDomains()', () => {
    it('should return all 13 domains as an array', () => {
      const domains = getLegalDomains();
      expect(domains).toHaveLength(13);
      expect(Array.isArray(domains)).toBe(true);
    });

    it('should return domain objects with all required properties', () => {
      const domains = getLegalDomains();
      domains.forEach((domain) => {
        expect(domain).toHaveProperty('key');
        expect(domain).toHaveProperty('label');
        expect(domain).toHaveProperty('icon');
        expect(domain).toHaveProperty('description');
        expect(domain).toHaveProperty('matterTypeKeys');
      });
    });
  });

  describe('getDomainByServiceType()', () => {
    it('should return the domain containing a specific service type', () => {
      const domain = getDomainByServiceType('labor_contract');
      expect(domain).not.toBeNull();
      expect(domain?.key).toBe('employment-legal');
    });

    it('should return null for non-existent service type', () => {
      const domain = getDomainByServiceType('non_existent_type');
      expect(domain).toBeNull();
    });

    it('should find domain for commercial-legal services', () => {
      const domain = getDomainByServiceType('nda');
      expect(domain).not.toBeNull();
      expect(domain?.key).toBe('commercial-legal');
    });

    it('should find domain for ip-legal services', () => {
      const domain = getDomainByServiceType('trademark_registration');
      expect(domain).not.toBeNull();
      expect(domain?.key).toBe('ip-legal');
    });
  });

  describe('getServiceTypesByDomain()', () => {
    it('should return all service types for a specific domain', () => {
      const serviceTypes = getServiceTypesByDomain('commercial-legal');
      expect(serviceTypes.length).toBe(3);
      expect(serviceTypes.map((t) => t.key)).toContain('distribution_contract');
      expect(serviceTypes.map((t) => t.key)).toContain('nda');
      expect(serviceTypes.map((t) => t.key)).toContain('commercial_review');
    });

    it('should return empty array for non-existent domain', () => {
      const serviceTypes = getServiceTypesByDomain('non-existent-domain');
      expect(serviceTypes).toEqual([]);
    });

    it('should return service types with proper structure', () => {
      const serviceTypes = getServiceTypesByDomain('corporate-legal');
      serviceTypes.forEach((serviceType) => {
        expect(serviceType).toHaveProperty('key');
        expect(serviceType).toHaveProperty('label');
        expect(serviceType).toHaveProperty('description');
        expect(serviceType).toHaveProperty('questions');
      });
    });

    it('should filter out undefined service types', () => {
      // If a domain references a non-existent service type, it should be filtered out
      const serviceTypes = getServiceTypesByDomain('employment-legal');
      serviceTypes.forEach((serviceType) => {
        expect(serviceType).toBeDefined();
        expect(serviceType.key).toBeDefined();
      });
    });
  });

  describe('getMatterQuestions()', () => {
    it('should return questions for a specific service type', () => {
      const questions = getMatterQuestions('labor_contract');
      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0]).toHaveProperty('key');
      expect(questions[0]).toHaveProperty('label');
      expect(questions[0]).toHaveProperty('required');
      expect(questions[0]).toHaveProperty('type');
    });

    it('should return empty array for non-existent service type', () => {
      const questions = getMatterQuestions('non_existent_type');
      expect(questions).toEqual([]);
    });
  });

  describe('getServiceType()', () => {
    it('should return service type object for valid key', () => {
      const serviceType = getServiceType('trademark_registration');
      expect(serviceType).not.toBeNull();
      expect(serviceType?.key).toBe('trademark_registration');
    });

    it('should return null for non-existent service type', () => {
      const serviceType = getServiceType('non_existent_type');
      expect(serviceType).toBeNull();
    });
  });

  describe('Data Integrity', () => {
    it('should ensure all matterTypeKeys in domains exist in SEED_MATTER_TYPES', () => {
      const allMatterTypeKeys = Object.values(SEED_LEGAL_DOMAINS)
        .flatMap((domain) => domain.matterTypeKeys);

      allMatterTypeKeys.forEach((key) => {
        expect(SEED_MATTER_TYPES).toHaveProperty(key);
      });
    });

    it('should ensure no duplicate domain keys', () => {
      const domainKeys = Object.keys(SEED_LEGAL_DOMAINS);
      const uniqueKeys = new Set(domainKeys);
      expect(uniqueKeys.size).toBe(domainKeys.length);
    });

    it('should ensure no duplicate matter type keys', () => {
      const matterTypeKeys = Object.keys(SEED_MATTER_TYPES);
      const uniqueKeys = new Set(matterTypeKeys);
      expect(uniqueKeys.size).toBe(matterTypeKeys.length);
    });

    it('should ensure all domains have unique icons', () => {
      const icons = Object.values(SEED_LEGAL_DOMAINS).map((d) => d.icon);
      const uniqueIcons = new Set(icons);
      expect(uniqueIcons.size).toBe(icons.length);
    });
  });
});
