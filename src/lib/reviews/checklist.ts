// Re-export QC-LEG-01 checklist constants from the canonical location so the
// reviewer service and review form can import from a single path.
export {
  CHECKLIST_ITEMS,
  CHECKLIST_GROUPS,
  GROUP_LABELS,
} from '@/constants/checklist-items';

import { CHECKLIST_ITEMS as ITEMS } from '@/constants/checklist-items';
export type ChecklistItemId = typeof ITEMS[number]['id'];
