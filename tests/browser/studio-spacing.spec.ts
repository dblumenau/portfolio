import { test, expect, type Page } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader'] } });
test.setTimeout(120_000);
const evidence = resolve(process.env.SPACING_EVIDENCE_DIR ?? '../spacing-fix-evidence');
const baselineURL = process.env.SPACING_BASELINE_URL;
type Glyph = { text: string; x: number; y: number; font: string; top: number; bottom: number };
async function instrument(page: Page, missingMetrics = false) {
  await page.addInitScript(({ missingMetrics }) => {
    const traces = new WeakMap<object, unknown[]>();
    Object.assign(window, { spacingTrace: (canvas: object) => traces.get(canvas) ?? [] });
    for (const klass of [CanvasRenderingContext2D, OffscreenCanvasRenderingContext2D]) {
      const fill = klass.prototype.fillText, clear = klass.prototype.fillRect, measure = klass.prototype.measureText;
      klass.prototype.fillRect = function(x, y, width, height) {
        if (this.canvas.width === 1080 && x === 0 && y === 0 && width === 1080 && height === 1080) traces.set(this.canvas, []);
        return clear.call(this, x, y, width, height);
      };
      klass.prototype.fillText = function(text, x, y, ...args) {
        if (this.canvas.width === 1080) {
          const metrics = measure.call(this, text), trace = traces.get(this.canvas) ?? [];
          trace.push({ text, x, y, font: this.font, top: y - metrics.actualBoundingBoxAscent, bottom: y + metrics.actualBoundingBoxDescent }); traces.set(this.canvas, trace);
        }
        return fill.call(this, text, x, y, ...args);
      };
      if (missingMetrics) klass.prototype.measureText = function(text) {
        const metrics = measure.call(this, text);
        return new Proxy(metrics, { get(target, key) { return key === 'actualBoundingBoxAscent' || key === 'actualBoundingBoxDescent' ? undefined : Reflect.get(target, key, target); } });
      };
    }
  }, { missingMetrics });
}
async function trace(page: Page, selector: string): Promise<Glyph[]> {
  return page.locator(selector).evaluate(canvas => (window as unknown as { spacingTrace: (canvas: Element) => Glyph[] }).spacingTrace(canvas));
}
function bounds(glyphs: Glyph[], studio = false) {
  const headline = glyphs.filter(glyph => /^(?:700|bold)\s/.test(glyph.font) && (!studio || Number(glyph.font.match(/([\d.]+)px/)?.[1]) >= 65));
  const last = Math.max(...headline.map(glyph => glyphs.indexOf(glyph)));
  const metadata = glyphs.slice(last + 1), bottom = Math.max(...headline.map(glyph => glyph.bottom));
  return { headline, metadata, headlineBottom: bottom, metadataTop: metadata.length ? Math.min(...metadata.map(glyph => glyph.top)) : null, gap: metadata.length ? Math.min(...metadata.map(glyph => glyph.top)) - bottom : null };
}
async function decoded(path: string | Buffer) { return sharp(path).removeAlpha().raw().toBuffer({ resolveWithObject: true }); }
async function saveAndCompare(page: Page, canvasSelector: string, downloadSelector: string, name: string) {
  await mkdir(evidence, { recursive: true });
  const flat = Buffer.from(await page.locator(canvasSelector).evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL('image/png').split(',')[1]!), 'base64');
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator(downloadSelector).click()]);
  const file = resolve(evidence, `${name}.png`); await download.saveAs(file);
  const actual = await decoded(file), expected = await decoded(flat);
  expect(actual.info.width).toBe(1080); expect(actual.info.height).toBe(1080); expect(Buffer.compare(actual.data, expected.data)).toBe(0);
  return { file, sha256: createHash('sha256').update(await readFile(file)).digest('hex'), rgb: actual.data };
}
const cases = [
  { id: 'default', headline: 'Make room for ideas', smallLine: 'A little thing, made here.' },
  { id: 'wrapped', headline: 'Something worth keeping', smallLine: 'A little thing, made here.' },
  { id: 'another', headline: 'Room for another idea', smallLine: 'A little thing, made here.' },
  { id: 'danish-60', headline: 'Åbne øer, ærlige idéer og glæde i vores fælles lille værksted. '.repeat(2).slice(0, 60), smallLine: 'Æbletræer, blå himmel og små øjeblikke vi gerne vil beholde. '.repeat(2).slice(0, 60) },
  { id: 'empty-line', headline: 'Something worth keeping', smallLine: '' },
];
async function shop(page: Page, url: string, words: typeof cases[number], arrangement: string, artifactRole = 'current') {
  await page.goto(url); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-preparation', 'ready');
  await page.locator('[data-shop-field="headline"]').fill(words.headline); await page.locator('[data-shop-field="smallLine"]').fill(words.smallLine);
  await page.locator('[data-shop-look="amber-pulse"]').click(); await expect(page.locator('[data-shop-draft-look]')).toContainText('Amber');
  await page.locator(`[data-shop-arrangement="${arrangement}"]`).click();
  const glyphs = await trace(page, '[data-shop-draft]'); await page.locator('.world-shop-pull').click();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '1');
  return { glyphs, artifact: await saveAndCompare(page, '[data-shop-draft]', '[data-shop-slot="0"] [data-shop-download]', `shop-${words.id}-${arrangement}-${artifactRole}`) };
}
for (const arrangement of ['poster', 'center']) for (const words of cases) test(`actual ${arrangement} PNG clears its ${words.id} headline and matches its canvas`, async ({ page }, info) => {
  await instrument(page); const after = await shop(page, '/world/#printshop', words, arrangement), measured = bounds(after.glyphs);
  expect(measured.headline.length).toBeGreaterThan(0);
  if (words.smallLine) expect(measured.gap).toBeGreaterThanOrEqual(24 - .01); else expect(measured.metadata).toEqual([]);
  expect(after.glyphs.every(glyph => glyph.top >= 0 && glyph.bottom < 1080)).toBe(true);
  let comparison;
  if (baselineURL && (words.id === 'default' || words.id === 'wrapped')) {
    const before = await shop(page, new URL('/world/#printshop', baselineURL).href, words, arrangement, 'baseline'), old = bounds(before.glyphs);
    expect(measured.headline).toEqual(old.headline);
    const unchanged = Buffer.compare(before.artifact.rgb, after.artifact.rgb) === 0;
    if (words.id === 'default') { expect(unchanged).toBe(true); expect(measured.metadata).toEqual(old.metadata); }
    else { expect(old.gap).toBeLessThan(0); expect(unchanged).toBe(false); }
    comparison = { before: { file: before.artifact.file, sha256: before.artifact.sha256, ...old }, rgbUnchanged: unchanged };
  }
  const result = { words, arrangement, after: { file: after.artifact.file, sha256: after.artifact.sha256, ...measured }, comparison, pngRGBMismatch: 0 };
  await writeFile(resolve(evidence, `shop-${words.id}-${arrangement}.json`), JSON.stringify(result, null, 2));
  await info.attach('actual-artifact-glyph-spacing', { body: JSON.stringify(result), contentType: 'application/json' });
});

