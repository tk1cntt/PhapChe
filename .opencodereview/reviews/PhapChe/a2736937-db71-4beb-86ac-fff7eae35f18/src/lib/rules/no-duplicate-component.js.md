# Review: `src/lib/rules/no-duplicate-component.js`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 7

---

## 🟠 High (2)

**🐛 Bug** · lines 141-145

Using `sourceCode.ast` as the report node causes ESLint to report all violations at the root of the file (line 0, column 0) instead of at the actual component location. This breaks editor integrations (e.g., squiggly underlines won't appear on the right line) and makes it impossible to suppress specific violations with `// eslint-disable-next-line`. Use a more specific node — for component file reports, the Program node's first meaningful child or the default export declaration would be more appropriate.

<details>
<summary>:bulb: Suggestion</summary>

```javascript
        // Find the actual component declaration node for accurate reporting
        const exportDefaultDeclaration = sourceCode.ast.body.find(
          (node) => node.type === 'ExportDefaultDeclaration'
        );
        const reportNode = exportDefaultDeclaration || sourceCode.ast.body[0] || sourceCode.ast;
        context.report({
          node: reportNode,
          messageId: 'duplicateComponent',
          data: { name: componentName, similar: shared },
        });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```javascript
        context.report({
          node: sourceCode.ast,
          messageId: 'duplicateComponent',
          data: { name: componentName, similar: shared },
        });
```
</details>

---

**⚡ Performance** · lines 67-78

`countComponentUsages` performs a synchronous recursive directory walk over the entire `src/components` tree using `fs.readdirSync` and `fs.readFileSync`. This is called for every file in `src/components/shared/` that is linted, blocking the ESLint process and degrading editor performance on large codebases. Consider caching the usage map once per lint run, using async I/O, or deferring to a build-time check instead.

<details>
<summary>:bulb: Suggestion</summary>

```javascript
// Cache the usage map at module level to avoid repeated directory scans
let _usageCache = null;
function getUsageMap() {
  if (_usageCache) return _usageCache;
  _usageCache = new Map();
  const componentsDir = path.join(process.cwd(), 'src', 'components');
  if (!fs.existsSync(componentsDir)) return _usageCache;
  const searchDir = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        searchDir(fullPath);
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.jsx')) {
        if (entry.name.includes('.test.') || entry.name.includes('.spec.')) continue;
        const content = fs.readFileSync(fullPath, 'utf-8');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```javascript
  const searchDir = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        searchDir(fullPath);
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.jsx')) {
        // Skip test files
        if (entry.name.includes('.test.') || entry.name.includes('.spec.')) {
          continue;
        }
        const content = fs.readFileSync(fullPath, 'utf-8');
```
</details>


## 🟡 Medium (4)

**🐛 Bug** · lines 80-84

The regex `/<ComponentName[\s>]/g` used in `countComponentUsages` matches inside JSX comments (`{/* <Button /> */}`), string literals (`'<Button />'`), and template literals — not just real JSX usage. This can produce inflated usage counts, leading to the `unusedInShared` warning being suppressed when it should fire, or firing when it shouldn't.

<details>
<summary>:bulb: Suggestion</summary>

```javascript
        // Strip comments and string literals before matching to avoid false positives
        const strippedContent = content
          .replace(/\/\*[\s\S]*?\*\//g, '')  // block comments
          .replace(/\/\/.*/g, '')               // line comments
          .replace(/`[^`]*`/g, '')               // template literals (simple)
          .replace(/'[^']*'/g, '')               // single-quoted strings
          .replace(/"[^"]*"/g, '');             // double-quoted strings
        const regex = new RegExp(`<${componentName}[\\s/>]`, 'g');
        const matches = strippedContent.match(regex);
        if (matches) {
          count += matches.length;
        }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```javascript
        const regex = new RegExp(`<${componentName}[\\s>]`, 'g');
        const matches = content.match(regex);
        if (matches) {
          count += matches.length;
        }
```
</details>

---

**🐛 Bug** · lines 150-156

The `startsWith` fuzzy match is too broad. For example, `ButtonGroup` starts with `Button`, `InputField` starts with `Input`, `SelectField` starts with `Select`. This flags legitimate, intentionally-more-specific component names as duplicates, creating noise and potentially confusing developers into ignoring the rule entirely.

<details>
<summary>:bulb: Suggestion</summary>

```javascript
    // Check for similar names (fuzzy match)
    for (const shared of SHARED_COMPONENTS) {
      // Check if the component name starts with a shared name followed by a non-alpha boundary
      // e.g., 'Button' matches 'ButtonIcon' but not 'ButtonGroup' (too generic a heuristic)
      // Consider using Levenshtein distance or a more targeted similarity check
      if (
        componentName !== shared &&
        componentName.toLowerCase().startsWith(shared.toLowerCase()) &&
        // Only flag if the remainder is short (e.g., 'Button2', 'ButtonNew')
        componentName.length - shared.length <= 3
      ) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```javascript
    // Check for similar names (fuzzy match)
    for (const shared of SHARED_COMPONENTS) {
      // Check if the component name starts with a shared name
      if (
        componentName.startsWith(shared) &&
        componentName !== shared
      ) {
```
</details>

---

**🐛 Bug** · lines 59-67

`countComponentUsages` recursively scans the entire `src/components` directory but does not exclude the current file. A component that renders itself recursively (e.g., `<TreeItem><TreeItem/></TreeItem>`) would be counted in its own file, potentially pushing `usages` above 1 and suppressing the `unusedInShared` warning for a genuinely unused component.

<details>
<summary>:bulb: Suggestion</summary>

```javascript
function countComponentUsages(componentName, excludeFile = null) {
  const componentsDir = path.join(process.cwd(), 'src', 'components');

  if (!fs.existsSync(componentsDir)) {
    return -1;
  }

  let count = 0;
  const searchDir = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (fullPath === excludeFile) continue; // Skip the current file
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```javascript
function countComponentUsages(componentName) {
  const componentsDir = path.join(process.cwd(), 'src', 'components');

  if (!fs.existsSync(componentsDir)) {
    return -1;
  }

  let count = 0;
  const searchDir = (dir) => {
```
</details>

---

**🔧 Maintainability** · lines 186-197

Nested ternary expressions are prohibited by the project's code quality standards. The deeply nested ternary to determine the `folder` value is hard to read and maintain. Use an `if/else` chain or a lookup approach instead.

<details>
<summary>:bulb: Suggestion</summary>

```javascript
        let folder = 'shared';
        if (relativePath.includes('/ui/')) {
          folder = 'ui';
        } else if (relativePath.includes('/table/')) {
          folder = 'table';
        } else if (relativePath.includes('/timeline/')) {
          folder = 'timeline';
        } else if (relativePath.includes('/layout/')) {
          folder = 'layout';
        } else if (relativePath.includes('/forms/')) {
          folder = 'forms';
        }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```javascript
        const folder =
          relativePath.includes('/ui/')
            ? 'ui'
            : relativePath.includes('/table/')
              ? 'table'
              : relativePath.includes('/timeline/')
                ? 'timeline'
                : relativePath.includes('/layout/')
                  ? 'layout'
                  : relativePath.includes('/forms/')
                    ? 'forms'
                    : 'shared';
```
</details>


## 🔵 Low (1)

**🐛 Bug** · lines 78-84

The `searchDir` callback inside `countComponentUsages` has a bare `try/catch` at the top level but no error handling for individual `fs.readFileSync` calls inside the loop. If a single file is unreadable (permissions, encoding issues), the entire `countComponentUsages` call will throw, crashing the ESLint rule for that file.

<details>
<summary>:bulb: Suggestion</summary>

```javascript
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          // Simple regex to find component usage
          const regex = new RegExp(`<${componentName}[\\s>]`, 'g');
          const matches = content.match(regex);
          if (matches) {
            count += matches.length;
          }
        } catch {
          // Skip unreadable files
        }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```javascript
        const content = fs.readFileSync(fullPath, 'utf-8');
        // Simple regex to find component usage
        const regex = new RegExp(`<${componentName}[\\s>]`, 'g');
        const matches = content.match(regex);
        if (matches) {
          count += matches.length;
        }
```
</details>


