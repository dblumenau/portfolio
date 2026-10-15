import { spawn } from 'node:child_process';
import { mkdir, writeFile, open, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const groups = {
  site: ['portfolio', 'conference', 'features', 'releases'],
  memory: ['memory-lab'],
  workbench: ['workbench-lab'],
  recovery: ['recovery'],
  studio: ['studio'],
  'studio-spacing': ['studio-spacing'],
  printshop: ['world-printshop'],
  gateway: ['gateway'],
  branches: ['branches'],
  margin: ['margin'],
  question: ['question'],
  attention: ['attention'],
  listening: ['listening'],
  archive: ['archive'],
  curation: ['curation'],
  'image-revision': ['image-revision'],
  overview: ['overview'],
  transit: ['transit'],
  'code-history': ['code-history'],
  'selected-work': ['selected-work'],
  'audio-intent': ['audio-intent'],
  'world-task': ['world-attention'],
  world: ['world', 'world-exhibit', 'world-lifecycle'],
};
if (process.argv.includes('--list')) { console.log(JSON.stringify(groups, null, 2)); process.exit(0); }
const output = resolve(process.argv[2] ?? `test-results/segments-${process.pid}`);
const selected = process.argv.slice(3).length ? process.argv.slice(3) : Object.keys(groups);
if (selected.some(name => !Object.hasOwn(groups, name))) throw new Error('Unknown browser segment. Run with --list for valid names.');
await mkdir(output, { recursive: true });
const report = { started: new Date().toISOString(), buildRoot: resolve(process.env.PORTFOLIO_DIST_ROOT ?? 'dist'), selected, passed: false, interrupted: false, segments: [] };
const children = new Set();
let signal;
async function save() { await writeFile(resolve(output, 'segments.json'), JSON.stringify(report, null, 2) + '\n'); }
function stop(child, value = 'SIGTERM') {
  try { process.kill(-child.pid, value); } catch (error) { if (error.code !== 'ESRCH') throw error; }
}
function start(args, log) {
  const child = spawn(process.execPath, args, { env: process.env, detached: true, stdio: ['ignore', log.fd, log.fd] });
  children.add(child);
  child.once('exit', () => children.delete(child));
  return child;
}
for (const value of ['SIGINT', 'SIGTERM']) process.on(value, () => {
  signal = value;
  report.interrupted = true;
  for (const child of children) stop(child, value);
  setTimeout(() => { for (const child of children) stop(child, 'SIGKILL'); }, 5000).unref();
});
let preview;
let previewLog;
try {
  await save();
  const port = process.env.PORTFOLIO_PREVIEW_PORT ?? 4322;
  const base = process.env.PORTFOLIO_TEST_URL ?? `http://127.0.0.1:${port}`;
  if (!process.env.PORTFOLIO_TEST_URL) {
    previewLog = await open(resolve(output, 'preview.log'), 'w');
    preview = start(['scripts/serve-dist.mjs'], previewLog);
    let ready = false;
    for (let attempt = 0; attempt < 40 && !signal; attempt++) {
      if (preview.exitCode !== null) throw new Error('Owned preview exited before becoming ready; inspect preview.log.');
      const started = (await readFile(resolve(output, 'preview.log'), 'utf8')).includes(`Serving ${report.buildRoot} at ${base}`);
      try { if (started && (await fetch(base, { signal: AbortSignal.timeout(1000) })).status === 200 && preview.exitCode === null) { ready = true; break; } } catch {}
      await new Promise(done => setTimeout(done, 250));
    }
    if (!ready && !signal) throw new Error('Owned preview did not become ready; inspect preview.log.');
  }
  process.env.PORTFOLIO_TEST_URL = base;
  for (const name of selected) {
    if (signal) break;
    const entry = { name, started: new Date().toISOString(), status: 'running', specs: groups[name], report: resolve(output, `${name}.json`), log: resolve(output, `${name}.log`) };
    report.segments.push(entry);
    await save();
    const log = await open(entry.log, 'w');
    process.env.PORTFOLIO_BROWSER_REPORT = entry.report;
    process.env.PORTFOLIO_TEST_ARTIFACTS = resolve(output, `${name}-artifacts`);
    const child = start(['node_modules/@playwright/test/cli.js', 'test', ...groups[name].map(spec => `tests/browser/${spec}.spec.ts`)], log);
    const result = await new Promise((done, reject) => {
      child.once('error', reject);
      child.once('exit', (code, exitSignal) => done({ code, signal: exitSignal }));
    });
    await log.close();
    entry.finished = new Date().toISOString();
    entry.exitCode = result.code;
    entry.signal = result.signal;
    entry.status = result.code === 0 ? 'passed' : result.signal || signal ? 'interrupted' : 'failed';
    await save();
    console.log(`${name}: ${entry.status}. Evidence: ${entry.report}`);
    if (entry.status !== 'passed') break;
  }
  report.passed = !signal && report.segments.length === selected.length && report.segments.every(entry => entry.status === 'passed');
} finally {
  if (preview && children.has(preview)) {
    const exited = new Promise(done => preview.once('exit', done));
    stop(preview);
    await Promise.race([exited, new Promise(done => setTimeout(done, 5000))]);
    if (children.has(preview)) { stop(preview, 'SIGKILL'); await exited; }
  }
  await previewLog?.close();
  report.finished = new Date().toISOString();
  await save();
}
process.exitCode = report.passed ? 0 : signal === 'SIGINT' ? 130 : signal === 'SIGTERM' ? 143 : 1;
