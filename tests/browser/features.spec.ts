import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { features } from '../../src/data/features';

test('the catalogue combines filters, shares state and resets', async ({ page }) => {
  await page.goto('/features/');
  await expect(page.locator('.atlas-row:visible')).toHaveCount(features.length);
  await page.getByLabel('Area', { exact: true }).selectOption('Memory');
  await expect(page.locator('.atlas-row:visible')).toHaveCount(features.filter((feature) => feature.area === 'Memory').length);
  await page.getByLabel('Topic', { exact: true }).selectOption('Knowledge graph');
  await expect(page.locator('.atlas-row:visible')).toHaveCount(features.filter((feature) => feature.area === 'Memory' && feature.topics.includes('Knowledge graph')).length);
  await expect(page).toHaveURL(/area=Memory/);
  await page.reload();
  await expect(page.getByLabel('Topic', { exact: true })).toHaveValue('Knowledge graph');
  await page.getByLabel('Story date', { exact: true }).selectOption('2026-08');
  await expect(page.locator('.atlas-row:visible')).toHaveCount(features.filter((feature) => feature.area === 'Memory' && feature.topics.includes('Knowledge graph') && feature.date.startsWith('2026-08')).length);
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.atlas-row:visible')).toHaveCount(features.length);
  await expect(page).toHaveURL(/\/features\/$/);
  await page.getByLabel('Find a feature').fill('nothing-matches-this-clue');
  await expect(page.locator('[data-atlas-empty]')).toBeVisible();
  await expect(page.locator('[data-atlas-count]')).toHaveText(`0 feature stories of ${features.length}`);
});

test('all feature links resolve to distinct stories with evidence notes', async ({ request }) => {
  for (const feature of features) {
    const response = await request.get(`/features/${feature.slug}/`);
    expect(response.status(), feature.slug).toBe(200);
    const html = await response.text();
    expect(html).toContain(feature.title);
    expect(html).toContain('Source information sheet');
    expect(html).toContain('explanatory exhibit');
    expect(html).not.toMatch(/conversation_id|\/home\/|conversations\/\d+/);
  }
});

test('exhibits and source sheets work through native keyboard controls', async ({ page }) => {
  await page.goto('/features/graph-curation/');
  const example = page.locator('.feature-example-choices summary').filter({ hasText: 'Inspect an inverse action' });
  await example.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Restore the recorded before-state' })).toBeVisible();
  await page.locator('.feature-sources summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Source areas' })).toBeVisible();
});

test('the catalogue and source notes remain readable without scripts', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${test.info().project.use.baseURL}/features/`);
  await expect(page.locator('.atlas-row:visible')).toHaveCount(features.length);
  await page.getByRole('link', { name: 'Read about FindThat' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Recover the detail you half remember.');
  await page.locator('.feature-sources summary').click();
  await expect(page.getByRole('heading', { name: 'Source areas' })).toBeVisible();
  await context.close();
});

for (const width of [390, 768, 1440]) {
  test(`atlas and feature story fit ${width}px and expose accessible controls`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/features/', '/features/knowledge-graph/']) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), path).toBe(true);
      const result = await new AxeBuilder({ page }).analyze();
      expect(result.violations.map((violation) => `${violation.id}: ${violation.description}`), path).toEqual([]);
    }
  });
}
