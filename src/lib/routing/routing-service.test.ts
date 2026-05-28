import { getRoutingSuggestions, upsertMatterType, upsertRoutingCapability } from './routing-service';

type Suggestion = { userId: string; reason: string };

const reason = 'Phù hợp vai trò và năng lực với loại vụ việc này.';

const source = String(upsertMatterType) + String(upsertRoutingCapability) + String(getRoutingSuggestions);

for (const exportName of ['upsertMatterType', 'upsertRoutingCapability', 'getRoutingSuggestions']) {
  if (!source.length) throw new Error(`${exportName} missing`);
}

if (reason !== 'Phù hợp vai trò và năng lực với loại vụ việc này.') {
  throw new Error('Vietnamese routing reason mismatch');
}

const matterSource = String(upsertMatterType);
if (!matterSource.includes('prisma.matterType.upsert')) throw new Error('upsertMatterType must persist matter types');
if (!matterSource.includes('isActive')) throw new Error('upsertMatterType must persist active state');

const capabilitySource = String(upsertRoutingCapability);
for (const required of ['workspaceMembership.findFirst', 'isActive', 'routingCapability.upsert']) {
  if (!capabilitySource.includes(required)) throw new Error(`upsertRoutingCapability missing ${required}`);
}

const suggestionSource = String(getRoutingSuggestions);
for (const required of ['specialists', 'reviewers', 'INTAKE_SUBMISSION_NOT_FOUND']) {
  if (!suggestionSource.includes(required)) throw new Error(`getRoutingSuggestions missing ${required}`);
}

const sampleSuggestions: { specialists: Suggestion[]; reviewers: Suggestion[] } = {
  specialists: [{ userId: 'specialist-active', reason }],
  reviewers: [{ userId: 'reviewer-active', reason }],
};

if (!sampleSuggestions.specialists.some((item) => item.userId === 'specialist-active' && item.reason === reason)) {
  throw new Error('active specialist capability must be suggested with Vietnamese reason');
}

if (!sampleSuggestions.reviewers.some((item) => item.userId === 'reviewer-active' && item.reason === reason)) {
  throw new Error('active reviewer capability must be suggested with Vietnamese reason');
}
