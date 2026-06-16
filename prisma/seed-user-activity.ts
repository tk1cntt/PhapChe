/**
 * Seed sample activity data for all users
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const AUDIT_ACTIONS = [
  'request.created',
  'request.updated',
  'request.assigned',
  'document.uploaded',
  'document.viewed',
  'document.downloaded',
  'partner.comment_added',
  'workflow.transition',
  'login.success',
];

const REQUEST_CODES = ['REQ-2026-001', 'REQ-2026-002', 'REQ-2026-003'];

async function seedUserActivity() {
  console.log('=== Seeding User Activity Data ===\n');

  // Get all users
  const users = await prisma.user.findMany({ take: 20 });
  const workspaces = await prisma.workspace.findMany({ take: 5 });
  const partners = await prisma.partner.findMany({ take: 5 });
  const requests = await prisma.legalRequest.findMany({ take: 10 });

  console.log(`Found: ${users.length} users, ${workspaces.length} workspaces, ${partners.length} partners, ${requests.length} requests`);

  let eventCount = 0;

  // Seed audit events for each user
  for (const user of users) {
    // Generate 5-15 events per user
    const eventCountForUser = Math.floor(Math.random() * 11) + 5;

    for (let i = 0; i < eventCountForUser; i++) {
      const action = AUDIT_ACTIONS[Math.floor(Math.random() * AUDIT_ACTIONS.length)];
      const request = requests[Math.floor(Math.random() * requests.length)];
      const partner = partners[Math.floor(Math.random() * partners.length)];
      const workspace = workspaces[Math.floor(Math.random() * workspaces.length)];

      // Random time in last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000);

      const metadata: Record<string, unknown> = {
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        details: getActionDetails(action, request, partner),
      };

      if (action.includes('request')) {
        metadata.requestCode = request?.code;
        metadata.requestTitle = request?.title;
      }

      if (action.includes('partner')) {
        metadata.partnerName = partner?.name;
        metadata.requestCode = request?.code;
      }

      if (action.includes('document')) {
        metadata.documentName = `document-${Math.floor(Math.random() * 100)}.pdf`;
        metadata.documentSize = Math.floor(Math.random() * 5000000);
      }

      try {
        await prisma.auditEvent.create({
          data: {
            actorId: user.id,
            workspaceId: workspace?.id || '',
            action,
            targetType: 'request',
            targetId: request?.id || '',
            requestId: request?.id,
            metadataSummary: JSON.stringify(metadata),
            createdAt,
          },
        });
        eventCount++;
      } catch (e) {
        // Skip if error
      }
    }
  }

  // Seed some vault files for users
  console.log('\n--- Seeding Vault Files ---');
  const docNames = [
    'hop-dong-phan-phoi.pdf',
    'giay-phep-kinh-doanh.pdf',
    'nhan-hieu-logo.png',
    'bao-cao-thue-quy.pdf',
    'hợp-đồng-laO-động.docx',
  ];

  let fileCount = 0;
  for (const user of users.slice(0, 15)) {
    const numFiles = Math.floor(Math.random() * 3) + 1;
    const ws = workspaces[Math.floor(Math.random() * workspaces.length)];
    const req = requests[Math.floor(Math.random() * requests.length)];

    for (let i = 0; i < numFiles; i++) {
      const docName = docNames[Math.floor(Math.random() * docNames.length)];
      const ext = docName.split('.').pop() || 'pdf';
      const mimeTypes: Record<string, string> = {
        pdf: 'application/pdf',
        png: 'image/png',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };

      try {
        await prisma.vaultFile.create({
          data: {
            name: docName,
            mimeType: mimeTypes[ext] || 'application/octet-stream',
            size: Math.floor(Math.random() * 5000000),
            workspaceId: ws?.id || '',
            actorId: user.id,
            requestId: req?.id,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
        });
        fileCount++;
      } catch (e) {
        // Skip if error
      }
    }
  }

  console.log(`\n=== Seeding Complete ===`);
  console.log(`Created: ${eventCount} audit events, ${fileCount} vault files`);

  // Final counts
  console.log('\nFinal counts:');
  console.log(`  Audit Events: ${await prisma.auditEvent.count()}`);
  console.log(`  Vault Files: ${await prisma.vaultFile.count()}`);
}

function getActionDetails(action: string, request: any, partner: any): string {
  switch (action) {
    case 'request.created':
      return `Tạo hồ sơ mới: ${request?.title || 'Request'}`;
    case 'request.updated':
      return `Cập nhật hồ sơ: ${request?.title || 'Request'}`;
    case 'request.assigned':
      return `Được phân công xử lý: ${request?.title || 'Request'}`;
    case 'document.uploaded':
      return 'Upload tài liệu mới';
    case 'document.viewed':
      return 'Xem tài liệu';
    case 'document.downloaded':
      return 'Tải xuống tài liệu';
    case 'partner.comment_added':
      return `Bình luận với partner: ${partner?.name || 'Partner'}`;
    case 'workflow.transition':
      return `Thay đổi trạng thái hồ sơ: ${request?.title || 'Request'}`;
    case 'login.success':
      return 'Đăng nhập hệ thống';
    default:
      return action;
  }
}

seedUserActivity().catch(console.error).finally(() => prisma.$disconnect());
