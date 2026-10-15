import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import fixture from '../../src/labs/listening/fixture.json' with { type: 'json' };
import provenance from '../../src/labs/listening/provenance.json' with { type: 'json' };

async function ready(page: import('@playwright/test').Page) {
  await page.goto('/labs/listening/');
  await expect(page.locator('[data-listening-player]')).toBeVisible();
  await page.waitForFunction(() => document.querySelector<HTMLAudioElement>('[data-listening-audio]')!.readyState >= 2);
}
const audioTime = (page: import('@playwright/test').Page) => page.locator('[data-listening-audio]').evaluate((audio: HTMLAudioElement) => audio.currentTime);

async function playBeforeEnhancement(page: import('@playwright/test').Page) {
  let release!: () => void;
  let requested!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const moduleRequested = new Promise<void>(resolve => { requested = resolve; });
  await page.route('**/_astro/ListeningLab*.js', async route => { requested(); await gate; await route.continue(); });
  await page.goto('/labs/listening/', { waitUntil: 'commit' });
  const native = page.locator('.ll-fallback audio');
  await native.waitFor();
  await moduleRequested;
  await native.scrollIntoViewIfNeeded();
  await native.evaluate(async (audio: HTMLAudioElement) => {
    (window as any).__nativeAudio = audio;
    (window as any).__nativeEvents = [];
    (window as any).__enhancedPlayEvents = 0;
    for (const event of ['play', 'playing', 'pause', 'ended']) audio.addEventListener(event, () => (window as any).__nativeEvents.push({ event, time: audio.currentTime, connected: audio.isConnected }));
    document.addEventListener('play', event => { if ((event.target as Element)?.matches('[data-listening-audio]')) (window as any).__enhancedPlayEvents++; }, true);
    audio.muted = true;
    await audio.play();
  });
  await expect.poll(() => native.evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(.6);
  return { native, release };
}

test('a playing native fallback survives module arrival and hands off paused at the visitor position', async ({ page }) => {
  const { native, release } = await playBeforeEnhancement(page);
  try {
    const before = await native.evaluate((audio: HTMLAudioElement) => audio.currentTime);
    release();
    await expect(page.locator('#ll-player')).toHaveAttribute('data-listening-state', 'waiting-for-pause');
    await expect.poll(() => native.evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(before + .5);
    expect(await native.evaluate((audio: HTMLAudioElement) => ({ connected: audio.isConnected, paused: audio.paused }))).toEqual({ connected: true, paused: false });
    await expect(page.locator('[data-listening-player]')).toHaveCount(0);
    await expect(page.locator('.ll-fallback-loading')).toHaveText('The word and waveform controls are ready. Pause the sample or let it finish to use them.');
    await page.screenshot({ path: test.info().outputPath('native-playing-after-module.png') });
    await native.click({ position: { x: 30, y: 27 } });
    await expect(page.locator('[data-listening-player]')).toBeVisible();
    const stopped = await page.evaluate(() => (window as any).__nativeAudio.currentTime);
    await expect.poll(async () => Math.abs(await audioTime(page) - stopped)).toBeLessThan(.03);
    await page.waitForTimeout(250);
    expect(await page.locator('[data-listening-audio]').evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true);
    expect(await audioTime(page)).toBeCloseTo(stopped, 2);
    expect(await page.evaluate(() => (window as any).__enhancedPlayEvents)).toBe(0);
    const evidence = await page.evaluate(() => ({ old: { time: (window as any).__nativeAudio.currentTime, paused: (window as any).__nativeAudio.paused, connected: (window as any).__nativeAudio.isConnected }, enhanced: { time: document.querySelector<HTMLAudioElement>('[data-listening-audio]')!.currentTime, paused: document.querySelector<HTMLAudioElement>('[data-listening-audio]')!.paused }, events: (window as any).__nativeEvents, enhancedPlayEvents: (window as any).__enhancedPlayEvents }));
    expect(evidence.old).toMatchObject({ paused: true, connected: false });
    expect(evidence.events.filter((event: any) => event.event === 'pause')).toHaveLength(1);
    expect(evidence.events.find((event: any) => event.event === 'pause').connected).toBe(true);
    await writeFile(test.info().outputPath('native-pause-handoff.json'), JSON.stringify({ before, ...evidence }, null, 2));
    await page.screenshot({ path: test.info().outputPath('enhanced-after-native-pause.png') });
  } finally { release(); }
});

test('a native sample may finish before enhancement without an automatic replay', async ({ page }) => {
  const { native, release } = await playBeforeEnhancement(page);
  try {
    await native.evaluate((audio: HTMLAudioElement) => { audio.currentTime = audio.duration - 1; });
    release();
    await expect(page.locator('#ll-player')).toHaveAttribute('data-listening-state', 'waiting-for-pause');
    await expect(page.locator('[data-listening-player]')).toBeVisible();
    await expect.poll(() => audioTime(page)).toBeCloseTo(fixture.chapter.audio_seconds, 2);
    expect(await page.evaluate(() => (window as any).__nativeAudio.ended)).toBe(true);
    expect(await page.locator('[data-listening-audio]').evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true);
    expect(await page.evaluate(() => (window as any).__enhancedPlayEvents)).toBe(0);
  } finally { release(); }
});

test('page lifecycle pauses a waiting native fallback and restores its position without restarting it', async ({ page }) => {
  const { release } = await playBeforeEnhancement(page);
  try {
    release();
    await expect(page.locator('#ll-player')).toHaveAttribute('data-listening-state', 'waiting-for-pause');
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    const stopped = await page.evaluate(() => (window as any).__nativeAudio.currentTime);
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => ({ paused: (window as any).__nativeAudio.paused, connected: (window as any).__nativeAudio.isConnected }))).toEqual({ paused: true, connected: true });
    await expect(page.locator('[data-listening-player]')).toHaveCount(0);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    await expect(page.locator('[data-listening-player]')).toBeVisible();
    await expect.poll(async () => Math.abs(await audioTime(page) - stopped)).toBeLessThan(.03);
    expect(await page.locator('[data-listening-audio]').evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true);
    expect(await page.evaluate(() => (window as any).__enhancedPlayEvents)).toBe(0);
  } finally { release(); }
});

