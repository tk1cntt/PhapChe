import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample specialists and customers
const specialists = [
  { name: 'Hà Linh', initials: 'HL', email: 'ha.linh@example.test' },
  { name: 'Quang Dũng', initials: 'QD', email: 'quang.dung@example.test' },
  { name: 'Minh Trang', initials: 'MT', email: 'minh.trang@example.test' },
  { name: 'Khánh An', initials: 'KA', email: 'khanh.an@example.test' },
];

const customer = {
  name: 'Mai Phương',
  initials: 'MP',
  email: 'mai.Phuong@example.test',
};

// Sample message content
const messageContent = {
  thread1: [
    // Thread 1: HL - REQ-2026-019 · Phụ lục SLA
    { from: 'specialist', content: 'Chào chị Phương, em đã xem bản phụ lục SLA. Hiện còn thiếu mức phạt khi đối tác chậm thanh toán quá 15 ngày.' },
    { from: 'customer', content: 'Bên em muốn áp dụng mức 0.05%/ngày trên số tiền chậm thanh toán, tối đa 8% giá trị phần nghĩa vụ vi phạm.' },
    { from: 'specialist', content: 'Em ghi nhận. Chị xác nhận thêm phụ lục này áp dụng cho toàn bộ hợp đồng hiện tại hay chỉ đơn hàng phát sinh từ tháng 7/2026?' },
    { from: 'customer', content: 'Chỉ áp dụng cho đơn hàng phát sinh từ 01/07/2026. Các đơn hàng trước đó giữ nguyên điều khoản cũ.' },
    { from: 'specialist', content: 'Đã rõ. Em sẽ cập nhật bản nháp và gửi lại trong hôm nay trước 17:00.' },
  ],
  thread2: [
    // Thread 2: QD - REQ-2026-021 · Hợp đồng dịch vụ
    { from: 'specialist', content: 'Chào chị Phương, em đã soạn xong bản hợp đồng dịch vụ theo yêu cầu. Tuy nhiên, em có một số nhận xét về rủi ro liên quan đến điều khoản bảo mật.' },
    { from: 'customer', content: 'Em chia sẻ thêm chi tiết về các rủi ro được không?' },
    { from: 'specialist', content: 'Điều khoản bảo mật hiện tại chưa quy định rõ về trách nhiệm khi xảy ra rò rỉ dữ liệu. Em đề xuất bổ sung mức bồi thường tối đa 12 tháng phí dịch vụ.' },
    { from: 'customer', content: 'Mức bồi thường này có thể thương lượng được không? Bên đối tác có vẻ muốn giảm xuống 6 tháng.' },
  ],
  thread3: [
    // Thread 3: MT - Thông báo workspace
    { from: 'specialist', content: 'Chào mọi người, em xin thông báo rằng hồ sơ NDA đã hoàn tất và được lưu trong vault. Các bạn có thể kiểm tra và phản hồi nếu cần.' },
    { from: 'customer', content: 'Cảm ơn Minh Trang. Mình đã kiểm tra và không có gì cần chỉnh sửa.' },
  ],
  thread4: [
    // Thread 4: KA - REQ-2026-012 · Nhãn hiệu
    { from: 'specialist', content: 'Chào chị Phương, em vừa nhận được biên lai nộp đơn đăng ký nhãn hiệu từ Cục Sở hữu trí tuệ. Vui lòng kiểm tra thông tin chủ sở hữu trên biên lai.' },
    { from: 'customer', content: 'Mình đã kiểm tra, thông tin chủ sở hữu chính xác. Cảm ơn Khánh An đã hỗ trợ.' },
    { from: 'specialist', content: 'Không có gì ạ. Đơn đăng ký hiện đang trong giai đoạn thẩm định nội dung, dự kiến mất khoảng 1-2 tháng.' },
  ],
};

async function seedMessages() {
  console.log('Seeding message data...');

  // Get the demo workspace
  const workspace = await prisma.workspace.findUnique({
    where: { slug: 'demo-legal-workspace' },
  });

  if (!workspace) {
    console.log('Workspace not found. Run the main seed first.');
    return;
  }

  // Get legal requests to link messages
  const legalRequests = await prisma.legalRequest.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: 'desc' },
    take: 4,
  });

  console.log(`Found ${legalRequests.length} legal requests in workspace`);

  // Get or create customer user
  let customerUser = await prisma.user.findUnique({
    where: { email: customer.email },
  });

  if (!customerUser) {
    // Create customer user
    customerUser = await prisma.user.create({
      data: {
        name: customer.name,
        email: customer.email,
        isActive: true,
        emailVerified: true,
      },
    });

    // Add to workspace
    await prisma.workspaceMembership.create({
      data: {
        userId: customerUser.id,
        workspaceId: workspace.id,
        role: 'customer',
        isActive: true,
      },
    });

    console.log(`Created customer user: ${customer.name}`);
  }

  // Get or create specialist users and seed messages
  const threads = [messageContent.thread1, messageContent.thread2, messageContent.thread3, messageContent.thread4];

  for (let i = 0; i < specialists.length; i++) {
    const spec = specialists[i];
    let specialistUser = await prisma.user.findUnique({
      where: { email: spec.email },
    });

    if (!specialistUser) {
      // Create specialist user
      specialistUser = await prisma.user.create({
        data: {
          name: spec.name,
          email: spec.email,
          isActive: true,
          emailVerified: true,
        },
      });

      // Add to workspace
      await prisma.workspaceMembership.create({
        data: {
          userId: specialistUser.id,
          workspaceId: workspace.id,
          role: 'specialist',
          isActive: true,
        },
      });

      console.log(`Created specialist user: ${spec.name}`);
    }

    // Get legalRequestId for this thread (if exists)
    const legalRequestId = legalRequests[i]?.id || null;

    // Seed messages for this thread
    const threadMessages = threads[i];
    for (let j = 0; j < threadMessages.length; j++) {
      const msg = threadMessages[j];
      const senderId = msg.from === 'specialist' ? specialistUser.id : customerUser.id;
      const recipientId = msg.from === 'specialist' ? customerUser.id : specialistUser.id;

      // Calculate timestamp (most recent messages first, 12 minutes ago for first thread)
      const minutesAgo = i === 0 ? 12 + (j * 5) : i === 1 ? 45 + (j * 10) : i === 2 ? 120 + (j * 30) : 1440 + (j * 60);
      const createdAt = new Date(Date.now() - minutesAgo * 60 * 1000);

      // Check if message already exists
      const existingMessage = await prisma.message.findFirst({
        where: {
          workspaceId: workspace.id,
          senderId,
          content: msg.content,
        },
      });

      if (!existingMessage) {
        await prisma.message.create({
          data: {
            workspaceId: workspace.id,
            senderId,
            recipientId,
            content: msg.content,
            isRead: j < threadMessages.length - 1, // All except last message are read
            createdAt,
            legalRequestId, // LINK MESSAGE TO LEGAL REQUEST
          },
        });
      }
    }

    console.log(`Seeded messages for thread with ${spec.name}${legalRequestId ? ' (linked to request)' : ''}`);
  }

  console.log('Message seeding complete!');
}

seedMessages()
  .catch((error) => {
    console.error('Error seeding messages:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { seedMessages };
