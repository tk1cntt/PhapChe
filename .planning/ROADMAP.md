# Roadmap: Legal-as-a-Service Platform

**Last updated:** 2026-06-05
**Current milestone:** v1.1 Auth & Hardening

## Milestones

- ✅ **v1.0 MVP** — Phases 1-14, 49 plans, 70 tasks (shipped 2026-06-05)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 01-14) — SHIPPED 2026-06-05</summary>

- [x] Phase 01: foundation (4/4 plans) — completed 2026-06-01
- [x] Phase 02: intake (4/4 plans) — completed 2026-06-01
- [x] Phase 03: routing (5/5 plans) — completed 2026-06-01
- [x] Phase 04: documents-vault (4/4 plans) — completed 2026-06-01
- [x] Phase 05: review (3/3 plans) — completed 2026-06-01
- [x] Phase 06: delivery (6/6 plans) — completed 2026-06-01
- [x] Phase 07: ops (4/4 plans) — completed 2026-06-01
- [x] Phase 08: reviewer-service (2/2 plans) — completed 2026-06-03
- [x] Phase 09: folder-tag (2/2 plans) — completed 2026-06-03
- [x] Phase 10: ux-hardening (1/1 plan) — completed 2026-06-03
- [x] Phase 11: wire-review-init (1/1 plan) — completed 2026-06-04
- [x] Phase 12: ops-sla-drill-in (1/1 plan) — completed 2026-06-05
- [x] Phase 13: service-cleanup-wiring (3/3 plans) — completed 2026-06-05
- [x] Phase 14: antd-layout-redesign (9/9 plans) — completed 2026-06-05

</details>

## Archive

Full milestone details: `.planning/milestones/v1.0-ROADMAP.md`
Requirements archive: `.planning/milestones/v1.0-REQUIREMENTS.md`
Milestone audit: `.planning/milestones/v1.0-MILESTONE-AUDIT.md`

### 🚧 v1.1 Auth & Hardening (Planned)

### Phase 15: auth

**Goal:** Replace stub auth (APP_SESSION_USER_ID) with real authentication — Better Auth with Prisma, login page, session management, protected routes, adapted requireAppSession().
**Requirements**: TBD
**Depends on:** Phase 14
**Plans:** 3 plans

Plans:
- [ ] 15-01-PLAN.md — Foundation: install better-auth, merge auth schema into Prisma, push DB, configure env vars
- [ ] 15-02-PLAN.md — Auth Infrastructure: auth.ts instance, proxy.ts, API route handler, client SDK, adapted requireAppSession()
- [ ] 15-03-PLAN.md — Login UI & Seed Data: Ant Design sign-in page, password-hashed seed users, real admin users page

### Phase 16: Fix 14 failed routes discovered by validated screenshot capture

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 15
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 16 to break down)

---
