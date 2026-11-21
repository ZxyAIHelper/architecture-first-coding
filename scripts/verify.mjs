import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// This tool validates publication artifacts; game rules live only in the examples.
const root = fileURLToPath(new URL('../', import.meta.url));
const skill = 'skills/architecture-first-coding';
const skillFiles = ['SKILL.md', 'references/layered-architecture.md',
  'references/reuse-and-third-party.md', 'references/third-party-selection.md',
  'references/design-and-verification.md'];
const allowed = new Set([
  '.gitattributes', '.gitignore', 'LICENSE', 'README.md', 'README.zh-CN.md',
  '.github/workflows/verify.yml', 'examples/README.md', 'scripts/verify.mjs',
  ...skillFiles.map(file => `${skill}/${file}`),
  ...['spec.md', 'plan.md', 'tasks.md'].map(file => `specs/001-open-source-skill/${file}`),
  ...['survivor', 'mall'].flatMap(name =>
    ['README.md', 'core.mjs', 'application.mjs', 'demo.mjs', 'behavior.test.mjs']
      .map(file => `examples/${name}/${file}`)),
]);

async function listFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === '.git' && directory === root) continue;
    const path = resolve(directory, entry.name);
    assert(!entry.isSymbolicLink(), `Publication must not contain symlinks: ${entry.name}`);
    if (entry.isDirectory()) result.push(...await listFiles(path));
    else result.push(path);
  }
  return result;
}

const files = await listFiles(root);
const present = new Set(files.map(file => relative(root, file).replaceAll('\\', '/')));
for (const file of present) assert(allowed.has(file), `Unreviewed publication file: ${file}`);
for (const file of allowed) assert(present.has(file), `Missing publication file: ${file}`);

// This is a narrow accidental-leak check, not a replacement for manual review.
const leakPatterns = [
  /\b[A-Za-z]:[\\/](?:Users|Documents and Settings)[\\/]/i,
  /\bgh[pousr]_[A-Za-z0-9]{24,}\b/,
  /github_pat_[A-Za-z0-9_]{30,}/,
  /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/,
];
let linkCount = 0;
for (const file of files) {
  const text = await readFile(file, 'utf8');
  const label = relative(root, file).replaceAll('\\', '/');
  assert(!leakPatterns.some(pattern => pattern.test(text)), `Possible private content: ${label}`);
  if (!file.endsWith('.md')) continue;
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (/^(?:https?:|mailto:|#)/.test(target)) continue;
    const path = resolve(dirname(file), decodeURIComponent(target.split('#')[0]));
    const local = relative(root, path);
    assert(!local.startsWith('..') && !isAbsolute(local), `Link escapes repository: ${label}`);
    assert((await stat(path)).isFile(), `Broken local file link: ${label}`);
    linkCount += 1;
  }
}

const entrypoint = await readFile(resolve(root, skill, 'SKILL.md'), 'utf8');
assert(/^---\r?\nname: architecture-first-coding\r?\ndescription: [^\r\n]+\r?\n---/.test(entrypoint),
  'Skill entrypoint must retain valid name/description frontmatter');

// Optional local comparison never records a personal source directory in artifacts.
if (process.env.ARCHITECTURE_SKILL_SOURCE) {
  for (const file of skillFiles) {
    const published = await readFile(resolve(root, skill, file));
    const original = await readFile(resolve(process.env.ARCHITECTURE_SKILL_SOURCE, file));
    assert(published.equals(original), `Published skill differs from original: ${file}`);
  }
  console.log('Original skill comparison: all 5 files are byte-identical.');
}

console.log(`Publication checks passed: ${files.length} files, ${linkCount} local links.`);
const tests = spawnSync(process.execPath, ['--test',
  'examples/survivor/behavior.test.mjs', 'examples/mall/behavior.test.mjs'],
{ cwd: root, encoding: 'utf8' });
process.stdout.write(tests.stdout ?? '');
process.stderr.write(tests.stderr ?? '');
if (tests.error) throw tests.error;
assert.equal(tests.status, 0, 'Behavior tests failed');
