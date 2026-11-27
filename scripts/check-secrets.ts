import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).split('\0');
const secrets = [
  /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----/,
  /\b(?:gh[pousr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[A-Z0-9]{16}|xox[baprs]-[0-9A-Za-z-]{18,})\b/,
];
const findings = new Set<string>();
for (const file of files) {
  if (!file || !existsSync(file) || !/\.(?:[cm]?[jt]sx?|jsonc?|ya?ml|md|example|rules|env|toml)$/i.test(file)) continue;
  if (secrets.some(pattern => pattern.test(readFileSync(file, 'utf8')))) findings.add(file);
}
if (findings.size) {
  console.error('Credential-shaped content found in: ' + [...findings].join(', '));
  process.exitCode = 1;
} else console.log('Secret-pattern scan passed.');
