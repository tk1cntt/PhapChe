/**
 * Partner Data Seed Script
 * Seeds: Partner Members, Engagements, Service Scopes, Legal Requests assigned to partners
 * Data matches the mock UI in layout/admin-partner-activity.html
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
  let organizations = await prisma.organization.findMany({
    where: { status: 'active' },
    take: 10,
  });

  // Create organizations matching mock UI
  const sampleOrgs = [
    { name: 'Green Agriculture JSC', businessType: 'Agriculture', address: '123 Dien Bien Phu, Ba Dinh, Hanoi' },
    { name: 'Cong Ty An Phat', businessType: 'Manufacturing', address: '456 Nguyen Trai, Thanh Xuan, Hanoi' },
    { name: 'Nam Viet Foods', businessType: 'Food & Beverage', address: '789 Le Lai, District 1, HCMC' },
    { name: 'Minh Khang Trading', businessType: 'Trading', address: '321 Tran Hung Dao, District 5, HCMC' },
    { name: 'Tech Solutions Corp', businessType: 'Technology', address: '555 Nguyen Hue, District 1, HCMC' },
    { name: 'Global Services JSC', businessType: 'Services', address: '888 Dong Khoi, District 1, HCMC' },
  ];

  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.log('  No tenant found, skipping organization creation');
    return { organizations: [] };
  }

  // Create or get organizations
  for (const org of sampleOrgs) {
    let existing = organizations.find(o => o.name === org.name);
    if (!existing) {
      existing = await prisma.organization.upsert({
        where: { id: `org-${org.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}` },
        update: {},
        create: {
          id: `org-${org.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}`,
          tenantId: tenant.id,
          name: org.name,
          businessType: org.businessType,
          address: org.address,
          status: 'active',
        },
      });
      console.log(`  Created org: ${org.name}`);
    }
  }

  organizations = await prisma.organization.findMany({
    where: { status: 'active' },
    take: 10,
  });

  // Get service types
  const serviceTypes = await prisma.serviceType.findMany({ where: { isActive: true } });

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
          startDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
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
    console.log('  Creating sample customer user...');
    await ensureUser('customer@demo.test', 'Customer Demo User');
  }

  const requestsData = [
    // REQ-2026-088 - SLA Risk (matching mock UI)
    {
      code: 'REQ-2026-088',
      title: 'GREENFARM ORGANIC',
      matterType: 'trademark_registration',
      status: 'in_progress',
      priority: 'high',
      slaHours: 17,
      orgName: 'Green Agriculture JSC',
      workspaceName: 'Demo Legal Workspace',
    },
    // REQ-2026-083 - Pending Review
    {
      code: 'REQ-2026-083',
      title: 'Hop dong phan phoi',
      matterType: 'contract_review',
      status: 'pending_review',
      priority: 'high',
      slaHours: 48,
      orgName: 'Cong Ty An Phat',
      workspaceName: 'an-phat workspace',
    },
    // REQ-2026-071 - In Progress with SLA risk
    {
      code: 'REQ-2026-071',
      title: 'Tu van nganh nghe',
      matterType: 'corporate_advisory',
      status: 'in_progress',
      priority: 'medium',
      slaHours: 8,
      orgName: 'Nam Viet Foods',
      workspaceName: 'nam-viet workspace',
    },
    // REQ-2026-064 - Completed
    {
      code: 'REQ-2026-064',
      title: 'NDA vendor logistics',
      matterType: 'contract_review',
      status: 'delivered',
      priority: 'medium',
      slaHours: 72,
      orgName: 'Minh Khang Trading',
      workspaceName: 'minh-khang workspace',
    },
    // Additional requests for variety
    {
      code: 'REQ-2026-055',
      title: 'Dang ky nhan hieu moi',
      matterType: 'trademark_registration',
      status: 'in_progress',
      priority: 'high',
      slaHours: 36,
      orgName: 'Green Agriculture JSC',
      workspaceName: 'green-ip workspace',
    },
    {
      code: 'REQ-2026-048',
      title: 'Hop dong lao dong',
      matterType: 'labor_contract',
      status: 'assigned',
      priority: 'medium',
      slaHours: 24,
      orgName: 'Tech Solutions Corp',
      workspaceName: 'tech-solutions workspace',
    },
  ];

  let requestCount = 0;
  for (const partner of partners) {
    if (partner.engagements.length === 0) continue;

    // Create requests with specific data first
    for (let i = 0; i < Math.min(requestsData.length, partner.engagements.length * 2); i++) {
      const reqData = requestsData[i % requestsData.length];

      // Find matching organization
      const engagement = partner.engagements.find(e => e.organization?.name === reqData.orgName)
        || partner.engagements[0];

      if (!engagement) continue;

      // Get workspace from organization
      const org = await prisma.organization.findUnique({
        where: { id: engagement.organizationId },
        include: { workspaces: { take: 1 } },
      });

      const workspace = org?.workspaces[0] || await prisma.workspace.findFirst({ where: { organizationId: org.id } });
      if (!workspace) continue;

      const request = await prisma.legalRequest.upsert({
        where: { id: `partner-req-${partner.slug}-${String(i + 1).padStart(2, '0')}` },
        update: {
          code: reqData.code,
          workspaceId: workspace.id,
          title: reqData.title,
          matterType: reqData.matterType,
          status: reqData.status,
          priority: reqData.priority,
          slaDeadline: new Date(Date.now() + reqData.slaHours * 60 * 60 * 1000),
          assignedPartnerId: partner.id,
          engagementId: engagement.id,
        },
        create: {
          id: `partner-req-${partner.slug}-${String(i + 1).padStart(2, '0')}`,
          code: reqData.code,
          workspaceId: workspace.id,
          title: reqData.title,
          matterType: reqData.matterType,
          status: reqData.status,
          priority: reqData.priority,
          slaDeadline: new Date(Date.now() + reqData.slaHours * 60 * 60 * 1000),
          createdById: customerUser?.id || (await prisma.user.findFirst())?.id,
          assignedPartnerId: partner.id,
          engagementId: engagement.id,
        },
      });

      requestCount++;
    }
    console.log(`  ✓ ${partner.name}: ${Math.min(requestsData.length, partner.engagements.length * 2)} requests`);
  }

  console.log(`  Total requests created: ${requestCount}`);
}

async function seedAuditEvents() {
  console.log('Seeding audit events for partner activities...');

  const partners = await prisma.partner.findMany();
  const requests = await prisma.legalRequest.findMany({
    where: { assignedPartnerId: { not: null } },
    take: 20,
    include: { workspace: true, engagement: { include: { organization: true } } },
  });

  if (requests.length === 0) {
    console.log('  No requests with partners found, skipping audit events');
    return;
  }

  const adminUser = await prisma.user.findFirst({
    where: { email: { contains: 'admin' } },
  });

  // Audit events matching mock UI
  const auditEventsData = [
    {
      action: 'SLA risk: Request approaching deadline',
      targetType: 'request',
      hoursAgo: 0.25, // 14 minutes
      requestCode: 'REQ-2026-088',
      requestTitle: 'GREENFARM ORGANIC',
      orgName: 'Green Agriculture JSC',
      workspaceName: 'Demo Legal Workspace',
      extra: 'Partner chua phan hoi yeu cau xac nhan nhom Nice',
    },
    {
      action: 'Partner upload document',
      targetType: 'vault_file',
      hoursAgo: 1,
      requestCode: 'REQ-2026-088',
      requestTitle: 'GREENFARM ORGANIC',
      docName: 'ket-qua-tra-cuu-so-bo.pdf',
      docSize: '2.1 MB',
      docType: 'Uploaded',
    },
    {
      action: 'Partner user commented',
      targetType: 'request',
      hoursAgo: 2,
      requestCode: 'REQ-2026-088',
      requestTitle: 'GREENFARM ORGANIC',
      userName: 'Le Thu Ha',
      orgName: 'Green Agriculture JSC',
      extra: 'Yeu cau khach hang xac nhan danh muc san pham',
    },
    {
      action: 'Request status changed to pending_review',
      targetType: 'request',
      hoursAgo: 4,
      requestCode: 'REQ-2026-083',
      requestTitle: 'Hop dong phan phoi',
      orgName: 'Cong Ty An Phat',
      workspaceName: 'an-phat workspace',
      extra: 'Ra soat hop dong phan phoi da hoan thanh',
    },
    {
      action: 'Partner added to workspace',
      targetType: 'workspace',
      hoursAgo: 24, // Yesterday
      orgName: 'Nam Viet Foods',
      workspaceName: 'nam-viet workspace',
      extra: 'Coordinator Admin cap quyen xem ho so',
    },
  ];

  let eventCount = 0;
  for (const eventData of auditEventsData) {
    const request = requests.find(r => r.code === eventData.requestCode) || requests[0];

    await prisma.auditEvent.create({
      data: {
        actorId: adminUser?.id,
        workspaceId: request?.workspaceId,
        action: eventData.action,
        targetType: eventData.targetType,
        targetId: eventData.targetType === 'request' ? request?.id : `doc-${eventData.docName}`,
        requestId: request?.id,
        metadataSummary: JSON.stringify({
          extra: eventData.extra || eventData.action,
          requestCode: eventData.requestCode,
          requestTitle: eventData.requestTitle,
          orgName: eventData.orgName,
          workspaceName: eventData.workspaceName,
          userName: eventData.userName,
          docName: eventData.docName,
          docSize: eventData.docSize,
          docType: eventData.docType,
        }),
        createdAt: new Date(Date.now() - eventData.hoursAgo * 60 * 60 * 1000),
      },
    });
    eventCount++;
  }

  console.log(`  ✓ Created ${eventCount} audit events`);
}

async function seedUsers() {
  console.log('Seeding additional users matching mock UI...');

  // Users from mock UI
  const users = [
    { email: 'le.thu.ha@partner.test', name: 'Le Thu Ha', type: 'partner' },
    { email: 'minh.trang@admin.test', name: 'Minh Trang', type: 'admin' },
    { email: 'mai.phuong@customer.test', name: 'Mai Phuong', type: 'customer' },
    { email: 'hai.nam@customer.test', name: 'Hai Nam', type: 'customer' },
    { email: 'van.trang@customer.test', name: 'Van Trang', type: 'customer' },
    { email: 'quang.dung@customer.test', name: 'Quang Dung', type: 'customer' },
    { email: 'linh.anh@customer.test', name: 'Linh Anh', type: 'customer' },
  ];

  for (const userData of users) {
    await ensureUser(userData.email, userData.name);
  }

  console.log(`  ✓ Created ${users.length} users`);
}

async function main() {
  console.log('');
  console.log('=== Partner Data Seed (Mock UI Compatible) ===');
  console.log('');

  // 1. Seed additional users
  await seedUsers();

  // 2. Seed partner members
  await seedPartnerMembers();

  // 3. Seed engagements with organizations
  await seedEngagements();

  // 4. Seed legal requests assigned to partners
  await seedPartnerRequests();

  // 5. Seed audit events
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
  const orgCount = await prisma.organization.count();

  console.log('Summary:');
  console.log(`  Partners: ${partnerCount}`);
  console.log(`  Organizations: ${orgCount}`);
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
