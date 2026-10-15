import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const route = '/features/grounded-analysis/';
const selector = '[data-grounded-analysis]';
async function capture(page: Page, id: string) {
  const section = page.locator(selector);
  await expect(section.locator('[data-analysis-frame]:visible')).toHaveCount(1);
  const image = section.locator(`[data-analysis-frame="${id}"] img`);
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true);
}

test('the existing feature distinguishes checked names from a surviving meaning error', async ({ page, request }) => {
  await page.goto(route);
  const section = page.locator(selector);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Resolve the names. Keep the source close.');
  await expect(page.getByRole('link', { name: 'Inspect the extracted statements' })).toHaveAttribute('href', '#analysis-in-context');
  await expect(page.locator('#small-example')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('Lantern');
  await expect(section.locator('.analysis-editorial-label')).toContainText('Editorial review after the run');
  await expect(section.locator('.analysis-supported .analysis-triple')).toHaveText('Harbor NotebookusesIndexedDB');
  await expect(section.locator('.analysis-review .analysis-triple')).toHaveText('Mira Valeprefersmanual file export');
  await expect(section.locator('.analysis-review blockquote')).toContainText('for this project');
  await expect(section.locator('.analysis-review')).toContainText('it did not catch this meaning error');
  await expect(section.locator('.analysis-review-note')).toContainText('saved output remains unchanged');
  await section.locator('.analysis-validation>summary').click();
  await expect(section.locator('.analysis-validation')).toContainText('One job. Three real provider requests.');
  await expect(section.locator('.analysis-trace li')).toHaveCount(3);
  await expect(section.locator('.analysis-trace li').nth(1)).toContainText('Nine coverage violations');
  await expect(section.locator('.analysis-validation')).toContainText('not reuse of an existing alias');
  const receipt = await (await request.get('/media/grounded-analysis/receipt.json')).json();
  expect(receipt.selectedActualSavedTriples).toEqual([
    { subject: 'Harbor Notebook', predicate: 'uses', object: 'IndexedDB', subject_type: 'project', object_type: 'technology' },
    { subject: 'Mira Vale', predicate: 'prefers', object: 'manual file export', subject_type: 'person', object_type: 'activity' },
  ]);
  expect(receipt.execution).toMatchObject({ analysisJobs: 1, workerAttempts: 1, providerRequests: 3, savedTriples: 7, initialCatalog: { tags: 0, entities: 0 } });
  expect(receipt.scope.automaticSemanticCorrection).toBe(false);
  expect(receipt.analyzer.actualModel).toBe('openai/gpt-oss-120b');
  await section.locator('.analysis-method>summary').click();
  await expect(section.locator('.analysis-method')).toContainText('not an independent provider-retention guarantee');
  await expect(section.locator('.analysis-method')).toContainText('bottom conversation-list button was occluded');
  await expect(section.getByRole('link', { name: 'See the Memory case study' })).toHaveAttribute('href', '/work/knowledge-graph/');
});

test('native keyboard choices reveal the actual source and phone captures', async ({ page }) => {
  await page.goto(route);
  const section = page.locator(selector);
  await capture(page, 'entity');
  await section.getByRole('radio', { name: 'Entity profile', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await capture(page, 'source');
  await expect(section.getByRole('radio', { name: 'Source conversation', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await capture(page, 'phone');
  await expect(section.locator('[data-analysis-frame="phone"]')).toContainText('event button');
  await section.getByRole('link', { name: 'Open full-size Phone source capture' }).click();
  await expect(page).toHaveURL(/\/media\/grounded-analysis\/phone-source.png$/);
});

for (const width of [360, 390, 768, 1440]) test(`editorial comparisons, captures and captions fit ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(route);
  const section = page.locator(selector);
  for (const [label, id] of [['Source conversation', 'source'], ['Phone source', 'phone'], ['Entity profile', 'entity']]) {
    await section.getByRole('radio', { name: label, exact: true }).check();
    await capture(page, id);
  }
  await section.locator('.analysis-validation>summary').click();
  await section.locator('.analysis-method>summary').click();
  expect(await section.evaluate(e => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    smallText: [...e.querySelectorAll('p,figcaption,label,legend,summary,a,code,blockquote')].filter(x => parseFloat(getComputedStyle(x).fontSize) < 14).map(x => x.textContent),
    smallTargets: [...e.querySelectorAll('label,summary,a')].filter(x => x.getBoundingClientRect().width > 0 && x.getBoundingClientRect().height < 44).map(x => x.textContent),
  }))).toEqual({ overflow: false, smallText: [], smallTargets: [] });
  const axe = await new AxeBuilder({ page }).include(selector).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(axe.violations.map(x => ({ id: x.id, nodes: x.nodes.map(n => n.target) }))).toEqual([]);
  await section.screenshot({ path: test.info().outputPath(`analysis-${width}.png`) });
  const video = section.locator('video');
  await video.scrollIntoViewIfNeeded(); await video.focus(); await page.keyboard.press('Space');
  await expect.poll(() => video.evaluate((e: HTMLVideoElement) => !e.paused && e.currentTime > 0)).toBe(true);
  await video.evaluate((e: HTMLVideoElement) => { e.pause(); e.currentTime = 5; e.textTracks[0].mode = 'showing'; });
  await expect.poll(() => video.evaluate((e: HTMLVideoElement) => e.textTracks[0].cues?.length)).toBe(3);
  await expect.poll(() => video.evaluate((e: HTMLVideoElement) => (e.textTracks[0].activeCues?.[0] as VTTCue)?.text)).toContain('Read the original wording.');
  expect(parseFloat(await video.evaluate(e => getComputedStyle(e, '::cue').fontSize))).toBeGreaterThanOrEqual(14);
  expect(await section.locator('#analysis-film-scope').evaluate(e => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);
  await page.screenshot({ path: test.info().outputPath(`analysis-captions-${width}.png`) });
  expect(errors).toEqual([]);
});

test('the real film retains native controls and bounded cues without autoplay', async ({ page }) => {
  await page.goto(route); const video = page.locator(`${selector} video`);
  await expect(video).toHaveAttribute('controls', ''); await expect(video).toHaveAttribute('preload', 'none');
  await expect(video).not.toHaveAttribute('autoplay', ''); await expect(video.locator('track')).toHaveAttribute('default', '');
  await video.scrollIntoViewIfNeeded(); await video.focus(); await page.keyboard.press('Space');
  await expect.poll(() => video.evaluate((e: HTMLVideoElement) => e.duration)).toBeCloseTo(7, 2);
  await video.evaluate((e: HTMLVideoElement) => { e.pause(); e.currentTime = 1; e.textTracks[0].mode = 'showing'; });
  await expect.poll(() => video.evaluate((e: HTMLVideoElement) => (e.textTracks[0].activeCues?.[0] as VTTCue)?.text)).toContain('from the entity profile.');
  expect(await video.evaluate((e: HTMLVideoElement) => e.textTracks[0].cues?.[2].endTime)).toBeLessThanOrEqual(7);
  await video.focus(); await page.keyboard.press('Space');
  await expect.poll(() => video.evaluate((e: HTMLVideoElement) => e.paused)).toBe(false);
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await expect.poll(() => video.evaluate((e: HTMLVideoElement) => e.paused)).toBe(true);
});

test('comparison, source disclosure and capture choices work without scripts', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage(); await page.goto(route); const section = page.locator(selector);
  await expect(section.locator('.analysis-review blockquote mark')).toHaveText('for this project');
  await capture(page, 'entity');
  await section.getByRole('radio', { name: 'Source conversation', exact: true }).check(); await capture(page, 'source');
  await section.getByRole('radio', { name: 'Phone source', exact: true }).check(); await capture(page, 'phone');
  await section.locator('.analysis-validation>summary').click();
  await expect(section.locator('.analysis-trace li')).toHaveCount(3);
  await section.locator('.analysis-method>summary').click();
  await expect(section.getByRole('link', { name: 'Read the selected execution receipt' })).toBeVisible();
  await expect(section.locator('#analysis-film-scope')).toContainText('GPT-OSS 120B');
  await page.screenshot({ path: test.info().outputPath('analysis-nojs.png'), fullPage: true }); await context.close();
});

test('the static presentation makes no model or application request', async ({ page, baseURL }) => {
  const unexpected: string[] = [];
  await page.route('**/*', route => {
    const request = route.request();
    if (request.method() !== 'GET' || new URL(request.url()).origin !== new URL(baseURL!).origin || /\/(?:api|mcp)\//.test(request.url())) {
      unexpected.push(request.method() + ' ' + request.url()); return route.abort();
    }
    return route.continue();
  });
  await page.goto(route); const section = page.locator(selector);
  await section.getByRole('radio', { name: 'Source conversation', exact: true }).check();
  await section.locator('.analysis-method>summary').click();
  const video = section.locator('video'); await video.scrollIntoViewIfNeeded(); await video.focus(); await page.keyboard.press('Space');
  await expect.poll(() => video.evaluate((e: HTMLVideoElement) => e.currentTime > 0)).toBe(true);
  await video.evaluate((e: HTMLVideoElement) => e.pause()); expect(unexpected).toEqual([]);
});
