import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const route = '/features/maintained-profile/';
const selector = '[data-maintained-profile-showcase]';
const media = '/media/maintained-profile/';
const starting = 'Prefer a short written outline before changing a notebook page.';
const edited = 'Prefer a concrete page example before changing a notebook page.';

async function openFilm(page: import('@playwright/test').Page) {
  const section = page.locator(selector);
  await section.locator('[data-maintained-profile-film] > summary').click();
  const video = section.locator('video');
  await video.scrollIntoViewIfNeeded();
  await video.focus();
  await page.keyboard.press('Space');
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => !element.paused && element.currentTime > 0)).toBe(true);
  return video;
}

test('the existing feature replaces the invented diagram with exact saved wording and a restore-forward result', async ({ page }) => {
  await page.goto(route);
  const section = page.locator(selector);
  await expect(page.locator('#small-example')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Inspect a saved revision', exact: true })).toHaveAttribute('href', '#saved-profile-revisions');
  await expect(section.getByRole('heading', { name: /Bring back the wording.*Keep the history/ })).toBeVisible();
  await expect(section.locator('blockquote')).toHaveText([starting, edited, starting]);
  await expect(section.locator('blockquote strong')).toHaveText(['a short written outline', 'a concrete page example', 'a short written outline']);
  await expect(section.locator('[data-profile-version="3"]')).toContainText('Restored from version 1');
  await expect(section.locator('.profile-result')).toHaveText('After reload, all three versions were still present.');
  await expect(section.locator('.profile-scope')).toContainText('fictional profile');
  await expect(section.locator('.profile-scope')).toContainText('manual edit and restore');
  await expect(section.locator('.profile-scope')).toContainText('No model or automatic refresh ran');
  await expect(section.locator('textarea,input,select,button,form')).toHaveCount(0);
  await page.locator('#source-notes > details > summary').click();
  await expect(page.locator('#source-notes')).toContainText('The recorded Settings workflow uses a complete fictional seed');
  await expect(page.locator('#source-notes')).not.toContainText('The small explanatory exhibit uses invented records');
  await expect(page.locator('#source-notes')).toContainText('not a diff editor');
});

for (const width of [390, 834, 1440]) {
  test(`excerpts, actual history and native captions are readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(route);
    const section = page.locator(selector);
    await expect(section.locator('blockquote')).toHaveText([starting, edited, starting]);
    await section.locator('[data-profile-history] > summary').click();
    const image = section.locator('.profile-history img');
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth === 390 && element.naturalHeight === 1000)).toBe(true);
    await expect(section.locator('.profile-history figcaption')).toContainText('browser emulation, not a physical-phone edit or restore');
    await section.locator('[data-profile-method] > summary').click();
    const geometry = await section.evaluate(element => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      smallText: [...element.querySelectorAll('p,figcaption,h3,blockquote,summary,a,code')].filter(item => parseFloat(getComputedStyle(item).fontSize) < 14).map(item => item.textContent),
      smallTargets: [...element.querySelectorAll('summary,a')].filter(item => item.getBoundingClientRect().width > 0 && item.getBoundingClientRect().height < 44).map(item => item.textContent),
    }));
    expect(geometry).toEqual({ overflow: false, smallText: [], smallTargets: [] });
    const axe = await new AxeBuilder({ page }).include(selector).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(axe.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await section.screenshot({ path: test.info().outputPath(`profile-${width}.png`) });
    const video = await openFilm(page);
    await video.evaluate((element: HTMLVideoElement) => { element.pause(); element.currentTime = 10.5; element.textTracks[0].mode = 'showing'; });
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => (element.textTracks[0].activeCues?.[0] as VTTCue | undefined)?.text)).toBe('Confirmation accepted; not visible.');
    expect(await video.evaluate(element => parseFloat(getComputedStyle(element, '::cue').fontSize))).toBeGreaterThanOrEqual(14);
    await page.screenshot({ path: test.info().outputPath(`profile-native-captions-${width}.png`) });
    expect(errors).toEqual([]);
  });
}

test('the story, saved history and proof disclosures work without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(route);
  const section = page.locator(selector);
  await expect(section.locator('blockquote')).toHaveText([starting, edited, starting]);
  await expect(section.locator('.profile-result')).toContainText('all three versions were still present');
  await section.locator('[data-profile-history] > summary').click();
  await section.getByRole('link', { name: 'Open the full-size saved history capture' }).click();
  await expect(page).toHaveURL(new RegExp(`${media}history-phone.png$`));
  await page.goBack();
  await section.locator('[data-maintained-profile-film] > summary').click();
  await expect(section.locator('video')).toBeVisible();
  await expect(section.getByRole('link', { name: 'Read the action captions' })).toHaveAttribute('href', `${media}profile-history.vtt`);
  await section.locator('[data-profile-method] > summary').click();
  await expect(section.getByRole('link', { name: 'Read the selected proof receipt' })).toBeVisible();
  await context.close();
});

test('the optional continuous film is paused, seeks through real actions and pauses on close and pagehide', async ({ page }) => {
  const filmRequests: string[] = [];
  page.on('request', request => { if (request.url().endsWith('profile-history.mp4')) filmRequests.push(request.url()); });
  await page.goto(route);
  const section = page.locator(selector); const video = section.locator('video');
  await expect(video).toHaveAttribute('controls', '');
  await expect(video).toHaveAttribute('preload', 'none');
  await expect(video).not.toHaveAttribute('autoplay', '');
  await expect(video).not.toHaveAttribute('loop', '');
  await expect(video.locator('track')).toHaveAttribute('default', '');
  expect(await video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
  expect(filmRequests).toEqual([]);
  await openFilm(page);
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.duration)).toBeCloseTo(20.08, 2);
  await video.evaluate((element: HTMLVideoElement) => { element.pause(); element.textTracks[0].mode = 'showing'; element.currentTime = 15.5; });
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => (element.textTracks[0].activeCues?.[0] as VTTCue | undefined)?.text)).toBe('Reload the actual Settings page.');
  await video.evaluate((element: HTMLVideoElement) => { element.currentTime = 18.5; });
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => (element.textTracks[0].activeCues?.[0] as VTTCue | undefined)?.text)).toBe('After reload: versions 3, 2 and 1 remain.');
  const cues = await video.evaluate((element: HTMLVideoElement) => [...(element.textTracks[0].cues ?? [])].map(cue => ({ start: cue.startTime, end: cue.endTime, text: (cue as VTTCue).text })));
  expect(cues).toHaveLength(9); expect(cues[0].start).toBe(0); expect(cues.at(-1)?.end).toBe(20.08);
  expect(cues.every((cue, index) => cue.end > cue.start && cue.end <= 20.08 && (!index || cue.start >= cues[index - 1].end))).toBe(true);
  await video.focus(); await page.keyboard.press('Space');
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(false);
  await section.locator('[data-maintained-profile-film] > summary').click();
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
  await openFilm(page);
  await page.evaluate(() => { window.addEventListener('pagehide', () => { const video = document.querySelector<HTMLVideoElement>('[data-maintained-profile-film] video'); sessionStorage.setItem('profile-paused-on-pagehide', String(video?.paused)); }, { once: true }); });
  await page.goto('/features/');
  expect(await page.evaluate(() => sessionStorage.getItem('profile-paused-on-pagehide'))).toBe('true');
});

test('the allowlisted receipt has version-level proof and retained-run limits without private identifiers', async ({ request }) => {
  const response = await request.get(`${media}receipt.json`); expect(response.status()).toBe(200);
  const text = await response.text(); const receipt = JSON.parse(text);
  expect(receipt.versions.map((item: { preference: string }) => item.preference)).toEqual([starting, edited, starting]);
  expect(receipt.operations.save).toEqual({ count: 1, expectedVersion: 1, resultVersion: 2, responseStatus: 200 });
  expect(receipt.operations.restore).toEqual({ count: 1, expectedVersion: 2, resultVersion: 3, restoredFromVersion: 1, responseStatus: 200 });
  expect(receipt.source.applicationSourceUnchanged).toBe(true); expect(receipt.source.productPatch).toBe(false);
  expect(receipt.verified.versions1And2RetainedUnchanged).toBe(true); expect(receipt.verified.separateAuthoredFieldsUnchanged).toBe(4);
  expect(receipt.verified.seededEvidenceWatermarkUnchanged).toBe(true); expect(receipt.scope.modelRuns).toBe(0); expect(receipt.scope.automaticRefreshes).toBe(0);
  expect(receipt.testEvidence.sourceApiSuite.recordedPassedTests).toBe(8); expect(receipt.testEvidence.sourceApiSuite.recordedAssertions).toBe(83);
  expect(receipt.testEvidence.sourceApiSuite.runnerLimit).toContain('not independently re-executed');
  expect(receipt.media.film.durationSeconds).toBe(20.08); expect(receipt.media.film.frameCount).toBe(502); expect(receipt.media.film.continuousSourceSpanSeconds).toEqual([3, 23.08]);
  expect(receipt.media.historyStill.unchangedSourceBytes).toBe(true); expect(receipt.media.historyStill.captureScope).toContain('not a physical-phone edit or restore');
  expect(text).not.toMatch(/\/home\/|localhost|127\.0\.0\.1|r2:\/\/|DB_PASSWORD|auth-state|runtime-env|container|schemaName|restored_from_revision_id|user_id|revision_id|personal_context_id|mira@example|bootstrap\.php/);
});

test('the atlas retains its generic story action and only the maintained-profile feature renders this exhibit', async ({ page, request }) => {
  await page.goto('/features/');
  const row = page.locator('.atlas-row').filter({ has: page.locator('.atlas-story-link[href="/features/maintained-profile/"]') });
  await expect(row.locator('.atlas-read')).toContainText('Read the story');
  await expect(row.locator('.atlas-read')).toHaveAttribute('href', route);
  for (const feature of ['maintained-profile', 'engine-context', 'grounded-analysis', 'same-page']) {
    const response = await request.get(`/features/${feature}/`); expect(response.status()).toBe(200);
    expect((await response.text()).includes('data-maintained-profile-showcase')).toBe(feature === 'maintained-profile');
  }
  expect((await request.get('/labs/maintained-profile/')).status()).toBe(404);
});

test('the exhibit uses only same-origin static GET assets and never starts an app or provider', async ({ page, baseURL }) => {
  const unexpected: string[] = [];
  await page.route('**/*', route => { const request = route.request(); if (request.method() !== 'GET' || new URL(request.url()).origin !== new URL(baseURL!).origin || /\/(?:api|mcp)\//.test(request.url())) { unexpected.push(`${request.method()} ${request.url()}`); return route.abort(); } return route.continue(); });
  await page.goto(route); const section = page.locator(selector);
  await section.locator('[data-profile-history] > summary').click();
  const video = await openFilm(page); await video.evaluate((element: HTMLVideoElement) => element.pause());
  await section.locator('[data-profile-method] > summary').click();
  await section.getByRole('link', { name: 'Read the selected proof receipt' }).click();
  await expect(page).toHaveURL(new RegExp(`${media}receipt.json$`)); expect(unexpected).toEqual([]);
});
