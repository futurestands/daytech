import { existsSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const runtime = [
  '@google/genai', '@vis.gl/react-google-maps', 'dotenv', 'express', 'firebase',
  'google-auth-library', 'lucide-react', 'qrcode-generator', 'react', 'react-dom',
  'react-router-dom', 'ws', 'zod',
];
const visited = new Set<string>();
const groups = new Map<string, Set<string>>();
const missing = new Set<string>();

function collect(name: string, from: string, optional = false) {
  const searchPaths = createRequire(join(from, 'package.json')).resolve.paths(name) ?? [];
  const packagePath = searchPaths.map(path => join(path, name, 'package.json')).find(existsSync);
  if (!packagePath) {
    if (!optional) missing.add(name);
    return;
  }
  const manifestPath = realpathSync(packagePath);
  if (visited.has(manifestPath)) return;
  visited.add(manifestPath);
  const directory = resolve(manifestPath, '..');
  const pkg = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const identity = pkg.name + '@' + pkg.version;
  const files = readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isFile() && /^(licen[cs]e|copying|notice|copyright)([._-]|$)/i.test(entry.name));
  if (!files.length) missing.add(identity);
  for (const file of files) {
    const content = readFileSync(join(directory, file.name), 'utf8').replace(/[\t\r ]+$/gm, '').trim();
    const owners = groups.get(content) ?? new Set<string>();
    owners.add(identity + ' (' + file.name + ')');
    groups.set(content, owners);
  }
  for (const dependency of Object.keys(pkg.dependencies ?? {})) collect(dependency, directory);
  for (const dependency of Object.keys(pkg.optionalDependencies ?? {})) collect(dependency, directory, true);
}

for (const name of runtime) collect(name, process.cwd());
const sections = [...groups].map(([content, owners]) => [...owners].sort().join('\n') + '\n\n' + content);
sections.push(readFileSync('third-party/runtime-upstream.txt', 'utf8').trim());
const header = 'DayTech runtime dependency notices\n\nInstalled package notices and licence texts for the browser and server runtime dependency roots.\n';
writeFileSync(process.argv[2] ?? 'public/third-party-notices.txt', header + '\n' + sections.join('\n\n' + '-'.repeat(72) + '\n\n') + '\n');
console.log(`${visited.size} installed runtime dependencies and ${groups.size} distinct notice texts.`);
if (missing.size) {
  console.error('Review packages without an installed notice file: ' + [...missing].sort().join(', '));
}
