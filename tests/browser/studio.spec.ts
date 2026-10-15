import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
const evidence=process.env.STUDIO_EVIDENCE_DIR??process.env.PORTFOLIO_TEST_ARTIFACTS??'test-results/studio';
async function ready(page:import('@playwright/test').Page){await page.goto('/labs/studio/');await expect(page.locator('[data-studio]')).toHaveAttribute('data-ready','true');}

test('a real edited print downloads at full resolution and exactly matches the paused preview',async({page})=>{
 await mkdir(evidence,{recursive:true});const errors:string[]=[];const requests:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));await ready(page);
 await page.locator('[data-control="headline"]').fill('A small adventure');await page.locator('[data-control="name"]').fill('The Sunday Studio');await page.locator('[data-control="font"]').selectOption('serif');await page.locator('[data-composition="center"]').click();await page.locator('[data-control="ink"]').fill('#f4f1e9');
 await page.locator('[data-control="time"]').fill('1800');await expect(page.getByRole('button',{name:'Play animation',exact:true})).toBeVisible();
 const pixels=Buffer.from(await page.locator('[data-canvas]').evaluate((c:HTMLCanvasElement)=>c.toDataURL('image/png').split(',')[1]),'base64');
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-action="png"]').click()]);await download.saveAs(`${evidence}/print.png`);const actual=await sharp(`${evidence}/print.png`).removeAlpha().raw().toBuffer({resolveWithObject:true});const reference=await sharp(pixels).removeAlpha().raw().toBuffer();expect(actual.info.width).toBe(1080);expect(actual.info.height).toBe(1080);expect(Buffer.compare(actual.data,reference)).toBe(0);
 const [jpg]=await Promise.all([page.waitForEvent('download'),page.locator('[data-action="jpg"]').click()]);await jpg.saveAs(`${evidence}/print.jpg`);const decoded=await sharp(`${evidence}/print.jpg`).removeAlpha().raw().toBuffer();const rgb=await sharp(pixels).removeAlpha().raw().toBuffer();let error=0;for(let i=0;i<rgb.length;i++)error+=Math.abs(rgb[i]-decoded[i]);const mean=error/rgb.length;expect(mean).toBeLessThan(3);
 await page.locator('[data-action="jpg"]').blur();await page.screenshot({path:`${evidence}/desktop.png`,fullPage:true});await writeFile(`${evidence}/image-proof.json`,JSON.stringify({width:1080,height:1080,pngPixelDifference:0,jpgMeanPixelError:mean,requests:requests.length,outboundRequests:requests.filter(u=>!u.startsWith(new URL(page.url()).origin)&&!u.startsWith('data:')&&!u.startsWith('blob:')),errors},null,2));expect(errors).toEqual([]);expect(requests.every(u=>u.startsWith(new URL(page.url()).origin)||u.startsWith('data:')||u.startsWith('blob:'))).toBe(true);expect(await page.evaluate(()=>localStorage.length+sessionStorage.length)).toBe(0);
});

test('the real animated composition exports to an MP4 with cancellation available',async({page})=>{
 await ready(page);const button=page.locator('[data-action="mp4"]');if(await button.isDisabled()){await expect(page.locator('[data-capability]')).toContainText('PNG and JPG');return;}
 await page.locator('[data-control="time"]').fill('0');await mkdir(evidence,{recursive:true});await writeFile(`${evidence}/loop-first-preview.png`,Buffer.from(await page.locator('[data-canvas]').evaluate((c:HTMLCanvasElement)=>c.toDataURL('image/png').split(',')[1]),'base64'));
 const [download]=await Promise.all([page.waitForEvent('download',{timeout:90000}),button.click()]);await mkdir(evidence,{recursive:true});await download.saveAs(`${evidence}/print.mp4`);await expect(page.locator('[data-status]')).toContainText('MP4 downloaded');await expect(page.locator('[data-progress]')).toBeHidden();
 await button.click();await expect(page.locator('[data-action="cancel"]')).toBeVisible();await page.locator('[data-action="cancel"]').click();await expect(page.locator('[data-status]')).toContainText('cancelled');await expect(page.locator('[data-action="png"]')).toBeEnabled();
});

