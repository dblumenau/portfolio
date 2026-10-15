import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const route = '/work/connected-agents/#session-cron';
const receiptPath = '/media/session-cron/receipt.json';

test('served receipt matches curated bytes and preserves the evidence boundary', async ({ request }) => {
  const response = await request.get(receiptPath);
  expect(response.ok()).toBe(true);
  const bytes = await response.body();
  expect(bytes.equals(await readFile('public' + receiptPath))).toBe(true);
  const fragment = JSON.parse(await readFile('src/showcases/session-cron/media-provenance.fragment.json', 'utf8'));
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(fragment.assets[0].sha256);
  const receipt = JSON.parse(bytes.toString());
  expect(receipt.live_cli).toMatchObject({ explicit_queries_after_resume: 0, explicit_arming_queries: 1, recurring: false, durable: false, fixed_response_matched: true, different_cli_process: true, same_session: true, sdk_product_interactions: 2, sdk_num_turns: { arming: 2, autonomous: 1 } });
  expect(receipt.live_cli.result_offset_from_mirror_seconds).toBe(2.3964736461639404);
  expect(receipt.original_source_tests.unique_passed).toBe(49);
  expect(receipt.synthetic_classifier.case_count).toBe(16);
  expect(receipt.synthetic_classifier.selected_cases.map((r: any) => r.restorable_count)).toEqual([1, 0, 0]);
  expect(receipt.synthetic_classifier.selected_cases[2].age_seconds).toBe(604800);
  expect(receipt.boundaries.join(' ')).toContain('No real Claude Engine restart');
  expect(bytes.toString()).not.toMatch(/\/home\/|Bearer |API_KEY|PRIVATE-CRON|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
});

test('native keyboard disclosures preserve the recorded timeline with only local requests', async ({ page, context }) => {
  const requests: string[] = [];
  context.on('request', req => requests.push(req.url()));
  await context.route('**/*', r => r.request().url().startsWith('http://127.0.0.1:') ? r.continue() : r.abort());
  await page.goto(route);
  const section = page.locator('[data-session-cron]');
  await expect(section.locator('.cron-timeline > li')).toHaveCount(4);
  await expect(section.locator('.cron-zero')).toHaveText(/0\s*explicit queries\s+after resume/);
  await expect(section.locator('.cron-match')).toContainText('Fixed response matched');
  expect(await page.locator('#the-workflow').evaluate(el => !!(el.compareDocumentPosition(document.querySelector('[data-session-cron]')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  const before = requests.length;
  const synthetic = section.locator('[data-cron-synthetic]');
  await synthetic.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(synthetic).toHaveAttribute('open', '');
  await expect(synthetic.getByRole('table')).toBeVisible();
  await page.keyboard.press('Space');
  await expect(synthetic).not.toHaveAttribute('open', '');
  await page.keyboard.press('Tab');
  await expect(section.locator('[data-cron-evidence] > summary')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(section.locator('[data-cron-evidence]')).toHaveAttribute('open', '');
  await expect(section).toContainText('not provider inference or billing counts');
  await expect(section).toContainText('No real Claude Engine restart');
  expect(requests.slice(before)).toEqual([]);
  expect(requests.every(url => url.startsWith('http://127.0.0.1:'))).toBe(true);
  await synthetic.locator('summary').click();
  const scan = await new AxeBuilder({ page }).include('[data-session-cron]').analyze();
  expect(scan.violations.map(v => `${v.id}: ${v.description}`)).toEqual([]);
});

for (const width of [320, 390, 834, 1440]) {
  test(`recorded result and native disclosures work without JavaScript at ${width}px`, async ({ browser }, info) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: width < 500 ? 844 : 1000 } });
    const page = await context.newPage();
    await page.goto(new URL(route, info.project.use.baseURL).href);
    const section = page.locator('[data-session-cron]');
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator('.cron-timeline > li')).toHaveCount(4);
    await expect(section.locator('.cron-zero')).toContainText('0');
    await expect(section.locator('.cron-zero > span')).toHaveText('explicit queries after resume');
    for (const details of ['data-cron-synthetic', 'data-cron-evidence']) {
      const disclosure = section.locator(`[${details}]`);
      await disclosure.locator('summary').click();
      await expect(disclosure).toHaveAttribute('open', '');
      expect((await disclosure.locator('summary').boundingBox())!.height).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (details === 'data-cron-synthetic') await expect(disclosure.getByRole('row')).toHaveCount(4);
      await disclosure.locator('summary').click();
      await expect(disclosure).not.toHaveAttribute('open', '');
    }
    await section.screenshot({ path: info.outputPath(`session-cron-${width}.png`) });
    await context.close();
  });
}
