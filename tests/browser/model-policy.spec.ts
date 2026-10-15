import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

const receipt = JSON.parse(readFileSync(new URL('../../public/media/model-policy/receipt.json', import.meta.url), 'utf8'));
const route = '/features/model-policy/';

test('the same explicit request has distinct saved outcomes when only the default role changes', async ({ page }) => {
  await page.goto(route);
  await page.getByRole('link', { name: 'Inspect the saved policy check', exact: true }).click();
  await expect(page).toHaveURL(/#saved-policy-check$/);
  const exhibit = page.locator('[data-model-policy-record]');
  await expect(exhibit.locator('.policy-request dd')).toHaveText(['gpt-6.1-sol', 'low', 'none']);
  const empty = page.locator('[data-policy-empty]');
  await expect(empty).toContainText('No denial emitted');
  await expect(empty).toContainText('stdout was empty');
  await expect(empty).toContainText('no explicit allow JSON');
  const override = page.locator('[data-policy-override]');
  await expect(override).toContainText(receipt.comparison.defaultRoleOverride.role.model);
  await expect(override).toContainText('PreToolUse · deny');
  await expect(override.locator('blockquote')).toHaveText(receipt.comparison.defaultRoleOverride.reasonPrefix);
  await expect(exhibit.locator('.policy-process')).toHaveText(['Process exit 0 · stderr empty', 'Process exit 0 · stderr empty']);
  await expect(exhibit.locator('button,input,select,textarea,video,canvas')).toHaveCount(0);
  await expect(page.locator('.feature-object-sequence,.feature-example-choices')).toHaveCount(0);
});

test('native keyboard disclosures separate the secondary input and source limits', async ({ page }) => {
  await page.goto(route);
  const method = page.locator('[data-policy-method]');
  await method.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(method).toHaveAttribute('open', '');
  await expect(method).toContainText('two inputs were byte-identical');
  await expect(method).toContainText('runtime integration was not tested');
  await expect(method).toContainText('15-test suite result is historical');
  await expect(method).toContainText('Metaclaude guard was not exercised');
  await expect(method).toContainText(receipt.source.hookSha256);
  const secondary = page.locator('[data-policy-unknown]');
  await secondary.locator('summary').focus();
  await page.keyboard.press('Space');
  await expect(secondary).toHaveAttribute('open', '');
  await expect(secondary.locator('blockquote')).toHaveText(receipt.secondary.reasonPrefix);
  await expect(secondary).toContainText('literal data value unknown');
  await page.locator('.feature-sources summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.feature-sources')).toContainText('Research cut: 15 October 2026');
  await expect(page.locator('.feature-sources time[datetime="2026-09-30"]')).toHaveText('30 Sept 2026');
  await expect(page.locator('.feature-sources time[datetime="2026-10-08"]')).toHaveText('8 Oct 2026');
});

test('the saved comparison and native details remain usable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${baseURL}${route}`);
  await expect(page.locator('[data-policy-empty]')).toBeVisible();
  await expect(page.locator('[data-policy-override] blockquote')).toHaveText(receipt.comparison.defaultRoleOverride.reasonPrefix);
  await page.locator('[data-policy-unknown] summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-policy-unknown] blockquote')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

test('the public receipt exposes selected actual fields and no private execution data', async ({ request }) => {
  const response = await request.get('/media/model-policy/receipt.json');
  expect(response.status()).toBe(200);
  const bytes = await response.body();
  expect(bytes.length).toBeLessThan(4096);
  const saved = JSON.parse(bytes.toString());
  expect(saved).toEqual(receipt);
  expect(Object.keys(saved).sort()).toEqual(['schema','kind','recorded','source','request','comparison','secondary','method','scope'].sort());
  expect(saved.comparison.sameInputBytes).toBe(true);
  expect(saved.comparison.noDefaultRole.stdout).toBe('');
  expect(saved.comparison.noDefaultRole).not.toHaveProperty('permissionDecision');
  expect(saved.comparison.defaultRoleOverride.permissionDecision).toBe('deny');
  expect(saved.secondary.permissionDecision).toBe('deny');
  expect([saved.comparison.noDefaultRole.exit,saved.comparison.defaultRoleOverride.exit,saved.secondary.exit]).toEqual([0,0,0]);
  expect(bytes.toString()).not.toMatch(/\/home\/|\/Users\/|\/tmp\/|127\.0\.0\.1|localhost|CODEX_HOME|"cwd"|namespace|auth\.json|session_id|Authorization|api[_-]?key/i);
});

for (const width of [360,390,1440]) {
  test(`the static comparison fits ${width}px with accessible controls and local GETs only`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const external: string[] = [], mutations: string[] = [], errors: string[] = [];
    page.on('request', request => {
      if (new URL(request.url()).origin !== new URL(String(info.project.use.baseURL)).origin) external.push(request.url());
      if (request.method() !== 'GET') mutations.push(request.method());
    });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(route);
    const exhibit = page.locator('[data-model-policy-record]');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const item of await exhibit.locator('.policy-request dd,.policy-role,blockquote').all()) {
      const bounds = await item.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width);
    }
    await exhibit.screenshot({ path: info.outputPath(`model-policy-${width}.png`) });
    for (const summary of await exhibit.locator('summary').all()) await summary.click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations.map(item => `${item.id}: ${item.description}`)).toEqual([]);
    expect(external).toEqual([]); expect(mutations).toEqual([]); expect(errors).toEqual([]);
  });
}
