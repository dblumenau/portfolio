import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const toData = async (path, mime) => `data:${mime};base64,${(await readFile(resolve(path))).toString('base64')}`;
  const sans = await toData('node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2', 'font/woff2');
  const serif = await toData('node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2', 'font/woff2');
  const world = await toData('public/media/forge-world-overview.webp', 'image/webp');
  await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
    @font-face{font-family:DM;src:url('${sans}')}@font-face{font-family:Fraunces;src:url('${serif}')}*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;overflow:hidden;background:#f4f1e9;color:#202622;font-family:DM,sans-serif}.brand{display:flex;align-items:center;gap:18px;position:absolute;left:54px;top:37px}.mark{font-family:Fraunces;font-size:47px;font-weight:560;letter-spacing:-5px}.dot{color:#a2452d}.name{font-size:16px;font-weight:550;line-height:1.25}.location{position:absolute;right:54px;top:55px;font-size:12px;text-transform:uppercase;letter-spacing:1.7px;color:#596159}.rule{position:absolute;left:54px;right:54px;top:116px;height:1px;background:#c9cec0}.copy{position:absolute;z-index:2;left:54px;top:167px;width:600px}h1{margin:0;font-size:76px;font-weight:550;letter-spacing:-4px;line-height:1.04}.serif{font-family:Fraunces;color:#344d3d;font-weight:480;letter-spacing:-3px}.copy p{margin:29px 0 0;max-width:380px;font-size:18px;line-height:1.5;color:#596159}.world{position:absolute;width:810px;height:auto;right:-165px;bottom:70px;mix-blend-mode:multiply;transform:rotate(-5deg)}.bottom{position:absolute;left:54px;right:54px;bottom:33px;display:flex;justify-content:space-between;border-top:1px solid #c9cec0;padding-top:18px;font-size:12px;letter-spacing:.3px}.bottom span:first-child{font-weight:600}.arrow{display:grid;place-items:center;position:absolute;right:54px;bottom:98px;width:48px;height:48px;border:1px solid #9da995;border-radius:50%;font-size:27px;background:#f4f1e9}
  </style></head><body><div class="brand"><span class="mark">d<span class="dot">.</span>b</span><span class="name">David<br>Blumenau</span></div><span class="location">Developer / Copenhagen</span><div class="rule"></div><img class="world" src="${world}" alt=""><div class="copy"><h1>Useful things,<br><span class="serif">made personal.</span></h1><p>Software for making things,<br>working with AI, and everyday life.</p></div><span class="arrow">↗</span><div class="bottom"><span>danishdave.com</span><span>Explore the projects. Try the ideas.</span></div></body></html>`);
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode())); });
  await page.screenshot({ path: resolve('public/media/portfolio-social-card.png') });
  console.log('Rendered public/media/portfolio-social-card.png at 1200 × 630.');
} finally {
  await browser.close();
}
