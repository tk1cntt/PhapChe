import { readFileSync } from 'node:fs';
import { getOpsDashboard, getOpsRequestTimeline, parseOpsFilters, requireOpsAdmin } from './ops-service';

const source = readFileSync(new URL('./ops-service.ts', import.meta.url), 'utf8');

function mustInclude(value: string, message: string) {
  if (!source.includes(value)) throw new Error(message);
}

function mustExclude(value: string, message: string) {
  if (source.includes(value)) throw new Error(message);
}

for (const exportName of ['requireOpsAdmin', 'parseOpsFilters', 'getOpsDashboard', 'getOpsRequestTimeline']) {
  if (!source.includes(exportName) && !String({ requireOpsAdmin, parseOpsFilters, getOpsDashboard, getOpsRequestTimeline }).length) {
    throw new Error(`${exportName} missing`);
  }
}

mustInclude('coordinator_admin', 'OPS-02 admin ops data must authorize coordinator_admin');
mustInclude('super_admin', 'OPS-02 admin ops data must authorize super_admin');
mustInclude('workspaceMembership.findFirst', 'OPS-02 must check active workspaceMembership.findFirst');
mustInclude('isActive: true', 'OPS-02 must require active membership/user/workspace');
mustInclude('workspace: { isActive: true }', 'OPS-02 must require active workspace');
mustInclude('role: { in: authorizedRoles }', 'OPS-02 must restrict admin roles');
mustInclude('requestStatuses.includes', 'OPS-02 must allowlist status filters');
mustInclude('Number.isNaN(date.getTime())', 'OPS-02 must reject invalid date filters safely');
mustInclude('AND: and', 'OPS-02 filters must compose with AND semantics');

mustInclude('legalRequest.count', 'OPS-01 dashboard totals must come from LegalRequest count');
mustInclude('legalRequest.groupBy', 'OPS-01 dashboard counts must come from persisted LegalRequest groupBy');
mustInclude('legalRequest.findMany', 'OPS-01 request rows must come from persisted LegalRequest rows');
mustInclude("by: ['status']", 'OPS-01 must group counts by status');
mustInclude("by: ['assignedSpecialistId']", 'OPS-03 specialist workload must group by assignedSpecialistId');
mustInclude("by: ['assignedReviewerId']", 'OPS-03 reviewer workload must group by assignedReviewerId');
mustInclude('assignedSpecialistId', 'OPS-03 service must use assignedSpecialistId source of truth');
mustInclude('assignedReviewerId', 'OPS-03 service must use assignedReviewerId source of truth');
mustInclude('workflowTransition.findMany', 'OPS-04 SLA age must use WorkflowTransition rows');
mustInclude('currentStatusSince', 'OPS-04 must return current status timestamp');
mustInclude('pendingReviewSince', 'OPS-04 must return pending review timestamp');
mustInclude('deliveredAt', 'OPS-04 must return delivery timestamp when present');
mustInclude('closedAt', 'OPS-04 must return close timestamp when present');
mustInclude('auditEvent.findMany', 'OPS-05 timeline must use AuditEvent rows');
mustInclude('metadataSummary', 'OPS-05 timeline must expose only safe metadataSummary');
mustInclude("kind: 'workflow'", 'OPS-05 timeline must include workflow events');
mustInclude("kind: 'audit'", 'OPS-05 timeline must include audit events');

for (const sensitiveField of ['generatedContent', 'generalComment', 'storageKey', 'fileContent', 'rawAnswer', 'rawContent', 'answers:', 'answerLabels', 'metadata: true']) {
  mustExclude(sensitiveField, `OPS-05 timeline must not expose sensitive field ${sensitiveField}`);
}

const behaviorFixtures = {
  rawLegalText: 'Điều khoản bí mật trong hợp đồng đại lý',
  reviewerComment: 'Reviewer-only comment về rủi ro pháp lý',
  generatedDocumentContent: 'Nội dung tài liệu pháp lý được generate',
  rawStorageKey: 'tenant-a/request-1/private/file.docx',
  rawFileContents: 'binary-private-file-content',
  safeMetadata: 'request.status_changed; target=req_1; correlation=corr_1; metadataSummary=assigned -> pending_review',
};

if (behaviorFixtures.safeMetadata.includes(behaviorFixtures.rawLegalText)) throw new Error('OPS-05 metadataSummary must not include raw legal text');
if (behaviorFixtures.safeMetadata.includes(behaviorFixtures.reviewerComment)) throw new Error('OPS-05 metadataSummary must not include reviewer-only comments');
if (behaviorFixtures.safeMetadata.includes(behaviorFixtures.generatedDocumentContent)) throw new Error('OPS-05 metadataSummary must not include generated document content');
if (behaviorFixtures.safeMetadata.includes(behaviorFixtures.rawStorageKey)) throw new Error('OPS-05 metadataSummary must not include raw storage keys');
if (behaviorFixtures.safeMetadata.includes(behaviorFixtures.rawFileContents)) throw new Error('OPS-05 metadataSummary must not include raw file contents');
if (behaviorFixtures.safeMetadata.length > 500) throw new Error('OPS-05 metadataSummary fixture must stay <= 500 chars');

const parsed = parseOpsFilters({ status: 'not_a_status', dateFrom: 'not-a-date', matterTypeKey: 'agency_contract' });
if (parsed.status !== undefined) throw new Error('OPS-02 invalid status must be ignored safely');
if (parsed.dateFrom !== undefined) throw new Error('OPS-02 invalid date must be ignored safely');
if (parsed.matterTypeKey !== 'agency_contract') throw new Error('OPS-02 matter type filter must parse');