test('Studio exports keep headline fitting and a clear first visible row across supported scales, fonts and compositions', async ({ page }, info) => {
  test.setTimeout(180_000); await instrument(page); await page.goto('/labs/studio/'); await expect(page.locator('[data-studio]')).toHaveAttribute('data-ready', 'true');
  await page.locator('[data-control="time"]').fill('0');
  const matrix = [];
  for (const scale of [75, 100, 115]) for (const font of ['sans', 'serif', 'mono']) for (const composition of ['poster', 'center', 'corner']) {
    await page.locator('[data-control="headline"]').fill('Something worth keeping');
    await page.locator('[data-control="event"]').fill(scale === 115 ? '' : 'An occasion, with æbleøer and open doors. '.repeat(3).slice(0, 120));
    await page.locator('[data-control="name"]').fill('A welcoming studio with plenty of room for new ideas. '.repeat(2).slice(0, 100));
    await page.locator('[data-control="detail"]').fill('A shared table, thoughtful experiments and a little more room for the next idea. '.repeat(2).slice(0, 140));
    await page.locator('[data-control="font"]').selectOption(font); await page.locator('[data-control="scale"]').fill(String(scale)); await page.locator(`[data-composition="${composition}"]`).click();
    const glyphs = await trace(page, '[data-canvas]'), measured = bounds(glyphs, true);
    expect(measured.headline.length).toBeGreaterThan(0); expect(measured.metadata.length).toBeGreaterThan(0); expect(measured.gap).toBeGreaterThanOrEqual(24 - .01);
    expect(glyphs.every(glyph => glyph.top >= 0 && glyph.bottom < 1080)).toBe(true);
    const artifact = await saveAndCompare(page, '[data-canvas]', '[data-action="png"]', `studio-${scale}-${font}-${composition}`);
    matrix.push({ scale, font, composition, eventHiddenByEmptyText: scale === 115, sha256: artifact.sha256, pngRGBMismatch: 0, ...measured, lastGlyphBottom: Math.max(...glyphs.map(glyph => glyph.bottom)) });
  }
  await writeFile(resolve(evidence, 'studio-spacing-matrix.json'), JSON.stringify(matrix, null, 2)); await info.attach('studio-actual-export-spacing-matrix', { body: JSON.stringify(matrix), contentType: 'application/json' });
});

test('missing canvas glyph metrics use conservative spacing while actual exported glyphs remain clear', async ({ page }, info) => {
  await instrument(page, true); const result = await shop(page, '/world/#printshop', { ...cases[1]!, id: 'metrics-fallback' }, 'poster'), measured = bounds(result.glyphs);
  expect(measured.headline.length).toBeGreaterThan(0); expect(measured.metadata.length).toBeGreaterThan(0);
  expect(measured.gap).toBeGreaterThanOrEqual(24); expect(result.glyphs.every(glyph => glyph.bottom < 1080)).toBe(true);
  await info.attach('conservative-metrics-fallback', { body: JSON.stringify({ ...measured, pngRGBMismatch: 0, sha256: result.artifact.sha256 }), contentType: 'application/json' });
});

test('a new look with both slots full names the replacement choice in its ready status', async ({ page }) => {
  await page.goto('/world/#printshop'); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-preparation', 'ready');
  for (const count of [1, 2]) { await expect(page.locator('.world-shop-pull')).toBeEnabled(); await page.locator('.world-shop-pull').click(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', String(count)); }
  await page.locator('[data-shop-look="amber-pulse"]').click(); await expect(page.locator('[data-shop-status]')).toContainText('Choose a print to replace');
  await expect(page.locator('.world-shop-pull')).toBeDisabled(); await page.locator('[data-shop-replace-slot="1"]').click(); await expect(page.locator('.world-shop-pull')).toBeEnabled();
});
