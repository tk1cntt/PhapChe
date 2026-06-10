# Requirements: Legal-as-a-Service Platform

**Defined:** 2026-06-10
**Milestone:** v1.2 UI/UX Improvements
**Core Value:** SME gửi yêu cầu pháp lý theo cách đơn giản như nhắn tin và nhận tài liệu/tư vấn đã qua kiểm soát chất lượng, có thể truy vết toàn bộ quá trình xử lý.

## v1.2 Requirements

Requirements cho milestone v1.2 — UI/UX Improvements cho Admin Dashboard.

### Loading States

- [x] **LOAD-01**: Admin pages display skeleton loading screens during data fetch
- [x] **LOAD-02**: PageSkeleton component matches table layout structure
- [x] **LOAD-03**: CardSkeleton component for card-based content
- [x] **LOAD-04**: Skeleton components reusable across all admin pages (no hard-coded per page)

### Error Handling

- [x] **ERR-01**: Each admin page wrapped in Error Boundary
- [x] **ERR-02**: Error fallback displays error message + Retry button
- [x] **ERR-03**: Errors logged to console for debugging
- [x] **ERR-04**: Shared ErrorFallback component used across all pages

### Data Fetching

- [x] **DATA-01**: TanStack Query v5 installed and configured
- [x] **DATA-02**: QueryClientProvider added to app layout
- [x] **DATA-03**: Query key convention established: `['entity', workspaceId?, options]`
- [x] **DATA-04**: React Query devtools enabled in development only
- [x] **DATA-05**: Cache configuration: staleTime 30s, gcTime 5min

### Pagination

- [x] **PAGE-01**: Tables support pagination with page sizes: 10, 25, 50
- [x] **PAGE-02**: Page state synced to URL query params
- [x] **PAGE-03**: Server-side pagination for requests, users, audit tables

### Search & Filter

- [x] **SCH-01**: Global search bar in admin header
- [x] **SCH-02**: Column filters in table headers
- [x] **SCH-03**: Debounced search: 300ms delay
- [x] **SCH-04**: Search state persisted in URL params

## v2 Requirements

Deferred to future releases.

### Performance

- **PERF-01**: Virtual scrolling for 10k+ rows
- **PERF-02**: First Contentful Paint < 1.5s
- **PERF-03**: Time to Interactive < 3s
- **PERF-04**: Bundle size increase < 50KB gzipped

### Accessibility

- **A11Y-01**: Keyboard navigation for all interactive elements
- **A11Y-02**: ARIA labels for icons
- **A11Y-03**: Focus management for modals

### Responsive

- **RESP-01**: Tablet: Collapsed sidebar
- **RESP-02**: Mobile: Hamburger menu, horizontal scroll tables

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time updates (WebSocket) | MVP focus on stability first |
| Offline mode | Not critical for internal tool |
| Full responsive redesign | Desktop-first, internal tool |
| Command palette | Power user feature for later |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| LOAD-01 | Phase 23 | Complete |
| LOAD-02 | Phase 23 | Complete |
| LOAD-03 | Phase 23 | Complete |
| LOAD-04 | Phase 23 | Complete |
| ERR-01 | Phase 23 | Complete |
| ERR-02 | Phase 23 | Complete |
| ERR-03 | Phase 23 | Complete |
| ERR-04 | Phase 23 | Complete |
| DATA-01 | Phase 24 | Complete |
| DATA-02 | Phase 24 | Complete |
| DATA-03 | Phase 24 | Complete |
| DATA-04 | Phase 24 | Complete |
| DATA-05 | Phase 24 | Complete |
| PAGE-01 | Phase 25 | Complete |
| PAGE-02 | Phase 25 | Complete |
| PAGE-03 | Phase 25 | Complete |
| SCH-01 | Phase 25 | Complete |
| SCH-02 | Phase 25 | Complete |
| SCH-03 | Phase 25 | Complete |
| SCH-04 | Phase 25 | Complete |

**Coverage:**
- v1.2 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0

---
*Requirements defined: 2026-06-10*
*Last updated: 2026-06-10 after roadmap creation*