test('actual audio time drives the retained highlight, seeking and native range keys', async ({ page }) => {
  await ready(page);
  const current = page.locator('[data-listening-text] .word.current');
  await expect(current).toHaveText('Ved ');
  await page.getByRole('button', { name: 'Play story', exact: true }).click();
  await expect.poll(() => audioTime(page)).toBeGreaterThan(.6);
  await expect(current).not.toHaveText('Ved ');
  await page.getByRole('button', { name: 'Pause story', exact: true }).click();
  const stopped = await audioTime(page);
  await page.waitForTimeout(250);
  expect(await audioTime(page)).toBeCloseTo(stopped, 1);
  await page.getByRole('slider', { name: 'Story position', exact: true }).fill('8.55');
  await expect.poll(() => audioTime(page)).toBeCloseTo(8.55, 1);
  await expect(current).toHaveText('kortet ');
  await page.getByRole('slider', { name: 'Story position', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => audioTime(page)).toBeCloseTo(8.56, 1);
  expect(await audioTime(page)).toBeLessThan(8.7);
  await page.getByRole('combobox', { name: 'Reading view' }).selectOption('guide');
  await expect(page.locator('[data-listening-text] .guide .word.current')).toHaveText('kortet ');
  await page.getByRole('combobox', { name: 'Reading view' }).selectOption('subtitle');
  await expect(page.locator('[data-listening-text] .subtitle')).toContainText('På kortet stod der:');
});

test('ordinary mouse gestures seek, select a real loop, repeat, pause at end and clear', async ({ page }) => {
  await ready(page);
  const wave = page.locator('.ll-player .waveform');
  await wave.scrollIntoViewIfNeeded();
  const box = (await wave.boundingBox())!;
  await page.mouse.click(box.x + box.width * .72, box.y + 35);
  await expect.poll(() => audioTime(page)).toBeCloseTo(fixture.chapter.audio_seconds * .72, 1);
  await expect(page.getByTitle('Clear region')).toHaveCount(0);
  await page.mouse.move(box.x + box.width * .286163522, box.y + 35);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .492, box.y + 35, { steps: 18 });
  await page.mouse.up();
  await expect(page.getByTitle('Disable looping')).toBeVisible();
  await page.evaluate(() => {
    const audio = document.querySelector<HTMLAudioElement>('[data-listening-audio]')!;
    (window as any).__loopTimes = [];
    audio.addEventListener('timeupdate', () => (window as any).__loopTimes.push(audio.currentTime));
  });
  await page.getByRole('button', { name: 'Play story', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__loopTimes.filter((time: number, index: number, times: number[]) => index > 0 && times[index - 1] - time > 1).length), { timeout: 12_000 }).toBeGreaterThanOrEqual(1);
  await page.getByTitle('Disable looping').click();
  await expect.poll(() => page.locator('[data-listening-audio]').evaluate((audio: HTMLAudioElement) => audio.paused), { timeout: 6_000 }).toBe(true);
  await expect.poll(() => audioTime(page)).toBeCloseTo(fixture.chapter.audio_seconds * .492, 1);
  await page.getByTitle('Clear region').click();
  await expect(page.getByTitle('Clear region')).toHaveCount(0);
  await expect(page.locator('.ll-player .wave-loop')).toBeHidden();
});

