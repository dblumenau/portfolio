import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const route = '/features/voice-conversation-loop/#sound-when-you-choose';
const sectionOf = (page: Page) => page.locator('[data-audio-intent]');
const native = (page: Page) => page.evaluate(() => (window as any).__audioIntentAudit.events as Array<Record<string, any>>);

async function observe(page: Page, external?: (event: Record<string, unknown>) => void) {
  if (external) await page.exposeFunction('__audioAuditSink', external);
  await page.addInitScript(() => {
    const events: Array<Record<string, unknown>> = [];
    const timers = new Map<number, number>();
    const record = (kind: string, data: Record<string, unknown> = {}) => {
      const event = { kind, ms: performance.now(), ...data };
      events.push(event);
      if (location.pathname.includes('/features/voice-conversation-loop/')) sessionStorage.setItem('__audioIntentLifecycle', JSON.stringify(events));
      (window as any).__audioAuditSink?.(event);
    };
    (window as any).__audioIntentAudit = { events, timers: () => [...timers.values()] };
    const originalPlay = HTMLMediaElement.prototype.play;
    const originalPause = HTMLMediaElement.prototype.pause;
    const seen = new WeakSet<HTMLMediaElement>();
    HTMLMediaElement.prototype.play = function (...args) {
      if (!seen.has(this)) {
        seen.add(this);
        for (const kind of ['playing', 'ended', 'error']) this.addEventListener(kind, () => record('media-' + kind, { src: this.currentSrc || this.src, time: this.currentTime }));
      }
      record('media-play', { src: this.currentSrc || this.src, active: navigator.userActivation.isActive });
      return originalPlay.apply(this, args);
    };
    HTMLMediaElement.prototype.pause = function (...args) { record('media-pause', { src: this.currentSrc || this.src }); return originalPause.apply(this, args); };
    const NativeContext = window.AudioContext;
    window.AudioContext = new Proxy(NativeContext, { construct(Target, args) { record('context-created', { active: navigator.userActivation.isActive }); return Reflect.construct(Target, args); } });
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) { record('pcm-start'); return start.apply(this, args); };
    const timeout = window.setTimeout, interval = window.setInterval, clearTimeoutNative = window.clearTimeout, clearIntervalNative = window.clearInterval;
    window.setTimeout = ((callback: (...args: any[]) => void, ms?: number, ...args: any[]) => {
      let id: number; id = timeout(() => { timers.delete(id); callback(...args); }, ms);
      if ([260, 520, 10000, 15000].includes(ms ?? 0)) timers.set(id, ms!);
      return id;
    }) as typeof window.setTimeout;
    window.setInterval = ((callback: TimerHandler, ms?: number, ...args: any[]) => { const id = interval(callback, ms, ...args); if ([60, 1000].includes(ms ?? 0)) timers.set(id, ms!); return id; }) as typeof window.setInterval;
    window.clearTimeout = (id) => { if (typeof id === 'number') timers.delete(id); clearTimeoutNative(id); };
    window.clearInterval = (id) => { if (typeof id === 'number') timers.delete(id); clearIntervalNative(id); };
    document.addEventListener('click', event => { if ((event.target as Element).closest('[data-audio-listen]')) record('listen-gesture', { trusted: event.isTrusted, active: navigator.userActivation.isActive }); }, true);
    window.addEventListener('pagehide', () => record('pagehide'));
  });
}

async function open(page: Page) {
  await page.goto(route);
  await expect(sectionOf(page)).toHaveAttribute('data-audio-ready', 'true');
  await sectionOf(page).scrollIntoViewIfNeeded();
}

const expectedToneHashes = [
  '9b0249c018b7d9019e38d4632c9cde184027df14c89e908139171932e44b9936',
  'fad4ff00e96b084420eab227fcfd56490d6398e3f3f54ce04af4afb5a6f1a552',
  '639937ea0d7561a7dfcc5329e64e5613e57f23e601772670e6322aeb31cd299d',
];

test('retained source and reviewed tone bytes match their receipts', async () => {
  const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
  expect(sha(await readFile('src/showcases/audio-intent/vendor/retained/audioRuntime.ts.txt'))).toBe('768a72c288fd11807d64d2302798486cf5c020fa3760ce19bb0d7863e1dbf3b0');
  expect(sha(await readFile('src/showcases/audio-intent/vendor/retained/useWebAudioPlayer.ts.txt'))).toBe('3b85ffbb132973703b23cc298cd32d059939c5576f2be891e042702fa0b74752');
  for (let i = 0; i < 3; i++) expect(sha(await readFile(`public/media/audio-intent/tone-${i}.wav`))).toBe(expectedToneHashes[i]);
  const receipt = JSON.parse(await readFile('public/media/audio-intent/receipt.json', 'utf8'));
  expect(receipt.privateVerification.baseline).toMatchObject({ passingChecks: 33, totalChecks: 34 });
  expect(receipt.privateVerification.separateUnreleasedCorrection).toMatchObject({ passingChecks: 45, totalChecks: 45 });
});

