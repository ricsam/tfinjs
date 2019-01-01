import { execFile } from 'child_process';

const hclPrettify = (hcl) => new Promise((resolve, reject) => {
  const cp = execFile('terraform', ['fmt', '-'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'inherit'],
  });
  let string = '';
  cp.stdout.on('data', (part) => {
    string += part;
  });

  cp.stdout.on('end', () => {
    resolve(string);
  });

  cp.stdout.on('error', (err) => {
    reject(err);
  });

  cp.stdin.write(hcl);
  cp.stdin.end();
});

export default hclPrettify;
