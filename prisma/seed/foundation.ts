import { Prisma } from '@prisma/client';
import { hashPassword } from '@better-auth/utils/password';

const seedUsers = [
  { email: 'superadmin@phapche.test', name: 'Nguyễn Văn An', password: 'Admin@123456', role: 'super_admin', accountType: 'staff' },
  { email: 'admin@phapche.test', name: 'Trần Thị Bình', password: 'Admin@123456', role: 'coordinator_admin', accountType: 'staff' },
  { email: 'coordinator@phapche.test', name: 'Lê Văn Cường', password: 'Admin@123456', role: 'coordinator_admin', accountType: 'staff' },
  { email: 'specialist1@phapche.test', name: 'Phạm Thị Dung', password: 'Admin@123456', role: 'specialist', accountType: 'staff' },
  { email: 'specialist2@phapche.test', name: 'Hoàng Văn Em', password: 'Admin@123456', role: 'specialist', accountType: 'staff' },
  { email: 'reviewer1@phapche.test', name: 'Vũ Thị Phương', password: 'Admin@123456', role: 'reviewer', accountType: 'staff' },
  { email: 'reviewer2@phapche.test', name: 'Đặng Văn Giang', password: 'Admin@123456', role: 'reviewer', accountType: 'staff' },
  { email: 'customer1@phapche.test', name: 'Bùi Thị Hương', password: 'Customer@123456', role: 'customer', accountType: 'customer' },
  { email: 'customer2@phapche.test', name: 'Đỗ Văn Ích', password: 'Customer@123456', role: 'customer', accountType: 'customer' },
  { email: 'customer3@phapche.test', name: 'Ngô Thị Kim', password: 'Customer@123456', role: 'customer', accountType: 'customer' },
];

const seedOrganizations = [
  { name: 'Công ty Luật Hợp Danh Minh Anh', businessType: 'LEGAL_FIRM', registrationNumber: '0123456789', address: '123 Nguyễn Huệ, Quận 1, TP.HCM', contactEmail: 'contact@minhanh.law' },
  { name: 'Văn phòng Luật sư Trần & Cộng sự', businessType: 'LEGAL_FIRM', registrationNumber: '9876543210', address: '456 Lê Lợi, Quận 1, TP.HCM', contactEmail: 'info@tranlaw.vn' },
  { name: 'Công ty Tư vấn Pháp lý Đại Việt', businessType: 'CONSULTING', registrationNumber: '5678901234', address: '789 Trần Hưng Đạo, Quận 5, TP.HCM', contactEmail: 'support@daiviet.consulting' },
];

const seedWorkspaces = [
  { name: 'Phòng Pháp lý ABC', slug: 'phap-ly-abc' },
  { name: 'Văn phòng XYZ', slug: 'van-phong-xyz' },
  { name: 'Phòng Tư vấn Đầu tư', slug: 'tu-van-dau-tu' },
  { name: 'Phòng Hợp đồng Thương mại', slug: 'hop-dong-thuong-mai' },
  { name: 'Phòng Sở hữu Trí tuệ', slug: 'so-huu-tri-tue' },
];

export default async function seedFoundation(tx: Prisma.TransactionClient) {
  console.log('Seeding foundation data...');

  // Create platform tenant
  const tenant = await tx.tenant.create({
    data: {
      id: 'platform-tenant-foundation',
      name: 'GitNexus Platform',
      type: 'platform',
      settings: JSON.stringify({
        requireMfa: false,
        defaultLanguage: 'vi',
        timezone: 'Asia/Ho_Chi_Minh',
      }),
    },
  });
  console.log('  ✓ Tenant:', tenant.id);

  // Create organizations
  const orgIds: string[] = [];
  for (const orgData of seedOrganizations) {
    const org = await tx.organization.create({
      data: {
        tenantId: tenant.id,
        name: orgData.name,
        businessType: orgData.businessType,
        registrationNumber: orgData.registrationNumber,
        address: orgData.address,
        contactEmail: orgData.contactEmail,
        status: 'active',
        isDefault: false,
      },
    });
    orgIds.push(org.id);
  }
  console.log('  ✓ Organizations:', orgIds.length);

  // Create users with accounts
  const userIds: string[] = [];
  for (const userData of seedUsers) {
    const user = await tx.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        emailVerified: true,
        accountType: userData.accountType,
      },
    });

    const hashedPassword = await hashPassword(userData.password);
    await tx.account.create({
      data: {
        userId: user.id,
        accountId: userData.email,
        providerId: 'credential',
        password: hashedPassword,
      },
    });

    userIds.push(user.id);
  }
  console.log('  ✓ Users:', userIds.length);

  // Create workspaces
  const workspaceIds: string[] = [];
  for (const wsData of seedWorkspaces) {
    const ws = await tx.workspace.create({
      data: {
        name: wsData.name,
        slug: wsData.slug,
        isActive: true,
        organizationId: orgIds[0], // Assign to first org
      },
    });
    workspaceIds.push(ws.id);
  }
  console.log('  ✓ Workspaces:', workspaceIds.length);

  // Create workspace memberships
  const membershipData = [
    // Super admin - all workspaces
    ...workspaceIds.map(wsId => ({ userId: userIds[0], workspaceId: wsId, role: 'super_admin' })),
    // Admin - first 3 workspaces
    ...workspaceIds.slice(0, 3).map(wsId => ({ userId: userIds[1], workspaceId: wsId, role: 'coordinator_admin' })),
    // Coordinator - first 2 workspaces
    ...workspaceIds.slice(0, 2).map(wsId => ({ userId: userIds[2], workspaceId: wsId, role: 'coordinator_admin' })),
    // Specialists - various workspaces
    { userId: userIds[3], workspaceId: workspaceIds[0], role: 'specialist' },
    { userId: userIds[3], workspaceId: workspaceIds[1], role: 'specialist' },
    { userId: userIds[4], workspaceId: workspaceIds[2], role: 'specialist' },
    { userId: userIds[4], workspaceId: workspaceIds[3], role: 'specialist' },
    // Reviewers
    { userId: userIds[5], workspaceId: workspaceIds[0], role: 'reviewer' },
    { userId: userIds[6], workspaceId: workspaceIds[1], role: 'reviewer' },
    // Customers
    { userId: userIds[7], workspaceId: workspaceIds[0], role: 'customer' },
    { userId: userIds[8], workspaceId: workspaceIds[1], role: 'customer' },
    { userId: userIds[9], workspaceId: workspaceIds[2], role: 'customer' },
  ];

  for (const mem of membershipData) {
    await tx.workspaceMembership.create({
      data: {
        userId: mem.userId,
        workspaceId: mem.workspaceId,
        role: mem.role,
        isActive: true,
      },
    });
  }
  console.log('  ✓ Workspace memberships:', membershipData.length);

  return {
    tenantId: tenant.id,
    orgIds,
    userIds,
    workspaceIds,
    counts: {
      tenants: 1,
      organizations: orgIds.length,
      users: userIds.length,
      workspaces: workspaceIds.length,
      memberships: membershipData.length,
    },
  };
}
