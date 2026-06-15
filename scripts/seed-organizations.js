/**
 * Seed script for Organization sample data
 * Run: node scripts/seed-organizations.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding organization sample data...');

  // Create Tenant first
  const tenant = await prisma.tenant.upsert({
    where: { id: 'platform-tenant' },
    update: {},
    create: {
      id: 'platform-tenant',
      name: 'Platform Tenant',
      type: 'platform',
    },
  });
  console.log('Created tenant:', tenant.name);

  // Create organizations
  const org1 = await prisma.organization.create({
    data: {
      id: 'org-default-an-phat',
      tenantId: tenant.id,
      name: 'An Phat Company',
      businessType: 'Manufacturing',
      registrationNumber: '0123456789',
      address: '123 Industrial Zone, District 7, Ho Chi Minh City',
      contactEmail: 'contact@anphat.vn',
      status: 'active',
      isDefault: true,
    },
  });
  console.log('Created:', org1.name);

  const org2 = await prisma.organization.create({
    data: {
      id: 'org-minh-khang',
      tenantId: tenant.id,
      name: 'Minh Khang Corp',
      businessType: 'Trading',
      registrationNumber: '9876543210',
      address: '456 Business Center, District 1, Ho Chi Minh City',
      contactEmail: 'info@minhkhang.vn',
      status: 'active',
      isDefault: false,
    },
  });
  console.log('Created:', org2.name);

  const org3 = await prisma.organization.create({
    data: {
      id: 'org-tech-solutions',
      tenantId: tenant.id,
      name: 'Tech Solutions VN',
      businessType: 'Technology',
      registrationNumber: '5678901234',
      address: '789 Tech Park, District 3, Ho Chi Minh City',
      contactEmail: 'contact@techsolutions.vn',
      status: 'active',
      isDefault: false,
    },
  });
  console.log('Created:', org3.name);

  const org4 = await prisma.organization.create({
    data: {
      id: 'org-green-agriculture',
      tenantId: tenant.id,
      name: 'Green Agriculture JSC',
      businessType: 'Agriculture',
      registrationNumber: '3456789012',
      address: '321 Farm Road, Cu Chi District, Ho Chi Minh City',
      contactEmail: 'info@greenagri.vn',
      status: 'active',
      isDefault: false,
    },
  });
  console.log('Created:', org4.name);

  const org5 = await prisma.organization.create({
    data: {
      id: 'org-inactive-demo',
      tenantId: tenant.id,
      name: 'Inactive Demo Org',
      businessType: 'Demo',
      registrationNumber: '0000000000',
      address: 'Demo Address',
      contactEmail: 'demo@example.com',
      status: 'inactive',
      isDefault: false,
    },
  });
  console.log('Created:', org5.name);

  console.log('\n=== Seed Summary ===');
  console.log('Organizations: 5');
  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
