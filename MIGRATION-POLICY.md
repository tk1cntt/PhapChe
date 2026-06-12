# Migration Policy: v1 to v2

## Status: IN PROGRESS

Start Date: 2026-06-12
Target Completion: TBD

## Migration Priority

| Priority | Pages | Reason | Status |
|----------|-------|--------|--------|
| 1 | Dashboard | Core flow, high visibility | Pending |
| 2 | Auth (sign-in) | Required for dashboard | Pending |
| 3 | Cases, Create | Main user features | Pending |
| 4 | Messages, Workspace | Secondary features | Pending |
| 5 | Admin pages | Lower priority | Pending |

## Sync Policy

### When to SYNC (update v2 from v1):

- When v1 has critical bug fix needed in v2
- When new patterns are established
- Monthly review of v1 changes

### When NOT to sync:

- Routine v1 development
- UI improvements (v2 has better UI)
- Features not in v2 scope

### Sync Process:

1. Review v1 changes
2. Identify reusable patterns (NOT code)
3. Implement in v2 with v2 patterns
4. Document in v2/docs/

## Exit Criteria

v1 can be deprecated when ALL:

- [ ] All Priority 1-3 pages migrated and tested
- [ ] E2E tests pass on v2
- [ ] No critical bugs in v2 for 2 weeks
- [ ] Business approves v2 as default

## Deprecation Timeline

1. **Phase 1**: v2 in development, v1 still primary
2. **Phase 2**: v2 deployed, v1 still available
3. **Phase 3**: v2 default, v1 archived (URL redirects)
4. **Phase 4**: v1 code deleted (after 6 months)

## Rules

1. **NEVER copy code from legacy**
   - Reference patterns only
   - Rewrite with v2 conventions

2. **ALWAYS import from shared libs**
   - src/lib/ for services
   - src/components/ for UI

3. **DOCUMENT migrations**
   - Update this file when page migrates
   - Note any issues encountered

4. **TEST before marking complete**
   - Run E2E tests
   - Manual verification
   - Update migration status