test('fresh ordinary actions and incoming sample events stay quiet without API requests', async ({ page, context }) => {
  await observe(page);
  const requests: string[] = [];
  context.on('request', request => requests.push(request.url()));
  await context.route('**/*', request => request.request().url().startsWith('http://127.0.0.1:') ? request.continue() : request.abort());
  await open(page);
  const section = sectionOf(page);
  await section.locator('select').selectOption('ordered');
  await section.locator('details > summary').click();
  await section.getByRole('button', { name: 'Receive sample reply' }).click();
  await expect(section.locator('[role=status]')).toContainText('Audio stayed off');
  await expect(section).toHaveAttribute('data-audio-armed', 'false');
  await expect(section).toHaveAttribute('data-audio-playing', 'false');
  await expect(section).toHaveAttribute('data-audio-synthesizing', 'false');
  await page.waitForTimeout(650);
  expect((await native(page)).filter(event => ['context-created', 'media-play', 'pcm-start'].includes(event.kind))).toEqual([]);
  expect(requests.filter(url => /\/api\/|tone-[012]\.wav|https:\/\//.test(url))).toEqual([]);
});

for (const delivery of ['ordered', 'reordered']) {
  test(`trusted Listen runs the real ${delivery} queue`, async ({ page }) => {
    await observe(page); await open(page);
    const section = sectionOf(page);
    await section.locator('select').selectOption(delivery);
    await section.getByRole('button', { name: 'Listen to sample' }).click();
    if (delivery === 'reordered') {
      await expect(section).toHaveAttribute('data-audio-synthesizing', 'true');
      await expect(section.locator('[data-audio-arrival]')).toContainText('Received: 3.');
    }
    await expect(section.locator('[role=status]')).toHaveText('Queue finished. This page stays enabled.');
    const events = await native(page);
    const play = events.filter(event => event.kind === 'media-play');
    expect(play.map(event => new URL(event.src).pathname)).toEqual([0, 1, 2].map(index => `/media/audio-intent/tone-${index}.wav`));
    expect(events.filter(event => event.kind === 'media-ended')).toHaveLength(3);
    expect(events.find(event => event.kind === 'listen-gesture')).toMatchObject({ trusted: true, active: true });
    expect(events.find(event => event.kind === 'context-created')).toMatchObject({ active: true });
    expect(events.findIndex(event => event.kind === 'listen-gesture')).toBeLessThan(events.findIndex(event => event.kind === 'context-created'));
    expect(events.filter(event => event.kind === 'pcm-start')).toEqual([]);
    await expect(section).toHaveAttribute('data-audio-synthesizing', 'false');
    await expect(section.locator('[data-audio-arrival]')).toContainText(delivery === 'reordered' ? 'Received: 3 → 1 → 2.' : 'Received: 1 → 2 → 3.');
  });
}

test('Stop cancels waiting deliveries and watchdogs, preserves intent, and reload creates a quiet page', async ({ page }) => {
  await observe(page); await open(page);
  const section = sectionOf(page);
  await section.getByRole('button', { name: 'Listen to sample' }).click();
  await expect(section.locator('[data-audio-arrival]')).toContainText('Received: 3.');
  await section.getByRole('button', { name: 'Stop', exact: true }).click();
  await page.waitForTimeout(750);
  expect((await native(page)).filter(event => event.kind === 'media-play')).toEqual([]);
  expect(await page.evaluate(() => (window as any).__audioIntentAudit.timers())).toEqual([]);
  await expect(section).toHaveAttribute('data-audio-armed', 'true');
  await expect(section).toHaveAttribute('data-audio-active', 'false');
  await expect(section.getByRole('button', { name: 'Receive sample reply' })).toBeDisabled();
  await section.getByRole('button', { name: 'Reload for a quiet start' }).click();
  await expect(section).toHaveAttribute('data-audio-ready', 'true');
  await expect(section).toHaveAttribute('data-audio-armed', 'false');
  expect((await native(page)).filter(event => ['context-created', 'media-play'].includes(event.kind))).toEqual([]);
});

test('Stop cuts current playback and a deliberate replay completes without stale deliveries', async ({ page }) => {
  await observe(page); await open(page);
  const section = sectionOf(page);
  await section.getByRole('button', { name: 'Listen to sample' }).click();
  await expect.poll(async () => (await native(page)).filter(event => event.kind === 'media-playing').length).toBe(1);
  await section.getByRole('button', { name: 'Stop', exact: true }).click();
  await page.waitForTimeout(800);
  expect((await native(page)).filter(event => event.kind === 'media-play')).toHaveLength(1);
  await expect(section.locator('[role=status]')).toHaveText('Stopped. This page stays enabled.');
  await section.getByRole('button', { name: 'Listen to sample' }).click();
  await expect(section.locator('[role=status]')).toHaveText('Queue finished. This page stays enabled.');
  expect((await native(page)).filter(event => event.kind === 'media-play')).toHaveLength(4);
});

test('real page navigation stops native playback and prevents queued background delivery', async ({ page }) => {
  await observe(page); await open(page);
  await sectionOf(page).getByRole('button', { name: 'Listen to sample' }).click();
  await expect.poll(async () => (await native(page)).filter(event => event.kind === 'media-playing').length).toBe(1);
  await page.goto('/features/browser-handoff/');
  await page.waitForTimeout(850);
  const recorded = await page.evaluate(() => JSON.parse(sessionStorage.getItem('__audioIntentLifecycle') ?? '[]') as Array<Record<string, any>>);
  expect(recorded.filter(event => event.kind === 'media-play')).toHaveLength(1);
  expect(recorded.some(event => event.kind === 'pagehide')).toBe(true);
  expect(recorded.some(event => event.kind === 'media-pause')).toBe(true);
});

test('a failed real media load is disclosed instead of claiming every tone played', async ({ page }) => {
  await observe(page);
  await page.route('**/media/audio-intent/tone-1.wav', route => route.abort('failed'));
  await open(page);
  const section = sectionOf(page);
  await section.getByRole('button', { name: 'Listen to sample' }).click();
  await expect(section.locator('[role=status]')).toHaveText('Queue finished with a playback error.');
  await expect(section).toHaveAttribute('data-audio-error', 'true');
  expect((await native(page)).some(event => event.kind === 'media-error')).toBe(true);
  expect((await native(page)).filter(event => event.kind === 'media-ended')).toHaveLength(2);
});

for (const width of [390, 834, 1440]) {
  test(`controls, receipt and sample remain readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await open(page);
    const section = sectionOf(page);
    if (width === 390) {
      const incoming = section.getByRole('button', { name: 'Receive sample reply' });
      await incoming.click();
      await expect(incoming).toBeFocused();
      await expect(section).toHaveAttribute('data-audio-armed', 'false');
      await expect.poll(() => section.evaluate(element => {
        const status = element.querySelector('[role=status]')!.getBoundingClientRect();
        const listen = element.querySelector('[data-audio-listen]')!.getBoundingClientRect();
        return status.top >= 0 && status.bottom <= innerHeight && listen.top >= 0 && listen.bottom <= innerHeight;
      })).toBe(true);
    }
    await section.locator('details > summary').click();
    const geometry = await section.evaluate(element => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      smallText: [...element.querySelectorAll('p, strong, label, summary, a, button, select')].filter(item => item.getBoundingClientRect().width > 0 && Number.parseFloat(getComputedStyle(item).fontSize) < 14).map(item => item.textContent),
      smallTargets: [...element.querySelectorAll('button, summary, a, select')].filter(item => item.getBoundingClientRect().width > 0 && item.getBoundingClientRect().height < 44).map(item => item.textContent),
    }));
    expect(geometry).toEqual({ overflow: false, smallText: [], smallTargets: [] });
    const axe = await new AxeBuilder({ page }).include('[data-audio-intent]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(axe.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
    expect(errors).toEqual([]);
    await section.locator('details > summary').click();
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await section.screenshot({ path: test.info().outputPath(`audio-intent-${width}.png`) });
  });
}

test('no JavaScript and unsupported browsers retain honest explanations and explicit file links', async ({ browser, baseURL }) => {
  for (const javaScriptEnabled of [false, true]) {
    const context = await browser.newContext({ baseURL, javaScriptEnabled });
    if (javaScriptEnabled) await context.addInitScript(() => { Object.defineProperty(window, 'AudioContext', { value: undefined }); });
    const page = await context.newPage(); await page.goto(route);
    const section = sectionOf(page);
    await expect(section.getByRole('button', { name: 'Listen to sample' })).toBeDisabled();
    if (javaScriptEnabled) await expect(section).toHaveAttribute('data-audio-ready', 'unsupported');
    else await expect(section.locator('.audio-nojs')).toContainText('Nothing starts automatically');
    await section.locator('details > summary').click();
    await expect(section.getByRole('link', { name: 'Open tone 1 · 330 Hz' })).toBeVisible();
    await expect(section.getByRole('link', { name: 'Read the concise source receipt' })).toBeVisible();
    await context.close();
  }
});
