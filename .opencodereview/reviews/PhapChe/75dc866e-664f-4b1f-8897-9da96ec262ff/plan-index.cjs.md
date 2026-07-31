# Review: `plan-index.cjs`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 1

---

## 🟠 High (1)

**🐛 Bug** · lines 1-3

Unhandled exceptions: `execSync` throws if the command exits with a non-zero code, and `JSON.parse` throws if the output is not valid JSON. Either failure will crash the process with an unhandled error and no meaningful diagnostics. Wrap the logic in try/catch and log the actual error (stderr from the command, or the raw output) before exiting gracefully.

<details>
<summary>:bulb: Suggestion</summary>

```
const { execSync } = require('child_process');

try {
  const index = JSON.parse(execSync('node "D:/PhapChe/.claude/gsd-core/bin/gsd-tools.cjs" query phase-plan-index 45', { encoding: 'utf8' }));
  console.log(JSON.stringify(index, null, 2));
} catch (err) {
  console.error('Failed to retrieve phase plan index:', err.stderr || err.message);
  process.exit(1);
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```
const { execSync } = require('child_process');
const index = JSON.parse(execSync('node "D:/PhapChe/.claude/gsd-core/bin/gsd-tools.cjs" query phase-plan-index 45', { encoding: 'utf8' }));
console.log(JSON.stringify(index, null, 2));
```
</details>


