/**
 * Seed users to organizations with proper role assignments
 * Distributes users across existing organizations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Organization structure
const ORG_STRUCTURE = [
  { orgId: 'org-minh-khang', orgName: 'Minh Khang Corp', roleDistribution: { admin: 3, coordinator: 5, specialist: 10, customer: 8 } },
  { orgId: 'org-tech-solutions', orgName: 'Tech Solutions VN', roleDistribution: { admin: 1, coordinator: 2, specialist: 4, customer: 3 } },
  { orgId: 'org-green-agriculture', orgName: 'Green Agriculture JSC', roleDistribution: { admin: 1, coordinator: 2, specialist: 4, customer: 4 } },
  { orgId: 'org-default-an-phat', orgName: 'An Phat Company', roleDistribution: { admin: 1, coordinator: 2, specialist: 3, customer: 4 } },
  { orgId: 'org-nam-viet-foods', orgName: 'Nam Viet Foods', roleDistribution: { admin: 1, coordinator: 1, specialist: 2, customer: 3 } },
  { orgId: 'org-tech-solutions-corp', orgName: 'Tech Solutions Corp', roleDistribution: { admin: 1, coordinator: 1, specialist: 2, customer: 2 } },
  { orgId: 'org-global-services-jsc', orgName: 'Global Services JSC', roleDistribution: { admin: 1, coordinator: 1, specialist: 2, customer: 2 } },
];

// Sample user templates by role
const USER_TEMPLATES = [
  // Admins
  { name: 'Nguyễn Văn Minh', email: 'admin@minhkhang.vn', title: 'IT Administrator', role: 'admin' },
  { name: 'Trần Thị Lan', email: 'lan.admin@minhkhang.vn', title: 'System Admin', role: 'admin' },
  { name: 'Lê Hoàng Nam', email: 'nam.admin@techsolutions.vn', title: 'Admin', role: 'admin' },
  { name: 'Phạm Đức Anh', email: 'anh.admin@greenagri.vn', title: 'System Admin', role: 'admin' },
  { name: 'Vũ Minh Quân', email: 'quan.admin@anphat.vn', title: 'Admin', role: 'admin' },
  // Coordinators
  { name: 'Đỗ Minh Tuấn', email: 'tuan.coordinator@minhkhang.vn', title: 'Legal Coordinator', role: 'coordinator' },
  { name: 'Ngô Thị Hương', email: 'huong.coordinator@minhkhang.vn', title: 'Case Coordinator', role: 'coordinator' },
  { name: 'Bùi Văn Hùng', email: 'hung.coordinator@minhkhang.vn', title: 'Operations Coordinator', role: 'coordinator' },
  { name: 'Vũ Thị Mai', email: 'mai.coordinator@minhkhang.vn', title: 'Project Coordinator', role: 'coordinator' },
  { name: 'Đinh Minh Đức', email: 'duc.coordinator@techsolutions.vn', title: 'Legal Coordinator', role: 'coordinator' },
  { name: 'Trần Văn Toàn', email: 'toan.coordinator@greenagri.vn', title: 'Coordinator', role: 'coordinator' },
  // Specialists
  { name: 'Trần Văn An', email: 'an.specialist@minhkhang.vn', title: 'Senior Legal Specialist', role: 'specialist' },
  { name: 'Nguyễn Thị Bình', email: 'binh.specialist@minhkhang.vn', title: 'Contract Specialist', role: 'specialist' },
  { name: 'Lê Văn Cường', email: 'cuong.specialist@minhkhang.vn', title: 'IP Specialist', role: 'specialist' },
  { name: 'Phạm Thị Dung', email: 'dung.specialist@minhkhang.vn', title: 'Compliance Specialist', role: 'specialist' },
  { name: 'Hoàng Văn Em', email: 'em.specialist@minhkhang.vn', title: 'Trade Law Specialist', role: 'specialist' },
  { name: 'Vũ Thị Hoa', email: 'hoa.specialist@minhkhang.vn', title: 'Tax Specialist', role: 'specialist' },
  { name: 'Đặng Văn Inh', email: 'inh.specialist@techsolutions.vn', title: 'Legal Counsel', role: 'specialist' },
  { name: 'Lý Văn Khải', email: 'khai.specialist@greenagri.vn', title: 'Agri Law Specialist', role: 'specialist' },
  // Customers
  { name: 'Nguyễn Văn Sơn', email: 'son.customer@minhkhang.vn', title: 'Business Manager', role: 'customer' },
  { name: 'Trần Thị Tâm', email: 'tam.customer@minhkhang.vn', title: 'Department Head', role: 'customer' },
  { name: 'Lê Văn Út', email: 'ut.customer@minhkhang.vn', title: 'Project Manager', role: 'customer' },
  { name: 'Phạm Thị V', email: 'v.customer@techsolutions.vn', title: 'Accountant', role: 'customer' },
  { name: 'Hoàng Văn X', email: 'x.customer@greenagri.vn', title: 'Sales Manager', role: 'customer' },
];

function getPrismaRole(role: string): string {
  switch (role) {
    case 'admin': return 'super_admin';
    case 'coordinator': return 'coordinator';
    case 'specialist': return 'specialist';
    default: return 'customer';
  }
}

async function main() {
  console.log('=== Assigning Users to Organizations ===\n');

  // Clear existing memberships
  console.log('Clearing existing memberships...');
  await prisma.workspaceMembership.deleteMany({});

  // Get all existing workspaces organized by org
  const workspaces = await prisma.workspace.findMany({
    where: { organizationId: { not: null } },
    orderBy: { organizationId: 'asc' }
  });

  console.log(`Found ${workspaces.length} workspaces\n`);

  // Group workspaces by organization
  const wsByOrg = new Map<string, typeof workspaces>();
  for (const ws of workspaces) {
    if (ws.organizationId) {
      if (!wsByOrg.has(ws.organizationId)) {
        wsByOrg.set(ws.organizationId, []);
      }
      wsByOrg.get(ws.organizationId)!.push(ws);
    }
  }

  let userIndex = 0;
  let totalAssigned = 0;

  for (const orgStruct of ORG_STRUCTURE) {
    const orgWorkspaces = wsByOrg.get(orgStruct.orgId) || [];
    if (orgWorkspaces.length === 0) {
      console.log(`⚠ ${orgStruct.orgName}: No workspaces, skipping...`);
      continue;
    }

    console.log(`\n📁 ${orgStruct.orgName} (${orgWorkspaces.length} workspaces)`);

    // Assign users by role
    for (const [role, count] of Object.entries(orgStruct.roleDistribution)) {
      console.log(`  ${role}: ${count} users`);

      for (let i = 0; i < count; i++) {
        const template = USER_TEMPLATES.find(u => u.role === role);
        const templateIndex = Math.floor(Math.random() * 10); // Add variety

        // Find or create user
        const emailBase = `${role}.${userIndex}@${orgStruct.orgId.replace('org-', '')}.test`;
        let user = await prisma.user.findUnique({ where: { email: emailBase } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              name: `${orgStruct.orgName.split(' ')[0]} ${role.charAt(0).toUpperCase()}${userIndex}`,
              email: emailBase,
              title: template?.title || role,
              emailVerified: true,
              isActive: true,
              lastActiveAt: new Date(Date.now() - Math.random() * 7 * 86400000),
            }
          });
        }

        // Assign to primary workspace
        const primaryWs = orgWorkspaces[0];
        await prisma.workspaceMembership.create({
          data: {
            userId: user.id,
            workspaceId: primaryWs.id,
            role: getPrismaRole(role),
          }
        });

        // Assign to secondary workspace if exists (for admins/coordinators)
        if (orgWorkspaces.length > 1 && (role === 'admin' || role === 'coordinator')) {
          await prisma.workspaceMembership.create({
            data: {
              userId: user.id,
              workspaceId: orgWorkspaces[1].id,
              role: 'viewer',
            }
          });
        }

        totalAssigned++;
        userIndex++;
      }
    }
  }

  // Handle remaining unassigned users
  console.log('\n--- Assigning remaining users to default org ---');

  const assignedUserIds = await prisma.workspaceMembership.findMany({
    select: { userId: true },
    distinct: ['userId']
  });
  const assignedIds = new Set(assignedUserIds.map(m => m.userId));

  const unassignedUsers = await prisma.user.findMany({
    where: { id: { notIn: Array.from(assignedIds) } }
  });

  const defaultWs = workspaces.find(w => w.organizationId === 'org-minh-khang');

  for (const user of unassignedUsers) {
    if (!assignedIds.has(user.id) && defaultWs) {
      await prisma.workspaceMembership.create({
        data: {
          userId: user.id,
          workspaceId: defaultWs.id,
          role: 'customer',
        }
      });
      totalAssigned++;
    }
  }

  // Summary
  console.log('\n=== Seeding Complete ===');
  console.log(`Total users assigned: ${totalAssigned}`);

  // Final distribution
  console.log('\n📊 User Distribution by Organization:');
  const orgs = await prisma.organization.findMany({
    where: { id: { in: ORG_STRUCTURE.map(o => o.orgId) } },
    include: {
      workspaces: {
        include: { memberships: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  let grandTotal = 0;
  for (const org of orgs) {
    const totalMembers = org.workspaces.reduce((sum, ws) => sum + ws.memberships.length, 0);
    grandTotal += totalMembers;
    const admins = org.workspaces.reduce((sum, ws) => sum + ws.memberships.filter(m => m.role === 'super_admin').length, 0);
    const coords = org.workspaces.reduce((sum, ws) => sum + ws.memberships.filter(m => m.role === 'coordinator').length, 0);
    const specs = org.workspaces.reduce((sum, ws) => sum + ws.memberships.filter(m => m.role === 'specialist').length, 0);
    const custs = org.workspaces.reduce((sum, ws) => sum + ws.memberships.filter(m => m.role === 'customer').length, 0);

    console.log(`  ${org.name}: ${totalMembers} members (${admins}A ${coords}C ${specs}S ${custs}U)`);
  }

  console.log(`\n  TOTAL: ${grandTotal} memberships`);

  console.log('\n📈 Database counts:');
  console.log(`  Users: ${await prisma.user.count()}`);
  console.log(`  Memberships: ${await prisma.workspaceMembership.count()}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
