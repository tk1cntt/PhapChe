/**
 * Partner Data Seed Script
 * Seeds: Partner Members, Engagements, Service Scopes, Legal Requests assigned to partners
 */

import { prisma } from '../src/lib/prisma';

async function ensureUser(email: string, name: string) {
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name,
        emailVerified: true,
      },
    });
    console.log(`  Created user: ${email}`);
  }
  return user;
}

async function seedPartnerMembers() {
  console.log('Seeding partner members...');

  // Get existing partners
  const partners = await prisma.partner.findMany();

  // Create team members for each partner
  const teamMembers = [
    { email: 'lawyer.tran@demo.test', name: 'Tran Van Lawyer', role: 'partner_admin' },
    { email: 'lawyer.nguyen@demo.test', name: 'Nguyen Van Lawyer', role: 'specialist' },
    { email: 'associate.ho@demo.test', name: 'Ho Thi Associate', role: 'specialist' },
    { email: 'paralegal.le@demo.test', name: 'Le Van Paralegal', role: 'paralegal' },
  ];

  for (const partner of partners) {
    for (const member of teamMembers) {
      const user = await ensureUser(member.email.replace('@demo.test', `.${partner.slug.replace('-', '')}@demo.test`),
        `${member.name} - ${partner.name}`);

      await prisma.partnerMember.upsert({
        where: {
          partnerId_userId: { partnerId: partner.id, userId: user.id },
        },
        update: { isActive: true },
        create: {
          partnerId: partner.id,
          userId: user.id,
          role: member.role,
          isActive: true,
        },
      });
    }
    console.log(`  ✓ Added ${teamMembers.length} members to ${partner.name}`);
  }

  return { partners };
}

async function seedEngagements() {
  console.log('Seeding engagements...');

  // Get existing partners and organizations
  const partners = await prisma.partner.findMany();
  const organizations = await prisma.organization.findMany({
    where: { status: 'active' },
    take: 10,
  });

  // Get service types
  const serviceTypes = await prisma.serviceType.findMany({ where: { isActive: true } });

  if (organizations.length === 0) {
    console.log('  No organizations found, creating sample ones...');

    // Create sample organizations
    const sampleOrgs = [
      { name: 'Cong Ty TNHH Tech Solutions', businessType: 'Technology', address: '123 Nguyen Hue, District 1, HCMC' },
      { name: 'Cong Ty CP ABC Group', businessType: 'Manufacturing', address: '456 Le Duan, District 3, HCMC' },
      { name: 'Cong Ty TNHH XYZ Trading', businessType: 'Trading', address: '789 Dien Bien Phu, Binh Thanh, HCMC' },
      { name: 'Cong Ty TNHH ABC Food', businessType: 'Food & Beverage', address: '321 Vo Thi Sau, District 3, HCMC' },
      { name: 'Cong Ty CP Global Services', businessType: 'Services', address: '654 Cach Mang Thang Tam, District 10, HCMC' },
    ];

    for (const org of sampleOrgs) {
      const tenant = await prisma.tenant.findFirst();
      if (tenant) {
        const created = await prisma.organization.create({
          data: {
            tenantId: tenant.id,
            name: org.name,
            businessType: org.businessType,
            address: org.address,
            status: 'active',
          },
        });
        organizations.push(created);
        console.log(`  Created org: ${org.name}`);
      }
    }
  }

  // Create engagements for each partner with organizations
  let engagementCount = 0;
  for (const partner of partners) {
    // Each partner serves 2-4 organizations
    const orgCount = Math.min(Math.floor(Math.random() * 3) + 2, organizations.length);
    const selectedOrgs = organizations.slice(0, orgCount);

    for (const org of selectedOrgs) {
      const engagement = await prisma.engagement.upsert({
        where: {
          partnerId_organizationId: { partnerId: partner.id, organizationId: org.id },
        },
        update: { status: 'active' },
        create: {
          partnerId: partner.id,
          organizationId: org.id,
          status: 'active',
          startDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date in past year
        },
      });

      // Add service scopes to engagement
      const scopeCount = Math.min(Math.floor(Math.random() * 3) + 1, serviceTypes.length);
      const selectedServices = serviceTypes.slice(0, scopeCount);

      for (const serviceType of selectedServices) {
        await prisma.engagementServiceScope.upsert({
          where: {
            engagementId_serviceTypeId: { engagementId: engagement.id, serviceTypeId: serviceType.id },
          },
          update: {},
          create: {
            engagementId: engagement.id,
            serviceTypeId: serviceType.id,
            permissionLevel: 'service_wide',
          },
        });
      }

      engagementCount++;
    }
    console.log(`  ✓ ${partner.name}: ${selectedOrgs.length} engagements`);
  }

  console.log(`  Total engagements: ${engagementCount}`);
  return { organizations };
}

