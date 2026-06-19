import { Prisma } from '@prisma/client';

interface SeedContext {
  userIds: string[];
  workspaceIds: string[];
  orgIds: string[];
}

const requestTitles = [
  'Tư vấn hợp đồng lao động',
  'Soạn thảo hợp đồng thương mại',
  'Đăng ký nhãn hiệu',
  'Tư vấn thành lập doanh nghiệp',
  'Rà soát tuân thủ pháp lý',
  'Đàm phán hợp đồng',
  'Tư vấn luật bất động sản',
  'Soạn thảo điều lệ công ty',
  'Đăng ký bản quyền',
  'Tư vấn thuế doanh nghiệp',
  'Hợp đồng lao động Nguyễn Văn A',
  'Hợp đồng thương mại ABC Corp',
  'Đơn đăng ký nhãn hiệu XYZ',
  'Hồ sơ thành lập công ty TNHH',
  'Báo cáo tuân thủ quý 1/2026',
  'Hợp đồng thuê văn phòng',
  'Thỏa thuận bảo mật NDA',
  'Hợp đồng dịch vụ IT',
  'Tư vấn sáp nhập doanh nghiệp',
  'Đăng ký kiểu dáng công nghiệp',
  'Hợp đồng phân phối độc quyền',
  'Tư vấn luật lao động',
  'Soạn thảo quy chế nội bộ',
  'Đăng ký sáng chế',
  'Hợp đồng chuyển nhượng cổ phần',
  'Tư vấn pháp lý dự án',
  'Rà soát hợp đồng thuê nhà',
  'Soạn thảo biên bản thỏa thuận',
  'Đăng ký tên thương mại',
  'Tư vấn xuất khẩu lao động',
  'Hợp đồng gia công',
  'Soạn thảo thỏa thuận hợp tác',
  'Đăng ký chỉ dẫn địa lý',
  'Tư vấn luật thương mại điện tử',
  'Hợp đồng đại lý',
  'Rà soát chính sách nhân sự',
  'Soạn thảo quy trình khiếu nại',
  'Đăng ký quyền tác giả',
  'Tư vấn đầu tư nước ngoài',
  'Hợp đồng nhượng quyền',
  'Soạn thảo thỏa thuận không cạnh tranh',
  'Đăng ký nhãn hiệu quốc tế',
  'Tư vấn giải quyết tranh chấp',
  'Hợp đồng liên doanh',
  'Rà soát tuân thủ GDPR',
  'Soạn thảo chính sách bảo mật',
  'Đăng ký tên miền',
  'Tư vấn luật gia đình',
  'Hợp đồng hôn nhân',
  'Soạn thảo di chúc',
];

const auditActions = [
  'user.login',
  'user.logout',
  'user.create',
  'user.update',
  'request.create',
  'request.update',
  'request.assign',
  'request.transition',
  'document.upload',
  'document.download',
  'document.create',
  'document.update',
  'workspace.create',
  'workspace.update',
  'membership.add',
  'membership.remove',
  'vault.upload',
  'vault.download',
  'review.submit',
  'review.approve',
  'review.reject',
  'partner.create',
  'partner.update',
  'engagement.create',
  'permission.grant',
  'permission.revoke',
];

const vaultFilenames = [
  'Hợp đồng lao động Nguyễn Văn A.pdf',
  'Giấy phép kinh doanh.docx',
  'Điều lệ công ty TNHH ABC.pdf',
  'Báo cáo tài chính 2025.xlsx',
  'Biên bản họp cổ đông.pdf',
  'Hợp đồng thương mại XYZ.docx',
  'Giấy chứng nhận đăng ký doanh nghiệp.pdf',
  'Đơn đăng ký nhãn hiệu.pdf',
  'Hợp đồng thuê văn phòng.docx',
  'Thỏa thuận bảo mật NDA.pdf',
  'Hợp đồng dịch vụ CNTT.pdf',
  'Báo cáo tuân thủ quý 1.pdf',
  'Hồ sơ sáp nhập doanh nghiệp.docx',
  'Giấy chứng nhận bản quyền.pdf',
  'Hợp đồng phân phối độc quyền.pdf',
  'Quy chế nội bộ công ty.docx',
  'Đơn đăng ký sáng chế.pdf',
  'Hợp đồng chuyển nhượng cổ phần.pdf',
  'Hồ sơ dự án đầu tư.pdf',
  'Hợp đồng gia công quốc tế.docx',
];

