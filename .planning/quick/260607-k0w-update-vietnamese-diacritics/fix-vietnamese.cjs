// Fix Vietnamese diacritics in source files
// Replace incorrect Vietnamese text with proper diacritics

const fs = require('fs');
const path = require('path');

const replacements = [
  // Basic auth terms
  ['Nguoi dung', 'Người dùng'],
  ['Nguoi duyet', 'Người duyệt'],
  ['Dang nhap', 'Đăng nhập'],
  ['Dang ky', 'Đăng ký'],
  ['Dang xuat', 'Đăng xuất'],
  ['Mat khau', 'Mật khẩu'],
  ['Tai khoan', 'Tài khoản'],

  // Role names
  ['Chuyen vien', 'Chuyên viên'],
  ['Kiem duyet', 'Kiểm duyệt'],

  // Queue terms
  ['Hang cho', 'Hàng chờ'],
  ['Hang cho duyet', 'Hàng chờ duyệt'],
  ['Hang cho xu ly', 'Hàng chờ xử lý'],
  ['Hang cho dien phoi', 'Hàng chờ điều phối'],

  // Request terms
  ['Ho so yeu cau', 'Hồ sơ yêu cầu'],
  ['Yeu cau', 'Yêu cầu'],
  ['Ho so', 'Hồ sơ'],
  ['Yeu cau chinh sua', 'Yêu cầu chỉnh sửa'],

  // Status labels
  ['Dang xu ly', 'Đang xử lý'],
  ['Hoan thanh', 'Hoàn thành'],
  ['Tu choi', 'Từ chối'],
  ['Chap nhan', 'Chấp nhận'],

  // Misc
  ['Can chuyen vien phan loai', 'Cần chuyên viên phân loại'],
  ['Chuyen vien se phan loai', 'Chuyên viên sẽ phân loại'],
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      // Only replace whole words
      const regex = new RegExp(from.replace(/([.*+?^${}()|[\]\\])/g, '\\$1'), 'g');
      const newContent = content.replace(regex, to);
      if (newContent !== content) {
        console.log(`  ${from} → ${to}`);
        content = newContent;
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

function scanDirectory(dir, extensions = ['.ts', '.tsx']) {
  const files = [];

  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        // Skip node_modules and .next
        if (!entry.name.includes('node_modules') && !entry.name.includes('.next') && !entry.name.includes('.git')) {
          scan(fullPath);
        }
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

const srcDir = path.join(__dirname, '..', '..', '..', 'src');
const files = scanDirectory(srcDir);

console.log('='.repeat(60));
console.log('Fixing Vietnamese Diacritics');
console.log('='.repeat(60));
console.log(`Scanning ${files.length} files...`);
console.log('');

let totalChanged = 0;
const changedFiles = [];

for (const file of files) {
  const relativePath = path.relative(process.cwd(), file);
  if (processFile(file)) {
    changedFiles.push(relativePath);
    totalChanged++;
  }
}

console.log('');
console.log('='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log(`Files modified: ${totalChanged}`);
console.log('');

if (changedFiles.length > 0) {
  console.log('Changed files:');
  for (const f of changedFiles) {
    console.log(`  - ${f}`);
  }
} else {
  console.log('No files needed changes.');
}
