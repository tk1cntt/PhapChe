import { PrismaClient } from '@prisma/client';
import seedFoundation from './foundation';
import seedPartners from './partners';
import seedOperations from './operations';

/**
 * Wipe all data and seed fresh data in a transaction.
 * If any operation fails, the entire transaction rolls back.
 */
export async function seedAll(prisma: PrismaClient) {
  await prisma.$transaction(async (tx) => {
    console.log('Wiping existing data...');

    // Wipe in reverse dependency order
    await tx.message.deleteMany();
    await tx.vaultFile.deleteMany();
    await tx.auditEvent.deleteMany();
    await tx.legalRequest.deleteMany();
    await tx.workspaceMembership.deleteMany();
    await tx.workspace.deleteMany();
    await tx.account.deleteMany();
    await tx.user.deleteMany();
    await tx.organization.deleteMany();
    await tx.tenant.deleteMany();

    console.log('✓ Data wiped\n');

    // Seed fresh data
    const foundation = await seedFoundation(tx);
    const partners = await seedPartners(tx);
    const operations = await seedOperations(tx, foundation);

    console.log('\n📊 Seed summary:');
    console.log(`  - Tenant: ${foundation.counts.tenants}`);
    console.log(`  - Organizations: ${foundation.counts.organizations}`);
    console.log(`  - Users: ${foundation.counts.users}`);
    console.log(`  - Workspaces: ${foundation.counts.workspaces}`);
    console.log(`  - Workspace memberships: ${foundation.counts.workspaceMemberships}`);
    console.log(`  - Partners: ${partners.counts.partners}`);
    console.log(`  - Service types: ${partners.counts.serviceTypes}`);
    console.log(`  - Legal requests: ${operations.counts.legalRequests}`);
    console.log(`  - Audit events: ${operations.counts.auditEvents}`);
    console.log(`  - Vault files: ${operations.counts.vaultFiles}`);
    console.log(`  - Messages: ${operations.counts.messages}`);
  });
}
