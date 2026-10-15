import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
const receipt = JSON.parse(readFileSync(new URL('../../public/media/steering/receipt.json', import.meta.url), 'utf8'));

const route = '/features/steer-without-interrupt/';

test('the recorded correction retains the successful result and distinguishes queued from applied', async ({ page }) => {
  await page.goto(route);
  await page.getByRole('link', { name: 'Inspect the recorded correction', exact: true }).click();
  await expect(page).toHaveURL(/#recorded-correction$/);
  const exhibit = page.locator('[data-recorded-steering]');
  await expect(exhibit.getByRole('heading', { name: 'A new instruction. The same result.' })).toBeVisible();
  await expect(exhibit.locator('blockquote').first()).toHaveText(receipt.instructions.originalSelectedExcerpt);
  await expect(exhibit.locator('blockquote').last()).toHaveText(receipt.instructions.changed);
  await expect(exhibit.locator('[data-steering-result] code')).toHaveText(receipt.tool.result);
  await expect(exhibit.locator('[data-steering-answer] code')).toHaveText(receipt.answer);
  await expect(exhibit.locator('.steering-correction')).toContainText('2.56 s · correction queued');
  await expect(exhibit.locator('.steering-correction')).toContainText('One tool still running');
  await expect(exhibit.locator('[data-steering-result]')).toContainText('10.57 s');
  await expect(exhibit.locator('[data-steering-answer]')).toContainText('13.07 s');
  await expect(exhibit).toContainText('private allow-once hook and namespace');
  await expect(page.locator('.feature-specimen')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('Use metric units');
  await expect(page.locator('body')).not.toContainText('no current product execution is claimed');
});

test('the saved sequence and method open through native keyboard controls', async ({ page }) => {
  await page.goto(route);
  const trace = page.locator('[data-steering-trace]');
  await trace.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(trace).toHaveAttribute('open', '');
  const rows = trace.locator('tbody tr');
  await expect(rows).toHaveCount(5);
  for (const [index, event] of receipt.sequence.entries()) {
    await expect(rows.nth(index)).toContainText(`${event.seconds.toFixed(2)} s`);
    await expect(rows.nth(index)).toContainText(event.label);
    await expect(rows.nth(index).locator('code')).toHaveText(event.event);
  }
  await expect(trace).toContainText('Two model response sequences');
  await expect(trace).toContainText('separate SDK input/control write');
  const method = page.locator('[data-steering-method]');
  await method.locator('summary').focus();
  await page.keyboard.press('Space');
  await expect(method).toHaveAttribute('open', '');
  await expect(method).toContainText('Bash is a broad grant');
  await expect(method).toContainText('two built-in plugins');
  await page.locator('.feature-sources summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.feature-sources')).toContainText('Research cut: 15 October 2026');
  await expect(page.locator('.feature-sources time[datetime="2026-10-04"]')).toHaveText('4 Oct 2026');
  await expect(page.locator('.feature-sources')).toContainText('No PanelForge UI or database persistence was tested');
});

test('all three recorded moments and receipt remain readable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${baseURL}${route}`);
  await expect(page.locator('[data-recorded-steering] blockquote').first()).toBeVisible();
  await expect(page.locator('[data-recorded-steering] blockquote').last()).toBeVisible();
  await expect(page.locator('[data-steering-result] code')).toBeVisible();
  await expect(page.locator('[data-steering-answer] code')).toBeVisible();
  await page.locator('[data-steering-trace] summary').click();
  await expect(page.locator('[data-steering-trace] tbody tr')).toHaveCount(5);
  await expect(page.getByRole('link', { name: 'Read the concise execution receipt' })).toBeVisible();
  await context.close();
});

test('the downloadable receipt contains only the explicit public projection', async ({ request }) => {
  const response = await request.get('/media/steering/receipt.json');
  expect(response.status()).toBe(200);
  const bytes = await response.body();
  expect(bytes.length).toBeLessThanOrEqual(5120);
  const saved = JSON.parse(bytes.toString());
  expect(saved).toEqual(receipt);
  expect(Object.keys(saved).sort()).toEqual(['schema','kind','recorded','source','instructions','sequence','tool','answer','observations','method','scope'].sort());
  expect(saved.observations).toMatchObject({ streams: 1, corrections: 1, toolCalls: 1, modelResponseSequences: 2, finalSdkResults: 1, pendingAfterEcho: 0 });
  expect(bytes.toString()).not.toMatch(/\/home\/|\/Users\/|127\.0\.0\.1|localhost|stream_id|session_id|tool_use_id|Authorization|api[_-]?key|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
});

for (const width of [360, 390, 1440]) {
  test(`recorded text fits ${width}px with accessible controls and local requests only`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const external: string[] = [], mutations: string[] = [], errors: string[] = [];
    page.on('request', request => {
      if (new URL(request.url()).origin !== new URL(String(info.project.use.baseURL)).origin) external.push(request.url());
      if (request.method() !== 'GET') mutations.push(request.method());
    });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const exhibit = page.locator('[data-recorded-steering]');
    for (const code of await exhibit.locator('.steering-values code').all()) {
      const bounds = await code.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    }
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations.map(item => `${item.id}: ${item.description}`)).toEqual([]);
    await exhibit.screenshot({ path: info.outputPath(`steering-${width}.png`) });
    await page.locator('[data-steering-trace] summary').click();
    await page.locator('[data-steering-method] summary').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(external).toEqual([]); expect(mutations).toEqual([]); expect(errors).toEqual([]);
  });
}
