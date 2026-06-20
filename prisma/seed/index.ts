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

    // Wipe in reverse dependency order (child tables before parent tables)
    await tx.reviewChecklistAnswer.deleteMany();
    await tx.documentVersion.deleteMany();
    await tx.fileAccessLog.deleteMany();
    await tx.fileVersion.deleteMany();
    await tx.review.deleteMany();
    await tx.workflowTransition.deleteMany();
    await tx.requestAssignment.deleteMany();
    await tx.intakeSubmission.deleteMany();
    await tx.vaultFileFolder.deleteMany();
    await tx.vaultFileTag.deleteMany();
    await tx.message.deleteMany();
    await tx.auditEvent.deleteMany();
    await tx.vaultFile.deleteMany();
    await tx.file.deleteMany();
    await tx.document.deleteMany();
    await tx.legalRequest.deleteMany();
    await tx.routingCapability.deleteMany();
    await tx.matterType.deleteMany();
    await tx.engagementServiceScope.deleteMany();
    await tx.engagement.deleteMany();
    await tx.workspaceMembership.deleteMany();
    await tx.documentTemplate.deleteMany();
    await tx.folder.deleteMany();
    await tx.tag.deleteMany();
    await tx.workspace.deleteMany();
    await tx.partnerInvite.deleteMany();
    await tx.partnerMember.deleteMany();
    await tx.partner.deleteMany();
    await tx.serviceType.deleteMany();
    await tx.account.deleteMany();
    await tx.session.deleteMany();
    await tx.verification.deleteMany();
    await tx.userPreferences.deleteMany();
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
    console.log(`  - Workspace memberships: ${foundation.counts.memberships}`);
    console.log(`  - Partners: ${partners.counts.partners}`);
    console.log(`  - Service types: ${partners.counts.serviceTypes}`);
    console.log(`  - Legal requests: ${operations.counts.requests}`);
    console.log(`  - Audit events: ${operations.counts.auditEvents}`);
    console.log(`  - Vault files: ${operations.counts.vaultFiles}`);
    console.log(`  - Messages: ${operations.counts.messages}`);
  });
}
