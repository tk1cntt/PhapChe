/**
 * Check and report duplicate data in database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicates() {
  console.log('=== Checking Database for Duplicates ===\n');

  // Check organizations
  const orgs = await prisma.organization.findMany({ select: { id: true, name: true } });
  const orgNameCount = new Map<string, number>();
  orgs.forEach(o => {
    const count = orgNameCount.get(o.name) || 0;
    orgNameCount.set(o.name, count + 1);
  });
  const duplicateOrgNames = Array.from(orgNameCount.entries()).filter(([_, count]) => count > 1);
  console.log(`Organizations: ${orgs.length} total`);
  if (duplicateOrgNames.length > 0) {
    console.log('Duplicate names:');
    duplicateOrgNames.forEach(([name, count]) => console.log(`  "${name}": ${count} times`));
  } else {
    console.log('No duplicate org names');
  }

  // Check workspaces
  const workspaces = await prisma.workspace.findMany({ select: { id: true, name: true } });
  const wsNameCount = new Map<string, number>();
  workspaces.forEach(w => {
    const count = wsNameCount.get(w.name) || 0;
    wsNameCount.set(w.name, count + 1);
  });
  const duplicateWsNames = Array.from(wsNameCount.entries()).filter(([_, count]) => count > 1);
  console.log(`\nWorkspaces: ${workspaces.length} total`);
  if (duplicateWsNames.length > 0) {
    console.log('Duplicate names:');
    duplicateWsNames.slice(0, 5).forEach(([name, count]) => console.log(`  "${name}": ${count} times`));
  } else {
    console.log('No duplicate workspace names');
  }

  // Check requests
  const requests = await prisma.legalRequest.findMany({ select: { id: true, code: true, title: true } });
  const reqCodeCount = new Map<string, number>();
  requests.forEach(r => {
    if (r.code) {
      const count = reqCodeCount.get(r.code) || 0;
      reqCodeCount.set(r.code, count + 1);
    }
  });
  const duplicateReqCodes = Array.from(reqCodeCount.entries()).filter(([_, count]) => count > 1);
  console.log(`\nLegal Requests: ${requests.length} total`);
  if (duplicateReqCodes.length > 0) {
    console.log('Duplicate codes:');
    duplicateReqCodes.slice(0, 10).forEach(([code, count]) => console.log(`  "${code}": ${count} times`));
  } else {
    console.log('No duplicate request codes');
  }

  // Check users
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } });
  const userEmailCount = new Map<string, number>();
  users.forEach(u => {
    const count = userEmailCount.get(u.email) || 0;
    userEmailCount.set(u.email, count + 1);
  });
  const duplicateEmails = Array.from(userEmailCount.entries()).filter(([_, count]) => count > 1);
  console.log(`\nUsers: ${users.length} total`);
  if (duplicateEmails.length > 0) {
    console.log('Duplicate emails:');
    duplicateEmails.slice(0, 5).forEach(([email, count]) => console.log(`  "${email}": ${count} times`));
  } else {
    console.log('No duplicate user emails');
  }

  // Check partners
  const partners = await prisma.partner.findMany({ select: { id: true, name: true } });
  const partnerNameCount = new Map<string, number>();
  partners.forEach(p => {
    const count = partnerNameCount.get(p.name) || 0;
    partnerNameCount.set(p.name, count + 1);
  });
  const duplicatePartnerNames = Array.from(partnerNameCount.entries()).filter(([_, count]) => count > 1);
  console.log(`\nPartners: ${partners.length} total`);
  if (duplicatePartnerNames.length > 0) {
    console.log('Duplicate names:');
    duplicatePartnerNames.forEach(([name, count]) => console.log(`  "${name}": ${count} times`));
  } else {
    console.log('No duplicate partner names');
  }

  console.log('\n=== Summary ===');
  console.log(`Duplicates: ${duplicateOrgNames.length + duplicateWsNames.length + duplicateReqCodes.length + duplicateEmails.length + duplicatePartnerNames.length}`);
}

checkDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