test('scoped keys and the declared synthetic sentence helper work after zoom and resize', async ({ page }) => {
  await ready(page);
  const player = page.locator('[data-listening-player]');
  await player.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => audioTime(page)).toBeCloseTo(4.92, 1);
  await page.keyboard.press('ArrowUp');
  await expect.poll(() => page.locator('[data-listening-audio]').evaluate((audio: HTMLAudioElement) => audio.playbackRate)).toBe(1.1);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Shift+ArrowRight');
  await expect.poll(() => audioTime(page)).toBeCloseTo(14.92, 1);
  await page.keyboard.press('Shift+ArrowLeft');
  await expect.poll(() => audioTime(page)).toBeCloseTo(4.92, 1);
  await page.getByRole('slider', { name: 'Waveform zoom' }).fill('3.5');
  await page.evaluate(() => {
    (window as any).__helperPointers = [];
    for (const type of ['pointerdown', 'pointermove', 'pointerup']) document.querySelector('.ll-player .waveform')!.addEventListener(type, event => (window as any).__helperPointers.push({ type: event.type, trusted: event.isTrusted }));
  });
  await page.getByRole('button', { name: 'Repeat this sentence' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTitle('Disable looping')).toBeVisible();
  await expect.poll(() => audioTime(page)).toBeGreaterThanOrEqual(4.92);
  expect(await audioTime(page)).toBeLessThan(7.42);
  expect(await page.evaluate(() => (window as any).__helperPointers)).toEqual([{ type: 'pointerdown', trusted: false }, { type: 'pointermove', trusted: false }, { type: 'pointerup', trusted: false }]);
  await page.getByRole('button', { name: 'Pause story', exact: true }).click();
  await page.getByTitle('Disable looping').click();
  await page.getByTitle('Clear region').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('slider', { name: 'Story position', exact: true }).fill('12');
  await page.getByRole('button', { name: 'Repeat this sentence' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTitle('Disable looping')).toBeVisible();
  await expect.poll(() => audioTime(page)).toBeGreaterThanOrEqual(11.12);
  expect(await audioTime(page)).toBeLessThan(15.74);
  await player.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Play story', exact: true })).toBeVisible();
});

test('trusted touch tap differs from early drag and deliberate hold selection', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await ready(page);
  const wave = page.locator('.ll-player .waveform');
  await wave.scrollIntoViewIfNeeded();
  const box = (await wave.boundingBox())!, y = box.y + 35;
  const session = await context.newCDPSession(page);
  const touch = (type: 'touchStart' | 'touchEnd' | 'touchMove' | 'touchCancel', x = 0) => session.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1, radiusX: 3, radiusY: 3 }] });
  await page.evaluate(() => {
    (window as any).__touchPointers = [];
    document.querySelector('.ll-player .waveform')!.addEventListener('pointerdown', event => (window as any).__touchPointers.push({ trusted: event.isTrusted, pointerType: (event as PointerEvent).pointerType }));
  });
  await touch('touchStart', box.x + box.width * .72);
  await page.waitForTimeout(80);
  await touch('touchEnd');
  await expect.poll(() => audioTime(page)).toBeCloseTo(15.9 * .72, 1);
  await expect(page.getByTitle('Clear region')).toHaveCount(0);
  const before = await audioTime(page);
  await touch('touchStart', box.x + box.width * .1);
  await page.waitForTimeout(70);
  await touch('touchMove', box.x + box.width * .2);
  await touch('touchEnd');
  await page.waitForTimeout(450);
  expect(await audioTime(page)).toBeCloseTo(before, 1);
  await expect(page.getByTitle('Clear region')).toHaveCount(0);
  await touch('touchStart', box.x + box.width * .3);
  await page.waitForTimeout(550);
  await expect(wave).toHaveClass(/armed/);
  for (let index = 1; index <= 16; index++) { await touch('touchMove', box.x + box.width * (.3 + .18 * index / 16)); await page.waitForTimeout(20); }
  await touch('touchEnd');
  await expect(page.getByTitle('Clear region')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__touchPointers)).toEqual([{ trusted: true, pointerType: 'touch' }, { trusted: true, pointerType: 'touch' }, { trusted: true, pointerType: 'touch' }]);
  await page.getByTitle('Clear region').tap();
  await expect(page.getByTitle('Clear region')).toHaveCount(0);
  await context.close();
});

