/**
 * Seed Document Samples — tạo Document + DocumentVersion cho mỗi LegalRequest
 *
 * Mỗi request có 1 Document + 1 DocumentVersion với nội dung tiếng Việt
 * phù hợp loại hồ sơ (dựa theo title keyword matching).
 *
 * Usage: npx tsx scripts/seed-documents.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Matter type detection từ title ──────────────────────────

type MatterTypeKey = 'labor_contract' | 'nda' | 'service_agreement' | 'company_formation' | 'trademark_registration' | 'general';

function detectMatterType(title: string): MatterTypeKey {
  const t = title.toLowerCase();
  if (t.includes('lao động') || t.includes('nhân viên') || t.includes('nhân sự')) return 'labor_contract';
  if (t.includes('nda') || t.includes('bảo mật') || t.includes('confidential')) return 'nda';
  if (t.includes('dịch vụ') || t.includes('cung cấp') || t.includes('bảo trì') || t.includes('out') || t.includes('saas') || t.includes('logistics')) return 'service_agreement';
  if (t.includes('thành lập') || t.includes('doanh nghiệp') || t.includes('công ty') || t.includes('điều lệ') || t.includes('chi nhánh')) return 'company_formation';
  if (t.includes('nhãn hiệu') || t.includes('sở hữu trí tuệ') || t.includes('bản quyền') || t.includes('sáng chế') || t.includes('kiểu dáng') || t.includes('license')) return 'trademark_registration';
  return 'general';
}

// ── Document content generators theo matter type ────────────

function generateContent(title: string, matterType: MatterTypeKey): string {
  const today = new Date().toISOString().split('T')[0];
  const year = new Date().getFullYear();

  switch (matterType) {
    case 'labor_contract':
      return `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
───────────────────────────

HỢP ĐỒNG LAO ĐỘNG
Số: ${Math.floor(Math.random() * 1000)}/HĐLĐ-${year}

Căn cứ Bộ luật Lao động số 45/2019/QH14 ngày 20/11/2019;
Căn cứ nhu cầu và năng lực của hai bên;

Hôm nay, ngày ... tháng ... năm ${year}, chúng tôi gồm:

BÊN A (Người sử dụng lao động):
- Tên công ty: Công ty TNHH ABC Việt Nam
- Địa chỉ: Tầng 5, Tòa nhà XYZ, 123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh
- Mã số thuế: 0312345678
- Người đại diện: Ông Nguyễn Văn An — Chức vụ: Giám đốc

BÊN B (Người lao động):
- Họ và tên: Trần Thị Bình
- Ngày sinh: 15/03/1995
- Địa chỉ thường trú: 45/2A Phan Đình Phùng, Phường 2, Quận Phú Nhuận, TP. Hồ Chí Minh
- Số CMND/CCCD: 079095012345
- Trình độ chuyên môn: Cử nhân Luật

Điều 1: Loại hợp đồng và thời hạn
- Loại hợp đồng: Hợp đồng lao động không xác định thời hạn
- Thời gian thử việc: 02 tháng (từ ngày bắt đầu làm việc)
- Ngày bắt đầu làm việc: 01/01/${year}

Điều 2: Công việc và địa điểm làm việc
- Vị trí: Chuyên viên Pháp lý
- Mô tả công việc: Soạn thảo, rà soát hợp đồng; tư vấn pháp lý nội bộ; hỗ trợ thủ tục đăng ký kinh doanh
- Địa điểm: Văn phòng Công ty tại TP. Hồ Chí Minh

Điều 3: Thời giờ làm việc và nghỉ ngơi
- Thời gian: 8h00 - 17h30, từ thứ Hai đến thứ Sáu
- Nghỉ trưa: 12h00 - 13h30
- Nghỉ phép năm: 12 ngày/năm
- Nghỉ lễ, Tết: Theo quy định Nhà nước

Điều 4: Tiền lương và phụ cấp
- Lương cơ bản: 15.000.000 VNĐ/tháng
- Phụ cấp ăn trưa: 1.000.000 VNĐ/tháng
- Phụ cấp đi lại: 800.000 VNĐ/tháng
- Thưởng: Theo quy chế thưởng của Công ty
- Hình thức trả lương: Chuyển khoản ngân hàng

Điều 5: Bảo hiểm xã hội và các chế độ khác
- BHXH, BHYT, BHTN: Đóng theo tỷ lệ quy định của Luật BHXH
- Khám sức khỏe định kỳ: 1 lần/năm
- Bảo hiểm tai nạn 24/24

Điều 6: Chấm dứt hợp đồng
- Hai bên có thể đơn phương chấm dứt hợp đồng theo quy định tại Điều 35, 36 BLLĐ 2019
- Thời hạn báo trước: 45 ngày đối với hợp đồng không xác định thời hạn

Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.

BÊN A              BÊN B
(Ký, ghi rõ họ tên)   (Ký, ghi rõ họ tên)`;

    case 'nda':
      return `THỎA THUẬN BẢO MẬT THÔNG TIN
(Non-Disclosure Agreement - NDA)

Số: NDA-${year}-${Math.floor(Math.random() * 100).toString().padStart(3, '0')}

Hôm nay, ngày ... tháng ... năm ${year}, tại TP. Hồ Chí Minh, chúng tôi gồm:

BÊN TIẾT LỘ (Disclosing Party):
- Công ty Cổ phần Công nghệ XYZ
- Địa chỉ: 456 Lý Tự Trọng, Quận 1, TP. Hồ Chí Minh
- Đại diện: Ông Lê Minh Tuấn — Chức vụ: Tổng Giám đốc

BÊN NHẬN (Receiving Party):
- Công ty TNHH Tư vấn ABC
- Địa chỉ: 789 Nguyễn Đình Chiểu, Quận 3, TP. Hồ Chí Minh
- Đại diện: Bà Phạm Thị Hương — Chức vụ: Giám đốc Điều hành

Cùng thỏa thuận các điều khoản bảo mật thông tin như sau:

Điều 1: Định nghĩa Thông tin Bảo mật
"Thông tin Bảo mật" là tất cả các thông tin, dữ liệu, tài liệu dưới bất kỳ hình thức nào (văn bản, điện tử, lời nói, hình ảnh) được Bên Tiết Lộ cung cấp cho Bên Nhận liên quan đến:
a) Chiến lược kinh doanh, kế hoạch phát triển, dự báo tài chính;
b) Bí quyết kỹ thuật, công nghệ, phần mềm, mã nguồn, thuật toán;
c) Danh sách khách hàng, nhà cung cấp, đối tác;
d) Thông tin nhân sự, cơ cấu tổ chức, chính sách nội bộ;
e) Bất kỳ thông tin nào khác được đánh dấu "Bảo mật" hoặc được thông báo là bảo mật.

Điều 2: Nghĩa vụ của Bên Nhận
2.1. Chỉ sử dụng Thông tin Bảo mật cho mục đích đã thỏa thuận.
2.2. Không tiết lộ, sao chép, phân phối Thông tin Bảo mật cho bên thứ ba.
2.3. Áp dụng biện pháp bảo vệ ít nhất tương đương với bảo vệ thông tin của chính mình.
2.4. Giới hạn tiếp cận chỉ cho nhân viên cần biết để thực hiện công việc.

Điều 3: Ngoại lệ
Thông tin không được coi là Thông tin Bảo mật nếu:
a) Đã được công khai hợp pháp trước khi nhận từ Bên Tiết Lộ;
b) Được Bên Nhận phát triển độc lập không dựa trên Thông tin Bảo mật;
c) Được Bên Tiết Lộ cho phép tiết lộ bằng văn bản;
d) Phải tiết lộ theo yêu cầu của cơ quan nhà nước có thẩm quyền.

Điều 4: Thời hạn
Thỏa thuận này có hiệu lực kể từ ngày ký và duy trì trong thời gian 03 năm kể từ ngày chấm dứt quan hệ hợp tác giữa hai bên.

Điều 5: Xử lý vi phạm
Bên vi phạm nghĩa vụ bảo mật phải bồi thường toàn bộ thiệt hại thực tế phát sinh cho bên bị vi phạm. Mức bồi thường không giới hạn.

Điều 6: Luật áp dụng và giải quyết tranh chấp
Thỏa thuận này được điều chỉnh bởi pháp luật Việt Nam. Mọi tranh chấp sẽ được giải quyết thông qua thương lượng. Nếu không thành, tranh chấp sẽ được giải quyết tại Tòa án Nhân dân TP. Hồ Chí Minh.

BÊN TIẾT LỘ           BÊN NHẬN`;

    case 'service_agreement':
      return `HỢP ĐỒNG DỊCH VỤ
Số: ${Math.floor(Math.random() * 1000)}/HĐDV-${year}

Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015;
Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14/6/2005;

Hôm nay, ngày ... tháng ... năm ${year}, chúng tôi gồm:

BÊN A (Bên thuê dịch vụ):
- Tên công ty: Công ty TNHH Thương mại DEF
- Địa chỉ: 12A Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
- Đại diện: Bà Đỗ Thị Mai — Chức vụ: Giám đốc
- MST: 0318765432

BÊN B (Bên cung cấp dịch vụ):
- Tên công ty: Công ty Cổ phần Giải pháp Công nghệ GHI
- Địa chỉ: 34 Trần Hưng Đạo, Quận Hoàn Kiếm, TP. Hà Nội
- Đại diện: Ông Vũ Văn Hải — Chức vụ: Tổng Giám đốc
- MST: 0109876543

Điều 1: Nội dung dịch vụ
Bên B cam kết cung cấp cho Bên A dịch vụ: Tư vấn chuyển đổi số doanh nghiệp bao gồm:
a) Đánh giá hiện trạng hệ thống CNTT;
b) Đề xuất lộ trình chuyển đổi số phù hợp;
c) Triển khai giải pháp ERP cho bộ phận Kế toán và Nhân sự;
d) Đào tạo nhân viên sử dụng hệ thống mới.

Điều 2: Thời hạn và tiến độ
- Thời gian: 06 tháng kể từ ngày ký hợp đồng
- Giai đoạn 1 (2 tháng đầu): Khảo sát & đánh giá → báo cáo hiện trạng
- Giai đoạn 2 (3 tháng tiếp): Triển khai ERP → vận hành thử (UAT)
- Giai đoạn 3 (1 tháng cuối): Chạy chính thức + đào tạo → nghiệm thu

Điều 3: Phí dịch vụ và thanh toán
- Tổng phí dịch vụ: 450.000.000 VNĐ (Bốn trăm năm mươi triệu đồng)
- Đợt 1 (30%): 135.000.000 VNĐ — sau khi ký hợp đồng
- Đợt 2 (40%): 180.000.000 VNĐ — sau khi hoàn thành giai đoạn 2
- Đợt 3 (30%): 135.000.000 VNĐ — sau khi nghiệm thu

Điều 4: SLA và Cam kết chất lượng
- Thời gian phản hồi yêu cầu hỗ trợ: ≤ 4 giờ làm việc
- Thời gian xử lý sự cố khẩn cấp: ≤ 8 giờ làm việc
- Độ sẵn sàng hệ thống: 99.5% (uptime)
- Bảo hành miễn phí: 12 tháng sau nghiệm thu

Điều 5: Chấm dứt hợp đồng
- Mỗi bên có quyền đơn phương chấm dứt nếu bên kia vi phạm nghiêm trọng
- Thông báo trước 30 ngày bằng văn bản
- Bên vi phạm chịu phạt 8% giá trị hợp đồng

BÊN A              BÊN B`;

    case 'company_formation':
      return `HỒ SƠ THÀNH LẬP CÔNG TY TNHH MTV
──────────────────────────────────

I. THÔNG TIN CHUNG
- Tên công ty (dự kiến): CÔNG TY TNHH MỘT THÀNH VIÊN ${title.split(' ').slice(0, 3).join(' ').toUpperCase()}
- Tên giao dịch tiếng Anh: ${title.split(' ').slice(0, 3).join(' ')} Company Limited
- Địa chỉ trụ sở chính: Số 88 Đường Nguyễn Văn Trỗi, Phường 8, Quận Phú Nhuận, TP. Hồ Chí Minh
- Ngành nghề kinh doanh chính: Dịch vụ tư vấn pháp lý

II. VỐN ĐIỀU LỆ
- Vốn điều lệ: 3.000.000.000 VNĐ (Ba tỷ đồng)
- Hình thức góp vốn: Tiền mặt
- Thời hạn góp vốn: 90 ngày kể từ ngày được cấp GCN Đăng ký doanh nghiệp

III. CHỦ SỞ HỮU
- Họ và tên: Nguyễn Văn Phúc
- Ngày sinh: 10/08/1985
- Quốc tịch: Việt Nam
- Số CCCD: 079085012345
- Nơi đăng ký hộ khẩu thường trú: 22/5 Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh

IV. NGƯỜI ĐẠI DIỆN THEO PHÁP LUẬT
- Họ và tên: Nguyễn Văn Phúc
- Chức danh: Giám đốc kiêm Chủ tịch Công ty
- Số CCCD: 079085012345

V. ĐIỀU LỆ CÔNG TY (tóm tắt)
1. Phạm vi hoạt động: Dịch vụ pháp lý, tư vấn doanh nghiệp
2. Cơ cấu tổ chức: Chủ tịch Công ty → Giám đốc → Các phòng ban
3. Quyền và nghĩa vụ của chủ sở hữu: Theo quy định tại Luật Doanh nghiệp 2025
4. Phân phối lợi nhuận: Chủ sở hữu hưởng toàn bộ LNST

VI. DANH MỤC HỒ SƠ KÈM THEO
1. Đơn đăng ký thành lập công ty TNHH MTV (theo mẫu)
2. Dự thảo Điều lệ công ty
3. Bản sao CCCD của Chủ sở hữu
4. Văn bản ủy quyền (nếu có)
5. Giấy tờ chứng minh địa điểm kinh doanh hợp lệ`;

    case 'trademark_registration':
      return `TỜ KHAI ĐĂNG KÝ NHÃN HIỆU
(Theo Thông tư số 23/2023/TT-BKHCN ngày 30/11/2023)

Kính gửi: CỤC SỞ HỮU TRÍ TUỆ
Địa chỉ: 386 Nguyễn Trãi, Thanh Xuân, Hà Nội

PHẦN 1: THÔNG TIN NGƯỜI NỘP ĐƠN
- Tên đầy đủ: CÔNG TY TNHH ABC VIỆT NAM
- Địa chỉ: Tầng 5, Tòa nhà XYZ, 123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh
- Số điện thoại: 028 3822 6688
- Email: legal@abccompany.vn

PHẦN 2: THÔNG TIN NHÃN HIỆU
- Loại nhãn hiệu: Nhãn hiệu kết hợp (chữ + hình)
- Mô tả nhãn hiệu: Nhãn hiệu gồm phần chữ "ABCLEGAL" màu xanh navy, phía trên có biểu tượng cán cân công lý cách điệu, đặt trong khung tròn màu vàng gold.
- Màu sắc: Xanh navy (#003366), Vàng gold (#FFD700)
- Kèm theo: 05 mẫu nhãn hiệu kích thước 8x8 cm

PHẦN 3: DANH MỤC SẢN PHẨM/DỊCH VỤ
(Bảng phân loại Nice — Ấn bản 12)

Nhóm 35:
- Dịch vụ tư vấn quản lý kinh doanh
- Dịch vụ tư vấn tổ chức, điều hành doanh nghiệp

Nhóm 45:
- Dịch vụ pháp lý
- Dịch vụ tư vấn pháp luật
- Dịch vụ soạn thảo văn bản pháp lý
- Dịch vụ đại diện sở hữu trí tuệ

PHẦN 4: CĂN CỨ HƯỞNG QUYỀN ƯU TIÊN
□ Đơn đầu tiên
□ Đơn nộp theo Công ước Paris
□ Triển lãm
□ Khác: ..................

PHẦN 5: TÀI LIỆU KÈM THEO
1. 05 mẫu nhãn hiệu (8x8 cm)
2. Giấy ủy quyền (nếu nộp qua đại diện)
3. Bản sao đơn đầu tiên (nếu yêu cầu quyền ưu tiên)
4. Chứng từ nộp phí, lệ phí
5. Tài liệu khác: Bản mô tả chi tiết ý tưởng thiết kế

Người nộp đơn
(Ký và ghi rõ họ tên)`;

    default:
      return `# ${title}

## TÀI LIỆU PHÁP LÝ

**Ngày lập:** ${today}

**Mô tả:** Tài liệu pháp lý liên quan đến yêu cầu "${title}". Tài liệu này được lập để phục vụ cho quá trình xử lý hồ sơ và cung cấp thông tin cho chuyên viên pháp lý và người kiểm duyệt.

### Nội dung chính:
1. **Phạm vi:** Tư vấn pháp lý và soạn thảo văn bản liên quan.
2. **Căn cứ pháp lý:** Bộ luật Dân sự 2015, Luật Doanh nghiệp 2025 và các văn bản hướng dẫn thi hành.
3. **Yêu cầu:** Hoàn thiện hồ sơ, đảm bảo tính pháp lý và tuân thủ quy định hiện hành.
4. **Thời hạn dự kiến:** 15 ngày làm việc kể từ ngày tiếp nhận hồ sơ đầy đủ.

### Ghi chú:
Tài liệu này là bản dự thảo ban đầu, cần được chuyên viên pháp lý rà soát và bổ sung thêm thông tin từ khách hàng để hoàn thiện. Sau khi hoàn tất, tài liệu sẽ được chuyển cho reviewer kiểm tra trước khi gửi cho khách hàng.`;
  }
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seed Document Samples\n');

  // 1. Load templates (làm lookup table)
  const templates = await prisma.documentTemplate.findMany({
    where: { status: 'published' },
    select: { id: true, matterTypeKey: true },
  });
  console.log(`📋 Found ${templates.length} templates: ${templates.map(t => t.matterTypeKey).join(', ')}`);

  // Build lookup: matterTypeKey → templateId
  const templateMap = new Map<string, string>();
  for (const t of templates) templateMap.set(t.matterTypeKey, t.id);

  // Fallback template nếu matter type không khớp
  const fallbackTemplateId = templates.length > 0 ? templates[0].id : null;
  if (!fallbackTemplateId) {
    console.error('❌ No templates found. Run seed first: npx tsx prisma/seed.ts');
    process.exit(1);
  }

  // 2. Query tất cả requests
  const requests = await prisma.legalRequest.findMany({
    select: { id: true, title: true, workspaceId: true, matterType: true },
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`📄 Found ${requests.length} requests\n`);

  // 3. Tạo Document + DocumentVersion cho từng request
  let created = 0;
  let skipped = 0;

  for (const req of requests) {
    // Check if already has document
    const existing = await prisma.document.findFirst({
      where: { requestId: req.id, deletedAt: null },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const matterType = detectMatterType(req.title);
    const templateId = templateMap.get(matterType) ?? fallbackTemplateId;
    const content = generateContent(req.title, matterType);

    // Create Document
    const doc = await prisma.document.create({
      data: {
        workspaceId: req.workspaceId,
        requestId: req.id,
        title: `Tài liệu: ${req.title}`,
      },
    });

    // Create DocumentVersion
    await prisma.documentVersion.create({
      data: {
        documentId: doc.id,
        templateId,
        templateVersion: 1,
        status: 'draft',
        inputSnapshot: {
          matterType,
          detectedFrom: 'title',
        },
        generatedContent: content,
      },
    });

    created++;
    if (created % 20 === 0) console.log(`   ... ${created}/${requests.length}`);
  }

  console.log(`\n✅ Done: ${created} created, ${skipped} skipped (already had documents)`);
  console.log(`📊 Total: ${requests.length} requests`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
