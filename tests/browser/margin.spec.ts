import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
const execution = JSON.parse(readFileSync(new URL('../../src/labs/margin/execution.json', import.meta.url), 'utf8')) as typeof import('../../src/labs/margin/execution.json');
const evidence = process.env.MARGIN_LAB_EVIDENCE_DIR ?? 'test-results/margin-evidence';

test('brief work stays quiet even after an eighteen-second pause', async ({ page }) => {
  await page.goto('/labs/margin/');
  await page.locator('[data-next]').click(); await page.locator('[data-next]').click();
  await expect(page.locator('[data-result-title]')).toHaveText('Wait before reviewing');
  await expect(page.locator('[data-active]')).toHaveText('13 s');
  await expect(page.locator('[data-strokes]')).toHaveText('26');
  await expect(page.locator('[data-idle]')).toHaveText('18 s');
  await expect(page.locator('[data-result-copy]')).toContainText('too little new work');
  await expect(page.locator('[data-note-permission]')).toHaveText('Not checked');
});
test('review and note presentation are separate permissions', async ({ page }) => {
  await page.goto('/labs/margin/?case=hold-feedback&check=1');
  await expect(page.locator('[data-result-title]')).toHaveText('Hold the note');
  await expect(page.locator('[data-review-permission]')).toHaveText('Permitted at 67 s');
  await expect(page.locator('[data-note-permission]')).toHaveText('Hold at 75 s');
  await expect(page.locator('[data-result-copy]')).toContainText(/person is (?:still )?writing/);
  await page.locator('[data-next]').click();
  await expect(page.locator('[data-result-title]')).toHaveText('Note permitted');
  await expect(page.locator('[data-review-permission]')).toHaveText('Permitted at 67 s');
  await expect(page.locator('[data-note-permission]')).toHaveText('Permitted at 77.5 s');
  await expect(page.locator('[data-note-copy]')).toContainText('No AI answer was generated');
});
test('long stretch waits for settling while hard deadline survives continued strokes', async ({ page }) => {
  await page.goto('/labs/margin/?case=deadline&check=0');
  await expect(page.locator('[data-result-title]')).toContainText('Wait');
  await expect(page.locator('[data-active]')).toHaveText('150 s');
  await page.locator('[data-next]').click();
  await expect(page.locator('[data-result-title]')).toHaveText('Review permitted');
  await expect(page.locator('[data-idle]')).toHaveText('1.5 s');
  await page.goto('/labs/margin/?case=hard-deadline&check=2');
  await expect(page.locator('[data-result-title]')).toHaveText('Review permitted');
  await expect(page.locator('[data-active]')).toHaveText('210 s');
  await expect(page.locator('[data-idle]')).toHaveText('0.1 s');
  await expect(page.locator('[data-result-copy]')).toContainText('hard deadline');
});
test('supplied failures retain covered work and increase retry delay', async ({ page }) => {
  await page.goto('/labs/margin/?case=failure&check=1');
  await expect(page.locator('[data-active]')).toHaveText('61 s');
  await expect(page.locator('[data-strokes]')).toHaveText('122');
  await expect(page.locator('[data-result-copy]')).toContainText('30-second backoff');
  await page.locator('[data-next]').click();
  await expect(page.locator('[data-result-title]')).toHaveText('Review permitted');
  await page.locator('[data-next]').click();
  await expect(page.locator('[data-result-copy]')).toContainText('60-second backoff');
  await expect(page.locator('[data-active]')).toHaveText('61 s');
  await expect(page.locator('[data-strokes]')).toHaveText('122');
});
test('margin capacity, cooldown and in-flight work preserve their distinct reasons', async ({ page }) => {
  await page.goto('/labs/margin/?case=cooldown&check=2');
  await expect(page.locator('[data-result-copy]')).toContainText('cooldown');
  await page.locator('[data-next]').click();
  await expect(page.locator('[data-result-title]')).toHaveText('Note permitted');
  await page.locator('[data-next]').click();
  await expect(page.locator('[data-result-copy]')).toContainText('Two unsolicited notes');
  await page.goto('/labs/margin/?case=coalescing&check=1');
  await expect(page.locator('[data-strokes]')).toHaveText('200');
  await expect(page.locator('[data-result-copy]')).toContainText('in flight');
  await page.locator('[data-next]').click();
  await expect(page.locator('[data-result-copy]')).toContainText('space between calls');
  await page.locator('[data-next]').click();
  await expect(page.locator('[data-result-title]')).toHaveText('Review permitted');
  await expect(page.locator('[data-strokes]')).toHaveText('200');
});
test('all 34 selectable decisions retain compiled Swift timestamps and state', async ({ page }) => {
  let count = 0;
  for (const scenario of execution.scenarios) {
    const checks = scenario.events.filter(e => e.action === 'decide' || e.action === 'present');
    await page.goto(`/labs/margin/?case=${scenario.id}&check=0`);
    for (let i = 0; i < checks.length; i++) {
      const expected = checks[i];
      await expect(page.locator('[data-margin-lab]')).toHaveAttribute('data-outcome', expected.result);
      await expect(page.locator('[data-book-time]')).toHaveText(`${Number(expected.time.toFixed(2))} s`);
      await expect(page.locator('[data-strokes]')).toHaveText(String(expected.unreviewedStrokes));
      await expect(page.locator('[data-active]')).toHaveText(`${Number(expected.unreviewedActiveSeconds.toFixed(2))} s`);
      await expect(page.locator('[data-idle]')).toHaveText(expected.idleSeconds === null ? 'No pen event' : `${Number(expected.idleSeconds.toFixed(2))} s`);
      count++;
      if (i < checks.length - 1) await page.locator('[data-next]').click();
    }
    await page.locator('.ml-inspect summary').click();
    for (const expected of scenario.events) {
      const row = page.locator('[data-events] tr').filter({ hasText: expected.reason }).first();
      await expect(row).toBeVisible();
    }
  }
  expect(count).toBe(34);
});
test('keyboard controls retain focus and browser back restores the check', async ({ page }) => {
  await page.goto('/labs/margin/');
  await page.locator('[data-case-choice="hold-feedback"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-case-choice="hold-feedback"]')).toBeFocused();
  await expect(page.locator('[data-result-title]')).toHaveText('Hold the note');
  await page.locator('[data-next]').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('[data-next]')).toBeFocused();
  await expect(page.locator('[data-result-title]')).toHaveText('Note permitted');
  await page.goBack();
  await expect(page.locator('[data-result-title]')).toHaveText('Hold the note');
  await page.locator('[data-check-choice="0"]').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('[data-check-choice="0"]')).toBeFocused();
  await expect(page.locator('[data-result-title]')).toHaveText('Review permitted');
  await page.goto('/labs/margin/?case=unknown&check=-10');
  await expect(page.locator('[data-margin-lab]')).toHaveAttribute('data-case', 'brief-pause');
  await expect(page.locator('[data-margin-lab]')).toHaveAttribute('data-check', '0');
});
for (const width of [390, 768, 1440]) test(`timing cause, decision and action fit ${width}px with accessible controls`, async ({ page }) => {
  await page.setViewportSize({ width, height: 960 });
  await page.goto('/labs/margin/?case=hold-feedback&check=1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  const title = await page.locator('[data-result-title]').boundingBox();
  const next = await page.locator('[data-next]').boundingBox();
  expect(next!.y - title!.y).toBeLessThan(350);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: `${evidence}/margin-${width}-hold.png`, fullPage: true });
  const report = await new AxeBuilder({ page }).include('main').analyze(); expect(report.violations).toEqual([]);
});
test('static reader exposes all decisions and native media without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage(); await page.goto('/labs/margin/');
  await expect(page.locator('.ml-nojs')).toBeVisible();
  await expect(page.locator('[data-next]')).toBeHidden();
  await page.locator('.ml-all-cases summary').click();
  await expect(page.locator('.ml-all-cases article')).toHaveCount(9);
  await expect(page.locator('.ml-all-cases li')).toHaveCount(34);
  await expect(page.locator('#ml-case-hold-feedback')).toContainText('user writing');
  await expect(page.locator('video')).toHaveAttribute('controls', '');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await context.close();
});
test('public receipts are the source run and replay never makes a live request', async ({ page, request }) => {
  const requests: { url: string; method: string }[] = [];
  page.on('request', req => requests.push({ url: req.url(), method: req.method() }));
  await page.goto('/labs/margin/');
  await page.locator('[data-case-choice="pause-review"]').click();
  for (let i = 0; i < 3; i++) await page.locator('[data-next]').click();
  expect(requests.filter(req => req.method !== 'GET' || new URL(req.url).origin !== new URL(page.url()).origin)).toEqual([]);
  const receipt = await (await request.get('/media/margin/receipt.json')).json();
  expect(receipt.scenarios).toEqual(execution.scenarios);
  expect(receipt.sourceSHA256).toBe('d21f2900bd5039dcbcef7cbc15e99c11355d6abed9269491750dd585b9dcb519');
  expect(receipt.verification.originalTestsPassed).toBe(11);
  expect(receipt.scope).toContain('without the app coordinator timer');
  expect(JSON.stringify(receipt)).not.toMatch(/\/home\/|\/tmp\/|conversationId|sessionId/);
  const inputs = await (await request.get('/media/margin/scenarios.json')).json();
  expect(inputs).toHaveLength(9);
  await expect(page.locator('.ml-disclosure')).toContainText('No model, network, handwriting recognition or app timer');
  await expect(page.locator('.ml-native-boundary')).toContainText('Manual Review');
  const media = await request.get('/media/pencil-page-workflow.mp4', { headers: { Range: 'bytes=0-1023' } }); expect(media.ok()).toBeTruthy();
  await expect(page.locator('video track')).toHaveAttribute('src', '/media/pencil-page-workflow.vtt');
  expect((await request.get('/media/pencil-page-workflow.vtt')).ok()).toBeTruthy();
});
