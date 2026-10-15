import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const route = '/work/panelforge/#image-revision';
const media = '/media/image-revision/';

for (const width of [390, 1024, 1440]) {
  test(`optional silent motion behaves and fits at ${width}px`, async ({ page, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [], unexpected: string[] = [], videoRequests: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      const url = new URL(request.url());
      if (request.method() !== 'GET' || url.origin !== origin || url.pathname.startsWith('/api/')) unexpected.push(request.url());
      if (url.pathname === `${media}motion-study.mp4`) videoRequests.push(request.url());
    });
    await page.goto(route);
    const study = page.locator('[data-motion-study]');
    const summary = study.locator(':scope > summary');
    const video = study.locator('video');
    await expect(study).not.toHaveAttribute('open');
    await expect(video).toBeHidden();
    await expect(video).toHaveAttribute('preload', 'none');
    await expect(video).toHaveAttribute('playsinline', '');
    expect(await video.evaluate((v: HTMLVideoElement) => ({ controls: v.controls, autoplay: v.autoplay, loop: v.loop, paused: v.paused }))).toEqual({ controls: true, autoplay: false, loop: false, paused: true });
    await page.waitForTimeout(350);
    expect(videoRequests).toHaveLength(0);
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(video).toBeVisible();
    await expect(study).toContainText('Silent preview: the returned audio track is omitted; the video frames are unchanged.');
    await expect(study).toContainText('Returned video: 1172 × 786, four seconds.');
    await expect(study).toContainText('The blue teapot stays in place as steam rises and clears.');
    await page.waitForTimeout(200);
    expect(videoRequests).toHaveLength(0);
    expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    await video.evaluate((v: HTMLVideoElement) => v.play());
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(.15);
    expect(await video.evaluate((v: HTMLVideoElement) => ({ width: v.videoWidth, height: v.videoHeight, duration: v.duration }))).toEqual({ width: 1172, height: 786, duration: 4 });
    const geometry = await video.evaluate(v => { const box = v.getBoundingClientRect(); return { ratio: box.width / box.height, objectFit: getComputedStyle(v).objectFit, overflow: document.documentElement.scrollWidth > innerWidth }; });
    expect(geometry.ratio).toBeCloseTo(1172 / 786, 3);
    expect(geometry.objectFit).toBe('contain');
    expect(geometry.overflow).toBe(false);
    await summary.click();
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    await summary.click();
    expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    await video.evaluate((v: HTMLVideoElement) => v.play());
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    const method = study.locator('.revision-motion-method');
    await method.locator('summary').click();
    await expect(method).toContainText('Requested: four seconds, 720p and 16:9. Returned: 120 frames at 1172 × 786, plus audio.');
    const axe = await new AxeBuilder({ page }).include('[data-motion-study]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(axe.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
    expect(await study.locator('figcaption').evaluate(e => Number.parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(14);
    const [download] = await Promise.all([page.waitForEvent('download'), study.getByRole('link', { name: 'Download the silent motion study' }).click()]);
    expect(download.suggestedFilename()).toBe('teapot-motion-silent.mp4');
    expect(await download.failure()).toBeNull();
    await method.locator('summary').click();
    await study.screenshot({ path: test.info().outputPath(`motion-${width}.png`) });
    expect(errors).toEqual([]);
    expect(unexpected).toEqual([]);
  });
}

test('the four-second study ends without looping', async ({ page }) => {
  await page.goto(route);
  const study = page.locator('[data-motion-study]');
  await study.locator(':scope > summary').click();
  const video = study.locator('video');
  await video.evaluate((v: HTMLVideoElement) => v.play());
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.ended), { timeout: 8000 }).toBe(true);
  expect(await video.evaluate((v: HTMLVideoElement) => ({ currentTime: v.currentTime, paused: v.paused, loop: v.loop }))).toEqual({ currentTime: 4, paused: true, loop: false });
});

test('selected receipt, silent stream and retained generated-content metadata agree', async ({ request }) => {
  const receipt = await (await request.get(`${media}motion-receipt.json`)).json();
  expect(Object.keys(receipt)).toEqual(['record_type', 'execution_date', 'source_version', 'input_checks', 'actual_execution', 'requested', 'returned', 'public_derivative', 'poster', 'reported_cost_usd', 'method', 'visual_review']);
  expect(receipt.actual_execution.render_attempts).toBe(1);
  expect(receipt.actual_execution.poster_attempts).toBe(1);
  expect(receipt.public_derivative.sha256).not.toBe(receipt.actual_execution.provider_original_sha256);
  expect(JSON.stringify(receipt)).not.toMatch(/https?:|\/home\/|localhost|gen-vid-|X-Goog-|Bearer |openrouter_job_id|file_asset_id|panel_id|user_id/);
  const probe = spawnSync('ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', new URL('../../public/media/image-revision/motion-study.mp4', import.meta.url).pathname], { encoding: 'utf8' });
  expect(probe.status).toBe(0);
  const metadata = JSON.parse(probe.stdout);
  expect(metadata.streams).toHaveLength(1);
  expect(metadata.streams[0]).toMatchObject({ codec_type: 'video', codec_name: 'h264', width: 1172, height: 786, nb_read_frames: '120', duration: '4.000000' });
  expect(metadata.format.duration).toBe('4.000000');
  expect(createHash('sha256').update(metadata.format.tags.AIGC).digest('hex')).toBe(receipt.public_derivative.AIGC_value_sha256);
  expect(receipt.public_derivative.full_original_AIGC_tag_unchanged).toBe(true);
  expect(receipt.public_derivative.embedded_signature_validation_claimed).toBe(false);
});
