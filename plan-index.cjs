const { execSync } = require('child_process');
const index = JSON.parse(execSync('node "D:/PhapChe/.claude/gsd-core/bin/gsd-tools.cjs" query phase-plan-index 45', { encoding: 'utf8' }));
console.log(JSON.stringify(index, null, 2));
