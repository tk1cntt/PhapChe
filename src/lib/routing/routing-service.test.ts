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

async function assertRoutingContracts() {
  const matterType = await upsertMatterType({
    key: 'agency_contract',
    label: 'Soạn hợp đồng đại lý',
    description: 'Hợp đồng đại lý',
    schemaVersion: '2026-05-27',
    questionSchema: [],
    isActive: true,
  });
  if (matterType.key !== 'agency_contract') throw new Error('upsertMatterType must preserve key');

  const capability = await upsertRoutingCapability({
    workspaceId: 'workspace-active',
    userId: 'specialist-active',
    matterTypeKey: 'agency_contract',
    kind: 'specialist',
    isActive: true,
  });
  if (capability.kind !== 'specialist') throw new Error('upsertRoutingCapability must preserve kind');

  const suggestions = await getRoutingSuggestions({ requestId: 'request-agency', workspaceId: 'workspace-active' });
  if (!('specialists' in suggestions) || !('reviewers' in suggestions)) {
    throw new Error('suggestions must return specialists and reviewers');
  }

  if (!suggestions.specialists.some((item: Suggestion) => item.userId === 'specialist-active' && item.reason === reason)) {
    throw new Error('active specialist capability must be suggested with Vietnamese reason');
  }

  if (!suggestions.reviewers.some((item: Suggestion) => item.userId === 'reviewer-active' && item.reason === reason)) {
    throw new Error('active reviewer capability must be suggested with Vietnamese reason');
  }

  for (const blockedUserId of ['specialist-inactive-capability', 'specialist-inactive-user', 'specialist-inactive-membership']) {
    if (suggestions.specialists.some((item: Suggestion) => item.userId === blockedUserId)) {
      throw new Error(`${blockedUserId} must not be suggested`);
    }
  }
}

await assertRoutingContracts();
