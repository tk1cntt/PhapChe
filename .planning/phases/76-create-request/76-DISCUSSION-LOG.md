# Phase 76: Create Request - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-20
**Phase:** 76-create-request
**Mode:** --auto (all decisions auto-selected, recommended options chosen)
**Areas discussed:** Wizard State Management, Draft Auto-save Trigger, Service Type Data Organization, File Upload Timing, Review Step Edit Navigation, Domain Icon Library, Success Message Timing, Mobile Wizard Progress, Form Validation Timing, Draft Resume Notification

---

## Wizard State Management Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| React Context + useReducer | Native React pattern for complex state, no dependency | ✓ |
| react-hook-form | External library, popular for complex forms | |
| Local state per step + prop drilling | Simple but hard to share state across steps | |

**User's choice:** [auto] React Context + useReducer (recommended default)
**Notes:** Phase 74 decided against react-hook-form for simple forms. This wizard is complex but native React pattern is sufficient and avoids new dependency.

---

## Draft Auto-save Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Before step transition only | 4 saves max, simple implementation | ✓ |
| On blur/timeout (every 30s) | More frequent saves, complex timer logic | |
| Debounce on every input change | Most aggressive, high API call volume | |

**User's choice:** [auto] Before step transition only (recommended default)
**Notes:** Matches SPEC.md R6 requirement. "Lưu nháp" button provides explicit save for mid-step persistence.

---

## Service Type Data Organization

| Option | Description | Selected |
|--------|-------------|----------|
| Single file + lazy question loading | 1 file <500 lines, questions loaded on demand | ✓ |
| Split into 13 domain files | Separate file per domain, harder to maintain | |
| Load all questions upfront | Simple but large initial bundle | |

**User's choice:** [auto] Single file with lazy question loading (recommended default)
**Notes:** SPEC.md constraint: "SEED_LEGAL_DOMAINS + SEED_MATTER_TYPES phải fit trong 1 file (< 500 lines)". Lazy loading reduces initial bundle.

---

## File Upload Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Immediate upload on file selection | Better UX, progress visible immediately | ✓ |
| Queue all files, upload on step 4 submit | Batch upload, no progress until step 4 | |
| Upload on step transition (step 3→4) | Delayed upload, confusing UX | |

**User's choice:** [auto] Immediate upload on file selection (recommended default)
**Notes:** Uses existing API `POST /api/intake/attach-file`. Draft created on first file upload if not exists. User can remove/re-upload before final submit.

---

## Review Step Edit Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Navigate back, preserve all state | Simple, state preserved in Context | ✓ |
| Navigate back, require re-submission | User must re-validate edited step | |
| Modal overlay for editing | Complex UI, harder on mobile | |

**User's choice:** [auto] Navigate back, preserve all state (recommended default)
**Notes:** Matches SPEC.md R10. User edits step, clicks Next → returns to Review (step 5). No data loss.

---

## Domain Icon Library

| Option | Description | Selected |
|--------|-------------|----------|
| Lucide React icons | Already installed, consistent, accessible SVGs | ✓ |
| Custom SVG icons | Unique look, maintenance burden | |
| Emoji icons | Simple, inconsistent across platforms | |

**User's choice:** [auto] Lucide React icons (recommended default)
**Notes:** Lucide already in codebase (STACK.md). Easy domain→icon mapping. Accessible with aria-label.

---

## Success Message Timing

| Option | Description | Selected |
|--------|-------------|----------|
| 2 seconds + "Xem hồ sơ" button immediately | Fast, user can redirect early | ✓ |
| 5 seconds with countdown | Longer read time, countdown visual | |
| No auto-redirect, manual only | User must click to leave | |

**User's choice:** [auto] 2 seconds, with "Xem hồ sơ" button visible immediately (recommended default)
**Notes:** Matches SPEC.md R9. 2s fast enough to not annoy, slow enough to read. Button allows immediate redirect.

---

## Mobile Wizard Progress Indicator

| Option | Description | Selected |
|--------|-------------|----------|
| Compact progress bar + current step name | Visual % + text context, responsive | ✓ |
| Show all 5 step names (horizontal scroll) | Full info but overflow on mobile | |
| Step counter only (e.g., "Step 3 of 5") | Minimal, no visual progress | |

**User's choice:** [auto] Compact progress bar with current step name (recommended default)
**Notes:** Responsive: desktop shows all 5 names, mobile shows bar + current step label. 5 names don't fit on mobile.

---

## Form Validation Timing

| Option | Description | Selected |
|--------|-------------|----------|
| On blur + on submit | Immediate feedback on blur, final check on submit | ✓ |
| On change (real-time) | Errors while typing, noisy UX | |
| On submit only | Late feedback, user fills entire form first | |

**User's choice:** [auto] On blur + on submit (recommended default)
**Notes:** Pattern from Phase 74. Balances UX and simplicity. Real-time validation too noisy for wizard forms.

---

## Draft Resume Notification

| Option | Description | Selected |
|--------|-------------|----------|
| Banner + "Xóa và bắt đầu mới" button | Visible, clear action, persistent | ✓ |
| Silently resume without notification | Confusing, user may not know they resumed | |
| Toast notification only | Auto-dismisses, easy to miss | |

**User's choice:** [auto] Show banner with clear action (recommended default)
**Notes:** User should know they're resuming. Banner visible at top of wizard. "Xóa và bắt đầu mới" clears draft and starts over.

---

## Claude's Discretion

None — all areas had clear recommended options.

## Deferred Ideas

None — discussion stayed within phase scope.
