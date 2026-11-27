import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

declare const Bun: { JSONC: { parse(text: string): unknown }; write(path: string, content: string): Promise<number> };

const root = JSON.parse(readFileSync('package.json', 'utf8'));
const lock = Bun.JSONC.parse(readFileSync('bun.lock', 'utf8')) as { packages: Record<string, [string]> };
const installed = new Map<string, string>();
function scanPackages(path: string) {
  let names: string[];
  try { names = readdirSync(path); } catch { return; }
  for (const name of names) {
    if (name.startsWith('.')) continue;
    const dir = join(path, name);
    if (name.startsWith('@')) { scanPackages(dir); continue; }
    try {
      const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
      if (typeof manifest.license === 'string') installed.set(manifest.name + '@' + manifest.version, manifest.license);
    } catch {}
    scanPackages(join(dir, 'node_modules'));
  }
}
scanPackages('node_modules');

const components = [...new Set(Object.values(lock.packages).map(([identity]) => identity))].sort().map(identity => {
  const divider = identity.lastIndexOf('@');
  const name = identity.slice(0, divider);
  const version = identity.slice(divider + 1);
  const licence = installed.get(identity);
  const direct = root.dependencies?.[name] ? 'direct-runtime' : root.devDependencies?.[name] ? 'direct-development' : 'transitive';
  return {
    type: 'library',
    name,
    version,
    'bom-ref': identity,
    purl: 'pkg:npm/' + name.replace('@', '%40') + '@' + encodeURIComponent(version),
    ...(licence && { licenses: [{ license: { name: licence } }] }),
    properties: [{ name: 'daytech:dependencyRelationship', value: direct },
      { name: 'daytech:licenseEvidence', value: licence ? 'installed-manifest' : 'unverified-on-this-platform' }],
  };
});
const missing = [...Object.keys(root.dependencies ?? {}), ...Object.keys(root.devDependencies ?? {})]
  .filter(name => !components.some(component => component.name === name && component.licenses));
const review = [...installed].filter(([, licence]) => /(?:GPL|MPL|EPL|CC-|SEE LICENSE|UNLICENSED)/i.test(licence));
console.log(components.length + ' locked components; ' + components.filter(item => item.licenses).length + ' licences from installed manifests.');
console.log('Conditional or custom licences for review: ' + review.map(([name, licence]) => name + ' (' + licence + ')').join(', '));
const output = process.argv[2] || 'test-results/daytech-sbom.cdx.json';
await Bun.write(output, JSON.stringify({ bomFormat: 'CycloneDX', specVersion: '1.6', version: 1, components }, null, 2) + '\n');
if (missing.length) {
  console.error('Direct packages without verified installed licence metadata: ' + missing.join(', '));
  process.exitCode = 1;
}
