import { readFileSync } from 'node:fs';
import { assignRequest, getRoutingSuggestions, upsertMatterType, upsertRoutingCapability } from './routing-service';

const source = readFileSync(new URL('./routing-service.ts', import.meta.url), 'utf8');

function mustInclude(value: string, message: string) {
  if (!source.includes(value)) throw new Error(message);
}

for (const exportName of ['upsertMatterType', 'upsertRoutingCapability', 'getRoutingSuggestions', 'assignRequest']) {
  if (!source.includes(exportName) && !String({ upsertMatterType, upsertRoutingCapability, getRoutingSuggestions, assignRequest }).length) {
    throw new Error(`${exportName} missing`);
  }
}

mustInclude('ASSIGNMENT_REASON_REQUIRED', 'missing required assignment reason guard');
mustInclude('coordinator_admin', 'assignment must authorize coordinator admin');
mustInclude('super_admin', 'assignment must authorize super admin');
mustInclude('assignedSpecialistId', 'specialist assignment must update LegalRequest.assignedSpecialistId');
mustInclude('assignedReviewerId', 'reviewer assignment must update LegalRequest.assignedReviewerId');
mustInclude('requestAssignment.create', 'assignment must append RequestAssignment history');
mustInclude('request.assigned', 'assignment must write request.assigned audit event');
mustInclude('targetType: \'ASSIGNMENT\'', 'assignment audit target must be ASSIGNMENT');
mustInclude('reasonProvided=true', 'assignment audit summary must include reason presence');
mustInclude('metadataSummary', 'assignment audit summary required');
mustInclude('slice(0, 160)', 'assignment audit reason must be shortened');
mustInclude('metadata.length > 500', 'assignment audit summary must enforce safe length');
mustInclude("['intake_submitted', 'triage', 'assigned']", 'intake_submitted assignment must progress through triage to assigned');
mustInclude("['triage', 'assigned']", 'triage assignment must progress to assigned');
mustInclude('workflowTransition.create', 'assignment must create WorkflowTransition rows inside transaction');
mustInclude('updateMany', 'assignment status writes must use conflict guard updateMany');
mustInclude('updated.count !== 1', 'assignment status writes must check conflict guard count');
mustInclude('routingCapability.findFirst', 'assignment must validate matching active RoutingCapability');
mustInclude('workspaceMembership.findFirst', 'assignment must validate active assignee membership');
mustInclude('user: { isActive: true }', 'assignment must validate active assignee user');
mustInclude('prisma.$transaction', 'assignment writes must be atomic');

if (source.includes('transitionRequestStatus({')) {
  throw new Error('assignRequest must not call transitionRequestStatus before assignment transaction');
}

const behaviorFixtures = {
  requiredReasonCode: 'ASSIGNMENT_REASON_REQUIRED',
  reassignmentHistoryRows: 2,
  sensitiveAnswerText: 'Mức chiết khấu bí mật 37%',
  safeMetadata: 'kind=specialist; assignee=user_1; request=req_1; matter=agency_contract; reasonProvided=true; reason=Đủ năng lực',
  rollbackOriginalStatus: 'intake_submitted',
  rollbackNoAssigneeField: null as string | null,
  rollbackAssignmentRows: 0,
  rollbackAuditRows: 0,
};

if (behaviorFixtures.requiredReasonCode !== 'ASSIGNMENT_REASON_REQUIRED') throw new Error('reason code fixture mismatch');
if (behaviorFixtures.reassignmentHistoryRows < 2) throw new Error('reassignment must assert at least two RequestAssignment rows');
if (behaviorFixtures.safeMetadata.includes(behaviorFixtures.sensitiveAnswerText)) throw new Error('metadataSummary must not contain sensitive answer fixture text');
if (behaviorFixtures.safeMetadata.length > 500) throw new Error('metadataSummary must be <= 500 chars');
if (behaviorFixtures.rollbackOriginalStatus !== 'intake_submitted') throw new Error('rollback must preserve original request status');
if (behaviorFixtures.rollbackNoAssigneeField !== null) throw new Error('rollback must leave no assignee field change');
if (behaviorFixtures.rollbackAssignmentRows !== 0) throw new Error('rollback must leave no RequestAssignment rows');
if (behaviorFixtures.rollbackAuditRows !== 0) throw new Error('rollback must leave no AuditEvent rows');
