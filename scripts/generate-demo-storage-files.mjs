/**
 * Generate physical storage files for demo vault records.
 * Seed data creates DB records but no actual files on disk.
 * This script creates placeholder PDF/DOCX/XLSX files so the preview API works.
 */
import { PrismaClient } from '@prisma/client';
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';

const STORAGE_ROOT = process.env.STORAGE_LOCAL_ROOT || 'D:/PhapChe/data/storage/private';

const CONTENT_BY_KIND = {
  contract: [
    'HỢP ĐỒNG LAO ĐỘNG THỜI VỤ',
    '',
    'Bên A: Công ty TNHH Pháp Việt',
    'Địa chỉ: 123 Nguyễn Huệ, Quận 1, TP.HCM',
    'MST: 0312345678',
    '',
    'Bên B: Nguyễn Văn An',
    'CMND/CCCD: 079123456789',
    '',
    'Điều 1: Đối tượng hợp đồng',
    'Bên A thuê Bên B làm việc theo thời vụ với vị trí Nhân viên kinh doanh.',
    '',
    'Điều 2: Thời hạn hợp đồng',
    'Hợp đồng có hiệu lực từ ngày 01/01/2026 đến ngày 30/06/2026.',
    '',
    'Điều 3: Tiền lương và phụ cấp',
    'Lương cơ bản: 8.000.000 VNĐ/tháng.',
    'Phụ cấp ăn trưa: 730.000 VNĐ/tháng.',
    'Thưởng doanh số: theo KPI từng quý.',
    '',
    'Điều 4: Quyền và nghĩa vụ các bên',
    'Bên A có trách nhiệm đóng BHXH, BHYT, BHTN đầy đủ.',
    'Bên B cam kết thực hiện đúng nội quy công ty.',
  ].join('\n'),
  nda: [
    'THỎA THUẬN BẢO MẬT (NDA)',
    '',
    'Giữa:',
    'Công ty TNHH Pháp Việt (Bên tiết lộ)',
    'và',
    'Công ty TNHH Đối tác XYZ (Bên nhận)',
    '',
    'Điều 1: Định nghĩa Thông tin Bảo mật',
    'Bao gồm: bí mật kinh doanh, danh sách khách hàng, chiến lược kinh doanh,',
    'dữ liệu tài chính, mã nguồn phần mềm, và mọi thông tin được đánh dấu "Bảo mật".',
    '',
    'Điều 2: Nghĩa vụ của Bên nhận',
    'Không tiết lộ cho bên thứ ba khi chưa có sự đồng ý bằng văn bản.',
    'Chỉ sử dụng thông tin cho mục đích đã thỏa thuận.',
    'Bảo vệ thông tin như bảo vệ thông tin bảo mật của chính mình.',
    '',
    'Điều 3: Thời hạn',
    'Nghĩa vụ bảo mật có hiệu lực trong thời hạn 5 năm kể từ ngày ký.',
  ].join('\n'),
  license: [
    'GIẤY PHÉP KINH DOANH',
    '',
    'Số ĐKKD: 0312345678',
    'Đăng ký lần đầu: 01/01/2020',
    '',
    'Tên công ty: CÔNG TY TNHH PHÁP VIỆT',
    'Tên giao dịch: PHAP VIET CO., LTD',
    'Địa chỉ trụ sở: 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
    '',
    'Ngành nghề kinh doanh:',
    '1. Hoạt động tư vấn pháp luật (Mã 6910)',
    '2. Hoạt động đại diện, tư vấn pháp lý (Mã 6910)',
    '3. Dịch vụ hành chính, hỗ trợ văn phòng (Mã 8211)',
    '',
    'Vốn điều lệ: 3.000.000.000 VNĐ',
  ].join('\n'),
  charter: [
    'ĐIỀU LỆ CÔNG TY TNHH PHÁP VIỆT',
    '',
    'Chương I: TÊN, ĐỊA CHỈ, NGÀNH NGHỀ',
    'Điều 1: Tên công ty: Công ty TNHH Pháp Việt',
    'Điều 2: Địa chỉ: 123 Nguyễn Huệ, Quận 1, TP.HCM',
    '',
    'Chương II: VỐN ĐIỀU LỆ',
    'Điều 3: Vốn điều lệ: 3.000.000.000 VNĐ',
    'Điều 4: Cơ cấu góp vốn:',
    '  - Thành viên A: 1.500.000.000 VNĐ (50%)',
    '  - Thành viên B: 900.000.000 VNĐ (30%)',
    '  - Thành viên C: 600.000.000 VNĐ (20%)',
    '',
    'Chương III: CƠ CẤU TỔ CHỨC',
    'Điều 5: Hội đồng thành viên là cơ quan quyết định cao nhất.',
    'Điều 6: Giám đốc/Tổng giám đốc là người điều hành hoạt động hàng ngày.',
  ].join('\n'),
  compliance: [
    'BÁO CÁO TUÂN THỦ PCCC',
    '',
    'Kính gửi: Phòng Cảnh sát PCCC - Công an TP.HCM',
    '',
    'Đơn vị báo cáo: Công ty TNHH Pháp Việt',
    'Địa chỉ: 123 Nguyễn Huệ, Quận 1, TP.HCM',
    '',
    'NỘI DUNG KIỂM TRA ĐỊNH KỲ',
    '',
    '1. Hệ thống báo cháy tự động:',
    '   - Số đầu báo khói: 12 (hoạt động tốt: 12)',
    '   - Tủ trung tâm báo cháy: hoạt động bình thường',
    '',
    '2. Bình chữa cháy xách tay:',
    '   - Số lượng: 8 bình CO2 5kg, 4 bình bột ABC 4kg',
    '   - Hạn sử dụng: còn hiệu lực đến 12/2027',
    '',
    '3. Hệ thống đèn exit, đèn sự cố:',
    '   - Tổng số: 6 đèn exit, 4 đèn sự cố',
    '   - Tình trạng: hoạt động bình thường',
    '',
    'KẾT LUẬN: Đạt yêu cầu PCCC.',
  ].join('\n'),
  application: [
    'ĐƠN ĐĂNG KÝ NHÃN HIỆU',
    '',
    'Kính gửi: CỤC SỞ HỮU TRÍ TUỆ',
    '386 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh',
    '',
    'I. THÔNG TIN NGƯỜI NỘP ĐƠN',
    'Tên: Công ty TNHH Pháp Việt',
    'Địa chỉ: 123 Nguyễn Huệ, Quận 1, TP.HCM',
    'Điện thoại: 028 1234 5678',
    '',
    'II. THÔNG TIN NHÃN HIỆU',
    'Tên nhãn hiệu: PHÁP VIỆT',
    'Loại nhãn hiệu: Nhãn hiệu tập thể (chữ + hình)',
    'Màu sắc: Xanh navy (#003366) và Trắng',
    '',
    'III. DANH MỤC SẢN PHẨM/DỊCH VỤ',
    'Nhóm 45: Dịch vụ pháp lý; tư vấn pháp luật; đại diện sở hữu trí tuệ.',
    '',
    'IV. TÀI LIỆU KÈM THEO',
    '1. Mẫu nhãn hiệu (5 mẫu)',
    '2. Giấy ủy quyền (nếu nộp qua đại diện)',
    '3. Chứng từ nộp phí',
  ].join('\n'),
  minutes: [
    'BIÊN BẢN THỎA THUẬN HỢP TÁC',
    '',
    'Hôm nay, ngày 15 tháng 03 năm 2026, tại văn phòng Công ty TNHH Pháp Việt',
    '',
    'CÁC BÊN THAM GIA:',
    '1. CÔNG TY TNHH PHÁP VIỆT (Bên A)',
    '   Đại diện: Ông Nguyễn Văn An - Giám đốc',
    '',
    '2. CÔNG TY TNHH ABC (Bên B)',
    '   Đại diện: Bà Trần Thị B - Giám đốc',
    '',
    'NỘI DUNG THỎA THUẬN:',
    '',
    '1. Hai bên thống nhất hợp tác trong lĩnh vực tư vấn pháp lý doanh nghiệp.',
    '2. Bên A cung cấp dịch vụ tư vấn pháp luật, Bên B cung cấp khách hàng.',
    '3. Tỷ lệ chia sẻ doanh thu: Bên A 60%, Bên B 40%.',
    '',
    'Biên bản được lập thành 02 bản, mỗi bên giữ 01 bản.',
  ].join('\n'),
  report: [
    'BÁO CÁO TÀI CHÍNH QUÝ I/2026',
    '',
    'Đơn vị: Công ty TNHH Pháp Việt',
    'Kỳ báo cáo: 01/01/2026 - 31/03/2026',
    '',
    'A. KẾT QUẢ HOẠT ĐỘNG KINH DOANH',
    '1. Doanh thu thuần:              2,450,000,000 VNĐ',
    '2. Giá vốn hàng bán:            (1,120,000,000) VNĐ',
    '3. Lợi nhuận gộp:                1,330,000,000 VNĐ',
    '4. Chi phí bán hàng:              (280,000,000) VNĐ',
    '5. Chi phí quản lý:               (350,000,000) VNĐ',
    '6. Lợi nhuận thuần HĐKD:          700,000,000 VNĐ',
    '',
    'B. BẢNG CÂN ĐỐI KẾ TOÁN',
    'Tổng tài sản:                   5,200,000,000 VNĐ',
    'Nợ phải trả:                    1,800,000,000 VNĐ',
    'Vốn chủ sở hữu:                 3,400,000,000 VNĐ',
  ].join('\n'),
  merger: [
    'HỒ SƠ SÁP NHẬP CHI NHÁNH',
    '',
    'I. THÔNG TIN CHUNG',
    'Công ty nhận sáp nhập: Công ty TNHH Pháp Việt (trụ sở chính)',
    'Công ty bị sáp nhập: Chi nhánh Pháp Việt - Hà Nội',
    '',
    'II. PHƯƠNG ÁN SÁP NHẬP',
    '',
    '1. Lý do sáp nhập:',
    'Tối ưu hóa cơ cấu tổ chức, giảm chi phí vận hành.',
    '',
    '2. Thời điểm sáp nhập: 01/07/2026',
    '',
    '3. Phương thức sáp nhập:',
    'Chuyển toàn bộ tài sản, quyền, nghĩa vụ và lợi ích hợp pháp',
    'của chi nhánh về trụ sở chính.',
    '',
    '4. Phương án xử lý lao động:',
    '- 5 nhân viên được điều chuyển về trụ sở chính',
    '- 2 nhân viên chấm dứt HĐLĐ với chế độ theo luật định',
  ].join('\n'),
  patent: [
    'ĐĂNG KÝ SÁNG CHẾ - MÔ TẢ KỸ THUẬT',
    '',
    'Tên sáng chế: HỆ THỐNG QUẢN LÝ HỒ SƠ PHÁP LÝ THÔNG MINH',
    'Tác giả: Nguyễn Văn An, Trần Thị Bình',
    '',
    'I. LĨNH VỰC KỸ THUẬT',
    'Sáng chế thuộc lĩnh vực công nghệ thông tin, cụ thể là hệ thống',
    'quản lý dữ liệu pháp lý ứng dụng trí tuệ nhân tạo.',
    '',
    'II. TÌNH TRẠNG KỸ THUẬT',
    'Hiện nay, các hệ thống quản lý hồ sơ pháp lý chủ yếu lưu trữ',
    'thụ động. Chưa có hệ thống nào tự động phân loại, trích xuất',
    'và gợi ý xử lý dựa trên nội dung hồ sơ.',
    '',
    'III. BẢN CHẤT KỸ THUẬT',
    'Hệ thống bao gồm:',
    '1. Module tiếp nhận và số hóa hồ sơ (OCR + NLP)',
    '2. Module phân loại tự động (PGVector + RAG)',
    '3. Module gợi ý xử lý (LLM Agent)',
    '4. Module kiểm soát chất lượng (Review workflow)',
  ].join('\n'),
};