test('phone controls show a synchronized small preview and reset the composition',async({page})=>{
 await page.setViewportSize({width:393,height:852});await ready(page);await page.locator('[data-control="headline"]').fill('Hello, tomorrow');await page.locator('button[data-background="amber-pulse"]').click();await expect(page.locator('[data-studio]')).toHaveAttribute('data-background','amber-pulse');await page.locator('[data-control="font"]').selectOption('mono');await page.locator('[data-composition="corner"]').click();await expect(page.locator('[data-mini]')).toBeVisible();
 const proof=await page.evaluate(()=>{const full=document.querySelector<HTMLCanvasElement>('[data-canvas]')!,mini=document.querySelector<HTMLCanvasElement>('[data-mini-canvas]')!;const same=document.createElement('canvas');same.width=same.height=216;same.getContext('2d')!.drawImage(full,0,0,216,216);return same.toDataURL()===mini.toDataURL();});expect(proof).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.locator('[data-control="font"]').blur();await page.screenshot({path:`${evidence}/phone-editing.png`,fullPage:true});
 await page.locator('[data-action="return"]').click();await expect(page.locator('[data-canvas]')).toBeInViewport();await page.locator('[data-action="reset"]').click();await expect(page.locator('[data-control="headline"]')).toHaveValue('Something useful');await expect(page.locator('[data-composition="poster"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('[data-studio]')).toHaveAttribute('data-background','forest-mist');await page.locator('[data-action="reset"]').blur();await page.screenshot({path:`${evidence}/phone.png`,fullPage:true});
});

test('missing WebCodecs offers working still downloads without a broken video action',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(window,'VideoEncoder',{value:undefined}));await ready(page);await expect(page.locator('[data-action="mp4"]')).toBeDisabled();await expect(page.locator('[data-capability]')).toContainText('PNG and JPG work here');const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-action="png"]').click()]);expect(download.suggestedFilename()).toBe('studio-print.png');
});

test('rapid ink changes and leaving the page release every created bitmap',async({page})=>{
 await page.addInitScript(()=>{const open=new Set<ImageBitmap>();const original=window.createImageBitmap;const close=ImageBitmap.prototype.close;window.createImageBitmap=(async(...args:unknown[])=>{const image=await (original as (...a:unknown[])=>Promise<ImageBitmap>)(...args);open.add(image);return image;}) as typeof createImageBitmap;ImageBitmap.prototype.close=function(){open.delete(this);return close.call(this)};(window as unknown as {bitmapCount:()=>number}).bitmapCount=()=>open.size;});await ready(page);await page.locator('button[data-background="amber-pulse"]').click();await page.locator('button[data-background="cyber-teal"]').click();await page.locator('button[data-background="forest-mist"]').click();await expect(page.locator('[data-studio]')).toHaveAttribute('aria-busy','false');expect(await page.evaluate(()=>(window as unknown as {bitmapCount:()=>number}).bitmapCount())).toBe(64);await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false})));await expect.poll(()=>page.evaluate(()=>(window as unknown as {bitmapCount:()=>number}).bitmapCount())).toBe(0);expect(await page.locator('[data-canvas]').evaluate((c:HTMLCanvasElement)=>c.width)).toBe(0);
});

test('the workshop works from the keyboard and passes accessibility checks',async({page})=>{
 await ready(page);await page.locator('[data-control="role"]').focus();await page.keyboard.press('s');await page.keyboard.press('Tab');await expect(page.locator('[data-control="prefix"]')).toBeFocused();await page.locator('[data-control="time"]').focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('button',{name:'Play animation',exact:true})).toBeVisible();const results=await new AxeBuilder({page}).include('[data-studio]').analyze();expect(results.violations).toEqual([]);
});

test('WebGL failure leaves an honest still print with working image export',async({page})=>{
 await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,type:string,...args:unknown[]){if(type==='webgl2')return null;return (original as (...a:unknown[])=>unknown).call(this,type,...args)} as typeof original;});await ready(page);await expect(page.locator('[data-capability]')).toContainText('PNG and JPG still prints are ready');await expect(page.locator('[data-action="mp4"]')).toBeDisabled();const[download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-action="png"]').click()]);expect(download.suggestedFilename()).toBe('studio-print.png');
});

test('the tablet bench fits without horizontal overflow',async({page})=>{await page.setViewportSize({width:768,height:1024});await ready(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`${evidence}/tablet.png`,fullPage:true});});
