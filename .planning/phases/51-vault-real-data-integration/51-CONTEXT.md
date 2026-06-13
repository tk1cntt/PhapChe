# Phase 51 Context: Vault Real Data Integration

## Phase Goal
Implement Admin Vault page (`/admin/vault`) with real Prisma data, matching mock UI from `layout/admin-vault.html`.

## Source References
- **Mock UI**: `layout/admin-vault.html` - full page layout reference
- **Legacy source**: `src/legacy/[locale]/admin/vault/VaultPageClient.tsx`, `VaultFilesTable.tsx`, `vault.css` - component patterns to clone
- **Backend API**: `/api/vault` returns `{ folders, tags, classifications }` from `classification-service.ts`
- **DB Models**: `VaultFile`, `Folder`, `Tag`, `VaultFileFolder`, `VaultFileTag`

## Component Architecture
Components saved in `src/components/admin/`:
1. `AdminVaultClient.tsx` - Main client component (clone from VaultPageClient.tsx)
2. `AdminVaultFilesTable.tsx` - File table (clone from VaultFilesTable.tsx)
3. `AdminVaultStats.tsx` - Stats grid component
4. `AdminVaultFoldersPanel.tsx` - Folder list panel
5. `AdminVaultTagsPanel.tsx` - Tag list panel
6. `AdminVaultToolbar.tsx` - Search/filter toolbar

## API Endpoint
- GET `/api/vault` - returns folders, tags, classifications with real Prisma data

## i18n Namespace
Messages in `AdminVault` namespace in `src/messages/vi.json`

## Success Criteria
1. Admin Vault page renders with 4 stat cards showing real data
2. Folder panel shows real folders with file counts
3. Tag panel shows real tags with usage counts
4. File table shows real vault files with classification data
5. Search/filter toolbar works with debounced search
6. Page layout matches mock UI exactly
7. All components in `src/components/admin/`