async function seedPartnerRequests() {
  console.log('Seeding legal requests assigned to partners...');

  const partners = await prisma.partner.findMany({ include: { engagements: true } });

  // Get some users for createdBy
  const customerUser = await prisma.user.findFirst({ where: { email: { contains: 'customer' } } });
  if (!customerUser) {
    console.log('  No customer user found, skipping request creation');
    return;
  }

  const requestTemplates = [
    { title: 'Review Labor Contract', matterType: 'labor_contract', priority: 'high' },
    { title: 'Trademark Registration Application', matterType: 'trademark_registration', priority: 'medium' },
    { title: 'Company Formation Documents', matterType: 'company_formation', priority: 'high' },
    { title: 'Compliance Audit Request', matterType: 'compliance_review', priority: 'low' },
    { title: 'Contract Negotiation Support', matterType: 'contract_negotiation', priority: 'medium' },
    { title: 'Employment Policy Review', matterType: 'labor_contract', priority: 'medium' },
    { title: 'NDA Review and Execution', matterType: 'contract_negotiation', priority: 'high' },
    { title: 'Business License Renewal', matterType: 'company_formation', priority: 'low' },
  ];

  const statuses = ['assigned', 'in_progress', 'pending_review', 'approved', 'delivered'];

  let requestCount = 0;
  for (const partner of partners) {
    if (partner.engagements.length === 0) continue;

    // Each partner gets 3-6 requests
    const requestCountForPartner = Math.floor(Math.random() * 4) + 3;

    for (let i = 0; i < requestCountForPartner; i++) {
      const template = requestTemplates[i % requestTemplates.length];
      const engagement = partner.engagements[Math.floor(Math.random() * partner.engagements.length)];

      // Get workspace from organization
      const org = await prisma.organization.findUnique({
        where: { id: engagement.organizationId },
        include: { workspaces: { take: 1 } },
      });

      const workspace = org?.workspaces[0];
      if (!workspace) continue;

      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const slaDays = Math.floor(Math.random() * 14) + 1;

      const request = await prisma.legalRequest.upsert({
        where: { id: `partner-req-${partner.slug}-${String(i + 1).padStart(2, '0')}` },
        update: {
          assignedPartnerId: partner.id,
          engagementId: engagement.id,
          status,
          priority: template.priority,
        },
        create: {
          id: `partner-req-${partner.slug}-${String(i + 1).padStart(2, '0')}`,
          workspaceId: workspace.id,
          title: template.title,
          matterType: template.matterType,
          status,
          priority: template.priority,
          slaDeadline: new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000),
          createdById: customerUser.id,
          assignedPartnerId: partner.id,
          engagementId: engagement.id,
        },
      });

      requestCount++;
    }
    console.log(`  ✓ ${partner.name}: ${requestCountForPartner} requests`);
  }

  console.log(`  Total requests created: ${requestCount}`);
}

async function seedAuditEvents() {
  console.log('Seeding audit events for partner activities...');

  const partners = await prisma.partner.findMany();
  const requests = await prisma.legalRequest.findMany({
    where: { assignedPartnerId: { not: null } },
    take: 20,
    include: { workspace: true },
  });

  if (requests.length === 0) {
    console.log('  No requests with partners found, skipping audit events');
    return;
  }

  const adminUser = await prisma.user.findFirst({
    where: { email: { contains: 'admin' } },
  });

  const actions = [
    'Request assigned to partner',
    'Request status changed to in_progress',
    'Document uploaded',
    'Review requested',
    'Request approved',
    'SLA warning triggered',
    'Comment added',
    'Document delivered to customer',
  ];

  let eventCount = 0;
  for (const request of requests) {
    // Create 2-4 audit events per request
    const eventCountForRequest = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < eventCountForRequest; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const hoursAgo = Math.floor(Math.random() * 72); // Within last 72 hours

      await prisma.auditEvent.create({
        data: {
          actorId: adminUser?.id,
          workspaceId: request.workspaceId,
          action,
          targetType: 'request',
          targetId: request.id,
          requestId: request.id,
          metadataSummary: JSON.stringify({
            extra: `${action} - ${request.title}`,
            requestCode: request.code,
          }),
          createdAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
        },
      });
      eventCount++;
    }
  }

  console.log(`  ✓ Created ${eventCount} audit events`);
}

async function main() {
  console.log('');
  console.log('=== Partner Data Seed ===');
  console.log('');

  // 1. Seed partner members
  await seedPartnerMembers();

  // 2. Seed engagements
  await seedEngagements();

  // 3. Seed legal requests assigned to partners
  await seedPartnerRequests();

  // 4. Seed audit events
  await seedAuditEvents();

  console.log('');
  console.log('=== Partner Data Seed Complete ===');
  console.log('');

  // Summary
  const partnerCount = await prisma.partner.count();
  const memberCount = await prisma.partnerMember.count();
  const engagementCount = await prisma.engagement.count();
  const scopeCount = await prisma.engagementServiceScope.count();
  const requestCount = await prisma.legalRequest.count({ where: { assignedPartnerId: { not: null } } });
  const auditCount = await prisma.auditEvent.count();

  console.log('Summary:');
  console.log(`  Partners: ${partnerCount}`);
  console.log(`  Partner Members: ${memberCount}`);
  console.log(`  Engagements: ${engagementCount}`);
  console.log(`  Service Scopes: ${scopeCount}`);
  console.log(`  Partner Requests: ${requestCount}`);
  console.log(`  Audit Events: ${auditCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
