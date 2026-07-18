/**
 * ── C3: Workflow/Template Inheritance Resolver ──
 * Resolve workflow & template theo 3 tầng:
 *   Organization → Partner → Platform (base)
 *
 * Resolution chain: Organization override → Partner override → Platform base
 * See: docs/shared_customer_partner_collaboration.md §9.1, §10.1
 *
 * ⚠ MVP note: Hiện tại chưa có bảng workflow_definitions/document_templates
 *    phân cấp trong Prisma. Resolver này là interface stub — implement khi
 *    DB schema được mở rộng với owner_type (platform | partner | organization).
 */

export type InheritanceOwnerType = 'platform' | 'partner' | 'organization';

export interface ResolvableEntity {
  id: string;
  serviceTypeId: string;
  ownerType: InheritanceOwnerType;
  ownerId: string | null;
  parentId: string | null;
  inheritanceMode: 'extend' | 'override' | 'compose';
  version: number;
  status: 'draft' | 'active' | 'archived';
  configJson: Record<string, unknown>;
}

export interface InheritanceResolutionResult {
  resolved: ResolvableEntity;
  chain: Array<{ level: InheritanceOwnerType; entityId: string }>;
  mode: 'extend' | 'override' | 'compose';
}

/**
 * InheritanceResolver — 3-tier resolution
 * Usage: const result = await resolver.resolveWorkflow(serviceTypeId, orgId, partnerId);
 */
export class InheritanceResolver {
  /**
   * Resolve workflow definition cho một service_type trong một organization cụ thể.
   *
   * Priority (first match wins):
   * 1. Organization override workflow (owner_type = 'organization', ownerId = orgId)
   * 2. Partner override workflow (owner_type = 'partner', ownerId = partnerId)
   * 3. Platform base workflow (owner_type = 'platform')
   *
   * @param serviceTypeId - service type cần resolve
   * @param organizationId - organization context (để check override)
   * @param partnerId - partner context (để check override, optional)
   * @param getWorkflowFn - async function query workflow từ DB (injectable cho test)
   */
  async resolveWorkflow(
    serviceTypeId: string,
    organizationId: string,
    partnerId: string | null,
    getWorkflowFn: (ownerType: InheritanceOwnerType, ownerId: string | null) => Promise<ResolvableEntity | null>,
  ): Promise<InheritanceResolutionResult | null> {
    const chain: Array<{ level: InheritanceOwnerType; entityId: string }> = [];

    // 1. Organization override
    const orgWorkflow = await getWorkflowFn('organization', organizationId);
    if (orgWorkflow && orgWorkflow.status === 'active') {
      return {
        resolved: orgWorkflow,
        chain: [...chain, { level: 'organization', entityId: orgWorkflow.id }],
        mode: orgWorkflow.inheritanceMode,
      };
    }

    // 2. Partner override
    if (partnerId) {
      const partnerWorkflow = await getWorkflowFn('partner', partnerId);
      if (partnerWorkflow && partnerWorkflow.status === 'active') {
        return {
          resolved: partnerWorkflow,
          chain: [
            { level: 'organization', entityId: 'none' },
            { level: 'partner', entityId: partnerWorkflow.id },
          ],
          mode: partnerWorkflow.inheritanceMode,
        };
      }
    }

    // 3. Platform base (fallback)
    const platformWorkflow = await getWorkflowFn('platform', null);
    if (platformWorkflow && platformWorkflow.status === 'active') {
      return {
        resolved: platformWorkflow,
        chain: [
          { level: 'organization', entityId: 'none' },
          { level: 'partner', entityId: 'none' },
          { level: 'platform', entityId: platformWorkflow.id },
        ],
        mode: platformWorkflow.inheritanceMode,
      };
    }

    return null;
  }

  /**
   * Resolve document template theo cùng cơ chế 3 tầng.
   * Same priority chain: org → partner → platform
   */
  async resolveTemplate(
    serviceTypeId: string,
    organizationId: string,
    partnerId: string | null,
    getTemplateFn: (ownerType: InheritanceOwnerType, ownerId: string | null) => Promise<ResolvableEntity | null>,
  ): Promise<InheritanceResolutionResult | null> {
    return this.resolveWorkflow(serviceTypeId, organizationId, partnerId, getTemplateFn);
  }

  /**
   * Snapshot version — khi tạo request, snapshot workflow version hiện tại
   * để request cũ không bị ảnh hưởng khi workflow được update.
   * See: docs/shared_customer_partner_collaboration.md §9.1
   */
  snapshotVersion(entity: ResolvableEntity): { entityId: string; version: number; snapshotAt: Date } {
    return {
      entityId: entity.id,
      version: entity.version,
      snapshotAt: new Date(),
    };
  }

  /**
   * Merge configs theo inheritance_mode:
   * - override: dùng config của child, ignore parent
   * - extend: merge parent config vào child (child wins on conflict)
   * - compose: deep merge cả 3 tầng
   */
  mergeConfigs(
    parent: Record<string, unknown>,
    child: Record<string, unknown>,
    mode: 'extend' | 'override' | 'compose',
  ): Record<string, unknown> {
    switch (mode) {
      case 'override':
        return { ...child };
      case 'extend':
        return { ...parent, ...child };
      case 'compose':
        return this.deepMerge(parent, child);
      default:
        return { ...child };
    }
  }

  private deepMerge(base: Record<string, unknown>, overrides: Record<string, unknown>): Record<string, unknown> {
    const result = { ...base };
    for (const [key, value] of Object.entries(overrides)) {
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        typeof result[key] === 'object' &&
        result[key] !== null &&
        !Array.isArray(result[key])
      ) {
        result[key] = this.deepMerge(
          result[key] as Record<string, unknown>,
          value as Record<string, unknown>,
        );
      } else {
        result[key] = value;
      }
    }
    return result;
  }
}

export const inheritanceResolver = new InheritanceResolver();
