import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const provenance = JSON.parse(readFileSync('public/sample-files/sample-provenance.json', 'utf8'));

test('the conference source drawer opens by keyboard and enlarges an authentic capture', async ({ page }) => {
  await page.goto('/work/conference-notes/');
  const disclosure = page.locator('.conference-source-detail');
  await disclosure.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(disclosure).toHaveAttribute('open', '');
  const screenshot = disclosure.locator('[data-zoom]');
  await screenshot.focus();
  await page.keyboard.press('Enter');
  const dialog = disclosure.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('img')).toHaveAttribute('src', /conference-notes-sources\.webp$/);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(screenshot).toBeFocused();
});

test('the actual editable deck downloads with the reviewed bytes', async ({ page }) => {
  await page.goto('/work/conference-notes/');
  const promise = page.waitForEvent('download');
  await page.getByRole('link', { name: /Download PowerPoint/ }).click();
  const download = await promise;
  expect(download.suggestedFilename()).toBe('conference-notes-demo.pptx');
  const bytes = readFileSync((await download.path())!);
  const expected = provenance.assets.find((asset: { file: string }) => asset.file === 'conference-notes-demo.pptx');
  expect(bytes.length).toBe(expected.bytes);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(expected.sha256);
  expect(bytes.readUInt32LE(0)).toBe(0x04034b50);
});

test('the PDF link serves the reviewed presentation as an actual PDF', async ({ page, request }) => {
  await page.goto('/work/conference-notes/');
  const link = page.getByRole('link', { name: 'Read the PDF', exact: false });
  await expect(link).toHaveAttribute('href', '/sample-files/conference-notes-demo.pdf');
  const response = await request.get((await link.getAttribute('href'))!);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
  const bytes = await response.body();
  const expected = provenance.assets.find((asset: { file: string }) => asset.file === 'conference-notes-demo.pdf');
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(bytes.length).toBe(expected.bytes);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(expected.sha256);
});


for (const width of [390, 1024, 1440]) {
  test(`embedded recovery evidence is optional and readable at ${width}px`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [], unexpected: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      const url = new URL(request.url());
      if (request.method() !== 'GET' || url.origin !== new URL(baseURL!).origin || url.pathname.startsWith('/api/')) unexpected.push(request.url());
    });
    await page.goto('/work/conference-notes/#conference-storage-bridge');
    const section = page.locator('[data-conference-bridge]');
    const disclosure = section.locator(':scope > details');
    const summary = disclosure.locator(':scope > summary');
    expect(await section.evaluate(element => element.previousElementSibling?.id)).toBe('the-decisions');
    await expect(disclosure).not.toHaveAttribute('open');
    await expect(section.locator('.bridge-content')).toBeHidden();
    await expect(summary).toHaveText('The page can reload. The draft stays.');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(disclosure).toHaveAttribute('open', '');
    await expect(section.locator('.bridge-sequence > li')).toHaveCount(3);
    await expect(section.locator('.bridge-note')).toHaveText('Agree on one clear owner before each handover.');
    await expect(section.locator('[data-bridge-scope]')).toContainText('Chromium');
    await expect(section.locator('[data-bridge-scope]')).toContainText('notes API returned 503');
    await expect(section.locator('[data-bridge-scope]')).toContainText('storage failure was injected');
    await expect(section.locator('[data-bridge-scope]')).toContainText('explicitly trusted');
    await section.locator('.bridge-captures img').evaluateAll(async images => Promise.all(images.map(image => (image as HTMLImageElement).decode())));
    expect(await section.locator('.bridge-captures img').evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth === 740 && (image as HTMLImageElement).naturalHeight === 560))).toBe(true);
    expect(await section.locator('video, input, textarea, button').count()).toBe(0);
    expect(await section.evaluate(element => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      smallText: [...element.querySelectorAll('p,dt,dd,figcaption,summary,a')].filter(item => item.getClientRects().length && parseFloat(getComputedStyle(item).fontSize) < 14).map(item => item.textContent),
      smallTargets: [...element.querySelectorAll('summary,a')].filter(item => item.getClientRects().length && item.getBoundingClientRect().height < 44).map(item => item.textContent),
    }))).toEqual({ overflow: false, smallText: [], smallTargets: [] });
    await section.locator('.bridge-method > summary').click();
    await expect(section.locator('.bridge-method')).toContainText('25 focused source tests and six bridge browser tests passed');
    await expect(section.locator('.bridge-method')).toContainText('three passes and one stale expectation');
    const axe = await new AxeBuilder({ page }).include('[data-conference-bridge]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(axe.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
    // Use actual viewports: an oversized element capture pulls offscreen fixed content into its clip.
    await section.locator('.bridge-method > summary').focus();
    await expect(page.locator('.skip-link')).not.toBeFocused();
    for (const [name, locator] of [['states', section], ['captures', section.locator('.bridge-captures')], ['method', section.locator('.bridge-method')]] as const) {
      await locator.evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
      expect(await page.locator('.skip-link').evaluate(element => element.getBoundingClientRect().bottom)).toBeLessThan(0);
      await page.screenshot({ path: test.info().outputPath(`conference-bridge-${width}-${name}.png`) });
    }
    expect(errors).toEqual([]);
    expect(unexpected).toEqual([]);
  });
}

