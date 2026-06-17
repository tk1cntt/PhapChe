/**
 * Seed comprehensive activity data for all users
 * Ensures rich data for user activity dashboard display
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

const DOCUMENT_TYPES = [
  { filename: 'hop-dong-phan-phoi.pdf', contentType: 'application/pdf', size: 2456000 },
  { filename: 'giay-phep-kinh-doanh.pdf', contentType: 'application/pdf', size: 1245000 },
  { filename: 'nhan-hieu-logo.png', contentType: 'image/png', size: 856000 },
  { filename: 'bao-cao-thue-quy.pdf', contentType: 'application/pdf', size: 1890000 },
  { filename: 'hop-dong-laO-dong.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 456000 },
  { filename: 'bien-ban-nghiem-thu.pdf', contentType: 'application/pdf', size: 2340000 },
  { filename: 'phieu-chi.pdf', contentType: 'application/pdf', size: 234000 },
  { filename: 'quy-trinh-nhan-su.pdf', contentType: 'application/pdf', size: 1560000 },
];

async function seedUserActivity() {
  console.log('=== Seeding User Activity Data ===\n');

  // Clear existing activity data (optional - comment out to append)
  // await prisma.auditEvent.deleteMany({});
  // await prisma.vaultFile.deleteMany({});

  // Get all users with memberships
  const users = await prisma.user.findMany({
    include: { memberships: { include: { workspace: true } } }
  });

  const workspaces = await prisma.workspace.findMany();
  const partners = await prisma.partner.findMany();
  const requests = await prisma.legalRequest.findMany({
    include: { workspace: true, assignedPartner: true }
  });

  console.log(`Found: ${users.length} users, ${workspaces.length} workspaces, ${partners.length} partners, ${requests.length} requests`);

  let auditEventCount = 0;
  let vaultFileCount = 0;
  let messageCount = 0;

  // Seed for each user
  for (const user of users) {
    // Get user's primary workspace
    const userWorkspace = user.memberships[0]?.workspace || workspaces[0];
    if (!userWorkspace) continue;

    // Get user's assigned requests
    const userRequests = requests.filter(r =>
      r.createdById === user.id ||
      r.assignedSpecialistId === user.id
    );

    // 1. Seed audit events (10-25 events per user for rich display)
    const numEvents = Math.floor(Math.random() * 16) + 10;

    for (let i = 0; i < numEvents; i++) {
      const action = AUDIT_ACTIONS[Math.floor(Math.random() * AUDIT_ACTIONS.length)];
      const request = userRequests[Math.floor(Math.random() * (userRequests.length || 1))] || requests[0];
      const partner = request?.assignedPartner || partners[Math.floor(Math.random() * partners.length)];

      // Spread events across last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const minsAgo = Math.floor(Math.random() * 60);
      const createdAt = new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000 - minsAgo * 60000);

      const metadata: Record<string, unknown> = {};

      if (action.includes('request')) {
        metadata.requestCode = request?.code;
        metadata.requestTitle = request?.title;
        metadata.details = getActionDetails(action, request, partner);
      } else if (action.includes('partner')) {
        metadata.partnerName = partner?.name;
        metadata.requestCode = request?.code;
        metadata.details = `Bình luận với partner: ${partner?.name || 'Partner'}`;
      } else if (action.includes('document')) {
        const doc = DOCUMENT_TYPES[Math.floor(Math.random() * DOCUMENT_TYPES.length)];
        metadata.documentName = doc.filename;
        metadata.details = 'Upload tài liệu mới';
      } else if (action === 'login.success') {
        metadata.details = 'Đăng nhập hệ thống thành công';
        metadata.ip = `192.168.1.${Math.floor(Math.random() * 255)}`;
      } else {
        metadata.details = getActionDetails(action, request, partner);
      }

      try {
        await prisma.auditEvent.create({
          data: {
            actorId: user.id,
            workspaceId: userWorkspace.id,
            action,
            targetType: action.includes('document') ? 'document' : action.includes('partner') ? 'partner' : 'request',
            targetId: request?.id || user.id,
            requestId: request?.id,
            metadataSummary: JSON.stringify(metadata),
            createdAt,
          },
        });
        auditEventCount++;
      } catch (e) {
        console.error(`Error creating audit event for ${user.email}:`, e);
      }
    }

    // 2. Seed vault files (2-5 documents per user)
    const numFiles = Math.floor(Math.random() * 4) + 2;
    const usedDocs = new Set<string>();

    for (let i = 0; i < numFiles; i++) {
      // Pick unique document type
      let doc = DOCUMENT_TYPES[Math.floor(Math.random() * DOCUMENT_TYPES.length)];
      while (usedDocs.has(doc.filename) && usedDocs.size < DOCUMENT_TYPES.length) {
        doc = DOCUMENT_TYPES[Math.floor(Math.random() * DOCUMENT_TYPES.length)];
      }
      usedDocs.add(doc.filename);

      const request = userRequests[Math.floor(Math.random() * (userRequests.length || 1))] || requests[0];
      const daysAgo = Math.floor(Math.random() * 20);

      try {
        await prisma.vaultFile.create({
          data: {
            requestId: request?.id || '',
            workspaceId: userWorkspace.id,
            actorId: user.id,
            filename: doc.filename,
            fileKind: 'upload',
            source: 'user_upload',
            contentType: doc.contentType,
            size: doc.size + Math.floor(Math.random() * 100000),
            createdAt: new Date(Date.now() - daysAgo * 86400000),
          },
        });
        vaultFileCount++;
      } catch (e) {
        console.error(`Error creating vault file for ${user.email}:`, e);
      }
    }

    // 3. Seed messages/comments for user
    const numMessages = Math.floor(Math.random() * 6) + 2;
    for (let i = 0; i < numMessages; i++) {
      const request = userRequests[Math.floor(Math.random() * (userRequests.length || 1))] || requests[0];
      if (!request) continue;

      const daysAgo = Math.floor(Math.random() * 14);
      const commentTypes = [
        'Đã xem xét hồ sơ và gửi feedback.',
        'Cần bổ sung thêm thông tin về bên liên quan.',
        'Đã gửi draft hợp đồng cho khách hàng.',
        'Kiểm tra lại các điều khoản theo yêu cầu.',
        'Tài liệu đã được review và approve.',
        'Cần thêm chữ ký từ phía đối tác.',
      ];

      try {
        await prisma.message.create({
          data: {
            legalRequestId: request.id,
            workspaceId: userWorkspace.id,
            senderId: user.id,
            recipientId: user.id, // Placeholder - in real scenario would be different user
            content: commentTypes[Math.floor(Math.random() * commentTypes.length)],
            createdAt: new Date(Date.now() - daysAgo * 86400000),
          },
        });
        messageCount++;
      } catch (e) {
        // Skip if error
      }
    }

    // 4. Update user's lastActiveAt if they have recent activity
    if (auditEventCount > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastActiveAt: new Date(Date.now() - Math.floor(Math.random() * 3) * 86400000),
          emailVerified: true,
        },
      });
    }
  }

  // 5. Create workspace memberships for users who don't have any
  for (const user of users) {
    if (user.memberships.length === 0 && workspaces[0]) {
      try {
        await prisma.workspaceMembership.create({
          data: {
            userId: user.id,
            workspaceId: workspaces[0].id,
            role: Math.random() > 0.7 ? 'coordinator' : 'specialist',
          },
        });
        console.log(`Created membership for ${user.email}`);
      } catch (e) {
        // Skip if error
      }
    }
  }

  console.log(`\n=== Seeding Complete ===`);
  console.log(`Created: ${auditEventCount} audit events, ${vaultFileCount} vault files, ${messageCount} messages`);

  // Final counts
  console.log('\nFinal database counts:');
  console.log(`  Users: ${await prisma.user.count()}`);
  console.log(`  Audit Events: ${await prisma.auditEvent.count()}`);
  console.log(`  Vault Files: ${await prisma.vaultFile.count()}`);
  console.log(`  Messages: ${await prisma.message.count()}`);
  console.log(`  Workspace Memberships: ${await prisma.workspaceMembership.count()}`);
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

seedUserActivity()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
