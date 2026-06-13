const { execSync } = require('child_process');
const init = JSON.parse(execSync('node "D:/PhapChe/.claude/gsd-core/bin/gsd-tools.cjs" query init.phase-op 45', { encoding: 'utf8' }));
console.log(JSON.stringify(init, null, 2));
