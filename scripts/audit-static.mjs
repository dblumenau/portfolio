import { readdir, readFile, stat, lstat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, dirname, extname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const root = resolve('dist');
const errors = [];
const external = new Set();
const report = { date: new Date().toISOString(), routes: [], assets: [], externalLinks: [], errors };
const required = [
  'panelforge-gallery-desktop.webp', 'panelforge-gallery-mobile.webp',
  'panelforge-chat-desktop.webp', 'panelforge-chat-mobile.webp',
  'panelforge-workflow.mp4', 'panelforge-workflow.vtt',
  'kitforge-desktop.webp', 'kitforge-workflow.mp4', 'kitforge-workflow.vtt',
  'pencil-page.webp', 'pencil-page-workflow.mp4', 'pencil-page-workflow.vtt',
  'apple-client.webp', 'apple-client-workflow.mp4', 'apple-client-workflow.vtt', 'media-provenance.json',
];
const allowed = new Set(required);

async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if ((await lstat(path)).isSymbolicLink()) errors.push(`Public symlink: ${relative(root, path)}`);
    else if (entry.isDirectory()) result.push(...await files(path));
    else result.push(path);
  }
  return result;
}
const all = await files(root);
const htmlFiles = all.filter(file => extname(file) === '.html');
const browser = await chromium.launch();
const context = await browser.newContext({ javaScriptEnabled: false });
await context.route('**/*', route => route.abort());
const pages = new Map();
for (const file of htmlFiles) {
  const route = '/' + relative(root, file).replace(/index\.html$/, '').replace(/\\/g, '/');
  const html = await readFile(file, 'utf8');
  if (/(?:BEGIN (?:RSA |OPENSSH )?PRIVATE KEY|sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}|\/home\/(?:david|dblumenau)\/|r2:\/\/|127\.0\.0\.1|localhost|\.env\b)/.test(html)) errors.push(`Private or development string in ${route}`);
  const page = await context.newPage();
  await page.setContent(html);
  const data = await page.evaluate(() => ({
    title: document.title,
    ids: [...document.querySelectorAll('[id]')].map(item => item.id),
    refs: [...document.querySelectorAll('a[href],link[href],img[src],script[src],source[src],track[src],video[poster]')].filter(item => item.getAttribute('rel') !== 'canonical').map(item => ({ tag: item.tagName, value: item.getAttribute(item.tagName === 'VIDEO' ? 'poster' : item.hasAttribute('href') ? 'href' : 'src') })),
    videos: [...document.querySelectorAll('video')].map(video => ({ source: video.querySelector('source')?.getAttribute('src'), captions: video.querySelector('track[kind="captions"]')?.getAttribute('src'), controls: video.controls, autoplay: video.autoplay })),
    placeholders: document.querySelectorAll('.missing-media').length,
    inputs: document.querySelectorAll('form,iframe,script[src^="http"]').length,
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
  }));
  if (!data.title) errors.push(`Missing title: ${route}`);
  if (new Set(data.ids).size !== data.ids.length) errors.push(`Duplicate IDs: ${route}`);
  if (data.placeholders) errors.push(`Unfinished capture placeholder: ${route}`);
  if (data.inputs) errors.push(`Unexpected form, embedded page or remote script: ${route}`);
  if (!data.canonical?.startsWith('https://danishdave.com/')) errors.push(`Invalid canonical: ${route}`);
  for (const video of data.videos) {
    if (!video.source || !video.captions || !video.controls || video.autoplay) errors.push(`Recording lacks controlled playback/captions: ${route} ${video.source}`);
  }
  pages.set(route, data);
  report.routes.push({ route, title: data.title, videos: data.videos });
  await page.close();
}
await browser.close();