test('recovery states and linked desktop crops remain available without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/work/conference-notes/#conference-storage-bridge');
  const section = page.locator('[data-conference-bridge]');
  await section.locator(':scope > details > summary').click();
  await expect(section.locator('.bridge-note')).toBeVisible();
  await expect(section.locator('.bridge-captures a')).toHaveCount(2);
  await expect(section.locator('.bridge-captures a').first()).toHaveAttribute('href','/media/conference-bridge/reloaded-pending.webp');
  await section.locator('.bridge-method > summary').click();
  await expect(section.getByRole('link',{name:'Read the selected recovery checks'})).toBeVisible();
  await expect(section).toContainText('A second page reload retained the saved result.');
  await context.close();
});

test('selected recovery receipt has safe equality checks and separate source test results', async ({ request }) => {
  const response = await request.get('/media/conference-bridge/receipt.json');
  expect(response.status()).toBe(200);
  const receipt = await response.json();
  expect(Object.keys(receipt)).toEqual(['record_type','execution_date','source','scope','note','observed_states','separate_tests','selected_media','privacy','boundaries','separate_native_compatibility']);
  expect(receipt.source.commit).toBe('6acc869a4b3c3cdb9cac11850534b69d2ca3aa21');
  expect(receipt.scope.browser).toBe('Chromium on Linux');
  expect(receipt.observed_states.server_response_rows_before_and_through_reload).toEqual([0,0,0,0]);
  expect(receipt.observed_states.parent_pending_finalise_record_exactly_equal_across_reload).toBe(true);
  expect(receipt.observed_states.final_server_response_rows).toBe(1);
  expect(receipt.observed_states.final_server_version_rows).toBe(1);
  expect(receipt.observed_states.acknowledged_parent_pending_count).toBe(0);
  expect(receipt.observed_states.server_resumed_with_unchanged_natural_retry).toBe(true);
  expect(receipt.observed_states.second_parent_reload_retains_saved_result).toBe(true);
  expect(receipt.separate_tests).toMatchObject({focused_source:{passed:25,failed:0},bridge_browser:{passed:6,failed:0},attendee_browser:{passed:3,failed:1},whole_suite_pass_claimed:false});
  expect(receipt.separate_native_compatibility).toMatchObject({ browser:'Safari 27.0', operating_system:'Intel macOS 26.7.1', finalised_response_rows:1, finalised_version_rows:1, native_notes_http_status_counts:{'503':10,'200':1}, native_counts_are_separate_from_Chromium:true, tests_rerun:false, native_media_selected:false });
  expect(receipt.selected_media.map((item: {sourceFrameZeroBased:number}) => item.sourceFrameZeroBased)).toEqual([108,184]);
  expect(receipt.selected_media.every((item: {decodedPixelsEqualSourceCrop:boolean}) => item.decodedPixelsEqualSourceCrop)).toBe(true);
  expect(await response.text()).not.toMatch(/https?:|localhost|127\.0\.0\.1|\/home\/|Bearer |auth_token|attendee_id|session_id|response_id|[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}/);
  for (const slug of ['panelforge','connected-agents','connected-tools','knowledge-graph','agent-workbench']) {
    expect(await (await request.get(`/work/${slug}/`)).text()).not.toContain('data-conference-bridge');
  }
});
