const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const nextProcess = spawn('npx', ['next', 'dev', '-H', '0.0.0.0', '-p', '3000'], {
  cwd: '/sessions/adoring-beautiful-keller/mnt/PhapChe',
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
nextProcess.stdout.on('data', (data) => { output += data.toString(); });
nextProcess.stderr.on('data', (data) => { output += data.toString(); });

function fetchPage(path, cb) {
  const req = http.get(`http://127.0.0.1:3000${path}`, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => cb(null, res.statusCode, body));
  });
  req.on('error', (err) => cb(err));
  setTimeout(() => { req.destroy(); cb(new Error('timeout')); }, 15000);
}

function tryFetch(attempts, cb) {
  fetchPage('/', (err, code, body) => {
    if (!err) {
      console.log('Server ready (attempt ' + attempts + ')');
      cb();
    } else if (attempts < 20) {
      setTimeout(() => tryFetch(attempts + 1, cb), 1000);
    } else {
      console.error('Server never ready: ' + err.message);
      console.error('Output:', output.substring(output.length - 500));
      nextProcess.kill();
      process.exit(1);
    }
  });
}

tryFetch(1, () => {
  fetchPage('/vi/admin/dashboard', (err, code, body) => {
    if (err) {
      console.error('Fetch error: ' + err.message);
      nextProcess.kill();
      process.exit(1);
    }

    console.log('HTTP_STATUS: ' + code);
    console.log('BODY_LENGTH: ' + body.length);

    fs.writeFileSync('/tmp/dash_result.html', body);
    console.log('Saved to /tmp/dash_result.html');

    const preview = body.substring(0, 2000);
    console.log('\n=== HTML PREVIEW (first 2000 chars) ===');
    console.log(preview);

    nextProcess.kill();
    process.exit(code === 200 ? 0 : 1);
  });
});
