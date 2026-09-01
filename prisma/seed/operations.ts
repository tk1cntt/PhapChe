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

const requestMatterTypes = [
  'labor_contract',        // 1
  'contract_drafting',     // 2
  'trademark',             // 3
  'incorporation',         // 4
  'regulatory',            // 5
  'contract_drafting',     // 6
  'regulatory',            // 7
  'corporate_governance',  // 8
  'copyright',             // 9
  'regulatory',            // 10
  'labor_contract',        // 11
  'contract_drafting',     // 12
  'trademark',             // 13
  'incorporation',         // 14
  'regulatory',            // 15
  'service_agreement',     // 16
  'nda',                   // 17
  'service_agreement',     // 18
  'mna',                   // 19
  'trademark',             // 20
  'distribution_contract', // 21
  'labor_contract',        // 22
  'internal_regulation',   // 23
  'patent',                // 24
  'contract_drafting',     // 25
  'regulatory',            // 26
  'contract_review',       // 27
  'contract_drafting',     // 28
  'business_registration', // 29
  'labor_contract',        // 30
  'contract_drafting',     // 31
  'contract_drafting',     // 32
  'trademark',             // 33
  'regulatory',            // 34
  'agency_contract',       // 35
  'internal_regulation',   // 36
  'internal_regulation',   // 37
  'copyright',             // 38
  'regulatory',            // 39
  'contract_drafting',     // 40
  'contract_drafting',     // 41
  'trademark',             // 42
  'dispute',               // 43
  'contract_drafting',     // 44
  'data_protection',       // 45
  'privacy_compliance',    // 46
  'trademark',             // 47
  'legal_advice',          // 48
  'contract_drafting',     // 49
  'contract_drafting',     // 50
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

  // Create 50 legal requests across all workflow statuses
  const requestIds: string[] = [];
  // Full workflow cycle: draft_intake → triage → assigned → in_progress → pending_review → revision_required → approved → delivered → closed
  const statuses = [
    'draft_intake', 'triage', 'triage',
    'assigned', 'assigned', 'in_progress', 'in_progress',
    'pending_review', 'pending_review',
    'revision_required',
    'approved', 'approved',
    'delivered', 'closed',
  ];
  const priorities = ['low', 'medium', 'high', 'urgent'];

  for (let i = 0; i < 50; i++) {
    const status = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];
    const workspaceId = workspaceIds[i % workspaceIds.length];
    const createdById = userIds[i % 3 + 7]; // Customers
    const assignedSpecialistId = i % 3 === 0 ? userIds[i % 2 + 3] : null; // Specialists
    const assignedReviewerId = i % 4 === 0 ? userIds[i % 2 + 5] : null; // Reviewers

    // Use realistic SLA ranges (3, 5, 7, 10, 14 days)
    const slaDays = [3, 5, 7, 10, 14][i % 5];
    const slaDeadline = new Date();
    slaDeadline.setDate(slaDeadline.getDate() + slaDays);

    const request = await tx.legalRequest.create({
      data: {
        code: `REQ-2026-${String(i + 1).padStart(3, '0')}`,
        title: requestTitles[i],
        matterType: requestMatterTypes[i] ?? null,
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
        workspaceId: workspaceIds[i % workspaceIds.length],
        action,
        targetType,
        targetId,
        metadataSummary: `Event ${i + 1}: ${action} on ${targetType} from 192.168.1.${(i % 255) + 1}`,
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
    const requestId = requestIds[i % requestIds.length];

    const vaultFile = await tx.vaultFile.create({
      data: {
        storageKey: `vault/${Date.now()}-${i}.pdf`,
        contentType: mimeType,
        size: Math.floor(Math.random() * 5000000) + 100000,
        workspace: { connect: { id: workspaceId } },
        actor: { connect: { id: uploaderId } },
        request: { connect: { id: requestId } },
        fileKind: 'document',
      },
    });
    vaultFileIds.push(vaultFile.id);
  }
  console.log('  ✓ Vault files:', vaultFileIds.length);

  // ── Rich conversational message threads ──
  // Pick 15 requests that match the messages page filter
  // (status in triage | assigned | in_progress | pending_review | revision_required)
  // and that have an assigned specialist.
  const threadDefs: Array<{
    requestIdx: number;
    specialistIdx: 3 | 4;  // userIds index for specialist
    messages: Array<{ from: 'specialist' | 'customer'; content: string }>;
  }> = [
    // ── Thread 1: Hợp đồng lao động (request idx 0 → triage, assigned to specialist) ──
    {
      requestIdx: 1, specialistIdx: 3,
      messages: [
        { from: 'specialist', content: 'Chào chị Hương, em đã tiếp nhận yêu cầu tư vấn hợp đồng lao động của bên mình. Chị cho em xin thêm bản mô tả công việc của vị trí đang tuyển để em tham khảo khi soạn điều khoản nhé.' },
        { from: 'customer', content: 'Chào em, chị gửi file JD đính kèm. Vị trí này là nhân viên kinh doanh, cần có điều khoản thử việc 2 tháng và điều khoản bảo mật sau khi nghỉ việc.' },
        { from: 'specialist', content: 'Dạ em đã nhận file. Em sẽ soạn hợp đồng với thời gian thử việc 60 ngày và điều khoản bảo mật có thời hạn 12 tháng sau khi chấm dứt HĐLĐ. Chị thấy vậy ổn không ạ?' },
        { from: 'customer', content: 'Thời hạn bảo mật 12 tháng hơi ngắn. Bên chị muốn 24 tháng vì vị trí này tiếp xúc với danh sách khách hàng.' },
        { from: 'specialist', content: 'Em hiểu. Tuy nhiên theo Bộ luật Lao động 2019, thời hạn bảo mật hợp lý thường không quá 3 năm tùy tính chất. Em sẽ để 24 tháng nhưng cần chị xác nhận danh sách thông tin mật cụ thể để ghi rõ trong phụ lục.' },
        { from: 'customer', content: 'OK em, để chị soạn danh sách gửi em vào chiều nay.' },
        { from: 'specialist', content: 'Dạ vâng, em gửi chị bản nháp hợp đồng trước. Chị check sơ các điều khoản chính rồi mình bổ sung phụ lục sau ạ.' },
      ],
    },
    // ── Thread 2: Hợp đồng thương mại (request idx 11 → assigned, specialist2) ──
    {
      requestIdx: 3, specialistIdx: 4,
      messages: [
        { from: 'specialist', content: 'Chào anh Ích, em là Hoàng Văn Em - chuyên viên phụ trách soạn thảo hợp đồng thương mại của anh. Em đã xem yêu cầu, bên mình cần hợp đồng mua bán hàng hóa với đối tác ABC Corp đúng không ạ?' },
        { from: 'customer', content: 'Đúng rồi em. Bọn anh đã thỏa thuận miệng với ABC Corp các điều khoản cơ bản. Em soạn hợp đồng dựa trên thỏa thuận này nhé: tổng giá trị 2.5 tỷ, giao hàng 3 đợt, thanh toán từng đợt.' },
        { from: 'specialist', content: 'Em ghi nhận. Em sẽ thêm điều khoản phạt vi phạm 8% giá trị hợp đồng và điều khoản bất khả kháng. Anh cho em hỏi thêm: hàng hóa có yêu cầu gì đặc biệt về bảo quản không ạ?' },
        { from: 'customer', content: 'Hàng là thiết bị điện tử, cần bảo quản trong kho mát, độ ẩm < 60%. Em thêm điều khoản về tiêu chuẩn giao hàng và bảo hành 12 tháng nhé.' },
        { from: 'specialist', content: 'Dạ rõ. Em cũng thêm điều khoản về quyền sở hữu trí tuệ đối với phần mềm đi kèm thiết bị. Chiều nay em gửi bản nháp, anh check giúp em.' },
        { from: 'customer', content: 'OK em. À, bên ABC Corp còn yêu cầu thêm điều khoản bảo mật thông tin khách hàng của họ. Em bổ sung luôn nhé.' },
        { from: 'specialist', content: 'Dạ em sẽ thêm phụ lục NDA riêng cho thông tin khách hàng của ABC Corp. Cuối ngày em gửi đầy đủ bản nháp ạ.' },
        { from: 'customer', content: 'Tuyệt vời, cảm ơn em.' },
      ],
    },
    // ── Thread 3: Đăng ký nhãn hiệu (request idx 12 → triage, specialist1) ──
    {
      requestIdx: 12, specialistIdx: 3,
      messages: [
        { from: 'customer', content: 'Chào chuyên viên, bên em muốn đăng ký nhãn hiệu cho sản phẩm mới tên là "EcoFresh". Cho em hỏi thủ tục cần những gì ạ?' },
        { from: 'specialist', content: 'Chào chị Kim, em là Phạm Thị Dung. Để đăng ký nhãn hiệu "EcoFresh", bên mình cần chuẩn bị: (1) Mẫu nhãn hiệu, (2) Danh mục sản phẩm/dịch vụ đăng ký theo bảng phân loại Nice, (3) Giấy ủy quyền nếu nhờ bên em nộp hộ.' },
        { from: 'customer', content: 'Bên em muốn ủy quyền cho bên chị nộp luôn. Chị cho em xin mẫu giấy ủy quyền. Về danh mục sản phẩm thì bên em làm về thực phẩm chức năng.' },
        { from: 'specialist', content: 'Dạ thực phẩm chức năng thuộc nhóm 5 theo bảng phân loại Nice. Em gửi chị mẫu giấy ủy quyền và tờ khai đăng ký nhãn hiệu. Chị điền thông tin và gửi lại em kèm 5 mẫu nhãn hiệu (PNG/JPG) trong tuần này nhé.' },
        { from: 'customer', content: 'OK chị. Em cũng muốn hỏi, thời gian đăng ký mất bao lâu và chi phí thế nào?' },
        { from: 'specialist', content: 'Thời gian thẩm định hình thức khoảng 1 tháng, thẩm định nội dung khoảng 9-12 tháng. Tổng thời gian có Giấy chứng nhận là 12-18 tháng. Chi phí: lệ phí nhà nước 1 triệu/nhóm sản phẩm + phí dịch vụ bên em 3 triệu. Em gửi báo giá chi tiết qua email ạ.' },
        { from: 'customer', content: 'Cảm ơn chị Dung nhiều. Để em sắp xếp gửi hồ sơ trong tuần.' },
        { from: 'specialist', content: 'Dạ không có gì ạ. Khi nào chị gửi hồ sơ em sẽ kiểm tra và tiến hành nộp đơn ngay trong ngày.' },
      ],
    },
    // ── Thread 4: Thành lập doanh nghiệp (request idx 13 → assigned, specialist2) ──
    {
      requestIdx: 4, specialistIdx: 4,
      messages: [
        { from: 'specialist', content: 'Chào chị Hương, em đã nhận yêu cầu tư vấn thành lập công ty TNHH 2 thành viên. Chị cho em xin: CMND/CCCD của các thành viên góp vốn, dự thảo điều lệ (nếu có), và địa chỉ trụ sở dự kiến.' },
        { from: 'customer', content: 'Em ơi, bên chị có 2 thành viên: chị góp 70%, bạn chị góp 30%. Trụ sở dự kiến ở 123 Nguyễn Huệ, Quận 1. Ngành nghề kinh doanh chính là tư vấn quản lý.' },
        { from: 'specialist', content: 'Dạ em ghi nhận. Với ngành tư vấn quản lý (mã ngành 7020), không yêu cầu vốn pháp định. Chị cần chuẩn bị: bản sao CCCD công chứng, giấy đề nghị đăng ký doanh nghiệp, điều lệ công ty, và danh sách thành viên.' },
        { from: 'customer', content: 'Em soạn giúp chị điều lệ và các giấy tờ cần thiết luôn nhé. Vốn điều lệ bên chị dự kiến 3 tỷ.' },
        { from: 'specialist', content: 'OK chị. Em sẽ soạn toàn bộ hồ sơ: điều lệ, giấy đề nghị, danh sách thành viên, và văn bản ủy quyền nộp hồ sơ. Chị chỉ cần ký và gửi lại CCCD công chứng.' },
        { from: 'customer', content: 'Bao lâu thì có giấy phép em nhỉ?' },
        { from: 'specialist', content: 'Thời gian xử lý tại Sở KHĐT là 3-5 ngày làm việc kể từ khi nộp hồ sơ hợp lệ. Em dự kiến gửi hồ sơ cho chị ký vào ngày mai, nộp vào thứ 2 tuần sau, và khoảng thứ 5-6 sẽ có kết quả ạ.' },
        { from: 'customer', content: 'Nhanh quá, cảm ơn em. Chị sẽ gửi CCCD công chứng trong hôm nay.' },
      ],
    },
    // ── Thread 5: Rà soát tuân thủ (request idx 14 → assigned, specialist1) ──
    {
      requestIdx: 5, specialistIdx: 3,
      messages: [
        { from: 'specialist', content: 'Chào anh Ích, em nhận yêu cầu rà soát tuân thủ pháp lý cho doanh nghiệp của anh. Em cần anh cung cấp: giấy phép đăng ký kinh doanh, các báo cáo thuế gần nhất, hợp đồng lao động mẫu, và chính sách bảo mật hiện tại của công ty.' },
        { from: 'customer', content: 'Em cho chị xin checklist đầy đủ để chị chuẩn bị một lần. Bên chị là công ty công nghệ 40 nhân viên.' },
        { from: 'specialist', content: 'Dạ đây là checklist các mảng cần rà soát:\n1. Giấy phép con (nếu có) - đã đầy đủ và còn hiệu lực?\n2. Hợp đồng lao động - đã ký với 100% nhân viên?\n3. Chính sách bảo mật dữ liệu - phù hợp Nghị định 13/2023/NĐ-CP?\n4. Điều khoản sử dụng website/app\n5. Hợp đồng với đối tác/khách hàng mẫu\nAnh gửi em từng mục theo checklist là được ạ.' },
        { from: 'customer', content: 'OK rõ ràng quá. Để chị tập hợp trong 2-3 ngày rồi gửi em.' },
        { from: 'specialist', content: 'Dạ vâng, khi nào anh gửi xong em sẽ rà soát trong 5 ngày làm việc và gửi báo cáo có đánh dấu các điểm rủi ro + đề xuất khắc phục.' },
      ],
    },
    // ── Thread 6: Đàm phán hợp đồng (request idx 15 → in_progress, specialist2) ──
    {
      requestIdx: 6, specialistIdx: 4,
      messages: [
        { from: 'customer', content: 'Em ơi, đối tác gửi lại bản hợp đồng họ tự soạn. Chị thấy có mấy điều khoản bất lợi. Em xem giúp chị nhé.' },
        { from: 'specialist', content: 'Chào chị Kim, em đã xem bản hợp đồng đối tác gửi. Em thấy có 3 điểm cần lưu ý: (1) điều khoản phạt vi phạm 15% là quá cao so với quy định 8% của Luật Thương mại, (2) thời hạn thanh toán 90 ngày quá dài, (3) điều khoản chấm dứt không có thời gian báo trước.' },
        { from: 'customer', content: 'Chị cũng thấy vậy. Em giúp chị soạn email phản hồi đề xuất sửa: phạt 8%, thanh toán 30 ngày, báo trước 30 ngày khi chấm dứt.' },
        { from: 'specialist', content: 'Dạ em soạn email phản hồi kèm bản hợp đồng đã đánh dấu các điểm đề xuất sửa. Chị xem trước khi em gửi cho đối tác nhé.' },
        { from: 'customer', content: 'Chị xem rồi, OK em gửi đi. À thêm 1 ý: bên mình muốn thêm điều khoản giải quyết tranh chấp tại VIAC thay vì tòa án.' },
        { from: 'specialist', content: 'Dạ em bổ sung điều khoản trọng tài VIAC. Vậy là bản đề xuất gồm 4 điểm sửa chính. Em gửi email ngay cho đối tác ạ.' },
        { from: 'customer', content: 'Tốt quá. Cảm ơn em.' },
      ],
    },
    // ── Thread 7: Tư vấn bất động sản (request idx 16 → in_progress, specialist1) ──
    {
      requestIdx: 7, specialistIdx: 3,
      messages: [
        { from: 'specialist', content: 'Chào chị Hương, em đã xem hồ sơ căn hộ chị định mua tại dự án Masteri. Em có vài lưu ý: (1) Chủ đầu tư đã có giấy phép xây dựng nhưng chưa có sổ hồng từng căn, (2) Hợp đồng mua bán mẫu có điều khoản phạt cọc 20% nếu hủy ngang - theo em là cao.' },
        { from: 'customer', content: 'Chị cũng lo vụ sổ hồng. Em tư vấn giúp chị nên thương lượng những gì?' },
        { from: 'specialist', content: 'Em đề xuất: (1) Bổ sung điều khoản cam kết thời hạn giao sổ hồng của CĐT, (2) Giảm phạt cọc xuống 10%, (3) Thêm điều kiện hoàn cọc nếu CĐT chậm giao sổ quá 6 tháng, (4) Kiểm tra kỹ biên bản bàn giao căn hộ.' },
        { from: 'customer', content: 'Hay quá, em soạn giúp chị phụ lục bổ sung những điều này để gửi cho CĐT.' },
        { from: 'specialist', content: 'Dạ em soạn phụ lục và gửi chị trong sáng mai. Chị cho em xin thêm thông tin: căn hộ thanh toán theo tiến độ hay vay ngân hàng ạ?' },
        { from: 'customer', content: 'Chị vay 70% bên Vietcombank, đã có thư phê duyệt khoản vay.' },
        { from: 'specialist', content: 'Dạ vậy em sẽ thêm điều khoản về việc CĐT phải hỗ trợ thủ tục thế chấp và giải chấp với ngân hàng. Sáng mai em gửi đầy đủ.' },
      ],
    },
    // ── Thread 8: Soạn điều lệ (request idx 17 → pending_review, specialist2) ──
    {
      requestIdx: 8, specialistIdx: 4,
      messages: [
        { from: 'specialist', content: 'Chào chị Kim, em đã soạn xong bản dự thảo Điều lệ công ty cổ phần theo yêu cầu. Các điểm chính: vốn điều lệ 20 tỷ, cổ phần phổ thông 100%, HĐQT 5 thành viên, Ban kiểm soát 3 thành viên. Chị xem qua và cho em ý kiến ạ.' },
        { from: 'customer', content: 'Em ơi, chị muốn sửa: HĐQT 7 thành viên thay vì 5, và thêm quy định về cổ phần ưu đãi biểu quyết cho cổ đông sáng lập.' },
        { from: 'specialist', content: 'Dạ em ghi nhận. Với cổ phần ưu đãi biểu quyết, em sẽ bổ sung điều khoản: cổ đông sáng lập được quyền biểu quyết gấp 3 lần trong 3 năm đầu, sau đó chuyển về 1:1. Theo Luật Doanh nghiệp 2020, quy định này cần được ĐHĐCĐ thông qua với tỷ lệ 65%.' },
        { from: 'customer', content: 'OK em, vậy là ổn. Em cập nhật bản dự thảo và gửi lại chị nhé. Về cơ cấu HĐQT thì: 1 chủ tịch, 1 phó chủ tịch, 5 ủy viên. Nhiệm kỳ 5 năm.' },
        { from: 'specialist', content: 'Dạ em cập nhật và gửi bản mới. Chị lưu ý: cần tổ chức họp ĐHĐCĐ để thông qua điều lệ trước khi nộp hồ sơ đăng ký doanh nghiệp ạ.' },
        { from: 'customer', content: 'Chị biết rồi. Đang lên lịch họp tuần sau. Cảm ơn em.' },
        { from: 'specialist', content: 'Dạ không có gì ạ. Em gửi kèm biên bản họp ĐHĐCĐ mẫu để chị tham khảo luôn.' },
      ],
    },
    // ── Thread 9: Đăng ký bản quyền (request idx 18 → pending_review, specialist1) ──
    {
      requestIdx: 9, specialistIdx: 3,
      messages: [
        { from: 'customer', content: 'Chào chị Dung, bên em có một phần mềm quản lý kho muốn đăng ký bản quyền. Cho em hỏi thủ tục thế nào?' },
        { from: 'specialist', content: 'Chào anh Ích, với phần mềm quản lý kho, mình sẽ đăng ký quyền tác giả tại Cục Bản quyền tác giả. Cần chuẩn bị: mã nguồn (có thể nộp bản rút gọn), tài liệu mô tả phần mềm, giao diện chính và quy trình hoạt động.' },
        { from: 'customer', content: 'Bên em đã có đầy đủ tài liệu. Thời gian và chi phí thế nào chị?' },
        { from: 'specialist', content: 'Chi phí dịch vụ bên em: 4 triệu + lệ phí nhà nước 600k. Thời gian: 15-20 ngày làm việc để có Giấy chứng nhận. Em gửi chị báo giá và danh sách hồ sơ cần chuẩn bị.' },
        { from: 'customer', content: 'OK chị, gửi em báo giá. Em muốn làm luôn trong tuần này.' },
        { from: 'specialist', content: 'Dạ em gửi. Anh gửi hồ sơ trước thứ 5, em sẽ nộp vào thứ 6 và gửi anh biên lai nộp hồ sơ.' },
        { from: 'customer', content: 'OK, em sẽ gửi đầy đủ vào thứ 4. Cảm ơn chị.' },
      ],
    },
    // ── Thread 10: Tư vấn thuế (request idx 19 → revision_required, specialist2) ──
    {
      requestIdx: 10, specialistIdx: 4,
      messages: [
        { from: 'specialist', content: 'Chào chị Hương, em đã xem báo cáo tài chính và tờ khai thuế 6 tháng đầu năm của bên mình. Em có một số lưu ý: (1) Chi phí lương chưa có hợp đồng lao động chính thức, (2) Một số hóa đơn đầu vào trên 20 triệu thanh toán tiền mặt - rủi ro không được khấu trừ.' },
        { from: 'customer', content: 'Em nói rõ hơn về vụ hóa đơn trên 20 triệu được không? Chị tưởng vẫn được khấu trừ bình thường.' },
        { from: 'specialist', content: 'Dạ theo Thông tư 78/2014/TT-BTC và Nghị định 123/2020/NĐ-CP: hóa đơn từ 20 triệu trở lên phải thanh toán qua ngân hàng mới được khấu trừ thuế GTGT đầu vào. Nếu thanh toán tiền mặt, cơ quan thuế sẽ loại chi phí này khi thanh tra.' },
        { from: 'customer', content: 'Ôi không biết luôn. Vậy giờ sao em? Bên chị có khoảng 5-6 hóa đơn như vậy trong 6 tháng qua.' },
        { from: 'specialist', content: 'Em đề xuất: (1) Lập phụ lục hợp đồng và chuyển khoản bổ sung cho các giao dịch chưa quá 6 tháng, (2) Với giao dịch đã quá hạn: ghi nhận là chi phí không được trừ khi tính thuế TNDN - chỉ mất phần ưu đãi thuế chứ không bị phạt, (3) Từ nay trở đi luôn chuyển khoản với hóa đơn ≥20 triệu.' },
        { from: 'customer', content: 'OK em, chị sẽ làm theo cách 1 với mấy giao dịch gần đây. Em giúp chị soạn công văn giải trình phòng khi thuế hỏi nhé.' },
        { from: 'specialist', content: 'Dạ em soạn công văn giải trình và hướng dẫn thanh toán bổ sung. Chị yên tâm, đây là lỗi thường gặp và hoàn toàn xử lý được.' },
      ],
    },
    // ── Thread 11: Hợp đồng thuê văn phòng (request idx 31 → assigned, specialist1) ──
    {
      requestIdx: 16, specialistIdx: 3,
      messages: [
        { from: 'customer', content: 'Chào chị Dung, em sắp thuê văn phòng mới ở Quận 3. Bên cho thuê gửi hợp đồng mẫu, chị xem giúp em với.' },
        { from: 'specialist', content: 'Chào chị Kim, em đã xem hợp đồng. Có vài điểm cần sửa: (1) Giá thuê chưa rõ đã bao gồm VAT và phí quản lý chưa, (2) Điều khoản tăng giá 10%/năm là cao, thị trường thường 5-7%, (3) Tiền cọc 6 tháng là quá cao so với thông lệ 2-3 tháng.' },
        { from: 'customer', content: 'Chị đồng ý với các điểm sửa. Em giúp chị đề xuất cụ thể: giá thuê đã gồm VAT + phí QL, tăng giá 5%/năm, cọc 3 tháng.' },
        { from: 'specialist', content: 'Dạ em soạn email phản hồi kèm bản hợp đồng đã mark-up các điểm sửa. Ngoài ra em thêm điều khoản: bên cho thuê phải hoàn cọc trong 30 ngày kể từ khi hết hạn thuê, và điều khoản sửa chữa lớn do chủ nhà chịu.' },
        { from: 'customer', content: 'OK em, gửi cho chị bản final để chị review rồi gửi cho bên cho thuê.' },
        { from: 'specialist', content: 'Dạ em gửi chị ạ. Chị xem có cần chỉnh gì thêm không, em gửi cho bên cho thuê trong hôm nay.' },
      ],
    },
    // ── Thread 12: NDA (request idx 32 → assigned, specialist2) ──
    {
      requestIdx: 17, specialistIdx: 4,
      messages: [
        { from: 'customer', content: 'Em ơi, bên chị sắp ký NDA với đối tác Nhật. Họ gửi bản tiếng Anh, em xem giúp chị có điều khoản nào bất lợi không?' },
        { from: 'specialist', content: 'Chào anh Ích, em đã xem bản NDA. Có 2 điểm cần lưu ý: (1) Thời hạn bảo mật "vô thời hạn" là bất lợi, nên giới hạn 3-5 năm, (2) Luật áp dụng là luật Nhật Bản và tòa án Tokyo - nên đề xuất chọn luật Việt Nam và trọng tài VIAC hoặc SIAC.' },
        { from: 'customer', content: 'Vụ luật áp dụng quan trọng thật. Chị sẽ đề nghị luật Việt Nam và VIAC. Còn thời hạn bảo mật em đề xuất 5 năm nhé.' },
        { from: 'specialist', content: 'Dạ hợp lý. Em soạn bản NDA song ngữ (Việt - Anh) để tiện cho cả hai bên, và mark-up các điểm đề xuất sửa. Chị duyệt rồi em gửi cho đối tác.' },
        { from: 'customer', content: 'Tốt quá, cảm ơn em. Em làm bản song ngữ luôn nhé.' },
        { from: 'specialist', content: 'Dạ em sẽ gửi chị bản song ngữ vào sáng mai. Đối tác Nhật thường rất kỹ về NDA nên mình làm cẩn thận ngay từ đầu sẽ thuận lợi hơn ạ.' },
        { from: 'customer', content: 'Đúng rồi, họ rất kỹ khoản này. Cảm ơn em.' },
      ],
    },
    // ── Thread 13: Hợp đồng dịch vụ IT (request idx 33 → in_progress, specialist1) ──
    {
      requestIdx: 18, specialistIdx: 3,
      messages: [
        { from: 'specialist', content: 'Chào chị Hương, em đã soạn xong hợp đồng dịch vụ IT theo yêu cầu: phát triển phần mềm quản lý nhân sự, thời gian 6 tháng, thanh toán 3 đợt. Chị xem qua giúp em.' },
        { from: 'customer', content: 'Chị xem rồi. Có 2 điểm cần sửa: (1) thời gian bảo hành tăng từ 6 lên 12 tháng, (2) thêm điều khoản hỗ trợ kỹ thuật 24/7 trong giờ hành chính sau bàn giao.' },
        { from: 'specialist', content: 'Dạ em cập nhật. Với bảo hành 12 tháng, em thêm điều khoản: lỗi critical fix trong 4h, lỗi major fix trong 24h, lỗi minor fix trong 72h. Còn hỗ trợ 24/7 sẽ là support level 2 (email + điện thoại) trong giờ hành chính, ngoài giờ chỉ email.' },
        { from: 'customer', content: 'Rõ ràng, OK em. À, thêm 1 ý: bên chị muốn sở hữu toàn bộ mã nguồn sau khi bàn giao, không phải license.' },
        { from: 'specialist', content: 'Dạ em thêm điều khoản chuyển giao toàn bộ quyền sở hữu trí tuệ (bao gồm mã nguồn, tài liệu thiết kế, database schema) cho bên mình sau khi thanh toán đợt cuối cùng. Chị xem bản cập nhật nhé.' },
        { from: 'customer', content: 'Hoàn hảo! Chị duyệt bản này. Em gửi cho đối tác ký nhé.' },
        { from: 'specialist', content: 'Dạ em gửi ngay. Khi nào đối tác ký xong em báo chị ạ.' },
      ],
    },
    // ── Thread 14: Sáp nhập doanh nghiệp (request idx 34 → pending_review, specialist2) ──
    {
      requestIdx: 19, specialistIdx: 4,
      messages: [
        { from: 'customer', content: 'Chào em, bên chị đang có kế hoạch sáp nhập công ty con vào công ty mẹ. Em tư vấn giúp chị quy trình và thủ tục.' },
        { from: 'specialist', content: 'Chào chị Kim, sáp nhập doanh nghiệp cần các bước: (1) Hoàn tất nghĩa vụ thuế và BHXH của công ty bị sáp nhập, (2) Thông qua nghị quyết sáp nhập tại ĐHĐCĐ/HĐTV, (3) Ký hợp đồng sáp nhập, (4) Đăng ký thay đổi nội dung đăng ký doanh nghiệp tại Sở KHĐT.' },
        { from: 'customer', content: 'Bên chị đã thông qua nghị quyết rồi. Em giúp chị soạn hợp đồng sáp nhập và hồ sơ nộp Sở KHĐT.' },
        { from: 'specialist', content: 'Dạ em cần thêm: (1) Báo cáo tài chính kiểm toán của cả 2 công ty, (2) Phương án sử dụng lao động sau sáp nhập, (3) Danh sách chủ nợ và phương án xử lý nợ.' },
        { from: 'customer', content: 'OK em, chị gửi trong 2 ngày. Còn thời gian làm thủ tục mất bao lâu?' },
        { from: 'specialist', content: 'Dạ sau khi nộp hồ sơ đầy đủ, Sở KHĐT xử lý trong 3-5 ngày làm việc. Công ty bị sáp nhập sẽ chấm dứt tồn tại, toàn bộ quyền và nghĩa vụ chuyển sang công ty nhận sáp nhập. Em sẽ soạn trước hợp đồng sáp nhập dựa trên thông tin sơ bộ, chị bổ sung số liệu tài chính sau.' },
        { from: 'customer', content: 'Tuyệt vời, cảm ơn em. Chị sẽ gửi hồ sơ sớm.' },
        { from: 'specialist', content: 'Dạ em gửi chị bản dự thảo hợp đồng sáp nhập và checklist hồ sơ cần chuẩn bị. Chị kiểm tra giúp em.' },
      ],
    },
    // ── Thread 15: Tranh chấp lao động (request idx 35 → pending_review, specialist1) ──
    {
      requestIdx: 20, specialistIdx: 3,
      messages: [
        { from: 'customer', content: 'Chào chị Dung, bên em đang có 1 nhân viên đơn phương chấm dứt HĐLĐ không báo trước. Em muốn khởi kiện đòi bồi thường. Chị tư vấn giúp.' },
        { from: 'specialist', content: 'Chào anh Ích, trường hợp này cần làm rõ: (1) Nhân viên đó có thuộc trường hợp được đơn phương chấm dứt không cần báo trước không (bị quấy rối, không được trả lương đầy đủ...)? (2) Đã có biên bản xác nhận nghỉ việc chưa?' },
        { from: 'customer', content: 'Nhân viên tự ý nghỉ, không có lý do chính đáng. Bên em đã gửi thư mời làm việc 3 lần nhưng không phản hồi. Chưa có biên bản.' },
        { from: 'specialist', content: 'Dạ vậy cơ sở pháp lý rõ ràng rồi. Theo Bộ luật Lao động 2019, NLĐ đơn phương chấm dứt trái luật phải bồi thường 1/2 tháng lương + hoàn trả chi phí đào tạo (nếu có). Em soạn: (1) Biên bản xác nhận nghỉ việc không lý do, (2) Đơn khởi kiện ra tòa án, (3) Bảng kê thiệt hại cụ thể.' },
        { from: 'customer', content: 'OK em, làm giúp chị. Thiệt hại: chưa bàn giao công việc, mất 1 khách hàng vì không có người phụ trách.' },
        { from: 'specialist', content: 'Dạ em soạn hồ sơ khởi kiện. Anh chuẩn bị: HĐLĐ đã ký, bảng lương 3 tháng gần nhất, các thư mời làm việc đã gửi, và bằng chứng về thiệt hại khách hàng. Khi nào có đủ em nộp đơn cho anh.' },
        { from: 'customer', content: 'OK chị, em tập hợp và gửi trong hôm nay.' },
        { from: 'specialist', content: 'Dạ vâng, nhận được hồ sơ em sẽ hoàn thiện đơn khởi kiện và gửi lại anh ký trước khi nộp tòa.' },
      ],
    },
  ];

  const messageIds: string[] = [];
  const now = Date.now();

  for (const thread of threadDefs) {
    const request = requestIds[thread.requestIdx];
    if (!request) continue;

    // Pick actual user IDs based on the request's customer and specialist
    const reqIdx = thread.requestIdx;
    const customerIdx = 7 + (reqIdx % 3); // 7,8,9 = customer1,2,3
    const specialistUserId = userIds[thread.specialistIdx];
    const customerUserId = userIds[customerIdx];

    // Use the request's workspace
    const wsId = workspaceIds[reqIdx % workspaceIds.length];

    const msgCount = thread.messages.length;
    for (let j = 0; j < msgCount; j++) {
      const msg = thread.messages[j];
      const senderId = msg.from === 'specialist' ? specialistUserId : customerUserId;
      const recipientId = msg.from === 'specialist' ? customerUserId : specialistUserId;

      // Spread threads across the last 72 hours, each message 3-15 min apart.
      // j=0 (opening message) → OLDEST, j=last (newest reply) → NEWEST, so the
      // messages page renders cũ→mới (ascending createdAt).
      const threadBaseMs = now - (threadDefs.indexOf(thread) * 180 * 60 * 1000); // 3h apart per thread
      const msgOffsetMs = (msgCount - 1 - j) * (3 + (j % 5) * 3) * 60 * 1000; // 3-15 min between messages
      const createdAt = new Date(threadBaseMs - msgOffsetMs);

      // Last message in each thread is unread for even-indexed threads
      const isRead = j < msgCount - 1 || (threadDefs.indexOf(thread) % 2 === 0);

      const message = await tx.message.create({
        data: {
          workspaceId: wsId,
          legalRequestId: request,
          senderId,
          recipientId,
          content: msg.content,
          isRead,
          createdAt,
        },
      });
      messageIds.push(message.id);
    }
  }
  console.log('  ✓ Messages:', messageIds.length, `(${threadDefs.length} threads)`);

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
