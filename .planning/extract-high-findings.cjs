const fs = require('fs');

const content = fs.readFileSync('D:/PhapChe/.planning/review-result.md', 'utf8');

// Extract section between ## 🟠 High (525) and ## 🟡 Medium (1200)
const highStart = content.indexOf('## 🟠 High (525)');
const highEnd = content.indexOf('## 🟡 Medium (1200)');
const highSection = content.substring(highStart, highEnd);

const lines = highSection.split('\n');

const findings = [];

function classify(text, severity, file) {
  const combined = (text + ' ' + severity + ' ' + file).toLowerCase();

  if (/hardcoded\s*(credentials?|password|email|plaintext|plain.text)\b/.test(combined) ||
      /\bcredentials?\s*(hardcoded|exposed|embedded|baked|stored|in source)\b/.test(combined) ||
      /\bpassword\s*(is|are)\s*(hardcoded|embedded)\b/.test(combined) ||
      /\bcredential\b.*\b(source|exposed)\b/.test(combined) ||
      /\bseed_users\b/.test(combined)) {
    return 'HARDCODED_CREDENTIALS';
  }
  if (/prompt\s*injection|prompt\s+injection|unsanitized.*prompt|llm.*injection|injection.*llm|instruction\s*injection/i.test(combined)) {
    return 'PROMPT_INJECTION';
  }
  if (/sql\s*injection|unsanitized.*sql|raw\s*sql|sql\s*query.*unsafe|unsafe.*sql|inject.*sql/i.test(combined)) {
    return 'SQL_INJECTION';
  }
  if (/\bxss\b|dangerouslySetInnerHTML|cross.site.script|unsanitized.*html|html.*unsanitized|innerhtml.*inject/i.test(combined)) {
    return 'XSS';
  }
  if (/auth(?:orization|entication)?\s*bypass|bypass.*auth|missing.*auth(?:orization|entication)?\s*check|privilege\s*escalat|unauthorized.*access|access.*unauthorized|missing\s*role.*check|role\s*check.*missing|no\s*auth(?:orization|entication)?\b|without.*auth(?:orization|entication)?|bypass.*permission|missing\s*permission|permission\s*check.*missing/i.test(combined)) {
    return 'AUTH_BYPASS';
  }
  if (/path\s*traversal|directory\s*traversal|absolute\s*path.*bypass|\.\.\/|\.\.\\|file\s*inclusion|path\.join.*bypass/i.test(combined)) {
    return 'PATH_TRAVERSAL';
  }
  if (/error\s*(detail|message|info).*\b(leak|expos|sensitive|client)\b|\b(leak|expos).*\b(error|sensitive|internal|stack)\b|information\s*disclosure|stack\s*trace.*(expos|client|return)|expos(?:ing|es).*(?:error|detail|internal|sensitive)/i.test(combined)) {
    return 'ERROR_INFO_LEAK';
  }
  if (/race\s*condition|race\s+condition|concurrent.*(?:update|create|write|request)|not\s*atomic|non.atomic|lost\s*update|duplicate.*concurrent|concurrent.*duplicate|no\s*abort\s*controller|abort\s*controller.*missing|overlapping\s*request/i.test(combined)) {
    return 'RACE_CONDITION';
  }
  if (/try.catch|try\/catch|catch\s*block|missing\s*error\s*handling|no\s*error\s*handling|unhandled\s*(?:rejection|exception|error|promise)|uncaught|swallow.*error|silent.*error|empty\s*catch|dead\s*code.*catch|catch.*never|never.*catch|unreachable.*catch|unhandled.*error|error.*unhandled|no\s*try|proper\s*error.*missing/i.test(combined)) {
    return 'MISSING_ERROR_HANDLING';
  }
  if (/prisma.*disconnect|connection\s*leak|pool\s*exhaust|connection\s*pool|connection.*never.*closed|never.*disconnect|prisma.*\$disconnect|database\s*connection.*leak|prisma.*singleton|prismaclient.*new|new\s*prismaclient|global\s*prisma|prisma\s*client\s*instantiat|instantiat.*prisma/i.test(combined)) {
    return 'CONNECTION_LEAK';
  }
  if (/null.*undefined|undefined.*null|null\s*check|null\s*guard|\.split\(.*null|\.filter\(.*null|\.map\(.*null|typeerror.*null|typeerror.*undefined|cannot\s*read\s*propert|\.\w+\s*of\s*(?:null|undefined)|missing\s*null\s*check|optional\s*chaining|\?\..*missing|guard.*against.*null|guard.*null|guard.*undefined|\.trim\(\).*null|\.toLowerCase\(\).*null|potential\s*null\s*reference|possible\s*null/i.test(combined)) {
    return 'NULL_REFERENCE';
  }
  if (/syntax\s*error|invalid\s*syntax|parse\s*error|malformed|missing.*delimiter|closing.*delimiter|unterminated|not\s*valid.*syntax|undefined.*not\s*defined|not\s*defined.*esm/i.test(combined)) {
    return 'SYNTAX_ERROR';
  }
  if (/csrf\b|xsrf|clickjack|secure\s*cookie|session\s*hijack|insecure\s*cookie|disable.*csrf|disable.*security|cookie.*security|rate\s*limit|rate.limit.*missing|brute\s*force/i.test(combined)) {
    return 'CSRF_SESSION';
  }
  if (/\bperformance\b|slow|inefficien|bottleneck|n\+1|memory\s*leak|unnecessary\s*(?:re.render|fetch|query|call)|redundant.*query|extra.*query|concurrent.*dep|unnecessary.*effect/i.test(combined)) {
    return 'PERFORMANCE';
  }
  if (/hardcoded\s*(url|port|path|locale|string|config|value|constant|domain|host)/i.test(combined) ||
      /mock\s*data|fake\s*data|placeholder.*data|stub.*data|hardcoded.*data|fabricated/i.test(combined)) {
    return 'HARDCODED_VALUE';
  }
  if (/typescript.*type|type.*error|incorrect.*type|wrong.*type|unsafe.*type|type.*assertion|type.*cast|any\s*type|implicit\s*any/i.test(combined)) {
    return 'TYPE_SAFETY';
  }
  if (/i18n|locale.*hardcoded|hardcoded.*locale|vietnamese.*hardcoded|hardcoded.*vietnamese|language.*hardcoded|translation.*missing|missing.*translation|localization/i.test(combined)) {
    return 'I18N_ISSUE';
  }
  if (/accessibility|aria|keyboard|wcag|a11y|tabindex|focus\s*management|screen.reader|onkeydown.*missing/i.test(combined)) {
    return 'ACCESSIBILITY';
  }
  if (/seed|migration.*data|data.*integrity|corrupt|inconsistent.*state|orphan|idempoten|data\s*loss|rollback|partial\s*commit|inconsistent.*data|soft.delete|deletedat/i.test(combined)) {
    return 'DATA_INTEGRITY';
  }
  if (/validation|validate|input\s*check|sanitiz/i.test(combined)) {
    return 'INPUT_VALIDATION';
  }
  return 'OTHER_HIGH';
}

function extractFix(linesArr, startIdx) {
  for (let k = startIdx; k < Math.min(startIdx + 50, linesArr.length); k++) {
    const line = linesArr[k];
    if (line.includes(':bulb:') || line.includes('**Fix:**') || line.includes('Recommendation') || line.includes('**Suggestion:**')) {
      for (let m = k + 1; m < Math.min(k + 5, linesArr.length); m++) {
        const fixLine = linesArr[m].trim();
        if (fixLine && !fixLine.startsWith('```') && !fixLine.startsWith('<') && fixLine.length > 10) {
          let action = fixLine
            .replace(/^\*\*?/, '')
            .replace(/\*\*?$/, '')
            .replace(/`/g, '')
            .replace(/^[-*]\s*/, '')
            .replace(/^\(\d+\)\s*/, '')
            .trim();
          if (action.length > 180) action = action.substring(0, 180) + '...';
          return action;
        }
      }
    }
  }
  return 'Review and apply fix from code review suggestions';
}

// Extract line number from issue text
function extractLinesFromText(text) {
  const m = text.match(/lines?\s*[~–-]?\s*(\d+[\-–]?\d*)/i);
  return m ? m[1] : 'N/A';
}

// State machine
let currentFile = '';
let currentSeverity = '';
let currentLines = '';
let issueText = '';
let issueStartIdx = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // File header: ### `path` (N issues)
  const fileMatch = line.match(/^### `(.+?)`/);
  if (fileMatch) {
    currentFile = fileMatch[1].replace(/\s+\(\d+\s+issues?\)$/, '');
    continue;
  }

  // Severity header: two forms:
  // Form 1: **🔒 Security** · lines X-Y
  // Form 2: **🐛 Bug** (alone, issue text on next line)
  const sevMatchFull = line.match(/^\*\*(🐛 Bug|🔒 Security|⚡ Performance|🧹 Cleanup|🔧 Maintainability|📐 Architecture)\*\*\s*·\s*(?:lines?\s*)?([\d,\-\s–]+)?/);
  const sevMatchBare = line.match(/^\*\*(🐛 Bug|🔒 Security|⚡ Performance|🧹 Cleanup|🔧 Maintainability|📐 Architecture)\*\*\s*$/);

  if (sevMatchFull) {
    // Save previous finding
    if (issueText.trim() && currentFile) {
      const cleanText = issueText.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
      const shortIssue = cleanText.length > 220 ? cleanText.substring(0, 220) + '...' : cleanText;
      const fix = extractFix(lines, i - 3);

      findings.push({
        pattern: classify(shortIssue, currentSeverity, currentFile),
        file: currentFile,
        line: currentLines || extractLinesFromText(cleanText) || 'N/A',
        severity: currentSeverity,
        issue: shortIssue,
        fix: fix
      });
    }

    currentSeverity = sevMatchFull[1].trim();
    currentLines = (sevMatchFull[2] || '').trim();
    issueText = '';
    issueStartIdx = i;
    continue;
  }

  if (sevMatchBare) {
    // Save previous finding
    if (issueText.trim() && currentFile) {
      const cleanText = issueText.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
      const shortIssue = cleanText.length > 220 ? cleanText.substring(0, 220) + '...' : cleanText;
      const fix = extractFix(lines, i - 3);

      findings.push({
        pattern: classify(shortIssue, currentSeverity, currentFile),
        file: currentFile,
        line: currentLines || extractLinesFromText(cleanText) || 'N/A',
        severity: currentSeverity,
        issue: shortIssue,
        fix: fix
      });
    }

    currentSeverity = sevMatchBare[1].trim();
    currentLines = '';
    issueText = '';
    issueStartIdx = i;
    continue;
  }

  // Collect issue description
  if (currentFile && currentSeverity) {
    const trimmed = line.trim();
    // Stop at details blocks, horizontal rules, or next file header
    if (trimmed.startsWith('<details>') || trimmed.startsWith('---') || trimmed.startsWith('###')) {
      // Save finding when we hit details
      if (issueText.trim()) {
        const cleanText = issueText.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
        const shortIssue = cleanText.length > 220 ? cleanText.substring(0, 220) + '...' : cleanText;
        const fix = extractFix(lines, i);

        findings.push({
          pattern: classify(shortIssue, currentSeverity, currentFile),
          file: currentFile,
          line: currentLines || extractLinesFromText(cleanText) || 'N/A',
          severity: currentSeverity,
          issue: shortIssue,
          fix: fix
        });
        // Reset for next issue in same file
        currentSeverity = '';
        currentLines = '';
        issueText = '';
      }
      continue;
    }
    // Skip empty lines before first content
    if (trimmed === '' && issueText === '') continue;
    // Collect non-code non-header content
    if (trimmed && !trimmed.startsWith('```') && !trimmed.startsWith('#')) {
      issueText += trimmed + ' ';
    }
  }
}

// Don't forget the last finding
if (issueText.trim() && currentFile) {
  const cleanText = issueText.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  const shortIssue = cleanText.length > 220 ? cleanText.substring(0, 220) + '...' : cleanText;
  const fix = extractFix(lines, lines.length - 1);

  findings.push({
    pattern: classify(shortIssue, currentSeverity, currentFile),
    file: currentFile,
    line: currentLines || extractLinesFromText(cleanText) || 'N/A',
    severity: currentSeverity,
    issue: shortIssue,
    fix: fix
  });
}

// Write output
const outputPath = 'D:/PhapChe/.planning/high-findings-classified.json';
fs.writeFileSync(outputPath, JSON.stringify(findings, null, 2));

// Summary stats
const byPattern = {};
findings.forEach(f => {
  byPattern[f.pattern] = (byPattern[f.pattern] || 0) + 1;
});
const sorted = Object.entries(byPattern).sort((a, b) => b[1] - a[1]);

console.log(`Total High findings extracted: ${findings.length}`);
console.log('---');
sorted.forEach(([k, v]) => console.log(`${v} - ${k}`));
console.log('---');
console.log(`Output: ${outputPath}`);
