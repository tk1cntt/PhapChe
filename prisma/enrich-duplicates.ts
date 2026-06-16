/**
 * Enrich duplicate records with more diverse data
 * Instead of deleting, we update them with richer data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function enrichDuplicates() {
  console.log('=== Enriching Duplicate Data ===\n');

  // Enrich duplicate workspaces with unique names
  const workspaces = await prisma.workspace.findMany();
  const wsByName = new Map<string, typeof workspaces>();
  workspaces.forEach(w => {
    const list = wsByName.get(w.name) || [];
    list.push(w);
    wsByName.set(w.name, list);
  });

  const uniqueWsNames = [
    'Legal Compliance Workspace',
    'Contract Management Workspace',
    'Trademark & IP Workspace',
    'Tax Advisory Workspace',
    'HR & Employment Workspace',
    'Corporate Governance Workspace',
    'M&A Due Diligence Workspace',
    'Regulatory Compliance Workspace',
  ];

  let wsCount = 0;
  for (const [name, list] of wsByName.entries()) {
    for (let i = 1; i < list.length; i++) {
      const newName = uniqueWsNames[wsCount % uniqueWsNames.length] + (wsCount > uniqueWsNames.length ? ` ${Math.floor(wsCount / uniqueWsNames.length) + 1}` : '');
      const newSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await prisma.workspace.update({
        where: { id: list[i].id },
        data: { name: newName, slug: newSlug }
      });
      console.log(`  Workspace: "${name}" -> "${newName}"`);
      wsCount++;
    }
  }

  // Enrich duplicate requests with unique titles
  const requests = await prisma.legalRequest.findMany({ where: { code: { not: null } } });
  const reqByCode = new Map<string, typeof requests>();
  requests.forEach(r => {
    if (r.code) {
      const list = reqByCode.get(r.code) || [];
      list.push(r);
      reqByCode.set(r.code, list);
    }
  });

  const uniqueMatterTypes = [
    'Trademark Registration',
    'Contract Review',
    'Tax Advisory',
    'Labor Law Compliance',
    'Corporate Governance',
    'M&A Advisory',
    'Regulatory Filing',
    'IP Protection',
  ];

  const uniqueTitles = [
    'Hợp đồng phân phối miền Bắc',
    'Đăng ký nhãn hiệu GREENFARM',
    'Rà soát thuế GTGT quý 2',
    'Hợp đồng lao động mới 2026',
    'NDA với đối tác Singapore',
    'Giấy phép kinh doanh bổ sung',
    'Rà soát hợp đồng vendor',
    'Đăng ký mẫu logo mới',
    'Tư vấn cổ phần hóa',
    'Thủ tục xuất nhập khẩu',
  ];

  let reqCount = 0;
  for (const [code, list] of reqByCode.entries()) {
    for (let i = 1; i < list.length; i++) {
      const newCode = `${code}-${String(i + 1).padStart(2, '0')}`;
      const newTitle = uniqueTitles[reqCount % uniqueTitles.length];
      const newMatterType = uniqueMatterTypes[reqCount % uniqueMatterTypes.length];
      await prisma.legalRequest.update({
        where: { id: list[i].id },
        data: { code: newCode, title: newTitle, matterType: newMatterType }
      });
      console.log(`  Request: "${code}" -> "${newCode}" (${newTitle})`);
      reqCount++;
    }
  }

  console.log('\n=== Enrichment Complete ===\n');

  // Summary
  console.log('Updated:');
  console.log(`  ${wsCount} duplicate workspaces`);
  console.log(`  ${reqCount} duplicate requests`);
}

enrichDuplicates().catch(console.error).finally(() => prisma.$disconnect());
