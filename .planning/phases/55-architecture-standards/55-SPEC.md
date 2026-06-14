# Phase 55: Architecture & Standards — Specification

**Created:** 2026-06-14
**Ambiguity score:** 0.14 (gate: ≤ 0.20)
**Requirements:** 7 locked

## Goal

Establish consistent development patterns across the codebase: shared component registry, API standards, service layer separation, type safety, and code conventions that prevent ad-hoc implementation.

## Background

The codebase has grown organically during v1.0 and v2.0. Components were created without a centralized registry, API endpoints use inconsistent response formats, and business logic is scattered between components and API routes. This phase creates the standards foundation for all subsequent feature phases.

**Current state:**
- 87+ components in `src/components/` across 10 directories
- Service layer partially exists (`src/lib/workflow/`, `src/lib/intake/`, etc.)
- API routes use different response patterns
- TypeScript has scattered `as any` casts
- No shared component documentation

## Requirements

1. **Component Registry**: Create a centralized registry documenting all shared/reusable components with props, usage, and examples.
   - Current: Components exist but no centralized documentation
   - Target: `src/components/COMPONENT_REGISTRY.md` listing all reusable components with props interface and usage examples
   - Acceptance: Registry lists 20+ components with complete prop documentation

2. **API Standards Document**: Define REST API conventions for request/response format, error handling, and naming.
   - Current: API routes use inconsistent response formats
   - Target: `src/docs/API_STANDARDS.md` with response format, error codes, pagination pattern, and naming conventions
   - Acceptance: All new API endpoints follow documented standards

3. **Shared Components Extraction**: Identify and extract common UI patterns into reusable components (StatCard, Badge, Button, Modal, etc.).
   - Current: Duplicate StatCard implementations in admin and user components
   - Target: Single `src/components/ui/StatCard.tsx` with 4 variants (blue, green, orange, purple)
   - Acceptance: All 6 StatCard variants across codebase use single component

4. **Service Layer Separation**: Document and enforce business logic separation from UI components.
   - Current: Some business logic embedded in components
   - Target: `src/docs/SERVICE_LAYER.md` defining service layer responsibilities and patterns
   - Acceptance: All business logic moves to `src/lib/` services by Phase 56

5. **TypeScript Type Unification**: Create shared type definitions and eliminate `as any` casts.
   - Current: Multiple scattered type definitions, `as any` casts present
   - Target: `src/lib/types/` with unified interfaces for User, Workspace, Request, AuditEvent, VaultFile
   - Acceptance: Zero `as any` casts in new code, only in legacy code with TODO comments

6. **Code Standards Document**: Define naming conventions, file structure, and import order.
   - Current: No documented standards
   - Target: `src/docs/CODE_STANDARDS.md` with naming, structure, and import conventions
   - Acceptance: Standards documented and followed in all new code

7. **i18n Implementation Rules**: Define when to use translation keys vs hardcoded strings.
   - Current: Mixed approach with some hardcoded strings
   - Target: `src/docs/I18N_RULES.md` defining translation scope and implementation
   - Acceptance: All user-facing text uses i18n, only internal logs/errors use hardcoded strings

## Boundaries

**In scope:**
- Documentation files (`src/docs/API_STANDARDS.md`, `src/docs/CODE_STANDARDS.md`, `src/docs/SERVICE_LAYER.md`, `src/docs/I18N_RULES.md`)
- Component registry (`src/components/COMPONENT_REGISTRY.md`)
- Shared component extraction (StatCard, Badge variants)
- Type unification in `src/lib/types/`
- Standards enforcement in new code (not retroactively fixing all legacy code)

**Out of scope:**
- Retroactively fixing all existing components to match new standards (deferred to feature phases)
- Creating new features or functionality
- Database schema changes
- Performance optimization
- Test coverage improvement

## Constraints

- All new code must follow documented standards
- Standards are documented, not enforced via tooling (Phase 57+)
- Shared components must maintain backward compatibility with existing usage
- i18n rules apply only to user-facing text in components

## Acceptance Criteria

- [ ] `src/components/COMPONENT_REGISTRY.md` exists with 20+ components documented
- [ ] `src/docs/API_STANDARDS.md` defines response format, error codes, pagination
- [ ] `src/docs/CODE_STANDARDS.md` defines naming, structure, import conventions
- [ ] `src/docs/SERVICE_LAYER.md` documents service layer responsibilities
- [ ] `src/docs/I18N_RULES.md` defines translation scope and implementation
- [ ] Single `StatCard` component replaces all duplicate implementations
- [ ] `src/lib/types/` contains unified interfaces for core entities
- [ ] Zero `as any` in new code (legacy code with TODO acceptable)

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|------|--------|-------|
| Goal Clarity | 0.90 | 0.75 | ✓ | Foundation phase for consistent patterns |
| Boundary Clarity | 0.85 | 0.70 | ✓ | Documentation + extraction, no new features |
| Constraint Clarity | 0.80 | 0.65 | ✓ | Standards only for new code |
| Acceptance Criteria | 0.85 | 0.70 | ✓ | 8 pass/fail checkboxes |
| **Ambiguity** | **0.14** | ≤0.20 | ✓ | |

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|-----------------|----------------|
| 1 | Researcher | What exists in codebase today? | 87+ components, partial service layer, inconsistent API patterns |
| 1 | Researcher | What triggers this work? | Ad-hoc implementation causing inconsistency across phases |
| 2 | Simplifier | Minimum viable foundation? | Component registry + API standards + shared components |
| 3 | Boundary Keeper | What's NOT this phase? | No retroactively fixing all legacy code |
| 4 | Failure Analyst | What goes wrong without standards? | Duplicate components, inconsistent APIs, type errors |

---
*Phase: 55-architecture-standards*
*Spec created: 2026-06-14*
*Next step: /gsd-discuss-phase 55 — implementation decisions (how to extract shared components, organize types, etc.)*
