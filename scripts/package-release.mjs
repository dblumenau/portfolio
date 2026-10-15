import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, cp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const output = resolve(process.argv[2] ?? 'artifacts');
if (process.env.PORTFOLIO_DIST_ROOT && resolve(process.env.PORTFOLIO_DIST_ROOT) !== resolve('dist')) throw new Error('Release packaging verifies the default dist directory. Unset PORTFOLIO_DIST_ROOT before packaging.');
if (output === resolve('dist') || output.startsWith(resolve('dist') + '/')) throw new Error('Release artifacts must stay outside the web root.');
for (const script of ['check:source', 'check', 'build', 'audit']) {
  const check = spawnSync('npm', ['run', script], { stdio: 'inherit' });
  if (check.status !== 0) process.exit(check.status ?? 1);
}
const deployment = spawnSync('npm', ['run', 'test:deployment', '--', '--browser'], { stdio: 'inherit' });
if (deployment.status !== 0) process.exit(deployment.status ?? 1);
const revision = spawnSync('git', ['rev-parse', '--short=12', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
const dirty = Boolean(spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).stdout.trim());
const date = new Date().toISOString();
const name = `portfolio-${date.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}-${revision}${dirty ? '-working' : ''}`;
await mkdir(output, { recursive: true });
const stage = await mkdtemp(join(tmpdir(), 'portfolio-release-'));
try {
  const release = join(stage, name);
  await mkdir(release);
  for (const file of ['dist', 'Dockerfile', 'docker', 'docker-compose.prod.yml', '.dockerignore', 'README.md', 'docs']) await cp(resolve(file), join(release, file), { recursive: true });
  await writeFile(join(release, 'release.json'), JSON.stringify({ name, revision, workingTree: dirty, builtAt: date, node: process.version, verified: ['retained-source', 'astro-check', 'production-build', 'static-audit', 'playwright', 'docker-smoke'] }, null, 2) + '\n');
  const archive = join(output, `${name}.tar.gz`);
  const tar = spawnSync('tar', ['-czf', archive, '-C', stage, name], { stdio: 'inherit' });
  if (tar.status !== 0) throw new Error('Release archive failed.');
  const digest = createHash('sha256').update(await readFile(archive)).digest('hex');
  await writeFile(`${archive}.sha256`, `${digest}  ${name}.tar.gz\n`);
  console.log(`Verified static package: ${archive}\nSHA-256: ${digest}`);
} finally { await rm(stage, { recursive: true, force: true }); }
