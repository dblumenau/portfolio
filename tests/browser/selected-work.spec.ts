import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const name = 'david-blumenau-selected-work.pdf';
const expectedHash = 'de251c223c0873ff9fe385d458558a87cd0c616d88903b87025e662a4895b80b';

for (const width of [390, 1440]) {
  test(`the selected-work companion downloads intact from the footer at ${width}px`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const link = page.getByRole('link', { name: /Selected work, in six pages/ });
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', `/sample-files/${name}`);
    const box = await link.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const pending = page.waitForEvent('download');
    await link.click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe('David-Blumenau-Selected-Work.pdf');
    const bytes = await readFile((await download.path())!);
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    expect(bytes.length).toBe(4_466_012);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(expectedHash);
    const response = await request.head(`/sample-files/${name}`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/pdf');
  });
}
