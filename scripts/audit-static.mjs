import { readdir, readFile, stat, lstat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, dirname, extname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';

const root = resolve(process.env.PORTFOLIO_DIST_ROOT ?? 'dist');
const errors = [];
const external = new Set();
const report = { date: new Date().toISOString(), buildRoot: root, routes: [], assets: [], sampleFiles: [], externalLinks: [], errors };
const reviewedEvidenceMedia = [
  'workbench/receipt.json', 'workbench/transcript.txt', 'workbench/terminal-replay.mp4',
  'workbench/terminal-replay.vtt', 'workbench/terminal-replay.webp',
  'recovery/execution.mp4', 'recovery/execution.vtt', 'recovery/disconnected.png',
  'recovery/recovered.png', 'recovery/execution-receipt.json', 'recovery/manifest.json',
  'gateway/browser-replay.mp4', 'gateway/browser-replay.png', 'gateway/browser-replay.vtt',
  'gateway/gateway-boundary.png', 'gateway/receipt.json', 'gateway/transcript.txt',
  'studio/sample-print.png', 'studio/sample-loop.mp4', 'studio/sample-loop.webp', 'studio/sample-loop.vtt',
  'branches/comparison.webp', 'branches/execution.mp4', 'branches/execution.vtt',
  'branches/original-retained.webp', 'branches/receipt.json', 'branches/reference-handoff.webp',
  'margin/receipt.json', 'margin/scenarios.json',
  'question/execution.mp4', 'question/execution.vtt', 'question/question.png',
  'question/selected.png', 'question/completed.png', 'question/receipt.json',
  'attention/answered.png', 'attention/execution.mp4', 'attention/execution.vtt',
  'attention/poster.png', 'attention/question.png', 'attention/receipt.json',
  'attention/workshop-desktop.png', 'attention/workshop-phone.png', 'attention/workshop-source.txt',
  'listening/desktop.mp4',
  'listening/desktop.vtt',
  'listening/desktop.webp',
  'listening/notice.txt',
  'listening/react-dom-license.txt',
  'listening/react-license.txt',
  'listening/receipt.json',
  'listening/sample.wav',
  'listening/scheduler-license.txt',
  'listening/touch.mp4',
  'listening/touch.vtt',
  'listening/touch.webp',
  'archive/archive-boundary.png',
  'archive/receipt.json',
  'archive/recorded-replay.mp4',
  'archive/recorded-replay.vtt',
  'archive/replay-poster.png',
  'archive/synthetic-01.png',
  'archive/synthetic-02.png',
  'archive/synthetic-03.png',
  'archive/transcript.txt',
  'curation/receipt.json', 'curation/recorded-merge.png',
  'image-revision/original.jpg', 'image-revision/revision.jpg',
  'image-revision/gallery-detail.png', 'image-revision/completed-chat.png', 'image-revision/receipt.json',
  'overview/selected-work-overview.mp4', 'overview/selected-work-poster.jpg',
  'overview/selected-work-overview.vtt', 'overview/selected-work-text-alternative.txt',
];
const reviewedTextMedia = new Set(reviewedEvidenceMedia.filter(name => /\.(?:json|txt)$/.test(name)));
const required = [
  'panelforge-gallery-desktop.webp', 'panelforge-gallery-mobile.webp',
  'panelforge-chat-desktop.webp', 'panelforge-chat-mobile.webp',
  'panelforge-workflow.mp4', 'panelforge-workflow.vtt',
  'kitforge-desktop.webp', 'kitforge-workflow.mp4', 'kitforge-workflow.vtt',
  'pencil-page.webp', 'pencil-page-workflow.mp4', 'pencil-page-workflow.vtt',
  'apple-client.webp', 'apple-client-workflow.mp4', 'apple-client-workflow.vtt', 'media-provenance.json',
  'knowledge-graph.webp', 'knowledge-graph-workflow.mp4', 'knowledge-graph-workflow.vtt',
  'code-history-peek.webp', 'code-history-week.webp', 'kitforge-output.mp4', 'kitforge-output.vtt',
  'forge-world-overview.webp',
  'portfolio-social-card.png',
  'conference-notes-agenda.webp', 'conference-notes-attendee.webp',
  'conference-notes-deck-builder.webp', 'conference-notes-deck-theme.webp', 'conference-notes-deck.webp',
  'conference-notes-mobile-agenda.webp', 'conference-notes-mobile.webp', 'conference-notes-offline.webp',
  'conference-notes-responses.webp', 'conference-notes-sources.webp', 'conference-notes-themes.webp',
  'conference-notes-workflow.mp4', 'conference-notes-workflow.vtt', 'conference-notes.webp',
  ...reviewedEvidenceMedia,
];
const allowed = new Set(required);
const requiredSamples = ['conference-notes-demo.pptx', 'conference-notes-demo.pdf', 'sample-provenance.json'];
const studioNotices = ['studio/paper-license.txt', 'studio/paper-notice.txt', 'studio/mp4-muxer-license.txt'];
const provenanceEntries = new Map();
const captionEnds = new Map();
const videoDurations = new Map();

function checkPublicText(value, path) {
  if (/(?:\/(?:home|Users|root|mnt|Volumes)\/|[A-Za-z]:\\Users\\|r2:\/\/|127\.0\.0\.1|localhost)/i.test(value)) errors.push(`Private/development path in reviewed text media: ${path}`);
  if (/(?:BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY|\bsk-(?:proj-|ant-api\d+-)?[A-Za-z0-9_-]{20,}|\bgh[opusr]_[A-Za-z0-9]{20,}|\bAKIA[A-Z0-9]{16}\b)/.test(value)) errors.push(`Secret marker in reviewed text media: ${path}`);
  if (/["']?(?:access_token|refresh_token|api[_-]?key)["']?\s*[:=]\s*["'][^"'\s]{8,}/i.test(value)) errors.push(`Credential value in reviewed text media: ${path}`);
}
function inspectJsonStrings(value, path, field) {
  if (typeof value === 'string') {
    // The approved gateway fixture records its local transport's loopback address.
    if (path === 'media/gateway/receipt.json' && field === 'ip_address' && value === '127.0.0.1') return;
    checkPublicText(value, path);
  } else if (Array.isArray(value)) value.forEach(item => inspectJsonStrings(item, path, field));
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) { checkPublicText(key, path); inspectJsonStrings(item, path, key); }
}

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
for (const name of ['three', 'fraunces', 'dm-sans']) if (!all.includes(resolve(root, 'licenses', `${name}.txt`))) errors.push(`Missing distributed dependency license: ${name}`);
const imageFiles = all.filter(file => ['.webp', '.png', '.jpg', '.jpeg', '.avif'].includes(extname(file)));
const locationTags = spawnSync('exiftool', ['-j', '-GPS:all', ...imageFiles], { encoding: 'utf8' });
if (locationTags.status !== 0) errors.push('Image location metadata audit requires exiftool.');
else for (const item of JSON.parse(locationTags.stdout)) {
  if (Object.keys(item).some(key => key !== 'SourceFile')) errors.push(`Public image includes GPS metadata: ${relative(root, item.SourceFile)}`);
}
report.locationMetadata = { inspectedImages: imageFiles.length, gpsTags: errors.filter(error => error.includes('GPS metadata')).length };
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
    authoredText: (() => { const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const parts = []; while (walker.nextNode()) { const node = walker.currentNode; if (!node.parentElement?.closest('script,style')) parts.push(node.textContent ?? ''); } return parts.join(' '); })(),
    ids: [...document.querySelectorAll('[id]')].map(item => item.id),
    routeHashes: document.querySelector('[data-forge-world]') ? [...document.querySelectorAll('[data-select-district]')].map(item => item.getAttribute('data-select-district')) : [],
    refs: [
      ...[...document.querySelectorAll('a[href],link[href],img[src],script[src],source[src],track[src],track[data-src],audio[src],video[poster],video[data-src]')].filter(item => item.getAttribute('rel') !== 'canonical').map(item => ({ tag: item.tagName, value: item.getAttribute(item.tagName === 'VIDEO' ? item.hasAttribute('poster') ? 'poster' : 'data-src' : item.hasAttribute('href') ? 'href' : 'src') ?? item.getAttribute('data-src') })),
      ...[...document.querySelectorAll('video[data-poster]')].map(item => ({ tag: 'VIDEO', value: item.getAttribute('data-poster') })),
      ...[...document.querySelectorAll('[srcset]')].flatMap(item => (item.getAttribute('srcset') ?? '').split(',').map(candidate => ({ tag: item.tagName, value: candidate.trim().split(/\s+/)[0] }))),
      ...[...document.querySelectorAll('meta[property="og:image"]')].map(item => ({ tag: 'META', value: item.getAttribute('content') })),
    ],
    videos: [...document.querySelectorAll('video')].map(video => ({ source: video.querySelector('source')?.getAttribute('src') ?? video.getAttribute('src') ?? video.getAttribute('data-src'), captions: video.querySelector('track[kind="captions"]')?.getAttribute('src') ?? video.querySelector('track[kind="captions"]')?.getAttribute('data-src'), controls: video.controls, autoplay: video.autoplay })),
    placeholders: document.querySelectorAll('.missing-media').length,
    embeds: document.querySelectorAll('iframe,script[src^="http"]').length,
    forms: [...document.querySelectorAll('form')].map(form => ({
      approved: (form.matches('[data-feature-atlas] form.atlas-controls') && form.getAttribute('role') === 'search') || (form.matches('[data-release-explorer] form.release-filter-form') && form.getAttribute('aria-label') === 'Filter release history') || form.matches('[data-studio] form.studio-controls[data-controls]'),
      action: form.getAttribute('action'), method: form.getAttribute('method'), target: form.getAttribute('target'),
      mutationControls: form.querySelectorAll('input[type="file"],input[type="password"],button[formaction],input[formaction],button[formmethod],input[formmethod]').length,
    })),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    social: { image: document.querySelector('meta[property="og:image"]')?.getAttribute('content'), width: document.querySelector('meta[property="og:image:width"]')?.getAttribute('content'), height: document.querySelector('meta[property="og:image:height"]')?.getAttribute('content'), alt: document.querySelector('meta[property="og:image:alt"]')?.getAttribute('content'), card: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content') },
  }));
  if (!data.title) errors.push(`Missing title: ${route}`);
  const emojiCharacters = [...data.authoredText].filter(character => /[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F]/u.test(character) && !/[©®™]/u.test(character));
  if (emojiCharacters.length) errors.push(`Emoji in authored page text: ${route} (${[...new Set(emojiCharacters.map(character => `U+${character.codePointAt(0).toString(16).toUpperCase()}`))].join(', ')})`);
  if (new Set(data.ids).size !== data.ids.length) errors.push(`Duplicate IDs: ${route}`);
  if (data.placeholders) errors.push(`Unfinished capture placeholder: ${route}`);
  if (data.embeds) errors.push(`Unexpected embedded page or remote script: ${route}`);
  for (const form of data.forms) if (!form.approved || form.action || (form.method && form.method.toLowerCase() !== 'get') || form.target || form.mutationControls) errors.push(`Unreviewed or mutating form: ${route}`);
  if (!data.canonical?.startsWith('https://danishdave.com/')) errors.push(`Invalid canonical: ${route}`);
  if (data.social.image !== 'https://danishdave.com/media/portfolio-social-card.png' || data.social.width !== '1200' || data.social.height !== '630' || !data.social.alt || data.social.card !== 'summary_large_image') errors.push(`Incomplete social preview metadata: ${route}`);
  for (const video of data.videos) {
    if (!video.source || !video.captions || !video.controls || video.autoplay) errors.push(`Recording lacks controlled playback/captions: ${route} ${video.source}`);
  }
  pages.set(route, data);
  report.routes.push({ route, title: data.title, videos: data.videos });
  await page.close();
}
await browser.close();
if (pages.has('/labs/studio/')) for (const name of studioNotices) if (!all.includes(resolve(root, 'notices', name))) errors.push(`Missing distributed Studio license notice: ${name}`);
for (const file of all.filter(path => path.startsWith(resolve(root, 'notices') + '/'))) {
  const name = relative(resolve(root, 'notices'), file).replace(/\\/g, '/');
  if (!studioNotices.includes(name)) errors.push(`Unreviewed public license notice: ${name}`);
  if (name === 'studio/paper-notice.txt') {
    if (!(await readFile(file)).equals(await readFile(resolve('src/labs/studio/vendor/paper/NOTICE')))) errors.push(`Distributed Paper notice differs from its vendored original: ${name}`);
  } else if ((await readFile(file, 'utf8')).length < 100) errors.push(`Empty or truncated license notice: ${name}`);
}
if (!all.includes(resolve(root, 'sitemap.xml')) || !all.includes(resolve(root, 'robots.txt'))) errors.push('Missing sitemap or robots discovery endpoint.');
else {
  const sitemap = await readFile(resolve(root, 'sitemap.xml'), 'utf8');
  const published = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  const expected = [...pages.keys()].filter(route => route !== '/404.html').map(route => `https://danishdave.com${route}`);
  if (new Set(published).size !== published.length || published.length !== expected.length || expected.some(url => !published.includes(url))) errors.push('Sitemap does not match the complete published route set.');
  const robots = await readFile(resolve(root, 'robots.txt'), 'utf8');
  if (!robots.includes('Sitemap: https://danishdave.com/sitemap.xml') || /Disallow:\s*\/(?:\s|$)/.test(robots)) errors.push('Robots endpoint does not expose the sitemap or blocks the site.');
  report.discovery = { sitemapRoutes: published.length, sitemap: '/sitemap.xml', robots: '/robots.txt' };
}

