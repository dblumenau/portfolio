import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import execution from '../../src/labs/archive/execution.json' with { type: 'json' };

const evidence = process.env.ARCHIVE_LAB_EVIDENCE_DIR ?? 'test-results/archive-evidence';

test('recorded states preserve the distinction between canonical data and index rows', async ({ page }) => {
  await page.goto('/labs/archive/');
  await page.getByRole('button', { name: '2. Index removed', exact: true }).click();
  await expect(page.locator('[data-index-file]')).toHaveText('Absent');
  await expect(page.locator('[data-index-assets]')).toHaveText('—');
  await expect(page.locator('[data-output-label]')).toHaveText('Recorded file-removal receipt');
  await expect(page.locator('[data-command-output]')).toContainText('$DEMO_ROOT/state/archive.sqlite');
  await expect(page.locator('.al-canonical')).toContainText('13 files checked');
  await page.getByRole('button', { name: '3. Rebuilt', exact: true }).click();
  await expect(page.locator('[data-index-assets]')).toHaveText('3');
  await expect(page.locator('[data-index-resources]')).toHaveText('6');
  await expect(page.locator('[data-index-integrity]')).toHaveText('ok');
  await expect(page.locator('[data-command-output]')).toContainText('rebuild-index $DEMO_ROOT/archive --destination $DEMO_ROOT/state/archive.sqlite');
  await expect(page.locator('[data-command-output]')).toContainText('"resources": 6, "status": "ok"');
  await expect(page.getByRole('button', { name: '3. Rebuilt', exact: true })).toBeFocused();
});

