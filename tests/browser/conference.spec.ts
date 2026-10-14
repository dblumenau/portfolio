import { test, expect } from '@playwright/test';
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
