---
status: incomplete
quick_id: 260606-pfi
slug: validate-screenshots
completed_at: 2026-06-06
---

# Quick Task 260606-pfi Summary

## Result

Đã mở và validate các route frontend hiện có bằng Playwright trên `http://localhost:3000` trước khi chụp screenshot.

Theo yêu cầu, **không chụp các trang đang lỗi như ảnh PASS**. Chỉ các route đạt validation mới có file screenshot trong thư mục `screenshots/`.

## Validation Output

- Route files discovered: 20
- Validation entries: 21 (bao gồm bước bootstrap đăng nhập `/sign-in`)
- PASS entries: 7
- FAIL entries: 14
- Screenshot files saved: 6
- Raw validation report: `.planning/quick/260606-pfi-m-t-t-c-c-c-trang-hi-n-c-ki-m-tra-hi-n-t/validation-results.json`
- Capture script: `.planning/quick/260606-pfi-m-t-t-c-c-c-trang-hi-n-c-ki-m-tra-hi-n-t/validate-and-capture.cjs`

## Screenshots Captured After PASS

| Route | Screenshot |
|---|---|
| `/` | `screenshots/home.png` |
| `/admin/audit` | `screenshots/admin-audit.png` |
| `/admin/requests` | `screenshots/admin-requests.png` |
| `/admin/workspaces` | `screenshots/admin-workspaces.png` |
| `/intake` | `screenshots/intake.png` |
| `/sign-in` | `screenshots/sign-in.png` |

## Routes Not Captured Because Validation Failed

| Route | Reason |
|---|---|
| `/admin/ops` | HTTP 500, blank body, React error: `Element type is invalid` in `OpsPage`. |
| `/admin/ops/[requestId]` | HTTP 500, blank body, React error: `Element type is invalid` in `OpsRequestTimelinePage`. |
| `/admin/routing` | HTTP 500, `FORBIDDEN` for logged-in specialist demo user. |
| `/admin/templates` | HTTP 404 / visible Not Found. |
| `/admin/templates/[templateId]` | HTTP 404 / visible Not Found. |
| `/admin/templates/new` | HTTP 404 / visible Not Found. |
| `/admin/users` | HTTP 404 / visible Not Found. |
| `/admin/vault` | HTTP 404 / visible Not Found. |
| `/customer/requests/[requestId]` | HTTP 404 / visible Not Found. |
| `/requests/[requestId]` | HTTP 404 / visible Not Found. |
| `/reviewer/requests` | HTTP 500, blank body, server/client boundary error: functions passed to Client Component via AntD `Table` columns. |
| `/reviewer/requests/[requestId]/review/[documentVersionId]` | HTTP 404 / visible Not Found. |
| `/specialist/requests` | HTTP 500, blank body, server/client boundary error: functions passed to Client Component via AntD `Table` columns. |
| `/specialist/requests/[requestId]` | HTTP 404 / visible Not Found. |

## Notes

- The existing dev server was already running on port 3000; a second `npm run dev` failed because port 3000 was occupied by the existing Next process. Validation used the existing server.
- `npm run typecheck` fails due to multiple pre-existing type errors across app/test files. Relevant route failures are captured in `validation-results.json`.
- No source files were changed for UI fixes in this quick task; the task outcome is a validated screenshot set plus a failure report, not a broad repair pass.