for (const [route, data] of pages) for (const { value, tag } of data.refs) {
  if (!value) continue;
  if (value.startsWith('mailto:')) {
    if (!/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push(`Invalid email link: ${value}`);
    continue;
  }
  const url = new URL(value, `https://danishdave.com${route}`);
  if (url.protocol !== 'https:') { errors.push(`Unexpected link protocol: ${value}`); continue; }
  if (url.hostname !== 'danishdave.com') { external.add(url.href); continue; }
  let target = pages.get(url.pathname);
  if (!target && !extname(url.pathname)) target = pages.get(url.pathname.replace(/\/$/, '') + '/');
  if (target) {
    if (url.hash && !target.ids.includes(decodeURIComponent(url.hash.slice(1)))) errors.push(`Missing anchor: ${route} -> ${value}`);
  } else {
    const path = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (!path.startsWith(root + '/') || !all.includes(path)) errors.push(`Missing ${tag} destination: ${route} -> ${value}`);
  }
}

for (const name of required) if (!all.includes(resolve(root, 'media', name))) errors.push(`Missing mandatory media: ${name}`);
for (const file of all) {
  const name = relative(root, file).replace(/\\/g, '/');
  if (/(?:\.map$|(?:^|\/)(?:\.env|research|captures|verification|raw|node_modules|src|tests)(?:\/|$))/.test(name)) errors.push(`Private/source artifact in web root: ${name}`);
  if (!name.startsWith('media/')) continue;
  if (!allowed.has(name.slice(6))) errors.push(`Media needs explicit public review: ${name}`);
  const info = { path: name, bytes: (await stat(file)).size };
  if (info.bytes === 0) errors.push(`Empty public media file: ${name}`);
  if (name === 'media/media-provenance.json') {
    const provenance = await readFile(file, 'utf8');
    try {
      const data = JSON.parse(provenance);
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) errors.push('Public media provenance is empty.');
    } catch { errors.push('Public media provenance is not valid JSON.'); }
    if (/(?:\/home\/|r2:\/\/|127\.0\.0\.1|localhost|BEGIN .*PRIVATE KEY|sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,})/.test(provenance)) errors.push('Public media provenance contains a private/development reference.');
  }
  if (extname(file) === '.vtt') {
    const captions = await readFile(file, 'utf8');
    if (!/^WEBVTT\b/.test(captions) || !/\d{2}:\d{2}(?::\d{2})?\.\d{3} --> \d{2}:\d{2}(?::\d{2})?\.\d{3}/.test(captions)) errors.push(`Invalid/empty caption file: ${name}`);
  }
  if (extname(file) === '.mp4') {
    const result = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_name,codec_type,width,height', '-of', 'json', file], { encoding: 'utf8' });
    if (result.status !== 0) errors.push(`Video cannot be inspected with ffprobe: ${name}`);
    else {
      const metadata = JSON.parse(result.stdout);
      info.duration = Number(metadata.format.duration);
      info.streams = metadata.streams;
      if (!(info.duration > 1) || !metadata.streams.some(stream => stream.codec_type === 'video' && stream.codec_name === 'h264')) errors.push(`Invalid browser MP4: ${name}`);
    }
  }
  report.assets.push(info);
}
report.externalLinks = [...external].sort().map(url => ({ url }));
if (process.argv.includes('--external')) for (const link of report.externalLinks) {
  try {
    const response = await fetch(link.url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(20_000) });
    link.status = response.status;
    link.destination = response.url;
    if (response.status === 404 || (response.status >= 500 && response.status !== 999)) errors.push(`External link failed: ${link.url} (${response.status})`);
    if ([401, 403, 405, 429, 999].includes(response.status)) link.review = 'Remote service blocks the audit or does not support HEAD; verify in a real browser.';
  } catch (error) { link.review = `Remote check unavailable: ${error.message}`; }
}
if (process.env.PORTFOLIO_AUDIT_REPORT) {
  const output = resolve(process.env.PORTFOLIO_AUDIT_REPORT);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
}
console.log(`Audited ${pages.size} pages, ${report.assets.length} curated media files and ${external.size} external destinations.`);
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Static routes, anchors, media, captions and privacy checks passed.');
