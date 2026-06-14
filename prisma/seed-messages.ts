import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample specialists
const specialists = [
  { name: 'Hà Linh', email: 'ha.linh@example.test' },
  { name: 'Quang Dũng', email: 'quang.dung@example.test' },
  { name: 'Minh Trang', email: 'minh.trang@example.test' },
  { name: 'Khánh An', email: 'khanh.an@example.test' },
];

const customer = {
  name: 'Mai Phương',
  // Use the actual customer email that has active workspace membership
  email: 'mai.phuong@anphat.vn',
};

// Sample message content per specialist
const messageContent = [
  [ // Specialist 1 - Hà Linh
    { from: 'specialist', content: 'Chào chị Phương, em đã xem bản phụ lục SLA. Hiện còn thiếu mức phạt khi đối tác chậm thanh toán quá 15 ngày.' },
    { from: 'customer', content: 'Bên em muốn áp dụng mức 0.05%/ngày trên số tiền chậm thanh toán, tối đa 8% giá trị phần nghĩa vụ vi phạm.' },
    { from: 'specialist', content: 'Em ghi nhận. Chị xác nhận thêm phụ lục này áp dụng cho toàn bộ hợp đồng hiện tại hay chỉ đơn hàng phát sinh từ tháng 7/2026?' },
    { from: 'customer', content: 'Chỉ áp dụng cho đơn hàng phát sinh từ 01/07/2026. Các đơn hàng trước đó giữ nguyên điều khoản cũ.' },
    { from: 'specialist', content: 'Đã rõ. Em sẽ cập nhật bản nháp và gửi lại trong hôm nay trước 17:00.' },
  ],
  [ // Specialist 2 - Quang Dũng
    { from: 'specialist', content: 'Chào chị Phương, em đã soạn xong bản hợp đồng dịch vụ theo yêu cầu. Tuy nhiên, em có một số nhận xét về rủi ro liên quan đến điều khoản bảo mật.' },
    { from: 'customer', content: 'Em chia sẻ thêm chi tiết về các rủi ro được không?' },
    { from: 'specialist', content: 'Điều khoản bảo mật hiện tại chưa quy định rõ về trách nhiệm khi xảy ra rò rỉ dữ liệu. Em đề xuất bổ sung mức bồi thường tối đa 12 tháng phí dịch vụ.' },
    { from: 'customer', content: 'Mức bồi thường này có thể thương lượng được không? Bên đối tác có vẻ muốn giảm xuống 6 tháng.' },
  ],
  [ // Specialist 3 - Minh Trang
    { from: 'specialist', content: 'Chào mọi người, em xin thông báo rằng hồ sơ NDA đã hoàn tất và được lưu trong vault. Các bạn có thể kiểm tra và phản hồi nếu cần.' },
    { from: 'customer', content: 'Cảm ơn Minh Trang. Mình đã kiểm tra và không có gì cần chỉnh sửa.' },
  ],
  [ // Specialist 4 - Khánh An
    { from: 'specialist', content: 'Chào chị Phương, em vừa nhận được biên lai nộp đơn đăng ký nhãn hiệu từ Cục Sở hữu trí tuệ. Vui lòng kiểm tra thông tin chủ sở hữu trên biên lai.' },
    { from: 'customer', content: 'Mình đã kiểm tra, thông tin chủ sở hữu chính xác. Cảm ơn Khánh An đã hỗ trợ.' },
    { from: 'specialist', content: 'Không có gì ạ. Đơn đăng ký hiện đang trong giai đoạn thẩm định nội dung, dự kiến mất khoảng 1-2 tháng.' },
  ],
];

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

  // Get ALL legal requests to link messages
  const legalRequests = await prisma.legalRequest.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Found ${legalRequests.length} legal requests in workspace`);

  if (legalRequests.length === 0) {
    console.log('No legal requests found. Please run the main seed first.');
    return;
  }

  // Delete all existing messages to re-seed with proper linking
  await prisma.message.deleteMany({
    where: { workspaceId: workspace.id },
  });
  console.log('Cleared existing messages');

  // Get or create customer user
  let customerUser = await prisma.user.findUnique({
    where: { email: customer.email },
  });

  if (!customerUser) {
    customerUser = await prisma.user.create({
      data: {
        name: customer.name,
        email: customer.email,
        isActive: true,
        emailVerified: true,
      },
    });

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

  // Create or get specialists
  const specialistUsers: Record<string, string> = {};
  for (const spec of specialists) {
    let specialistUser = await prisma.user.findUnique({
      where: { email: spec.email },
    });

    if (!specialistUser) {
      specialistUser = await prisma.user.create({
        data: {
          name: spec.name,
          email: spec.email,
          isActive: true,
          emailVerified: true,
        },
      });

      await prisma.workspaceMembership.create({
        data: {
          userId: specialistUser.id,
          workspaceId: workspace.id,
          role: 'specialist',
          isActive: true,
        },
      });
    }
    specialistUsers[spec.email] = specialistUser.id;
    console.log(`Specialist: ${spec.name}`);
  }

  // Get requests matching the filter used in messages page
  const filteredRequests = await prisma.legalRequest.findMany({
    where: {
      workspaceId: workspace.id,
      status: { in: ['in_progress', 'pending_review', 'revision_required', 'assigned', 'triage'] },
    },
    orderBy: { updatedAt: 'desc' },
    take: specialists.length,
  });

  // Link messages to FIRST 4 filtered requests
  // (Each specialist gets one request)
  const targetRequests = filteredRequests;

  for (let i = 0; i < targetRequests.length; i++) {
    const request = targetRequests[i];
    const specEmail = specialists[i].email;
    const specialistId = specialistUsers[specEmail];
    const messages = messageContent[i];

    console.log(`\nLinking messages to request ${request.id} with specialist ${specialists[i].name}`);

    for (let j = 0; j < messages.length; j++) {
      const msg = messages[j];
      const senderId = msg.from === 'specialist' ? specialistId : customerUser.id;
      const recipientId = msg.from === 'specialist' ? customerUser.id : specialistId;

      // Calculate timestamp: j=0 is oldest (baseMinutes = max), j=n-1 is newest (baseMinutes = 0)
      const baseMinutes = ((messages.length - 1 - j) * 5) + (i * 30);
      const createdAt = new Date(Date.now() - baseMinutes * 60 * 1000);

      await prisma.message.create({
        data: {
          workspaceId: workspace.id,
          senderId,
          recipientId,
          content: msg.content,
          isRead: j < messages.length - 1,
          createdAt,
          legalRequestId: request.id, // LINK TO REQUEST
        },
      });
    }
    console.log(`Created ${messages.length} messages`);
  }

  // Update legal requests' assignedSpecialist
  for (let i = 0; i < targetRequests.length; i++) {
    await prisma.legalRequest.update({
      where: { id: targetRequests[i].id },
      data: { assignedSpecialistId: specialistUsers[specialists[i].email] },
    });
  }

  console.log('\n✓ Message seeding complete!');
  console.log(`✓ Linked ${messageContent.length} specialists to ${targetRequests.length} requests`);
  console.log(`✓ Created ${messageContent.reduce((sum, msgs) => sum + msgs.length, 0)} messages total`);
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
