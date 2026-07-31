# Review: `src/lib/reviews/checklist.ts`

**Project:** PhapChe | **Review:** `d142b51d-e8c0-4364-af77-2335c5770baa`

**Comments:** 1

---

## 🔵 Low (1)

**🔧 Maintainability** · lines 3-9

CHECKLIST_ITEMS is imported from the same module twice: once via the re-export declaration and once via a separate import statement. This creates a maintenance risk where the two references could drift if one is updated and the other is not. Consider consolidating into a single import and then re-exporting the local binding.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
import { CHECKLIST_ITEMS, CHECKLIST_GROUPS, GROUP_LABELS } from '@/constants/checklist-items';
export { CHECKLIST_ITEMS, CHECKLIST_GROUPS, GROUP_LABELS };

export type ChecklistItemId = typeof CHECKLIST_ITEMS[number]['id'];
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export {
  CHECKLIST_ITEMS,
  CHECKLIST_GROUPS,
  GROUP_LABELS,
} from '@/constants/checklist-items';

import { CHECKLIST_ITEMS as ITEMS } from '@/constants/checklist-items';
```
</details>