test('Web Crypto verifies the actual PNG bytes and catches exactly one changed memory copy', async ({ page, request, baseURL }) => {
  const forbidden: string[] = [];
  page.on('request', req => { if (req.method() !== 'GET' || new URL(req.url()).origin !== new URL(baseURL!).origin) forbidden.push(`${req.method()} ${req.url()}`); });
  await page.goto('/labs/archive/');
  await expect(page.getByRole('button', { name: 'Change one copied byte', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Verify three originals', exact: true }).click();
  await expect(page.locator('[data-check-state]')).toHaveAttribute('data-check-state', 'verified');
  await expect(page.locator('[data-file-check][data-result=match]')).toHaveCount(3);
  for (const [i, fixture] of execution.fixtures.entries()) {
    const original = await (await request.get(fixture.src)).body();
    expect(original.byteLength).toBe(fixture.bytes);
    expect(createHash('sha256').update(original).digest('hex')).toBe(fixture.sha256);
    await expect(page.locator(`[data-file-check="${i}"] [data-local-hash]`)).toHaveText(fixture.sha256);
  }
  await page.getByRole('button', { name: 'Change one copied byte', exact: true }).click();
  await expect(page.locator('[data-check-state]')).toHaveAttribute('data-check-state', 'mismatch');
  await expect(page.locator('[data-file-check][data-result=mismatch]')).toHaveCount(1);
  await expect(page.locator('[data-file-check][data-result=match]')).toHaveCount(2);
  const copied = Buffer.from(await (await request.get(execution.fixtures[0].src)).body());
  copied[0] ^= 1;
  await expect(page.locator('[data-file-check="0"] [data-local-hash]')).toHaveText(createHash('sha256').update(copied).digest('hex'));
  expect(createHash('sha256').update(await (await request.get(execution.fixtures[0].src)).body()).digest('hex')).toBe(execution.fixtures[0].sha256);
  await expect(page.locator('[data-local-status]')).toContainText('hosted PNGs and downloaded originals are unchanged');
  await page.getByRole('button', { name: 'Restore the copied bytes', exact: true }).click();
  await expect(page.locator('[data-file-check][data-result=match]')).toHaveCount(3);
  expect(forbidden).toEqual([]);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
});

test('the local check recovers from an unavailable fixture without changing recorded proof', async ({ page }) => {
  await page.route('**/media/archive/synthetic-02.png', route => route.fulfill({ status: 503, body: 'unavailable' }));
  await page.goto('/labs/archive/');
  await page.getByRole('button', { name: 'Verify three originals', exact: true }).click();
  await expect(page.locator('[data-check-state]')).toHaveAttribute('data-check-state', 'error');
  await expect(page.locator('[data-local-status]')).toContainText('does not change the completed CLI proof');
  await expect(page.getByRole('button', { name: 'Change one copied byte', exact: true })).toBeDisabled();
  await expect(page.locator('[data-index-integrity]')).toHaveText('ok');
  await page.unroute('**/media/archive/synthetic-02.png');
  await page.getByRole('button', { name: 'Verify three originals', exact: true }).click();
  await expect(page.locator('[data-check-state]')).toHaveAttribute('data-check-state', 'verified');
});

test('keyboard verification and copied-byte comparison retain action focus', async ({ page }) => {
  await page.goto('/labs/archive/');
  const verify = page.getByRole('button', { name: 'Verify three originals', exact: true });
  await verify.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('[data-check-state]')).toHaveAttribute('data-check-state', 'verified');
  await expect(page.getByRole('button', { name: 'Verify originals again', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Change one copied byte', exact: true })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.locator('[data-check-state]')).toHaveAttribute('data-check-state', 'mismatch');
  await expect(page.getByRole('button', { name: 'Restore the copied bytes', exact: true })).toBeFocused();
});

for (const width of [390, 768, 1440]) test(`archive proof and hash mismatch fit ${width}px without accessibility violations`, async ({ page }) => {
  await page.setViewportSize({ width, height: 960 });
  await page.goto('/labs/archive/');
  await page.getByRole('button', { name: 'Verify three originals', exact: true }).click();
  await page.getByRole('button', { name: 'Change one copied byte', exact: true }).click();
  await expect(page.locator('[data-check-state]')).toHaveAttribute('data-check-state', 'mismatch');
  await page.locator('[data-file-check="0"] summary').click();
  await page.getByRole('button', { name: '3. Rebuilt', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: `${evidence}/archive-${width}-mismatch.png`, fullPage: true });
});

test('without JavaScript hashes, downloads and the full execution remain inspectable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false }); const page = await context.newPage();
  await page.goto('/labs/archive/');
  await expect(page.getByRole('button', { name: 'Verify three originals', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '3. Rebuilt', exact: true })).toBeDisabled();
  await page.getByText('Read every CLI command and its recorded result', { exact: true }).click();
  await expect(page.locator('.al-invocations li')).toHaveCount(10);
  await expect(page.locator('.al-invocations')).toContainText('FileExistsError');
  await expect(page.locator('.al-invocations')).toContainText('--destination');
  await page.locator('[data-file-check="0"] summary').click();
  await expect(page.locator('[data-file-check="0"]')).toContainText(execution.fixtures[0].sha256);
  await expect(page.getByRole('link', { name: 'Download original', exact: false })).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

test('public evidence is consistent and recording has playable media and captions', async ({ page, request }) => {
  const receiptResponse = await request.get('/media/archive/receipt.json');
  const raw = await receiptResponse.text();
  expect(raw).not.toMatch(/\/home\/|\/mnt\/|portfolio-project-/);
  const receipt = JSON.parse(raw);
  expect(receipt.results).toMatchObject({ assets: 3, originalResources: 3, metadataResources: 3, totalResources: 6, canonicalFiles: 13, sourceTestsPassed: 6 });
  expect(receipt.canonicalBefore).toEqual(receipt.canonicalAfter);
  expect(receipt.indexBefore.tables).toEqual(receipt.indexAfter.tables);
  await page.goto('/labs/archive/');
  await expect(page.locator('video')).toHaveAttribute('preload', 'none');
  await page.getByText('Watch the recorded prototype replay · 18 seconds', { exact: true }).click();
  await expect(page.locator('.al-recording')).toContainText('not live CLI footage');
  await page.locator('video').evaluate(video => { if (video instanceof HTMLVideoElement) video.load(); });
  await expect.poll(() => page.locator('video').evaluate(video => video instanceof HTMLVideoElement ? video.readyState : -1)).toBeGreaterThanOrEqual(1);
  const dimensions = await page.locator('video').evaluate(video => {
    if (!(video instanceof HTMLVideoElement)) throw new Error('Expected video element');
    return { width: video.videoWidth, height: video.videoHeight, duration: video.duration };
  });
  expect(dimensions.width).toBe(1440); expect(dimensions.height).toBe(1000); expect(dimensions.duration).toBeCloseTo(17.68, 1);
  const captions = await request.get('/media/archive/recorded-replay.vtt');
  expect(await captions.text()).toMatch(/^WEBVTT/);
  await expect(page.locator('track[kind=captions]')).toHaveAttribute('srclang', 'en');
});
