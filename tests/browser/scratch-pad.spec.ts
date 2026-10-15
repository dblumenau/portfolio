import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const route = '/work/panelforge/';
const selector = '[data-scratch-showcase]';
const media = '/media/scratch-pad/';
const excerpts = [
  'Begin with a paper sketch.\nReserve ten minutes for questions.',
  'Begin with a cardboard model.\nReserve five minutes for questions.',
  'Begin with a paper sketch.\nReserve ten minutes for questions.',
];
async function expand(page: Page) {
  const section = page.locator(selector);
  await section.locator('[data-scratch-main] > summary').click();
  return section;
}
async function play(page: Page) {
  const section = page.locator(selector);
  const film = section.locator('[data-scratch-film]');
  if (!(await film.evaluate((element: HTMLDetailsElement) => element.open))) await film.locator('summary').click();
  const video = film.locator('video');
  await video.scrollIntoViewIfNeeded(); await video.focus(); await page.keyboard.press('Space');
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => !element.paused && element.currentTime > 0)).toBe(true);
  return video;
}

test('one collapsed case disclosure explains the actual competing wording and whole-file replacement', async ({ page }) => {
  await page.goto(route); const section = page.locator(selector);
  await expect(section.locator('[data-scratch-main]')).not.toHaveAttribute('open', '');
  await expect(section.locator('[data-scratch-main] > summary')).toHaveText('Keep your draft when the saved file changes.');
  await expect(section.locator('blockquote').first()).toBeHidden();
  await section.locator('[data-scratch-main] > summary').focus(); await page.keyboard.press('Enter');
  expect(await section.locator('blockquote').allInnerTexts()).toEqual(excerpts);
  await expect(section.locator('.scratch-scope')).toContainText('Two browsers shared one fictional account');
  await expect(section.locator('.scratch-scope')).toContainText('No model ran');
  await expect(section.locator('[data-scratch-state="result"]')).toContainText('whole-file replacement, not a merge');
  await expect(section.locator('.scratch-captures figcaption').first()).toContainText('app labels assistant edits “Claude”');
  await expect(section.locator('.scratch-captures figcaption').first()).toContainText('controlled tool call, with no model');
  await expect(section.locator('.scratch-retention')).toContainText('seven days after its last write');
  await expect(section.locator('.scratch-retention')).toContainText('reads do not renew');
  await expect(section.locator('textarea,input,select,button,form')).toHaveCount(0);
  await expect(section.getByRole('link', { name: 'Open the actual conflict crop at full size' })).toHaveAttribute('href', `${media}conflict.png`);
});

