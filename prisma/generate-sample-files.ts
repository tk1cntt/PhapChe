/**
 * Generate sample files on disk for vaultFile records that exist in DB
 * but have no corresponding file on disk.
 *
 * Usage: npx tsx prisma/generate-sample-files.ts
 *
 * Creates minimal valid .docx, .xlsx, .pdf, and text sample files
 * in the local storage directory.
 */

import { PrismaClient } from '@prisma/client';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { deflateSync, createGzip } from 'zlib';

const prisma = new PrismaClient();
const STORAGE_ROOT = process.env.STORAGE_LOCAL_ROOT || '/data/storage/private';

// ── Minimal ZIP builder (zero-dependency, pure Node.js) ─────────

interface ZipEntry {
  name: string;
  data: Buffer;
}

/** Build a minimal uncompressed (STORE) ZIP archive */
function buildZip(entries: ZipEntry[]): Buffer {
  const chunks: Buffer[] = [];
  const cdEntries: { offset: number; header: Buffer }[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf-8');
    // Local file header
    const localHeader = Buffer.alloc(30 + nameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0);  // signature
    localHeader.writeUInt16LE(20, 4);           // version needed
    localHeader.writeUInt16LE(0x0800, 6);       // flags (UTF-8)
    localHeader.writeUInt16LE(0, 8);            // compression = STORE
    localHeader.writeUInt16LE(0, 10);           // mod time
    localHeader.writeUInt16LE(0, 12);           // mod date
    localHeader.writeUInt32LE(0, 14);           // crc32 (0 for store)
    localHeader.writeUInt32LE(entry.data.length, 18); // compressed size
    localHeader.writeUInt32LE(entry.data.length, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26);    // filename length
    localHeader.writeUInt16LE(0, 28);                 // extra field length
    nameBuf.copy(localHeader, 30);
    chunks.push(localHeader, entry.data);

    // Prepare central directory entry
    const cdEntry = Buffer.alloc(46 + nameBuf.length);
    cdEntry.writeUInt32LE(0x02014b50, 0);  // CD signature
    cdEntry.writeUInt16LE(20, 4);           // version made by
    cdEntry.writeUInt16LE(20, 6);           // version needed
    cdEntry.writeUInt16LE(0x0800, 8);       // flags (UTF-8)
    cdEntry.writeUInt16LE(0, 10);           // compression
    cdEntry.writeUInt16LE(0, 12);           // mod time
    cdEntry.writeUInt16LE(0, 14);           // mod date
    cdEntry.writeUInt32LE(0, 16);           // crc32
    cdEntry.writeUInt32LE(entry.data.length, 20); // compressed size
    cdEntry.writeUInt32LE(entry.data.length, 24); // uncompressed size
    cdEntry.writeUInt16LE(nameBuf.length, 28);    // filename length
    cdEntry.writeUInt16LE(0, 30);                 // extra field length
    cdEntry.writeUInt16LE(0, 32);                 // file comment length
    cdEntry.writeUInt16LE(0, 34);                 // disk number start
    cdEntry.writeUInt16LE(0, 36);                 // internal file attrs
    cdEntry.writeUInt32LE(0, 38);                 // external file attrs
    cdEntry.writeUInt32LE(offset, 42);            // relative offset
    nameBuf.copy(cdEntry, 46);
    cdEntries.push({ offset, header: cdEntry });
    offset += 30 + nameBuf.length + entry.data.length;
  }

  // Central directory
  const cdOffset = offset;
  for (const cd of cdEntries) {
    chunks.push(cd.header);
  }
  const cdSize = chunks.reduce((sum, b) => sum + b.length, 0) - offset;

  // End of central directory
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);     // EOCD signature
  eocd.writeUInt16LE(0, 4);               // disk number
  eocd.writeUInt16LE(0, 6);               // CD start disk
  eocd.writeUInt16LE(cdEntries.length, 8); // entries on disk
  eocd.writeUInt16LE(cdEntries.length, 10); // total entries
  eocd.writeUInt32LE(cdSize, 12);          // CD size
  eocd.writeUInt32LE(cdOffset, 16);        // CD offset
  eocd.writeUInt16LE(0, 20);              // comment length
  chunks.push(eocd);

  return Buffer.concat(chunks);
}

// ── OOXML Templates ─────────────────────────────────────────────

