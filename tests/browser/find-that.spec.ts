import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const width of [390, 768, 1440]) {
  test(`saved FindThat evidence works without scripts at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 950 } });
    const page = await context.newPage();
    await page.goto(`${test.info().project.use.baseURL}/features/find-that/`);
    await expect(page.locator('.findthat-scope')).toContainText('One known review');
    await expect(page.locator('.findthat-stages li')).toHaveCount(3);
    await expect(page.locator('.findthat input')).toHaveCount(0);
    const source = page.getByText('Read the corrected source', { exact: true });
    await source.focus(); await page.keyboard.press('Enter');
    await expect(page.locator('.findthat blockquote')).toBeVisible();
    await expect(page.locator('.findthat blockquote')).toContainText("Follow the selected tool's actual output-path restrictions");
    await page.getByText('What the evidence establishes', { exact: true }).click();
    await expect(page.locator('.findthat')).toContainText('not a runtime screenshot test');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('.findthat').screenshot({ path: `../evidence/find-that-${width}.png`, style: '.skip-link:not(:focus){visibility:hidden}' });
    await context.close();
  });
}

test('saved FindThat excerpt exposes accessible controls', async ({ page }) => {
  await page.goto('/features/find-that/');
  await page.getByText('Read the corrected source', { exact: true }).click();
  expect((await new AxeBuilder({ page }).include('.findthat').analyze()).violations).toEqual([]);
});