for (const [route, data] of pages) for (const { value, tag } of data.refs) {
  if (!value) continue;
  if (value.startsWith('mailto:')) {
    if (!/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push(`Invalid email link: ${value}`);
    continue;
  }
  const url = new URL(value, `https://danishdave.com${route}`);
  if (url.protocol !== 'https:') { errors.push(`Unexpected link protocol: ${value}`); continue; }
  if (url.hostname !== 'danishdave.com') {
    if (tag !== 'A') errors.push(`Unexpected external resource: ${route} -> ${value}`);
    external.add(url.href); continue;
  }
  let target = pages.get(url.pathname);
  if (!target && !extname(url.pathname)) target = pages.get(url.pathname.replace(/\/$/, '') + '/');
  if (target) {
    if (url.hash && ![...target.ids, ...target.routeHashes].includes(decodeURIComponent(url.hash.slice(1)))) errors.push(`Missing anchor: ${route} -> ${value}`);
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
      if (!data || !Array.isArray(data.assets) || data.assets.length === 0) errors.push('Public media provenance has no asset records.');
      else for (const entry of data.assets) {
        if (typeof entry.file !== 'string' || (!/^[a-z0-9-]+\.(?:webp|mp4|vtt|png)$/.test(entry.file) && !reviewedEvidenceMedia.includes(entry.file)) || provenanceEntries.has(entry.file)) { errors.push(`Invalid or duplicate provenance filename: ${entry.file}`); continue; }
        if (!allowed.has(entry.file)) errors.push(`Unreviewed provenance asset: ${entry.file}`);
        if (!Number.isSafeInteger(entry.bytes) || entry.bytes < 1 || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? '') || !/^\d{4}-\d{2}-\d{2}$/.test(entry.captured ?? '') || !entry.product || !entry.method || !entry.content || !Array.isArray(entry.redactions)) errors.push(`Incomplete provenance record: ${entry.file}`);
        provenanceEntries.set(entry.file, entry);
      }
    } catch { errors.push('Public media provenance is not valid JSON.'); }
    if (/(?:\/home\/|r2:\/\/|127\.0\.0\.1|localhost|BEGIN .*PRIVATE KEY|sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,})/.test(provenance)) errors.push('Public media provenance contains a private/development reference.');
  }
  if (reviewedTextMedia.has(name.slice(6))) {
    const content = await readFile(file, 'utf8');
    if (content.includes('\ufffd') || content.includes('\0')) errors.push(`Invalid UTF-8 text media: ${name}`);
    if (extname(file) === '.json') {
      try {
        const data = JSON.parse(content);
        if (!data || typeof data !== 'object') errors.push(`Receipt must contain a JSON object: ${name}`);
        inspectJsonStrings(data, name);
      } catch { errors.push(`Invalid execution receipt JSON: ${name}`); }
    } else checkPublicText(content, name);
  }
  if (extname(file) === '.vtt') {
    const captions = await readFile(file, 'utf8');
    if (!/^WEBVTT\b/.test(captions) || !/\d{2}:\d{2}(?::\d{2})?\.\d{3} --> \d{2}:\d{2}(?::\d{2})?\.\d{3}/.test(captions)) errors.push(`Invalid/empty caption file: ${name}`);
    const seconds = value => value.split(':').reduce((total, part) => total * 60 + Number(part), 0);
    let previousEnd = 0;
    for (const match of captions.matchAll(/(\d{2}:\d{2}(?::\d{2})?\.\d{3}) --> (\d{2}:\d{2}(?::\d{2})?\.\d{3})/g)) {
      const start = seconds(match[1]), end = seconds(match[2]);
      if (end <= start || start < previousEnd) errors.push(`Unordered caption interval: ${name}`);
      previousEnd = end;
    }
    captionEnds.set(name.replace(/\.vtt$/, '.mp4'), previousEnd);
  }
  if (extname(file) === '.mp4') {
    const result = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_name,codec_type,width,height', '-of', 'json', file], { encoding: 'utf8' });
    if (result.status !== 0) errors.push(`Video cannot be inspected with ffprobe: ${name}`);
    else {
      const metadata = JSON.parse(result.stdout);
      info.duration = Number(metadata.format.duration);
      videoDurations.set(name, info.duration);
      info.streams = metadata.streams;
      if (!(info.duration > 1) || !metadata.streams.some(stream => stream.codec_type === 'video' && stream.codec_name === 'h264')) errors.push(`Invalid browser MP4: ${name}`);
    }
  }
  if (extname(file) === '.wav') {
    const result = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_name,codec_type,sample_rate,channels', '-of', 'json', file], { encoding: 'utf8' });
    if (result.status !== 0) errors.push(`Audio cannot be inspected with ffprobe: ${name}`);
    else {
      const metadata = JSON.parse(result.stdout);
      info.duration = Number(metadata.format.duration);
      info.streams = metadata.streams;
      if (!(info.duration > 0) || metadata.streams.length !== 1 || !metadata.streams.some(stream => stream.codec_type === 'audio' && stream.codec_name === 'pcm_s16le' && Number(stream.sample_rate) === 24000 && stream.channels === 1)) errors.push(`Audio differs from the reviewed mono 24 kHz PCM format: ${name}`);
    }
  }
  report.assets.push(info);
}
for (const [video, end] of captionEnds) {
  const duration = videoDurations.get(video);
  if (!duration) errors.push(`Captions have no paired recording: ${video}`);
  else if (end > duration + 0.05) errors.push(`Captions run beyond the recording: ${video}`);
}
for (const asset of report.assets) {
  if (asset.path === 'media/media-provenance.json') continue;
  const name = asset.path.slice(6);
  const entry = provenanceEntries.get(name);
  if (!entry) { errors.push(`Missing reviewed provenance record: ${name}`); continue; }
  asset.sha256 = createHash('sha256').update(await readFile(resolve(root, asset.path))).digest('hex');
  if (asset.sha256 !== entry.sha256 || asset.bytes !== entry.bytes) errors.push(`Media differs from reviewed provenance: ${name}`);
}
for (const name of provenanceEntries.keys()) if (!report.assets.some(asset => asset.path === `media/${name}`)) errors.push(`Provenance points to missing media: ${name}`);
for (const name of requiredSamples) if (!all.includes(resolve(root, 'sample-files', name))) errors.push(`Missing approved sample file: ${name}`);
const sampleEntries = new Map();
if (all.includes(resolve(root, 'sample-files/sample-provenance.json'))) {
  const content = await readFile(resolve(root, 'sample-files/sample-provenance.json'), 'utf8');
  try {
    const data = JSON.parse(content);
    if (!Array.isArray(data.assets) || data.assets.length !== 2) errors.push('Sample provenance must cover both approved artifacts.');
    else for (const entry of data.assets) {
      if (!requiredSamples.includes(entry.file) || entry.file === 'sample-provenance.json' || sampleEntries.has(entry.file)) errors.push(`Unreviewed or duplicate sample record: ${entry.file}`);
      if (!entry.content || !entry.editing || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? '') || !Number.isSafeInteger(entry.bytes)) errors.push(`Incomplete sample provenance: ${entry.file}`);
      sampleEntries.set(entry.file, entry);
    }
  } catch { errors.push('Sample provenance is not valid JSON.'); }
  if (/(?:\/home\/|r2:\/\/|127\.0\.0\.1|localhost|BEGIN .*PRIVATE KEY)/.test(content)) errors.push('Sample provenance includes a private/development reference.');
}
for (const file of all.filter(path => path.startsWith(resolve(root, 'sample-files') + '/'))) {
  const name = relative(resolve(root, 'sample-files'), file);
  if (!requiredSamples.includes(name)) { errors.push(`Sample file needs explicit public review: ${name}`); continue; }
  if (name === 'sample-provenance.json') continue;
  const bytes = await readFile(file);
  const entry = sampleEntries.get(name);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (!entry || entry.bytes !== bytes.length || entry.sha256 !== sha256) errors.push(`Sample differs from reviewed provenance: ${name}`);
  if ((name.endsWith('.pdf') && bytes.subarray(0, 5).toString() !== '%PDF-') || (name.endsWith('.pptx') && bytes.readUInt32LE(0) !== 0x04034b50)) errors.push(`Invalid sample file format: ${name}`);
  report.sampleFiles.push({ path: `sample-files/${name}`, bytes: bytes.length, sha256 });
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
