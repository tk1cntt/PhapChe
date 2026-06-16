/**
 * Organization Activity Data Seed Script
 * Seeds data matching the org activity dashboard mock UI
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const process: {
  exit: (code: number) => never;
  on: (event: string, handler: () => void) => void;
};

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

async function ensureOrganization(name: string, data: any) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-');
  let org = await prisma.organization.findFirst({ where: { name } });
  if (!org) {
    const tenant = await prisma.tenant.findFirst();
    org = await prisma.organization.create({
      data: {
        id: `org-${slug}`,
        tenantId: tenant?.id || 'default',
        name,
        ...data,
      },
    });
    console.log(`  Created org: ${name}`);
  }
  return org;
}

async function ensureWorkspace(orgId: string, name: string, description: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-');
  let ws = await prisma.workspace.findFirst({ where: { organizationId: orgId, name } });
  if (!ws) {
    ws = await prisma.workspace.create({
      data: {
        id: `ws-${slug}`,
        organizationId: orgId,
        name,
        slug: name,
        isActive: true,
      },
    });
    console.log(`  Created workspace: ${name}`);
  }
  return ws;
}

async function seedOrganization() {
  console.log('Seeding organization (Minh Khang Corp)...');

  const org = await ensureOrganization('Minh Khang Corp', {
    businessType: 'Manufacturing',
    address: '123 Nguyen Trai, District 1, HCMC',
    registrationNumber: '0123456789',
    status: 'active',
  });

  // Create workspaces matching mock UI
  const workspaces = [
    {
      name: 'Demo Legal Workspace',
      description: 'Workspace chính cho nhãn hiệu, hợp đồng phân phối và hồ sơ compliance.',
    },
    {
      name: 'Green IP Workspace',
      description: 'Quản lý nhãn hiệu, mẫu logo, giấy ủy quyền và phản hồi từ partner IP.',
    },
    {
      name: 'Contract Workspace',
      description: 'Rà soát hợp đồng phân phối, hợp đồng vendor và NDA.',
    },
    {
      name: 'Tax Compliance Workspace',
      description: 'Hồ sơ thuế GTGT, báo cáo tài chính và tuân thủ pháp luật.',
    },
  ];

  const createdWorkspaces = [];
  for (const ws of workspaces) {
    const workspace = await ensureWorkspace(org.id, ws.name, ws.description);
    createdWorkspaces.push(workspace);
  }

  console.log(`  ✓ Created ${workspaces.length} workspaces`);
  return { org, workspaces: createdWorkspaces };
}

async function seedUsers() {
  console.log('Seeding users matching mock UI...');

  const users = [
    { email: 'mai.phuong@minhkhang.test', name: 'Mai Phương', role: 'owner' },
    { email: 'minh.trang@minhkhang.test', name: 'Minh Trang', role: 'owner' },
    { email: 'le.thu.ha@minhkhang.test', name: 'Lê Thu Hà', role: 'reviewer' },
    { email: 'khanh.linh@minhkhang.test', name: 'Khánh Linh', role: 'specialist' },
    { email: 'hai.nam@minhkhang.test', name: 'Hải Nam', role: 'customer' },
    { email: 'quang.dung@minhkhang.test', name: 'Quang Dũng', role: 'customer' },
  ];

  const createdUsers = [];
  for (const u of users) {
    const user = await ensureUser(u.email, u.name);
    createdUsers.push({ ...user, role: u.role });
  }

  console.log(`  ✓ Created ${users.length} users`);
  return createdUsers;
}

async function seedWorkspaceMemberships(workspaces: any[], users: any[]) {
  console.log('Seeding workspace memberships...');

  for (const ws of workspaces) {
    for (let i = 0; i < Math.min(4, users.length); i++) {
      const user = users[i];
      await prisma.workspaceMembership.create({
        data: {
          userId: user.id,
          workspaceId: ws.id,
          role: user.role,
          isActive: true,
        },
      }).catch(() => {}); // Ignore if exists
    }
  }

  console.log(`  ✓ Added memberships for ${workspaces.length} workspaces`);
}

async function seedLegalRequests(workspaces: any[], users: any[]) {
  console.log('Seeding legal requests matching mock UI...');

  const requestsData = [
    {
      code: 'REQ-2026-088',
      title: 'GREENFARM ORGANIC',
      matterType: 'trademark',
      status: 'in_progress',
      priority: 'high',
      workspaceIndex: 0,
      creatorIndex: 0,
      slaHours: 17,
      partners: ['Tư Vấn Pháp Lý Miền Bắc'],
      relatedUsers: ['Mai Phương', 'Minh Trang', 'Lê Thu Hà'],
    },
    {
      code: 'REQ-2026-079',
      title: 'Rà soát thuế GTGT',
      matterType: 'tax',
      status: 'in_progress',
      priority: 'medium',
      workspaceIndex: 3,
      creatorIndex: 3,
      slaHours: 48,
      partners: ['Tax Advisory Vietnam'],
      relatedUsers: ['Khánh Linh', 'Hải Nam'],
    },
    {
      code: 'REQ-2026-072',
      title: 'Hợp đồng phân phối miền Bắc',
      matterType: 'contract',
      status: 'pending_review',
      priority: 'high',
      workspaceIndex: 2,
      creatorIndex: 0,
      slaHours: 72,
      partners: ['Internal Legal Team'],
      relatedUsers: ['Mai Phương', 'Quang Dũng'],
    },
    {
      code: 'REQ-2026-065',
      title: 'Đăng ký nhãn hiệu GREENFARM',
      matterType: 'trademark',
      status: 'assigned',
      priority: 'high',
      workspaceIndex: 0,
      creatorIndex: 1,
      slaHours: 36,
      partners: ['Tư Vấn Pháp Lý Miền Bắc'],
      relatedUsers: ['Minh Trang', 'Lê Thu Hà'],
    },
    {
      code: 'REQ-2026-058',
      title: 'Hợp đồng lao động mới',
      matterType: 'labor',
      status: 'in_progress',
      priority: 'medium',
      workspaceIndex: 2,
      creatorIndex: 2,
      slaHours: 24,
      partners: ['Internal Legal Team'],
      relatedUsers: ['Lê Thu Hà', 'Khánh Linh'],
    },
    {
      code: 'REQ-2026-051',
      title: 'NDA với đối tác Singapore',
      matterType: 'contract',
      status: 'approved',
      priority: 'low',
      workspaceIndex: 2,
      creatorIndex: 0,
      slaHours: 96,
      partners: [],
      relatedUsers: ['Mai Phương'],
    },
  ];

  const partners = await prisma.partner.findMany({ take: 5 });

  for (const reqData of requestsData) {
    const workspace = workspaces[reqData.workspaceIndex];
    if (!workspace) continue;

    const creator = users[reqData.creatorIndex];
    const slaDeadline = new Date(Date.now() + reqData.slaHours * 60 * 60 * 1000);

    await prisma.legalRequest.upsert({
      where: { id: `req-${reqData.code.toLowerCase()}` },
      update: {
        code: reqData.code,
        workspaceId: workspace.id,
        title: reqData.title,
        matterType: reqData.matterType,
        status: reqData.status,
        priority: reqData.priority,
        slaDeadline,
        createdById: creator?.id,
      },
      create: {
        id: `req-${reqData.code.toLowerCase()}`,
        code: reqData.code,
        workspaceId: workspace.id,
        title: reqData.title,
        matterType: reqData.matterType,
        status: reqData.status,
        priority: reqData.priority,
        slaDeadline,
        createdById: creator?.id || users[0].id,
      },
    });

    // Add request assignments
    for (let i = 0; i < reqData.relatedUsers.slice(0, 3).length; i++) {
      const userName = reqData.relatedUsers[i];
      const user = users.find(u => u.name === userName);
      if (user) {
        const requestId = reqData.code.toLowerCase().replace('req-', '');
        await prisma.requestAssignment.create({
          data: {
            id: `assign-${requestId}-${i}`,
            requestId: `req-${requestId}`,
            userId: user.id,
            kind: user.role === 'specialist' ? 'specialist' : 'reviewer',
            createdById: creator?.id || users[0].id,
          },
        }).catch(() => {}); // Ignore if already exists
      }
    }
  }

  console.log(`  ✓ Created ${requestsData.length} legal requests`);
}

async function seedAuditEvents(workspaces: any[], users: any[]) {
  console.log('Seeding audit events matching mock UI...');

  // Get workspace IDs by name
  const wsByName = new Map(workspaces.map(w => [w.name, w]));

  const adminUser = users.find(u => u.role === 'owner');

  const auditEvents = [
    {
      action: 'SLA risk: Request approaching deadline',
      targetType: 'request',
      hoursAgo: 0.25,
      requestCode: 'REQ-2026-088',
      requestTitle: 'GREENFARM ORGANIC',
      extra: 'Partner chưa phản hồi yêu cầu xác nhận nhóm Nice cho hồ sơ đăng ký nhãn hiệu GREENFARM ORGANIC.',
      orgName: 'Minh Khang Corp',
      workspaceName: 'Demo Legal Workspace',
      userName: 'Lê Thu Hà',
      partnerName: 'Tư Vấn Pháp Lý Miền Bắc',
    },
    {
      action: 'document.uploaded',
      targetType: 'vault_file',
      hoursAgo: 1,
      requestCode: 'REQ-2026-088',
      requestTitle: 'GREENFARM ORGANIC',
      extra: 'Tài liệu được gắn vào hồ sơ REQ-2026-088 và chia sẻ cho Coordinator Admin review.',
      docName: 'ket-qua-tra-cuu-so-bo.pdf',
      docSize: '2.1 MB',
      docType: 'Uploaded',
    },
    {
      action: 'User commented on request',
      targetType: 'request',
      hoursAgo: 2,
      requestCode: 'REQ-2026-088',
      requestTitle: 'GREENFARM ORGANIC',
      extra: 'Yêu cầu khách hàng xác nhận danh mục sản phẩm: rau hữu cơ, trái cây sấy, nước ép đóng chai.',
      userName: 'Lê Thu Hà',
      commentType: 'Public comment',
    },
    {
      action: 'Request status changed to pending_review',
      targetType: 'request',
      hoursAgo: 4,
      requestCode: 'REQ-2026-072',
      requestTitle: 'Hợp đồng phân phối miền Bắc',
      extra: 'Rà soát hợp đồng phân phối của Công ty An Phát đã hoàn thành vòng kiểm tra đầu tiên.',
      orgName: 'Minh Khang Corp',
      workspaceName: 'Contract Workspace',
    },
    {
      action: 'Partner assigned to request',
      targetType: 'request',
      hoursAgo: 8,
      requestCode: 'REQ-2026-079',
      requestTitle: 'Rà soát thuế GTGT',
      extra: 'Tax Advisory Vietnam được chỉ định xử lý yêu cầu.',
      orgName: 'Minh Khang Corp',
      workspaceName: 'Tax Compliance Workspace',
      partnerName: 'Tax Advisory Vietnam',
    },
    {
      action: 'Workspace created',
      targetType: 'workspace',
      hoursAgo: 24,
      workspaceName: 'Green IP Workspace',
      extra: 'Workspace mới được tạo để quản lý nhãn hiệu và tài sản trí tuệ.',
      orgName: 'Minh Khang Corp',
    },
    {
      action: 'document.uploaded',
      targetType: 'vault_file',
      hoursAgo: 48,
      requestCode: 'REQ-2026-065',
      requestTitle: 'Đăng ký nhãn hiệu GREENFARM',
      extra: 'Hồ sơ đăng ký nhãn hiệu đã được upload và gửi cho partner review.',
      docName: 'hoso-dangky-nhanhieu.pdf',
      docSize: '4.5 MB',
      docType: 'Uploaded',
    },
    {
      action: 'Request status changed to in_progress',
      targetType: 'request',
      hoursAgo: 72,
      requestCode: 'REQ-2026-058',
      requestTitle: 'Hợp đồng lao động mới',
      extra: 'Hợp đồng lao động mới được chuyển sang trạng thái đang xử lý.',
      orgName: 'Minh Khang Corp',
      workspaceName: 'Contract Workspace',
    },
  ];

  for (const event of auditEvents) {
    const workspace = wsByName.get(event.workspaceName) || workspaces[0];
    const user = users.find(u => u.name === event.userName) || adminUser;

    // Skip if no workspace
    if (!workspace?.id) continue;

    await prisma.auditEvent.create({
      data: {
        actorId: user?.id || adminUser?.id,
        workspaceId: workspace.id,
        action: event.action,
        targetType: event.targetType,
        targetId: event.targetType === 'request' ? `req-${event.requestCode?.toLowerCase().replace('req-', '')}` : `doc-${event.docName || 'unknown'}`,
        requestId: event.requestCode ? `req-${event.requestCode.toLowerCase().replace('req-', '')}` : null,
        metadataSummary: JSON.stringify({
          extra: event.extra,
          requestCode: event.requestCode,
          requestTitle: event.requestTitle,
          orgName: event.orgName,
          workspaceName: event.workspaceName,
          userName: event.userName,
          partnerName: event.partnerName,
          docName: event.docName,
          docSize: event.docSize,
          docType: event.docType,
          commentType: event.commentType,
        }),
        createdAt: new Date(Date.now() - event.hoursAgo * 60 * 60 * 1000),
      },
    }).catch((e: any) => console.log(`  Warning: ${e.message}`));
  }

  console.log(`  ✓ Created ${auditEvents.length} audit events`);
}

async function seedVaultFiles() {
  console.log('Seeding vault files for all organizations and partners...');

  // Get all workspaces with organizations
  const allWorkspaces = await prisma.workspace.findMany({
    where: { organization: { status: 'active' } },
    include: { organization: true },
  });

  // Get all users
  const users = await prisma.user.findMany({ take: 20 });

  // Template file names for variety
  const fileTemplates = [
    { name: 'logo-{org}.png', size: 204800, type: 'image/png' },
    { name: 'giay-dang-ky-{org}.pdf', size: 1024000, type: 'application/pdf' },
    { name: 'hop-dong-{org}-v1.docx', size: 51200, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { name: 'nda-{org}.pdf', size: 358400, type: 'application/pdf' },
    { name: 'bao-cao-{org}.xlsx', size: 153600, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    { name: 'bien-ban-{org}.pdf', size: 716800, type: 'application/pdf' },
    { name: 'hso-chiu-trach-nhiem-{org}.pdf', size: 921600, type: 'application/pdf' },
    { name: 'ung-dung-dang-ky-{org}.pdf', size: 2048000, type: 'application/pdf' },
  ];

  let created = 0;
  for (const ws of allWorkspaces) {
    // Get requests in this workspace
    const reqs = await prisma.legalRequest.findMany({
      where: { workspaceId: ws.id },
      take: 3,
    });

    if (reqs.length === 0) continue;

    // Create 2-4 files per workspace
    const fileCount = Math.floor(Math.random() * 3) + 2;
    const orgSlug = ws.organization?.name?.toLowerCase().replace(/[^a-z0-9]/gi, '-').slice(0, 10) || 'org';

    for (let i = 0; i < fileCount; i++) {
      const template = fileTemplates[i % fileTemplates.length];
      const filename = template.name.replace('{org}', orgSlug);
      const user = users[i % users.length];

      await prisma.vaultFile.create({
        data: {
          id: `vault-${ws.id.slice(-6)}-${i}-${Date.now()}`,
          requestId: reqs[i % reqs.length].id,
          workspaceId: ws.id,
          actorId: user.id,
          filename,
          size: template.size + Math.floor(Math.random() * 100000),
          contentType: template.type,
          createdAt: new Date(Date.now() - Math.random() * 72 * 60 * 60 * 1000),
        },
      }).catch(() => {});
      created++;
    }
  }

  console.log(`  ✓ Created ${created} vault files across ${allWorkspaces.length} workspaces`);
}

async function main() {
  console.log('');
  console.log('=== Organization Activity Seed (Mock UI Compatible) ===');
  console.log('');

  try {
    // 1. Seed organization and workspaces
    const { org, workspaces } = await seedOrganization();

    // 2. Seed users
    const users = await seedUsers();

    // 3. Seed workspace memberships
    await seedWorkspaceMemberships(workspaces, users);

    // 4. Seed legal requests
    await seedLegalRequests(workspaces, users);

    // 5. Seed audit events
    await seedAuditEvents(workspaces, users);

    // 6. Seed vault files for all orgs and partners
    await seedVaultFiles();

    console.log('');
    console.log('=== Organization Activity Seed Complete ===');
    console.log('');

    // Summary
    const summary = {
      organizations: await prisma.organization.count(),
      workspaces: await prisma.workspace.count(),
      users: await prisma.user.count(),
      memberships: await prisma.workspaceMembership.count(),
      requests: await prisma.legalRequest.count(),
      assignments: await prisma.requestAssignment.count(),
      auditEvents: await prisma.auditEvent.count(),
      vaultFiles: await prisma.vaultFile.count(),
    };

    console.log('Summary:');
    Object.entries(summary).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
