import { spawnSync } from 'node:child_process';
import { mkdir, writeFile, readdir, mkdtemp, cp, rm } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { tmpdir } from 'node:os';

const name = `portfolio-smoke-${process.pid}`;
const image = `portfolio:${name}`;
const buildRoot = resolve(process.env.PORTFOLIO_DIST_ROOT ?? 'dist');
const stage = await mkdtemp(resolve(tmpdir(), `${name}-`));
const report = { date: new Date().toISOString(), buildRoot, passed: false, checks: [], image: null, baseImage: null };
function docker(args, options = {}) {
  const result = spawnSync('docker', args, { encoding: 'utf8', ...options });
  if (result.status !== 0) throw new Error(`docker ${args[0]} failed: ${result.stderr || result.stdout}`);
  return result.stdout.trim();
}
function assert(condition, label) {
  if (!condition) throw new Error(label);
  report.checks.push(label);
}
async function builtRoutes(directory = resolve(stage, 'dist')) {
  const routes = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) routes.push(...await builtRoutes(path));
    else if (entry.name === 'index.html') routes.push('/' + relative(resolve(stage, 'dist'), path).replace(/index\.html$/, '').replace(/\\/g, '/'));
  }
  return routes.sort();
}
try {
  await cp(buildRoot, resolve(stage, 'dist'), { recursive: true });
  for (const file of ['Dockerfile', 'docker', '.dockerignore']) await cp(resolve(file), resolve(stage, file), { recursive: true });
  docker(['build', '-t', image, stage]);
  report.image = docker(['image', 'inspect', '--format', '{{.Id}}', image]);
  report.baseImage = docker(['image', 'inspect', '--format', '{{json .RepoDigests}}', 'nginx:stable-alpine']);
  docker(['compose', '-p', name, '-f', 'docker-compose.prod.yml', 'config', '--quiet'], { env: { ...process.env, PORTFOLIO_IMAGE: image } });
  docker(['run', '--detach', '--name', name, '-p', '127.0.0.1::8080', '--read-only', '--tmpfs', '/var/cache/nginx', '--tmpfs', '/var/run', '--tmpfs', '/tmp', '--security-opt', 'no-new-privileges:true', image]);
  const port = docker(['inspect', '--format', '{{(index (index .NetworkSettings.Ports "8080/tcp") 0).HostPort}}', name]);
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { if ((await fetch(base)).status === 200) { ready = true; break; } } catch {}
    await new Promise(done => setTimeout(done, 250));
  }
  assert(ready, 'Container starts with read-only filesystem and tmpfs runtime directories');
  docker(['exec', name, 'nginx', '-t']);
  assert(true, 'nginx configuration validates');
  for (const route of await builtRoutes()) {
    const response = await fetch(base + route);
    assert(response.status === 200 && (await response.text()).includes('<h1'), `Static route serves: ${route}`);
    assert(response.headers.get('x-content-type-options') === 'nosniff', `Security headers serve: ${route}`);
  }
  for (const route of ['/en', '/en/', '/da', '/da/']) {
    const response = await fetch(base + route, { redirect: 'manual' });
    assert(response.status === 301 && response.headers.get('location') === '/', `Locale URL redirects without internal port: ${route}`);
  }
  const missing = await fetch(base + '/not-a-real-page/');
  assert(missing.status === 404 && (await missing.text()).includes('Back to the work'), 'Missing route serves the portfolio 404 with HTTP404');
  const screenshot = await fetch(base + '/media/panelforge-gallery-desktop.webp');
  assert(screenshot.status === 200 && screenshot.headers.get('content-type') === 'image/webp' && Number(screenshot.headers.get('content-length')) > 1000, 'Public screenshots are readable by nginx workers');
  const video = await fetch(base + '/media/pencil-page-workflow.mp4', { headers: { Range: 'bytes=0-1023' } });
  assert(video.status === 206 && (await video.arrayBuffer()).byteLength === 1024 && video.headers.get('content-range')?.startsWith('bytes 0-1023/'), 'Video supports byte ranges for playback and seeking');
  const captions = await fetch(base + '/media/pencil-page-workflow.vtt');
  assert(captions.status === 200 && captions.headers.get('content-type')?.includes('text/vtt') && (await captions.text()).startsWith('WEBVTT'), 'Caption files serve as WebVTT');
  for (const [file, mime] of [['workbench/receipt.json', 'application/json'], ['workbench/transcript.txt', 'text/plain'], ['recovery/execution-receipt.json', 'application/json']]) {
    const available = await fetch(base + '/media/' + file);
    assert(available.status === 200 && available.headers.get('content-type')?.includes(mime), `Reviewed execution evidence serves with its MIME type: ${file}`);
    const text = await available.text();
    assert(text.length > 100 && !/\/home\/|BEGIN .*PRIVATE KEY|\bsk-(?:proj-|ant-api\d+-)?[A-Za-z0-9_-]{20,}/.test(text), `Execution evidence remains readable and redacted: ${file}`);
    if (file.endsWith('.json')) assert(JSON.parse(text) !== null, `Execution receipt is valid JSON: ${file}`);
  }
  for (const [file, mime] of [['conference-notes-demo.pdf', 'application/pdf'], ['conference-notes-demo.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']]) {
    const response = await fetch(base + '/sample-files/' + file, { method: 'HEAD' });
    assert(response.status === 200 && response.headers.get('content-type') === mime && Number(response.headers.get('content-length')) > 1000, `Reviewed artifact serves with its download MIME type: ${file}`);
  }
  assert((await fetch(base + '/sitemap.xml')).status === 200 && (await fetch(base + '/robots.txt')).status === 200, 'Search discovery endpoints serve');
  for (const route of ['/src/data/projects.ts', '/package.json', '/.env', '/docs/publishing.md']) assert((await fetch(base + route)).status === 404, `Private/build files stay outside web root: ${route}`);
  if (process.argv.includes('--browser')) {
    const browser = spawnSync('npm', ['run', 'test:browser'], { stdio: 'inherit', env: { ...process.env, PORTFOLIO_TEST_URL: base } });
    assert(browser.status === 0, 'Browser experience passes against the production nginx image');
  }
  report.passed = true;
  console.log(`Deployment smoke checks passed (${report.checks.length}).`);
} finally {
  spawnSync('docker', ['rm', '-f', name], { stdio: 'ignore' });
  spawnSync('docker', ['image', 'rm', image], { stdio: 'ignore' });
  await rm(stage, { recursive: true, force: true });
  if (process.env.PORTFOLIO_DEPLOYMENT_REPORT) {
    const output = resolve(process.env.PORTFOLIO_DEPLOYMENT_REPORT);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  }
}
