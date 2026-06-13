const { execSync } = require('child_process');
const init = JSON.parse(execSync('node "D:/PhapChe/.claude/gsd-core/bin/gsd-tools.cjs" query init.execute-phase 45', { encoding: 'utf8' }));
console.log(JSON.stringify(init, null, 2));