function buildMinimalDocx(text: string): Buffer {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p><w:r><w:t>${escapeXml(text)}</w:t></w:r></w:p>
  </w:body>
</w:document>`;

  // Split text into paragraphs
  const paragraphs = text.split('\n').filter(p => p.trim()).map(p =>
    `<w:p><w:r><w:t xml:space="preserve">${escapeXml(p)}</w:t></w:r></w:p>`
  ).join('\n');

  const fullDocXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>${paragraphs}</w:body>
</w:document>`;

  return buildZip([
    {
      name: '[Content_Types].xml',
      data: Buffer.from(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '</Types>', 'utf-8'),
    },
    {
      name: '_rels/.rels',
      data: Buffer.from(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        '</Relationships>', 'utf-8'),
    },
    {
      name: 'word/document.xml',
      data: Buffer.from(fullDocXml, 'utf-8'),
    },
  ]);
}

function buildMinimalXlsx(rows: string[][]): Buffer {
  const escaped = rows.map(row =>
    `<row>${row.map(cell =>
      `<c t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`
    ).join('')}</row>`
  ).join('\n');

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
           xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetData>${escaped}</sheetData>
</worksheet>`;

  const cols = Array.from({ length: rows[0]?.length || 3 }, (_, i) =>
    `<col min="${i + 1}" max="${i + 1}" width="20" customWidth="1"/>`
  ).join('');

  const sheetXmlWithCols = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
           xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <cols>${cols}</cols>
  <sheetData>${escaped}</sheetData>
</worksheet>`;

  return buildZip([
    {
      name: '[Content_Types].xml',
      data: Buffer.from(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '</Types>', 'utf-8'),
    },
    {
      name: '_rels/.rels',
      data: Buffer.from(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>', 'utf-8'),
    },
    {
      name: 'xl/workbook.xml',
      data: Buffer.from(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>' +
        '</workbook>', 'utf-8'),
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: Buffer.from(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        '</Relationships>', 'utf-8'),
    },
    {
      name: 'xl/worksheets/sheet1.xml',
      data: Buffer.from(sheetXmlWithCols, 'utf-8'),
    },
  ]);
}

/**
 * Generate PDF sample file as plain UTF-8 text (not a real PDF binary).
 *
 * Preview route (preview/route.ts) checks for real PDF magic bytes (%PDF).
 * If absent, it reads the file directly as UTF-8 — no pdf.js / MarkItDown decode step.
 * This avoids encoding issues with Vietnamese diacritics in PDF comment/cross-ref sections.
 */
function generatePdfContent(filename: string): string {
  const name = filename.replace(/\.pdf$/i, '');
  return (
    `TÀI LIỆU PHÁP LÝ\n\n` +
    `${name}\n\n` +
    `Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}\n\n` +
    `---\n\n` +
    `1. GIỚI THIỆU\n\n` +
    `Đây là tài liệu mẫu được tạo tự động bởi hệ thống Pháp Chế nhằm phục vụ mục đích demo ` +
    `tính năng xem trước (preview) file PDF.\n\n` +
    `Tài liệu này chứa nội dung pháp lý giả lập để người dùng có thể trải nghiệm đầy đủ quy ` +
    `trình review tài liệu trong hệ thống.\n\n` +
    `2. NỘI DUNG CHÍNH\n\n` +
    `- Điều 1: Các bên tham gia thỏa thuận\n` +
    `- Điều 2: Phạm vi và đối tượng của hợp đồng\n` +
    `- Điều 3: Thời hạn và hiệu lực\n` +
    `- Điều 4: Quyền và nghĩa vụ của các bên\n` +
    `- Điều 5: Phương thức thanh toán\n` +
    `- Điều 6: Bảo mật thông tin\n` +
    `- Điều 7: Chấm dứt và hủy bỏ\n` +
    `- Điều 8: Giải quyết tranh chấp\n\n` +
    `3. KẾT LUẬN\n\n` +
    `Tài liệu cần được xem xét kỹ lưỡng bởi chuyên viên pháp lý trước khi gửi cho khách hàng.`
  );
}

function buildMinimalPdf(text: string): Buffer {
  // Plain UTF-8 text — preview route detects missing %PDF header and reads directly
  return Buffer.from(text, 'utf-8');
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Sample Content Generators ───────────────────────────────────

function generateDocxContent(filename: string): string {
  const name = filename.replace(/\.docx$/i, '');
  return `TÀI LIỆU PHÁP LÝ\n\n${name}\n\nNgày tạo: ${new Date().toLocaleDateString('vi-VN')}\n\n---\n\n1. GIỚI THIỆU\n\nĐây là tài liệu mẫu được tạo tự động bởi hệ thống Pháp Chế nhằm phục vụ mục đích demo tính năng xem trước (preview) file Word (.docx).\n\nTài liệu này chứa nội dung pháp lý giả lập để người dùng có thể trải nghiệm đầy đủ quy trình review tài liệu trong hệ thống.\n\n2. NỘI DUNG CHÍNH\n\n- Điều 1: Các bên tham gia thỏa thuận\n- Điều 2: Phạm vi và đối tượng của hợp đồng\n- Điều 3: Thời hạn và hiệu lực\n- Điều 4: Quyền và nghĩa vụ của các bên\n- Điều 5: Phương thức thanh toán\n- Điều 6: Bảo mật thông tin\n- Điều 7: Chấm dứt và hủy bỏ\n- Điều 8: Giải quyết tranh chấp\n\n3. KẾT LUẬN\n\nTài liệu cần được xem xét kỹ lưỡng bởi chuyên viên pháp lý trước khi gửi cho khách hàng.`;
}

function generateXlsxContent(filename: string): string[][] {
  return [
    ['STT', 'Hạng mục', 'Mô tả', 'Giá trị', 'Trạng thái', 'Ghi chú'],
    ['1', 'Hợp đồng dịch vụ', 'Hợp đồng tư vấn pháp lý năm 2026', '50,000,000 VND', 'Đã ký', 'Cần gia hạn'],
    ['2', 'Thỏa thuận NDA', 'Thỏa thuận bảo mật với đối tác', '0 VND', 'Đang soạn', ''],
    ['3', 'Đăng ký nhãn hiệu', 'Nhãn hiệu "Pháp Việt"', '15,000,000 VND', 'Đã nộp', 'Đợi kết quả'],
    ['4', 'Giấy phép kinh doanh', 'Giấy phép PCCC', '2,000,000 VND', 'Đã cấp', 'Hiệu lực 5 năm'],
    ['5', 'Báo cáo tài chính', 'Báo cáo quý 1/2026', 'N/A', 'Đã duyệt', ''],
    ['6', 'Hợp đồng thuê văn phòng', 'Văn phòng quận 1, TPHCM', '120,000,000 VND/năm', 'Đã ký', 'Hết hạn 12/2026'],
    ['7', 'Bảo hiểm trách nhiệm', 'Bảo hiểm nghề nghiệp luật sư', '30,000,000 VND/năm', 'Đã gia hạn', ''],
    ['8', 'Hồ sơ nhân sự', 'Hồ sơ chuyên viên pháp lý', 'N/A', 'Đầy đủ', ''],
  ];
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  console.log('[generate-sample-files] Starting...');
  console.log(`  Storage root: ${STORAGE_ROOT}`);

  const vaultFiles = await prisma.vaultFile.findMany({
    where: { deletedAt: null },
  });

  console.log(`  Found ${vaultFiles.length} vault files in DB`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const vf of vaultFiles) {
    const storageKey = vf.storageKey;
    if (!storageKey) {
      skipped++;
      continue;
    }

    const fullPath = join(STORAGE_ROOT, storageKey);

    // Skip if already exists
    if (existsSync(fullPath)) {
      skipped++;
      continue;
    }

    try {
      // Ensure parent directory exists
      const dir = dirname(fullPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      const filename = vf.filename || 'file.bin';
      const mimeType = vf.contentType || '';
      const ext = filename.split('.').pop()?.toLowerCase();

      let buffer: Buffer;

      if (mimeType.includes('wordprocessingml') || ext === 'docx') {
        const content = generateDocxContent(filename);
        buffer = buildMinimalDocx(content);
      } else if (mimeType.includes('spreadsheetml') || ext === 'xlsx') {
        const rows = generateXlsxContent(filename);
        buffer = buildMinimalXlsx(rows);
      } else if (mimeType === 'application/pdf' || ext === 'pdf') {
        const content = generatePdfContent(filename);
        buffer = buildMinimalPdf(content);
      } else {
        // Plain text for everything else
        const content = `File mẫu: ${filename}\n\nĐây là file mẫu được tạo tự động bởi hệ thống Pháp Chế.\nNgày tạo: ${new Date().toLocaleDateString('vi-VN')}\nMIME: ${mimeType}`;
        buffer = Buffer.from(content, 'utf-8');
      }

      writeFileSync(fullPath, buffer);
      console.log(`  ✅ Created: ${storageKey} (${(buffer.length / 1024).toFixed(1)} KB)`);
      created++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ Failed: ${storageKey} — ${msg}`);
      errors++;
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped, ${errors} errors`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
