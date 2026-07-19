import fs from 'fs';
import path from 'path';

const MOCK_LINE = "vi.mock('next-intl', () => ({ useTranslations: () => (key) => key }));";

function processDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      processDir(full);
    } else if (
      (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx') || entry.name.endsWith('.spec.ts') || entry.name.endsWith('.spec.tsx'))
      && !full.includes('.claude')
    ) {
      let content = fs.readFileSync(full, 'utf8');
      if (content.includes("mock('next-intl'") || content.includes('mock("next-intl")')) continue;
      // Only fix files that use react/testing-library (not pure node/service tests)
      const isReactTest = content.includes('@testing-library') || content.includes('render(') || content.includes('from "react"') || content.includes("from 'react'");
      if (!isReactTest) continue;
      if (content.includes('vi.mock')) continue;

      const lines = content.split('\n');
      let lastImportIdx = -1;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].startsWith('import ')) { lastImportIdx = i; break; }
      }
      if (lastImportIdx >= 0) {
        lines.splice(lastImportIdx + 1, 0, '', MOCK_LINE);
        fs.writeFileSync(full, lines.join('\n'));
        console.log('Fixed:', full.replace('D:\\PhapChe\\', ''));
      }
    }
  }
}

processDir('D:/PhapChe/src');
processDir('D:/PhapChe/tests');
console.log('Done.');
