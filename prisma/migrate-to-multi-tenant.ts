/**
 * Migration Script: Link workspaces to organizations
 *
 * This script migrates existing workspaces to the new multi-tenant model
 * by linking them to the default organization.
 *
 * Uses Prisma client - run 'npx prisma generate' first if models changed.
 *
 * Usage: npx tsx prisma/migrate-to-multi-tenant.ts
 */

import { prisma } from '../src/lib/prisma';

const PLATFORM_TENANT_ID = 'platform-tenant';
const DEFAULT_ORG_ID = 'platform-default-org';

async function up() {
  console.log('Starting migration: Link workspaces to organizations...\n');

  // 1. Verify platform tenant exists
  let tenant;
  try {
    tenant = await prisma.tenant.findUnique({
      where: { id: PLATFORM_TENANT_ID },
    });
  } catch (e) {
    console.error('ERROR: Cannot query tenants table. Run "npx prisma generate" first.');
    console.error('If Prisma client is outdated, restart the dev server to regenerate.');
    process.exit(1);
  }

  if (!tenant) {
    console.error(`ERROR: Platform tenant '${PLATFORM_TENANT_ID}' not found.`);
    console.error('Run seed first: npm run seed');
    process.exit(1);
  }
  console.log('✓ Platform tenant found:', tenant.name);

  // 2. Verify or create default organization
  let org;
  try {
    org = await prisma.organization.findUnique({
      where: { id: DEFAULT_ORG_ID },
    });
  } catch (e) {
    console.error('ERROR: Cannot query organizations table. Schema may be out of sync.');
    process.exit(1);
  }

  if (!org) {
    console.log('Creating default organization...');
    try {
      org = await prisma.organization.create({
        data: {
          id: DEFAULT_ORG_ID,
          tenantId: PLATFORM_TENANT_ID,
          name: 'Default Organization',
          businessType: 'platform_internal',
          status: 'active',
          isDefault: true,
        },
      });
      console.log('✓ Default organization created:', org.id);
    } catch (e) {
      console.error('ERROR: Cannot create organization. Check database schema.');
      process.exit(1);
    }
  } else {
    console.log('✓ Default organization found:', org.name);
  }

  // 3. Count workspaces before migration
  const workspacesBefore = await prisma.workspace.count();
  const unlinkedBefore = await prisma.workspace.count({
    where: { organizationId: null },
  });
  console.log(`\nBefore migration:`);
  console.log(`  Total workspaces: ${workspacesBefore}`);
  console.log(`  Unlinked workspaces: ${unlinkedBefore}`);

  // 4. Link unlinked workspaces to default organization
  const result = await prisma.workspace.updateMany({
    where: { organizationId: null },
    data: { organizationId: DEFAULT_ORG_ID },
  });
  console.log(`\n✓ Linked ${result.count} workspaces to organization '${org.name}'`);

  // 5. Verify migration
  const workspacesAfter = await prisma.workspace.count();
  const unlinkedAfter = await prisma.workspace.count({
    where: { organizationId: null },
  });
  console.log(`\nAfter migration:`);
  console.log(`  Total workspaces: ${workspacesAfter}`);
  console.log(`  Unlinked workspaces: ${unlinkedAfter}`);

  // 6. Validate counts
  if (unlinkedAfter !== 0) {
    console.error('\n⚠ WARNING: Some workspaces are still unlinked!');
  } else {
    console.log('\n✓ All workspaces successfully linked to organization');
  }

  console.log('\n✅ Migration completed successfully!');
}

async function down() {
  console.log('Rolling back migration: Unlinking workspaces from organizations...\n');

  // Unlink all workspaces
  const result = await prisma.workspace.updateMany({
    where: { organizationId: DEFAULT_ORG_ID },
    data: { organizationId: null },
  });
  console.log(`✓ Unlinked ${result.count} workspaces`);

  console.log('\n✅ Rollback completed!');
}

async function status() {
  console.log('Migration status:\n');

  let tenantCount = 0;
  let orgCount = 0;
  let totalWorkspaces = 0;
  let linkedWorkspaces = 0;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: PLATFORM_TENANT_ID },
    });
    tenantCount = tenant ? 1 : 0;
  } catch (e) {
    // Table might not exist
  }

  try {
    const org = await prisma.organization.findUnique({
      where: { id: DEFAULT_ORG_ID },
    });
    orgCount = org ? 1 : 0;
  } catch (e) {
    // Table might not exist
  }

  try {
    totalWorkspaces = await prisma.workspace.count();
    linkedWorkspaces = await prisma.workspace.count({
      where: { organizationId: { not: null } },
    });
  } catch (e) {
    // Table might not exist
  }

  console.log(`Platform tenant: ${tenantCount ? '✓ Found' : '✗ Not found'} (${PLATFORM_TENANT_ID})`);
  console.log(`Default organization: ${orgCount ? '✓ Found' : '✗ Not found'} (${DEFAULT_ORG_ID})`);

  console.log(`\nWorkspaces:`);
  console.log(`  Total: ${totalWorkspaces}`);
  console.log(`  Linked: ${linkedWorkspaces}`);
  console.log(`  Unlinked: ${totalWorkspaces - linkedWorkspaces}`);
}

// Main
const command = process.argv[2] || 'up';

switch (command) {
  case 'up':
    up().catch(console.error);
    break;
  case 'down':
    down().catch(console.error);
    break;
  case 'status':
    status().catch(console.error);
    break;
  default:
    console.log('Usage: npx tsx prisma/migrate-to-multi-tenant.ts [up|down|status]');
}