function createPdfContent(text) {
  // Thay vì tạo PDF thật (Helvetica không hỗ trợ tiếng Việt),
  // lưu text content trực tiếp. Preview API sẽ parse qua pdf.js;
  // nếu fail thì fallback hiển thị raw text.
  // pdfjs-dist@6.x dùng Uint8Array nên file cần là binary hợp lệ.
  // Ghi text với BOM UTF-8 để tránh lỗi encoding.
  return '﻿' + text;
}

async function main() {
  const p = new PrismaClient();
  try {
    const vfs = await p.vaultFile.findMany({
      where: { storageKey: { contains: 'vault/demo/' } },
    });
    console.log(`Found ${vfs.length} demo vault files`);

    let created = 0;
    for (const vf of vfs) {
      const filePath = join(STORAGE_ROOT, vf.storageKey);
      const dir = dirname(filePath);
      mkdirSync(dir, { recursive: true });

      const kind = vf.fileKind || 'contract';
      const text = CONTENT_BY_KIND[kind] || 'Tài liệu mẫu';

      if (vf.contentType === 'application/pdf') {
        writeFileSync(filePath, createPdfContent(text));
      } else if (vf.contentType?.includes('wordprocessingml')) {
        writeFileSync(filePath, text, 'utf-8');
      } else if (vf.contentType?.includes('spreadsheetml')) {
        writeFileSync(filePath, text, 'utf-8');
      } else {
        writeFileSync(filePath, text, 'utf-8');
      }
      created++;
    }
    console.log(`Created ${created} files in ${STORAGE_ROOT}`);
  } finally {
    await p.$disconnect();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
