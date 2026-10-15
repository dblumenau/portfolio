import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const route = '/features/shared-engine-surface/#saved-engine-translations';
const receiptHash = 'ed9f6645c3da0f38ac1f838deedebbafbe0fba3eca240acf25a288a4b29a1d23';
const expectedRevisions = ['bf89abc1646bd12133a0f22bc2d51f3286813250', 'e1553a508a7b6ac6cfdb34b1b51a3be45a91bf7e', '671de66ac4f32b09b2d8b36328030935edc3ac38'];

// Pin the reviewed artifact; selections must inspect the saved source receipt.
test('served receipt retains the reviewed bytes and source provenance', async ({ request }) => {
  const response = await request.get('/media/engine-contract/receipt.json');
  expect(response.ok()).toBe(true);
  const bytes = await response.body();
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(receiptHash);
  expect(bytes.equals(await readFile('public/media/engine-contract/receipt.json'))).toBe(true);
  const receipt = JSON.parse(bytes.toString());
  expect(receipt.engines.map((engine: any) => engine.revision)).toEqual(expectedRevisions);
  expect(receipt.verified.original_focused_tests_passed).toBe(75);
  expect(receipt.engines[0].boundary).toContain('unit-harness compatibility branch');
  expect(receipt.engines[1].records.filter((row: any) => [5, 6].includes(row.input_index)).every((row: any) => row.outputs.length === 0)).toBe(true);
  expect(receipt.engines[2].records.find((row: any) => row.input_index === 11).outputs).toEqual([]);
  expect(bytes.toString()).not.toMatch(/\/home\/|danishdave\.com|Bearer |API_KEY|localhost:|127\.0\.0\.1/);
});

test('native engine choices inspect saved output without network activity', async ({ page, context }) => {
  const requests: string[] = [];
  context.on('request', request => requests.push(request.url()));
  await context.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:') ? route.continue() : route.abort());
  await page.goto(route);
  const showcase = page.locator('[data-engine-contract]');
  await expect(showcase.getByRole('radio', { name: /^Codex/ })).toBeChecked();
  const count = requests.length;
  for (const [name, id, heading] of [['Claude', 'claude', 'One sentence, once.'], ['OpenCode', 'opencode', 'A repeated part adds nothing.'], ['Codex', 'codex', 'Wait for the complete result.']]) {
    await showcase.getByRole('radio', { name: new RegExp('^' + name) }).check();
    await expect(showcase.locator('.contract-view:visible')).toHaveCount(1);
    const panel = showcase.locator(`[data-engine=${id}]`);
    await expect(panel.getByRole('heading', { name: heading })).toBeVisible();
    for (const kind of ['text', 'tool_use', 'tool_result', 'done']) await expect(panel.locator(`.contract-chat-event code`).filter({ hasText: new RegExp('^' + kind + '$') })).toBeVisible();
    await expect(panel.locator('.contract-done pre')).toHaveText('Fixture complete.');
    await expect(panel.locator('.contract-tool_result pre')).toHaveText('fixture-ok\n');
    await panel.getByText('Inspect the saved input and output', { exact: true }).click();
    await expect(panel.locator('details[open] pre')).toContainText('"outputs"');
    await panel.getByText('Inspect the saved input and output', { exact: true }).click();
  }
  expect(requests.slice(count)).toEqual([]);
  expect(requests.some(url => /\/api\/|https?:\/\/(?!127\.0\.0\.1:)/.test(url))).toBe(false);
  await showcase.getByText('Source versions and what was checked', { exact: true }).click();
  await expect(showcase.locator('.contract-evidence')).toContainText('mocked SDK transport');
  await expect(showcase.locator('.contract-evidence')).toContainText('optional fields and capabilities differ');
  await page.locator('#source-notes summary').click();
  await expect(page.locator('#source-notes')).toContainText('Research cut: 15 October 2026.');
  await expect(page.locator('#source-notes')).not.toContainText('Every illustrated record in this story is invented.');
});

test('keyboard arrows change the native radio selection', async ({ page }) => {
  await page.goto(route);
  const codex = page.getByRole('radio', { name: /^Codex/ });
  await codex.focus(); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: /^OpenCode/ })).toBeChecked();
  await expect(page.locator('[data-engine=opencode]')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(codex).toBeChecked();
});

for (const width of [320, 390, 834, 1440]) {
  test(`saved translations remain readable without JavaScript at ${width}px`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: width < 500 ? 844 : 1000 } });
    const page = await context.newPage();
    await page.goto(new URL(route, testInfo.project.use.baseURL).href);
    const showcase = page.locator('[data-engine-contract]');
    await showcase.scrollIntoViewIfNeeded();
    for (const [name, id] of [['Codex', 'codex'], ['OpenCode', 'opencode'], ['Claude', 'claude']]) {
      await showcase.getByRole('radio', { name: new RegExp('^' + name) }).check();
      await expect(showcase.locator('.contract-view:visible')).toHaveCount(1);
      await expect(showcase.locator(`[data-engine=${id}] .contract-done pre`)).toHaveText('Fixture complete.');
      const dimensions = await showcase.getByRole('radio', { name: new RegExp('^' + name) }).locator('..').boundingBox();
      expect(dimensions!.height).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await showcase.locator(`[data-engine=${id}] summary`).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await showcase.locator(`[data-engine=${id}] summary`).click();
      if (width !== 320) {
        await showcase.evaluate(element => window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - 24, behavior: 'instant' }));
        await page.screenshot({ path: testInfo.outputPath(`${id}-${width}.png`) });
        await showcase.locator(`[data-engine=${id}] .contract-focus`).evaluate(element => window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - 24, behavior: 'instant' }));
        await page.screenshot({ path: testInfo.outputPath(`${id}-${width}-detail.png`) });
      }
    }
    await showcase.getByText('Source versions and what was checked', { exact: true }).click();
    await expect(showcase.locator('.contract-evidence')).toContainText(expectedRevisions[0]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await context.close();
  });
}

test('the active translation and open evidence pass an accessibility scan', async ({ page }) => {
  await page.goto(route);
  await page.locator('.contract-evidence > summary').click();
  for (const name of ['Claude', 'Codex', 'OpenCode']) {
    await page.getByRole('radio', { name: new RegExp('^' + name) }).check();
    const result = await new AxeBuilder({ page }).include('[data-engine-contract]').analyze();
    expect(result.violations.map(item => `${item.id}: ${item.description}`)).toEqual([]);
  }
});