test('the static player makes no outbound mutations or storage writes', async ({ page, baseURL }) => {
  const mutations: string[] = [], external: string[] = [];
  page.on('request', request => { if (!['GET', 'HEAD'].includes(request.method())) mutations.push(request.method() + ' ' + request.url()); if (new URL(request.url()).origin !== new URL(baseURL!).origin) external.push(request.url()); });
  await page.addInitScript(() => {
    (window as any).__storageWrites = [];
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) { (window as any).__storageWrites.push(key); return original.call(this, key, value); };
  });
  await ready(page);
  await page.getByRole('combobox', { name: 'Reading view' }).selectOption('guide');
  await page.getByRole('slider', { name: 'Playback speed' }).fill('1.2');
  await page.getByRole('button', { name: 'Repeat this sentence' }).click();
  await expect(page.getByRole('button', { name: 'Pause story', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Pause story', exact: true }).click();
  expect(mutations).toEqual([]);
  expect(external).toEqual([]);
  expect(await page.evaluate(() => (window as any).__storageWrites)).toEqual([]);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
});

for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 1000 }]) {
  test(`listening is readable, accessible and contained at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await ready(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Repeat a phrase from a Danish story.');
    await expect(page.getByText('AI-generated Danish narration.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Repeat this sentence' }).click();
    await page.getByRole('button', { name: 'Pause story', exact: true }).click();
    const geometry = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth, player: document.querySelector('[data-listening-player]')!.getBoundingClientRect().toJSON() }));
    expect(geometry.document).toBeLessThanOrEqual(viewport.width + 1);
    expect(geometry.body).toBeLessThanOrEqual(viewport.width + 1);
    expect(geometry.player.width).toBeGreaterThan(viewport.width === 390 ? 280 : 500);
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(axe.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('curated audio, captions, source compilation and provenance are exact and bounded', async ({ request, page }) => {
  execFileSync(process.execPath, ['src/labs/listening/vendor/compile.mjs', '--check']);
  for (const component of provenance.components) {
    expect(createHash('sha256').update(readFileSync(`src/labs/listening/vendor/source/${component.component}.tsx.txt`)).digest('hex')).toBe(component.original_sha256);
    expect(createHash('sha256').update(readFileSync(`src/labs/listening/vendor/components/${component.component}.js`)).digest('hex')).toBe(component.compiled_sha256);
  }
  const response = await request.get('/media/listening/sample.wav');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/^audio\/(?:x-)?wav/);
  expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(provenance.fixture.audio_sha256);
  const receipt = await (await request.get('/media/listening/receipt.json')).json();
  expect(receipt.fixture.words).toBe(39);
  expect(receipt.fixture.duration_seconds).toBe(15.9);
  expect(receipt.fixture.human_listening_review).toBe(false);
  expect(receipt.fixture.original_pdf_srt_pipeline_tested).toBe(false);
  expect(receipt.voice.ai_generated).toBe(true);
  expect(receipt.recordings.touch.physical_device).toBe(false);
  expect(JSON.stringify(receipt)).not.toMatch(/\/home\/|localhost|127\.0\.0\.1|requestId|Bearer |access_token|refresh_token/);
  for (const name of ['desktop', 'touch'] as const) {
    const captions = await (await request.get(`/media/listening/${name}.vtt`)).text();
    expect(captions).toMatch(/^WEBVTT/);
    const toSeconds = (stamp: string) => stamp.split(':').reduce((sum, part) => sum * 60 + Number(part), 0);
    let previous = 0;
    for (const match of captions.matchAll(/(\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}\.\d{3})/g)) { const start = toSeconds(match[1]), end = toSeconds(match[2]); expect(start).toBeGreaterThanOrEqual(previous); expect(end).toBeGreaterThan(start); previous = end; }
    expect(previous).toBeLessThanOrEqual(receipt.recordings[name].duration_seconds + .001);
    expect(previous).toBeGreaterThan(receipt.recordings[name].duration_seconds - .1);
  }
  for (const library of ['react', 'react-dom', 'scheduler']) expect(await (await request.get(`/media/listening/${library}-license.txt`)).text()).toContain('MIT License');
  await ready(page);
  const videos = page.locator('.ll-films video');
  await expect(videos).toHaveCount(2);
  await expect(videos.nth(0).locator('track')).toHaveAttribute('src', '/media/listening/desktop.vtt');
  await expect(videos.nth(1).locator('track')).toHaveAttribute('src', '/media/listening/touch.vtt');
  await page.getByText('What happens in the desktop recording', { exact: true }).click();
  await expect(page.getByText('The 24.23-second recording starts', { exact: false })).toBeVisible();
  await page.getByText('What happens in the touch recording', { exact: true }).click();
  await expect(page.getByText('The 17.88-second silent recording', { exact: false })).toBeVisible();
});

test('without JavaScript the original story and native audio remain available', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/labs/listening/');
  await expect(page.locator('.ll-fallback audio')).toHaveAttribute('controls', '');
  await page.getByText('Read the complete original Danish story', { exact: true }).click();
  await expect(page.locator('.ll-transcript p')).toHaveText(fixture.aligned.map(word => word.word).join(' '));
  await context.close();
});

test('page lifecycle pauses audio and restores the manual island from a cached page', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'Play story', exact: true }).click();
  await expect.poll(() => audioTime(page)).toBeGreaterThan(.3);
  await page.evaluate(() => {
    (window as any).__departingAudio = document.querySelector('[data-listening-audio]');
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
  });
  await expect(page.locator('[data-listening-player]')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__departingAudio.paused)).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await expect(page.locator('[data-listening-player]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play story', exact: true })).toBeVisible();
  await expect(page.locator('[data-listening-text] .word.current')).toHaveText('Ved ');
});