const messageContents = [
  'Kính gửi Quý khách, chúng tôi đã nhận được yêu cầu của Quý khách và sẽ phản hồi trong thời gian sớm nhất.',
  'Cảm ơn Quý khách đã sử dụng dịch vụ của chúng tôi. Yêu cầu của Quý khách đang được xử lý.',
  'Chúng tôi cần thêm một số thông tin để hoàn thiện hồ sơ. Vui lòng cung cấp giấy tờ liên quan.',
  'Hồ sơ của Quý khách đã được chuyển cho chuyên viên phụ trách. Thời gian xử lý dự kiến là 5-7 ngày làm việc.',
  'Quý khách vui lòng xác nhận thông tin trong hợp đồng trước khi ký.',
  'Chúng tôi đã hoàn thành việc rà soát hợp đồng. Vui lòng xem xét các điểm được đánh dấu.',
  'Kết quả đăng ký nhãn hiệu đã có. Vui lòng liên hệ văn phòng để nhận giấy chứng nhận.',
  'Chúng tôi đã gửi báo cáo tuân thủ qua email. Vui lòng kiểm tra hộp thư.',
  'Yêu cầu tư vấn của Quý khách đã được phân công cho luật sư chuyên trách.',
  'Vui lòng cung cấp thêm thông tin về đối tác để chúng tôi hoàn thiện hợp đồng.',
  'Hợp đồng đã được soạn thảo xong. Quý khách vui lòng xem xét và cho ý kiến.',
  'Chúng tôi đã nhận được phản hồi từ đối tác. Vui lòng xem chi tiết trong tài liệu đính kèm.',
  'Quý khách cần chuẩn bị các giấy tờ sau để hoàn tất thủ tục đăng ký.',
  'Chúng tôi đã nộp hồ sơ đăng ký doanh nghiệp. Kết quả sẽ có trong 3-5 ngày làm việc.',
  'Vui lòng thanh toán phí dịch vụ theo hóa đơn đính kèm.',
  'Chúng tôi đã hoàn thành việc tư vấn. Báo cáo chi tiết được gửi kèm theo email này.',
  'Quý khách có thể đặt lịch hẹn tư vấn trực tiếp tại văn phòng vào tuần tới.',
  'Chúng tôi đã gửi bản dự thảo hợp đồng. Vui lòng xem xét và phản hồi trước ngày mai.',
  'Hồ sơ của Quý khách đã được cập nhật trạng thái. Vui lòng kiểm tra trên hệ thống.',
  'Cảm ơn Quý khách đã tin tưởng sử dụng dịch vụ của chúng tôi.',
  'Chúng tôi xin thông báo về tiến độ xử lý yêu cầu của Quý khách.',
  'Vui lòng xác nhận lịch hẹn tư vấn vào ngày mai lúc 14:00.',
  'Chúng tôi đã hoàn tất việc rà soát và phát hiện một số điểm cần lưu ý.',
  'Quý khách vui lòng cung cấp thông tin người đại diện theo pháp luật.',
  'Hồ sơ đăng ký đã được nộp tại cơ quan có thẩm quyền.',
  'Chúng tôi đã nhận được phản hồi từ cơ quan thuế. Vui lòng xem chi tiết.',
  'Vui lòng ký vào các tài liệu đính kèm và gửi lại cho chúng tôi.',
  'Chúng tôi đã cập nhật điều lệ công ty theo yêu cầu của Quý khách.',
  'Quý khách cần chuẩn bị các giấy tờ sau để ký hợp đồng.',
  'Chúng tôi đã hoàn thành tất cả các công việc theo thỏa thuận. Cảm ơn Quý khách.',
];

