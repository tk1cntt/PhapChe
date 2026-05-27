import { getMatterQuestions, getMatterType, MATTER_CATALOG } from './catalog';

const requiredMatterKeys = ['agency_contract', 'labor_contract', 'trademark_registration', 'unsupported'];

for (const key of requiredMatterKeys) {
  const matterType = getMatterType(key);
  if (!matterType) throw new Error(`${key} matter type missing`);
  if (!matterType.label.trim()) throw new Error(`${key} Vietnamese label missing`);
  if (!matterType.schemaVersion.trim()) throw new Error(`${key} schema version missing`);
  if (matterType.questions.length === 0) throw new Error(`${key} questions missing`);
}

const agencyQuestions = getMatterQuestions('agency_contract');
if (!agencyQuestions.some((question) => question.key === 'partner_name' && question.required)) {
  throw new Error('agency_contract partner_name required question missing');
}

const unsupported = getMatterType('unsupported');
if (!unsupported?.description.includes('chuyên viên phân loại')) {
  throw new Error('unsupported guidance must route to human triage');
}

const firstSnapshot = getMatterQuestions('labor_contract');
const secondSnapshot = getMatterQuestions('labor_contract');
if (Object.is(firstSnapshot, secondSnapshot)) throw new Error('question snapshots must not share array identity');
firstSnapshot[0].label = 'mutated';
if (getMatterQuestions('labor_contract')[0].label === 'mutated') throw new Error('question snapshots must be immutable copies');

const duplicateKeys = MATTER_CATALOG.map((item) => item.key).filter((key, index, keys) => keys.indexOf(key) !== index);
if (duplicateKeys.length > 0) throw new Error(`duplicate matter keys: ${duplicateKeys.join(',')}`);
