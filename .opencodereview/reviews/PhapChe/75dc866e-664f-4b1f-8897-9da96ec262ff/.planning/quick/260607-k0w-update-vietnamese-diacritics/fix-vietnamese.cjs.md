# Review: `.planning/quick/260607-k0w-update-vietnamese-diacritics/fix-vietnamese.cjs`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 6

---

## 🔴 Critical (1)

**🐛 Bug** · lines 7-31

Replacement order causes partial/incomplete substitutions. Shorter strings are processed before longer ones that share the same prefix:
- `'Hang cho'` (line 19) runs before `'Hang cho duyet'` (line 20), so `'Hang cho duyet'` becomes `'Hàng chờ duyet'` (half-corrected) and never matches the longer pattern.
- `'Yeu cau'` (line 26) runs before `'Yeu cau chinh sua'` (line 28), producing `'Yêu cầu chinh sua'`.
- `'Ho so'` (line 27) runs before `'Ho so yeu cau'` (line 26), producing `'Hồ sơ yeu cau'`.

Fix: sort replacements so longer strings are processed first, e.g., `replacements.sort((a, b) => b[0].length - a[0].length)` before iterating.

<details>
<summary>:bulb: Suggestion</summary>

```
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

  // Queue terms — longer first
  ['Hang cho dien phoi', 'Hàng chờ điều phối'],
  ['Hang cho xu ly', 'Hàng chờ xử lý'],
  ['Hang cho duyet', 'Hàng chờ duyệt'],
  ['Hang cho', 'Hàng chờ'],

  // Request terms — longer first
  ['Yeu cau chinh sua', 'Yêu cầu chỉnh sửa'],
  ['Ho so yeu cau', 'Hồ sơ yêu cầu'],
  ['Yeu cau', 'Yêu cầu'],
  ['Ho so', 'Hồ sơ'],
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
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
```
</details>


## 🟠 High (1)

**🐛 Bug** · lines 44-66

No error handling for file I/O operations. `readFileSync` and `writeFileSync` can throw on permission errors, missing files, or disk-full conditions. If `writeFileSync` fails after `readFileSync` succeeded, the original file contents are lost (the write may truncate the file before failing).

Fix: wrap I/O in try/catch, and consider writing to a temp file first then renaming atomically.

<details>
<summary>:bulb: Suggestion</summary>

```
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    for (const [from, to] of replacements) {
      if (content.includes(from)) {
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
  } catch (err) {
    console.error(`Error processing ${filePath}: ${err.message}`);
    return false;
  }
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
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
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · lines 50-51

The comment says 'Only replace whole words' but the regex does not use word boundaries (`\b`). The regex is just a global match of the escaped literal string, so it will replace substrings inside larger words. For example, if a file contained a variable name like `someHangChoVar`, it would be incorrectly modified.

Fix: either remove the misleading comment, or add `\b` word boundaries to the regex: `new RegExp('\\b' + escaped + '\\b', 'g')`.

<details>
<summary>:bulb: Suggestion</summary>

```
      const escaped = from.replace(/([.*+?^${}()|[\]\\])/g, '\\$1');
      const regex = new RegExp(escaped, 'g');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
      // Only replace whole words
      const regex = new RegExp(from.replace(/([.*+?^${}()|[\]\\])/g, '\\$1'), 'g');
```
</details>

---

**🐛 Bug** · lines 61-64

Files are overwritten in-place with no backup. If a replacement rule is incorrect or the script crashes mid-write, the original file contents are permanently lost. Since this is a one-off migration script, consider writing a `.bak` copy before modifying, or use a dry-run mode first.

<details>
<summary>:bulb: Suggestion</summary>

```
  if (changed) {
    // Create backup before overwriting
    fs.copyFileSync(filePath, filePath + '.bak');
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
```
</details>

---

**🐛 Bug** · lines 68-88

`scanDirectory` uses `readdirSync` without error handling. If a subdirectory lacks read permissions (e.g., system-protected folders), the script crashes immediately without processing any files. The caller also has no try/catch around the scan.

<details>
<summary>:bulb: Suggestion</summary>

```
function scanDirectory(dir, extensions = ['.ts', '.tsx']) {
  const files = [];

  function scan(currentDir) {
    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (err) {
      console.error(`Cannot read directory ${currentDir}: ${err.message}`);
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        const skipDirs = new Set(['node_modules', '.next', '.git']);
        if (!skipDirs.has(entry.name)) {
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
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
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
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 77

Directory skip condition uses `entry.name.includes('node_modules')` which is too broad — it would also skip legitimate directories like `my-node_modules-backup` or `data.next` if they existed. Use exact matching or a dedicated skip-set instead.

<details>
<summary>:bulb: Suggestion</summary>

```
        const skipDirs = new Set(['node_modules', '.next', '.git', 'dist', 'build']);
        if (!skipDirs.has(entry.name)) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
        if (!entry.name.includes('node_modules') && !entry.name.includes('.next') && !entry.name.includes('.git')) {
```
</details>