export default async function seedOperations(tx: Prisma.TransactionClient, context: SeedContext) {
  console.log('Seeding operations data...');

  const { userIds, workspaceIds } = context;

  // Create 50 legal requests
  const requestIds: string[] = [];
  const statuses = ['draft_intake', 'intake_submitted', 'in_progress', 'pending_review', 'approved'];
  const priorities = ['low', 'medium', 'high', 'urgent'];

  for (let i = 0; i < 50; i++) {
    const status = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];
    const workspaceId = workspaceIds[i % workspaceIds.length];
    const createdById = userIds[i % 3 + 7]; // Customers
    const assignedSpecialistId = i % 3 === 0 ? userIds[i % 2 + 3] : null; // Specialists
    const assignedReviewerId = i % 4 === 0 ? userIds[i % 2 + 5] : null; // Reviewers

    const slaDays = i % 5 === 0 ? -5 : (i % 10) + 5; // Some overdue, some upcoming
    const slaDeadline = new Date();
    slaDeadline.setDate(slaDeadline.getDate() + slaDays);

    const request = await tx.legalRequest.create({
      data: {
        code: `REQ-2026-${String(i + 1).padStart(3, '0')}`,
        title: requestTitles[i],
        status,
        priority,
        workspaceId,
        createdById,
        assignedSpecialistId,
        assignedReviewerId,
        slaDeadline,
      },
    });
    requestIds.push(request.id);
  }
  console.log('  ✓ Legal requests:', requestIds.length);

  // Create 100 audit events
  const auditEventIds: string[] = [];
  const actionTypes = ['security', 'operations', 'access'];

  for (let i = 0; i < 100; i++) {
    const action = auditActions[i % auditActions.length];
    const actorId = userIds[i % userIds.length];
    const targetType = i % 5 === 0 ? 'user' : i % 3 === 0 ? 'request' : 'workspace';
    const targetId = targetType === 'request' ? requestIds[i % requestIds.length] : workspaceIds[i % workspaceIds.length];

    const auditEvent = await tx.auditEvent.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        ipAddress: `192.168.1.${(i % 255) + 1}`,
        metadata: JSON.stringify({
          timestamp: new Date(Date.now() - i * 3600000).toISOString(),
          details: `Audit event ${i + 1}`,
        }),
      },
    });
    auditEventIds.push(auditEvent.id);
  }
  console.log('  ✓ Audit events:', auditEventIds.length);

  // Create 20 vault files
  const vaultFileIds: string[] = [];
  const mimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  for (let i = 0; i < 20; i++) {
    const filename = vaultFilenames[i];
    const mimeType = mimeTypes[i % mimeTypes.length];
    const workspaceId = workspaceIds[i % workspaceIds.length];
    const uploaderId = userIds[i % userIds.length];
    const requestId = i % 2 === 0 ? requestIds[i % requestIds.length] : null;

    const vaultFile = await tx.vaultFile.create({
      data: {
        name: filename,
        mimeType,
        size: Math.floor(Math.random() * 5000000) + 100000, // 100KB to 5MB
        workspaceId,
        uploaderId,
        requestId,
        encryptedUrl: `https://storage.example.com/vault/${Date.now()}-${i}.enc`,
        version: 1,
      },
    });
    vaultFileIds.push(vaultFile.id);
  }
  console.log('  ✓ Vault files:', vaultFileIds.length);

  // Create 30 messages
  const messageIds: string[] = [];

  for (let i = 0; i < 30; i++) {
    const threadId = `thread-${Math.floor(i / 6) + 1}`; // 5 threads, 6 messages each
    const senderId = userIds[i % 2 === 0 ? 7 : 3]; // Alternate between customer and specialist
    const recipientId = userIds[i % 2 === 0 ? 3 : 7];
    const content = messageContents[i % messageContents.length];

    const message = await tx.message.create({
      data: {
        threadId,
        senderId,
        recipientId,
        content,
        isRead: i < 20, // First 20 are read
      },
    });
    messageIds.push(message.id);
  }
  console.log('  ✓ Messages:', messageIds.length);

  return {
    requestIds,
    auditEventIds,
    vaultFileIds,
    messageIds,
    counts: {
      requests: requestIds.length,
      auditEvents: auditEventIds.length,
      vaultFiles: vaultFileIds.length,
      messages: messageIds.length,
    },
  };
}