for (const width of [390, 1024, 1440]) {
  test(`actual crops, readable excerpts and native captions fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 }); const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message)); await page.goto(route); const section = await expand(page);
    expect(await section.locator('blockquote').allInnerTexts()).toEqual(excerpts);
    for (const [name, dimensions] of [['conflict.png', [743, 320]], ['result.png', [743, 260]]] as const) {
      const image = section.locator(`img[src="${media}${name}"]`); await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => [element.complete, element.naturalWidth, element.naturalHeight])).toEqual([true, ...dimensions]);
    }
    await section.locator('[data-scratch-method] > summary').click();
    const geometry = await section.evaluate(element => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      smallText: [...element.querySelectorAll('p,figcaption,h3,blockquote,summary,a,code')].filter(item => parseFloat(getComputedStyle(item).fontSize) < 14).map(item => item.textContent),
      smallTargets: [...element.querySelectorAll('summary,a')].filter(item => item.getBoundingClientRect().width > 0 && item.getBoundingClientRect().height < 44).map(item => item.textContent),
    }));
    expect(geometry).toEqual({ overflow: false, smallText: [], smallTargets: [] });
    const axe = await new AxeBuilder({ page }).include(selector).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(axe.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await section.screenshot({ path: test.info().outputPath(`scratch-${width}.png`) });
    const video = await play(page);
    await video.evaluate((element: HTMLVideoElement) => { element.pause(); element.textTracks[0].mode = 'showing'; element.currentTime = 5; });
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => (element.textTracks[0].activeCues?.[0] as VTTCue | undefined)?.text)).toBe('Saved file changes. The dirty draft stays.');
    expect(await video.evaluate(element => parseFloat(getComputedStyle(element, '::cue').fontSize))).toBeGreaterThanOrEqual(14);
    await page.screenshot({ path: test.info().outputPath(`scratch-native-captions-${width}.png`) });
    expect(errors).toEqual([]);
  });
}

test('native disclosures, exact quotations and static proof links work without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage(); await page.goto(route); const section = await expand(page);
  expect(await section.locator('blockquote').allInnerTexts()).toEqual(excerpts);
  await section.locator('[data-scratch-method] > summary').click();
  await expect(section.locator('[data-scratch-method]')).toContainText('empty revision 1');
  await expect(section.locator('[data-scratch-method]')).toContainText('gateway authentication and model inference were outside');
  await section.locator('[data-scratch-film] > summary').click(); await expect(section.locator('video')).toBeVisible();
  await expect(section.getByRole('link', { name: 'Read the action captions' })).toHaveAttribute('href', `${media}draft-choice.vtt`);
  await section.getByRole('link', { name: 'Read the selected Scratch Pad receipt' }).click();
  await expect(page).toHaveURL(new RegExp(`${media}receipt.json$`)); await context.close();
});

test('the opt-in film retains native captions and pauses when either disclosure closes or the page leaves', async ({ page }) => {
  const filmRequests: string[] = []; page.on('request', request => { if (request.url().endsWith('draft-choice.mp4')) filmRequests.push(request.url()); });
  await page.goto(route); const section = page.locator(selector); const video = section.locator('video');
  await expect(video).toHaveAttribute('preload', 'none'); await expect(video).toHaveAttribute('controls', '');
  await expect(video).not.toHaveAttribute('autoplay', ''); await expect(video).not.toHaveAttribute('loop', '');
  expect(await video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true); expect(filmRequests).toEqual([]);
  await expand(page); expect(filmRequests).toEqual([]); await play(page);
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.duration)).toBeCloseTo(15.24, 2);
  await video.evaluate((element: HTMLVideoElement) => { element.pause(); element.textTracks[0].mode = 'showing'; element.currentTime = 8; });
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => (element.textTracks[0].activeCues?.[0] as VTTCue | undefined)?.text)).toBe('Keep mine replaces the whole saved file.');
  await video.evaluate((element: HTMLVideoElement) => { element.currentTime = 14; });
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => (element.textTracks[0].activeCues?.[0] as VTTCue | undefined)?.text)).toBe('After reload: paper sketch, ten minutes.');
  const cues = await video.evaluate((element: HTMLVideoElement) => [...(element.textTracks[0].cues ?? [])].map(cue => ({ start: cue.startTime, end: cue.endTime })));
  expect(cues).toHaveLength(6); expect(cues[0].start).toBe(0); expect(cues.at(-1)?.end).toBe(15.24);
  expect(cues.every((cue, index) => cue.end > cue.start && (!index || cue.start >= cues[index - 1].end))).toBe(true);
  await video.focus(); await page.keyboard.press('Space'); await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(false);
  await section.locator('[data-scratch-film] > summary').click(); await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
  await play(page); await section.locator('[data-scratch-main] > summary').click(); await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
  await expand(page); await play(page);
  await page.evaluate(() => window.addEventListener('pagehide', () => sessionStorage.setItem('scratch-paused-on-pagehide', String(document.querySelector<HTMLVideoElement>('[data-scratch-showcase] video')?.paused)), { once: true }));
  await page.goto('/features/'); expect(await page.evaluate(() => sessionStorage.getItem('scratch-paused-on-pagehide'))).toBe('true');
});

test('safe selected receipt and all six served assets match the reviewed bytes', async ({ request }) => {
  const response = await request.get(`${media}receipt.json`); expect(response.status()).toBe(200);
  const text = await response.text(), receipt = JSON.parse(text);
  expect(receipt.revisions.map((item: { revision: number }) => item.revision)).toEqual([1, 2, 3, 4]);
  expect(receipt.revisions[0].content).toBe(''); expect(receipt.revisions[2].actor).toBe('assistant');
  expect(receipt.revisions[2].content).toContain('cardboard model'); expect(receipt.revisions[3].content).toContain('paper sketch'); expect(receipt.revisions[3].content).toContain('ten minutes');
  expect(receipt.observed.keepMineWholeFileReplacement).toBe(true); expect(receipt.observed.automaticMerge).toBe(false);
  expect(receipt.counts).toMatchObject({ browserFileWrites: 3, controlledMcpFileWrites: 1, scratchNotificationFrames: 8, framesPerClient: 4, notificationContainsDocumentContent: false, cleanClientContentReads: 4, dirtyClientContentReadsReplacingDraft: 0 });
  expect(receipt.scope.modelCalls).toBe(0); expect(receipt.scope.upstreamGatewayAuthenticationExercised).toBe(false);
  expect(receipt.retention).toMatchObject({ daysAfterEachFilesLastWrite: 7, readsRenewExpiry: false, sevenRealDaysElapsed: false });
  expect(receipt.source.applicationRevision).toBe('4bb89c99324dd287baed1122c9e460d4bb1b196e'); expect(receipt.source.mcpRevision).toBe('25d1b7140355be1b8fc9f5331cf41cc01c8b8050');
  expect(receipt.media.film).toMatchObject({ sourceSpanSeconds: [7, 22.24], frameCount: 381, durationSeconds: 15.24, internalCuts: 0, speedChanges: false });
  expect(text).not.toMatch(/\/home\/|\/Users\/|localhost|127\.0\.0\.1|r2:\/\/|user_id|userId|socket_id|private-users|mira@|service_key|DB_PASSWORD|auth-state/);
  const manifest = JSON.parse(await readFile(resolve('public/media/media-provenance.json'), 'utf8')).assets.filter((item: { file: string }) => item.file.startsWith('scratch-pad/'));
  expect(manifest).toHaveLength(6);
  for (const item of manifest) {
    const served = await request.get(`/media/${item.file}`); expect(served.status()).toBe(200); const bytes = await served.body();
    expect(bytes.length).toBe(item.bytes); expect(createHash('sha256').update(bytes).digest('hex')).toBe(item.sha256);
  }
});

test('the existing case gains no new feature, lab or index route', async ({ page, request }) => {
  await page.goto('/features/'); await expect(page.locator('.atlas-row')).toHaveCount(30);
  for (const other of ['/work/conference-notes/', '/work/connected-agents/']) expect(await (await request.get(other)).text()).not.toContain('data-scratch-showcase');
  for (const missing of ['/features/scratch-pad/', '/labs/scratch-pad/', '/work/scratch-pad/']) expect((await request.get(missing)).status()).toBe(404);
  const files = await readdir(resolve(process.env.PORTFOLIO_DIST_ROOT ?? 'dist'), { recursive: true });
  expect(files.filter(name => String(name).endsWith('index.html'))).toHaveLength(54);
});

test('expanding, playing and reading the receipt only makes same-origin static GET requests', async ({ page, baseURL }) => {
  const unexpected: string[] = [];
  await page.route('**/*', route => { const request = route.request(); if (request.method() !== 'GET' || new URL(request.url()).origin !== new URL(baseURL!).origin || /\/(?:api|mcp)\//.test(request.url())) { unexpected.push(`${request.method()} ${request.url()}`); return route.abort(); } return route.continue(); });
  await page.goto(route); const section = await expand(page); const video = await play(page); await video.evaluate((element: HTMLVideoElement) => element.pause());
  await section.locator('[data-scratch-method] > summary').click(); await section.getByRole('link', { name: 'Read the selected Scratch Pad receipt' }).click();
  await expect(page).toHaveURL(new RegExp(`${media}receipt.json$`)); expect(unexpected).toEqual([]);
});
