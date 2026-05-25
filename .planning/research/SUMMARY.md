# Research Summary: Legal-as-a-Service Platform

## Stack Recommendation

MVP nên dùng modular monolith:

- Next.js 15 + TypeScript cho customer portal, admin portal, specialist/reviewer portal và API.
- Tailwind CSS + shadcn/ui + TanStack Table cho dashboard nhanh.
- PostgreSQL + Prisma cho dữ liệu workflow, template, review, audit.
- S3-compatible private storage như Cloudflare R2/AWS S3/Supabase Storage cho Legal Vault.
- Worker riêng cho document generation/conversion: Inngest/Trigger.dev/BullMQ + LibreOffice headless.
- Docxtemplater cho DOCX template; LibreOffice convert PDF; pdf-lib cho merge/stamp/fill PDF cơ bản.
- Resend cho email notification.
- Clerk/Auth.js cho auth; nếu cần kiểm soát sâu chọn Auth.js, nếu cần nhanh chọn Clerk.
- Sentry + PostHog cho error/product analytics.

## Table Stakes

- Chat/form hybrid intake.
- Structured intake answers.
- Request tracking.
- File upload/download.
- Admin dashboard.
- Manual assignment.
- Specialist queue.
- Reviewer QC checklist.
- Deliverable delivery.
- Legal Vault cơ bản.
- Role-based access.
- Audit trail.
- Capability Matrix cơ bản.

## Key Architecture

Core flow:

Customer submits intake → LegalRequest created → Capability Matrix suggests specialist/reviewer → Admin assigns → Specialist works/generates draft → Reviewer approves/rejects → Final document delivered → Legal Vault stores all artifacts → AuditEvent records every critical action.

Components:

- Customer Chat/Portal: submit request, answer intake, upload files, view status, receive final docs.
- Intake API: normalize chat/form into structured answers.
- Workflow Service: state machine, assignment, transitions.
- Capability Matrix: map matter type to skills, availability, review authority.
- Document Template Engine: render approved DOCX template with variables.
- Legal Vault: private files, versions, metadata, access control.
- Reviewer Portal: split view + checklist + comments + approve/revise.
- Admin Portal: templates, users, assignment, dashboard, audit.
- Notification Service: email/in-app updates.

## Pitfalls

- AI legal advice tự động: không cho AI kết luận pháp lý; dùng human-in-loop.
- Template governance yếu: version/lifecycle bắt buộc.
- Privacy/file leakage: private storage, signed URL, RBAC, audit, no email attachments.
- Reviewer QC qua loa: checklist theo request type, comments bắt buộc khi reject.
- Workflow state rối: backend state machine, không update status tùy ý.
- Audit thiếu: append-only audit_events từ phase đầu.
- OCR/e-sign quá sớm: thiết kế integration boundary, defer implementation.

## Recommended MVP Phase Order

1. `foundation` — auth, RBAC, tenant/customer, LegalRequest base, audit event.
2. `intake` — chat/form intake, structured answers, file upload, status tracking.
3. `routing` — matter types, capability matrix, manual assignment, specialist queue.
4. `documents` — vault, template lifecycle, DOCX generation, document versioning.
5. `review` — reviewer portal, QC checklist, approve/revise loop, final marking.
6. `delivery` — customer status, secure final download, notifications, close request.
7. `ops` — SLA, workload, search/filter, reporting.

## Defer to V2

- OCR scanner and extraction.
- E-sign integration.
- Compliance calendar advanced automation.
- AI triage/draft/risk flags.
- Billing/subscription automation.
- Analytics for client value.
- Advanced template/clause recommendation.
