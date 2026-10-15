import { test, expect, type Page } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { buildSync } from 'esbuild';
const sample=JSON.parse(readFileSync('src/labs/memory/sample.json','utf8'));
const compiled=buildSync({stdin:{contents: "export * from './src/world/memory-desk/model'; export { sourceExcerpts, relationKey } from './src/labs/memory/model';",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'cjs'}).outputFiles![0]!.text;
const {findRecords,initialState,inspect,evidenceJSON,sourceExcerpts,relationKey}=Function('const module={exports:{}};'+compiled+';return module.exports;')() as typeof import('../../src/world/memory-desk/model') & typeof import('../../src/labs/memory/model');

test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader'] } });
test.setTimeout(90_000);
const root = (page: Page) => page.locator('[data-forge-world]');
const card = (page: Page) => page.locator('[data-memory-card]');
const select = (page: Page, label: string) => page.locator(`[data-memory-inspect="${label}"]`).click();
async function ready(page: Page, hash = '#memory-desk') { await page.goto(`/world/${hash}`); await page.locator('[data-world-stage]').scrollIntoViewIfNeeded(); await expect(page.locator('[data-memory-find]')).toBeEnabled(); }
async function find(page: Page) { await page.locator('[data-memory-find]').click(); await expect(page.locator('[data-memory-status]')).toHaveText('3 matching records in this sample'); }
async function data(page: Page) { return JSON.parse((await page.locator('[data-memory-json]').textContent())!); }
async function keep(page: Page, label: string) { await select(page, label); await page.locator('[data-memory-toggle]').click(); }
async function download(page: Page) { const [file] = await Promise.all([page.waitForEvent('download'), page.locator('[data-memory-download]').click()]); expect(file.suggestedFilename()).toBe('memory-evidence-card.json'); return readFile((await file.path())!, 'utf8'); }

test('exact local rows, null type and tuple-specific evidence survive reordering and a foreign excerpt', () => {
  const before = JSON.stringify(sample); expect(sample.relationships).toHaveLength(33);
  const exact = findRecords(); expect(exact.map(record => record.tuple)).toEqual(['vue','vue-js','vue-3'].map(object => ({ subject:'panelforge', predicate:'built_with', object })));
  expect(exact.map(record => record.originalType)).toEqual([null,'technology','technology']);
  expect(exact[0]!.excerpt).toEqual({quote:'Explore the panel-forge Laravel+Vue codebase',attribution:'User wording in a discussion of live prompt modes and costing.'});
  expect(exact.slice(1).map(record => record.excerpt)).toEqual([null,null]); expect(findRecords([...sample.relationships].reverse())).toEqual(exact);
  const foreign = {subject:'another-project',predicate:'built_with',object:'vue-js'}; sourceExcerpts[relationKey(foreign)] = {quote:'FOREIGN EXCERPT NEVER BORROW',source:'foreign attribution'};
  try { expect(findRecords([...sample.relationships,foreign])).toEqual(exact); const state=initialState(); state.records=findRecords(); inspect(state,'vue-js');state.selected.add('vue-js'); expect(evidenceJSON(state)).not.toMatch(/FOREIGN|Laravel\+Vue/); } finally { delete sourceExcerpts[relationKey(foreign)]; }
  expect(JSON.stringify(sample)).toBe(before);
});

test('query, inspection, exact preview/download bytes, subset uncertainty and reset', async ({ page }, info) => {
  const requests: {url:string;method:string}[]=[];page.on('request',r=>requests.push({url:r.url(),method:r.method()}));
  const sourceBefore = createHash('sha256').update(await readFile('src/labs/memory/sample.json')).digest('hex');
  await ready(page); await find(page);
  await expect(page.locator('[data-memory-type]')).toHaveText('unknown (null in the sample)'); await expect(page.locator('[data-memory-quote]')).toHaveText('Explore the panel-forge Laravel+Vue codebase');
  await expect(page.locator('[data-memory-download]')).toHaveAttribute('aria-disabled','true'); expect(await page.locator('[data-memory-download]').getAttribute('href')).toBeNull();
  await keep(page,'vue'); const one = await download(page); expect(one).toBe(await page.locator('[data-memory-json]').textContent()); expect(JSON.parse(one).records[0].originalType).toBeNull();
  await page.locator('[data-memory-toggle]').click(); await keep(page,'vue-js'); await expect(page.locator('[data-memory-missing]')).toBeVisible(); await expect(page.locator('[data-memory-quote]')).toBeEmpty();
  await keep(page,'vue-3'); const two = await download(page); expect(two).toBe(await page.locator('[data-memory-json]').textContent()); expect(two).not.toBe(one);
  const parsed=JSON.parse(two);expect(parsed.records.map((r:{tuple:{object:string}})=>r.tuple.object)).toEqual(['vue-js','vue-3']);expect(parsed.records.every((r:{excerpt:unknown;openedByVisitor:boolean})=>r.excerpt===null&&r.openedByVisitor)).toBe(true);
  expect(two).not.toMatch(/Laravel\+Vue|conversationId|conversation_id|accountId|account_id|\/home\/|privateRoute|verified|approved/i);
  expect(parsed.aliasEquivalence).toBe('not-established-by-this-sample');expect(Object.keys(parsed)).toEqual(['schemaVersion','kind','sample','query','records','aliasEquivalence','scopeNotes']);
  await keep(page,'vue');expect((await data(page)).records).toHaveLength(3);
  await page.locator('[data-memory-reset]').click();await expect(page.locator('[data-memory-results]')).toBeVisible();await expect(page.locator('[data-memory-label]')).toContainText('vue');expect((await data(page)).records).toHaveLength(0);await expect(page.locator('[data-memory-download]')).toHaveAttribute('aria-disabled','true');
  await page.locator('[data-memory-exit]').click();expect(createHash('sha256').update(await readFile('src/labs/memory/sample.json')).digest('hex')).toBe(sourceBefore);
  expect(requests.filter(r=>/^https?:/.test(r.url)&&(!r.url.startsWith(new URL(page.url()).origin)||r.method!=='GET'||/\/api\//.test(r.url)))).toEqual([]);
  await info.attach('memory-evidence-subset.json',{body:two,contentType:'application/json'});await info.attach('network.json',{body:JSON.stringify(requests,null,2),contentType:'application/json'});
});

for(const width of [360,390,834,1440]) test(`native flow, target size, comparison, JSON and accessibility at ${width}`,async({page},info)=>{
  await page.setViewportSize({width,height:1000});await ready(page);await find(page);await keep(page,'vue-js');await keep(page,'vue-3');
  await page.locator('.memory-compare summary').click();await expect(page.locator('.memory-compare article')).toHaveCount(3);
  await page.locator('.memory-preview summary').click();await expect(page.locator('[data-memory-json]')).toBeVisible();expect(JSON.parse(await download(page)).records).toHaveLength(2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const targets=await card(page).locator('button,a,summary').evaluateAll(elements=>elements.filter(e=>e.getClientRects().length).map(e=>({text:e.textContent,height:e.getBoundingClientRect().height})));expect(targets.filter(t=>t.height<43)).toEqual([]);
  const axe=await new AxeBuilder({page}).analyze();expect(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
  await page.locator('[data-world-stage]').scrollIntoViewIfNeeded();await info.attach(`memory-${width}`,{body:await page.screenshot({fullPage:false}),contentType:'image/png'});
});

test('keyboard-only query and selection; direct fixed hashes; origin, Escape and cross-mode history',async({page})=>{
  await page.goto('/world/#memory');await page.locator('[data-world-stage]').scrollIntoViewIfNeeded();await expect(root(page)).toHaveAttribute('data-world-state','ready');
  const entry=page.locator('[data-district-detail="memory"] [data-open-memory]');await entry.focus();await page.keyboard.press('Enter');await expect(card(page)).toBeVisible();await expect(card(page).locator('h2')).toBeFocused();
  await page.locator('[data-memory-find]').focus();await page.keyboard.press('Enter');await page.locator('[data-memory-inspect="vue-js"]').focus();await page.keyboard.press('Space');await page.locator('[data-memory-toggle]').focus();await page.keyboard.press('Enter');expect((await data(page)).records[0].tuple.object).toBe('vue-js');
  await page.keyboard.press('Escape');await expect(page).toHaveURL(/#memory$/);await expect(entry).toBeFocused();
  await page.goBack();await expect(page).toHaveURL(/#memory-desk\/vue-js$/);await expect(card(page)).toBeVisible();await expect(page.locator('[data-memory-label]')).toContainText('vue-js');
  await page.locator('[data-open-task]').click();await expect(root(page)).toHaveAttribute('data-experience','attention');await expect(card(page)).toBeHidden();
  await page.evaluate(()=>document.querySelector<HTMLElement>('[data-open-printshop]')!.click());await expect(root(page)).toHaveAttribute('data-experience','printshop');await expect(page.locator('[data-shop-pull]').first()).toBeEnabled();
  await page.goBack();await expect(root(page)).toHaveAttribute('data-experience','attention');await expect(page.locator('[data-shop-card]')).toBeHidden();
  await page.goBack();await expect(root(page)).toHaveAttribute('data-experience','memory');await expect(page.locator('[data-task-card]')).toBeHidden();await expect(page.locator('[data-memory-label]')).toContainText('vue-js');
  await page.locator('[data-memory-exit]').click();await expect(page).toHaveURL(/#memory$/);
  await ready(page,'#memory-desk/vue-3');await expect(page.locator('[data-memory-type]')).toHaveText('technology');await expect(page.locator('[data-memory-missing]')).toBeVisible();await page.locator('[data-memory-exit]').click();await expect(page).toHaveURL(/#memory$/);
});

test('WebGL unavailable retains complete local workflow; no-JS comparison and Lab link remain readable',async({browser})=>{
  const noGL=await browser.newContext({baseURL:test.info().project.use.baseURL});await noGL.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,...args:Parameters<typeof get>){return String(args[0]).includes('webgl')?null:get.apply(this,args);}as typeof get;});const page=await noGL.newPage();await ready(page);await find(page);await keep(page,'vue-js');expect(JSON.parse(await download(page)).records[0].excerpt).toBeNull();await expect(root(page)).toHaveAttribute('data-world-state','fallback');await noGL.close();
  const noJS=await browser.newContext({baseURL:test.info().project.use.baseURL,javaScriptEnabled:false});const fallback=await noJS.newPage();await fallback.goto('/world/');await fallback.locator('#memory-desk-readable summary').click();await expect(fallback.locator('#memory-desk-readable article')).toHaveCount(3);await expect(fallback.locator('#memory-desk-readable')).toContainText('unknown (null)');await expect(fallback.locator('#memory-desk-readable a[href="/labs/memory/"]')).toBeVisible();await noJS.close();
});

test('Memory is intent-lazy and load failure gives readable comparison and existing Lab',async({page})=>{
  const dir=resolve(process.env.PORTFOLIO_DIST_ROOT ?? 'dist','_astro');const files=await readdir(dir);const modules:string[]=[];for(const name of files.filter(n=>n.endsWith('.js'))){const body=await readFile(resolve(dir,name),'utf8');if(body.includes('matching records in this sample')&&body.includes('createObjectURL'))modules.push(name);}expect(modules).toHaveLength(1);
  const seen:string[]=[];page.on('request',r=>seen.push(r.url()));await page.goto('/world/');await page.locator('[data-world-stage]').scrollIntoViewIfNeeded();await expect(root(page)).toHaveAttribute('data-world-state','ready');expect(seen.some(url=>modules.some(name=>url.endsWith(name)))).toBe(false);
  await page.route(`**/${modules[0]}`,route=>route.abort());await page.evaluate(()=>document.querySelector<HTMLElement>('[data-open-memory]')!.click());await expect(page.locator('[data-memory-status]')).toContainText('could not open');await expect(card(page).locator('a[href="/labs/memory/"]')).toBeVisible();await page.locator('#memory-desk-readable summary').click();await expect(page.locator('#memory-desk-readable article')).toHaveCount(3);await page.locator('[data-memory-exit]').click();await expect(card(page)).toBeHidden();
});

async function memoryResourceProbe(page: Page) {
  await page.addInitScript(() => {
    const bitmaps = new Set<ImageBitmap>(), urls = new Set<string>(), surfaces = new Set<HTMLCanvasElement | OffscreenCanvas>(), contexts = new Set<WebGL2RenderingContext>();
    const buffers = new Set<object>(), textures = new Set<object>(); let peakShader = 0, peakBitmaps = 0, peakSurfaces = 0, peakUrls = 0, memoryDraws = 0;
    const ownedListeners = new Map<EventTarget, Map<string, Set<EventListenerOrEventListenerObject>>>();
    const tracked = (target: EventTarget) => target === window || target === document || target === window.visualViewport || target instanceof Element && Boolean(target.closest('[data-forge-world]'));
    const add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function(type, callback, options) {
      if (callback && tracked(this)) { if (!ownedListeners.has(this)) ownedListeners.set(this, new Map()); const types = ownedListeners.get(this)!; if (!types.has(type)) types.set(type, new Set()); const callbacks = types.get(type)!; callbacks.add(callback); const signal = typeof options === 'object' ? options.signal : undefined; if (signal) add.call(signal, 'abort', () => callbacks.delete(callback), { once: true }); }
      return add.call(this, type, callback, options);
    };
    EventTarget.prototype.removeEventListener = function(type, callback, options) { if (callback) ownedListeners.get(this)?.get(type)?.delete(callback); return remove.call(this, type, callback, options); };
    const bitmap = window.createImageBitmap, close = ImageBitmap.prototype.close;
    window.createImageBitmap = (async (...args: Parameters<typeof bitmap>) => { const image = await Reflect.apply(bitmap, window, args); bitmaps.add(image); peakBitmaps = Math.max(peakBitmaps, bitmaps.size); return image; }) as typeof createImageBitmap;
    ImageBitmap.prototype.close = function() { bitmaps.delete(this); return close.call(this); };
    const createURL = URL.createObjectURL, revokeURL = URL.revokeObjectURL;
    URL.createObjectURL = function(object) { const url = createURL.call(this, object); urls.add(url); peakUrls = Math.max(peakUrls, urls.size); return url; };
    URL.revokeObjectURL = function(url) { urls.delete(url); return revokeURL.call(this, url); };
    const glPrototype = WebGL2RenderingContext.prototype;
    const own = (gl: WebGL2RenderingContext) => gl.canvas instanceof HTMLCanvasElement && gl.canvas.matches('[data-world-canvas]');
    for (const kind of ['Buffer', 'Texture'] as const) {
      const objects = kind === 'Buffer' ? buffers : textures, createName = `create${kind}` as 'createBuffer' | 'createTexture', deleteName = `delete${kind}` as 'deleteBuffer' | 'deleteTexture';
      const create = glPrototype[createName], remove = glPrototype[deleteName];
      Object.defineProperty(glPrototype, createName, { configurable: true, value: function(this: WebGL2RenderingContext) { const object = Reflect.apply(create, this, []); if (object && own(this)) objects.add(object); return object; } });
      Object.defineProperty(glPrototype, deleteName, { configurable: true, value: function(this: WebGL2RenderingContext, object: object) { if (own(this)) objects.delete(object); return Reflect.apply(remove, this, [object]); } });
    }
    for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced'] as const) {
      const original = glPrototype[name]; Object.defineProperty(glPrototype, name, { configurable: true, value: function(this: WebGL2RenderingContext, ...args: unknown[]) { if (own(this) && document.querySelector<HTMLElement>('[data-forge-world]')?.dataset.experience === 'memory') memoryDraws++; return Reflect.apply(original, this, args); } });
    }
    const surfaceCount = () => [...surfaces].filter(canvas => canvas.width === 1080 && canvas.height === 1080).length;
    const htmlContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, ...args: Parameters<typeof htmlContext>) {
      const context = htmlContext.apply(this, args);
      if (args[0] === '2d' && this.width === 1080 && this.height === 1080) surfaces.add(this);
      if (args[0] === 'webgl2' && context) { contexts.add(context as WebGL2RenderingContext); peakShader = Math.max(peakShader, [...contexts].filter(gl => !own(gl) && !gl.isContextLost()).length); }
      peakSurfaces = Math.max(peakSurfaces, surfaceCount()); return context;
    } as typeof htmlContext;
    if (typeof OffscreenCanvas !== 'undefined') {
      const offscreenContext = OffscreenCanvas.prototype.getContext;
      OffscreenCanvas.prototype.getContext = function(this: OffscreenCanvas, ...args: Parameters<typeof offscreenContext>) { const context = offscreenContext.apply(this, args); if (args[0] === '2d' && this.width === 1080 && this.height === 1080) surfaces.add(this); peakSurfaces = Math.max(peakSurfaces, surfaceCount()); return context; } as typeof offscreenContext;
    }
    document.addEventListener('webglcontextlost', event => { if ((event.target as Element).matches?.('[data-world-canvas]')) { buffers.clear(); textures.clear(); } }, true);
    Object.assign(window, { readMemoryResources: () => ({ bitmaps: bitmaps.size, urls: urls.size, surfaces: surfaceCount(), shaderContexts: [...contexts].filter(gl => !own(gl) && !gl.isContextLost()).length, worldContexts: [...contexts].filter(gl => own(gl) && !gl.isContextLost()).length, buffers: [...contexts].some(gl => own(gl) && !gl.isContextLost()) ? buffers.size : 0, textures: [...contexts].some(gl => own(gl) && !gl.isContextLost()) ? textures.size : 0, listeners: [...ownedListeners.values()].reduce((sum, types) => sum + [...types.values()].reduce((count, callbacks) => count + callbacks.size, 0), 0), memoryDraws, peakShader, peakBitmaps, peakSurfaces, peakUrls }) });
  });
}
type Resources = { bitmaps: number; urls: number; surfaces: number; shaderContexts: number; worldContexts: number; buffers: number; textures: number; listeners: number; memoryDraws: number; peakShader: number; peakBitmaps: number; peakSurfaces: number; peakUrls: number };
const resources = (page: Page) => page.evaluate(() => (window as unknown as { readMemoryResources: () => Resources }).readMemoryResources());


test('bounded real resources, idle/suspended frames, context loss, retained DOM and release on disposal',async({page},info)=>{
  await memoryResourceProbe(page);await page.goto('/world/#memory');await page.locator('[data-world-stage]').scrollIntoViewIfNeeded();await expect(root(page)).toHaveAttribute('data-world-state','ready');await page.waitForTimeout(800);const mapBaseline=await resources(page);
  await page.locator('[data-district-detail="memory"] [data-open-memory]').click();await find(page);await keep(page,'vue');await expect(root(page)).toHaveAttribute('data-memory-draw-calls',/\d+/);await page.waitForTimeout(700);const initial=await resources(page);expect(initial.textures-mapBaseline.textures).toBe(1);expect(initial.urls).toBe(1);
  const stillBefore=await root(page).getAttribute('data-memory-frames');await page.locator('[data-memory-toggle]').click();await page.locator('[data-memory-toggle]').click();await page.waitForTimeout(650);expect(Number(await root(page).getAttribute('data-memory-frames'))-Number(stillBefore)).toBeLessThan(10);
  const budget=await root(page).evaluate(el=>({calls:Number((el as HTMLElement).dataset.memoryDrawCalls),triangles:Number((el as HTMLElement).dataset.memoryTriangles)}));expect(budget.calls).toBeLessThanOrEqual(60);expect(budget.triangles).toBeLessThanOrEqual(25000);
  const cycles=[];for(let i=0;i<10;i++){await select(page,i%2?'vue-js':'vue-3');await page.locator('[data-memory-toggle]').click();await download(page);await page.locator('[data-memory-exit]').click();expect((await resources(page)).urls).toBe(0);await page.goBack();await expect(card(page)).toBeVisible();await expect(root(page)).toHaveAttribute('data-memory-draw-calls',/\d+/);await page.waitForTimeout(550);const current=await resources(page);expect(current.urls).toBe(1);expect(current.worldContexts).toBe(1);expect(current.textures).toBe(initial.textures);expect(current.buffers).toBe(initial.buffers);expect(current.listeners).toBe(initial.listeners);cycles.push(current);}
  expect((await resources(page)).peakUrls).toBe(1);const idle=await resources(page);await page.waitForTimeout(250);expect((await resources(page)).memoryDraws).toBe(idle.memoryDraws);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});const hidden=await resources(page);await page.waitForTimeout(200);expect((await resources(page)).memoryDraws).toBe(hidden.memoryDraws);await page.evaluate(()=>{Reflect.deleteProperty(document,'hidden');document.dispatchEvent(new Event('visibilitychange'));});
  await page.locator('footer').scrollIntoViewIfNeeded();await page.waitForTimeout(250);const offscreen=await resources(page);await page.locator('[data-memory-inspect="vue-js"]').evaluate((el:HTMLElement)=>el.click());await page.waitForTimeout(200);expect((await resources(page)).memoryDraws).toBe(offscreen.memoryDraws);await page.locator('[data-world-stage]').scrollIntoViewIfNeeded();
  const beforeLoss=await data(page);await page.evaluate(()=>{const gl=document.querySelector<HTMLCanvasElement>('[data-world-canvas]')!.getContext('webgl2')!;const extension=gl.getExtension('WEBGL_lose_context')!;Object.assign(window,{restoreMemoryContext:()=>extension.restoreContext()});extension.loseContext();});await expect(root(page)).toHaveAttribute('data-world-state','fallback');await expect(card(page)).toBeVisible();expect(await data(page)).toEqual(beforeLoss);expect(JSON.parse(await download(page))).toEqual(beforeLoss);await page.waitForTimeout(150);await page.evaluate(()=>(window as unknown as {restoreMemoryContext:()=>void}).restoreMemoryContext());await expect(root(page)).toHaveAttribute('data-world-state','ready');
  await page.locator('[data-world-stage]').scrollIntoViewIfNeeded();await expect(root(page)).toHaveAttribute('data-memory-draw-calls',/\d+/);await page.waitForTimeout(600);
  await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));expect(await data(page)).toEqual(beforeLoss);
  await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false})));const disposed=await resources(page);expect(disposed.urls).toBe(0);expect(disposed.worldContexts).toBe(0);expect(disposed.buffers).toBe(0);expect(disposed.textures).toBe(0);
  await info.attach('memory-resource-envelope.json',{body:JSON.stringify({mapBaseline,initial,budget,cycles,idle,hidden,offscreen,disposed},null,2),contentType:'application/json'});
});

test('curation link keeps the separate fictional correction disclosure',async({page})=>{await ready(page);await page.locator('.memory-curation summary').click();await expect(page.locator('.memory-curation')).toContainText('Those fictional records do not establish that these Vue labels should merge.');await page.locator('.memory-curation a').click();await expect(page).toHaveURL(/\/labs\/curation\/$/);await expect(page.locator('h1')).toBeVisible();});

for(const origin of ['#memory','#memory/exhibit'])test(`Memory exit restores exact camera, inspector scroll, page scroll and focus from ${origin}`,async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await page.goto(`/world/${origin}`);await page.locator('[data-world-stage]').scrollIntoViewIfNeeded();await expect(root(page)).toHaveAttribute('data-world-state','ready');await page.waitForTimeout(800);
  const entry=page.locator('[data-district-detail="memory"] [data-open-memory]');await entry.focus();const scroll=await page.evaluate(()=>({page:scrollY,inspector:document.querySelector('[data-world-inspector]')!.scrollTop}));await entry.click();await expect(card(page)).toBeVisible();const first=await page.evaluate(()=>history.state.worldTaskOrigin.pose);await expect(page.locator('[data-world-viewport]')).toHaveJSProperty('clientHeight',780);
  await page.locator('[data-memory-exit]').click();await expect(page).toHaveURL(new RegExp(origin+'$'));await expect(entry).toBeFocused();expect(await page.evaluate(()=>({page:scrollY,inspector:document.querySelector('[data-world-inspector]')!.scrollTop}))).toEqual(scroll);
  await entry.click();await expect(card(page)).toBeVisible();expect(await page.evaluate(()=>history.state.worldTaskOrigin.pose)).toEqual(first);await page.keyboard.press('Escape');await expect(page).toHaveURL(new RegExp(origin+'$'));
});

for(const navigation of ['hash','same-document-goto'] as const)test(`initialized overview returns from Memory fixed hash to a coherent district via ${navigation}`,async({page},info)=>{
  await page.setViewportSize({width:1440,height:1000});await page.goto('/world/#memory');await page.locator('[data-world-stage]').scrollIntoViewIfNeeded();await expect(root(page)).toHaveAttribute('data-world-state','ready');await page.waitForTimeout(1800);
  const entry=page.locator('[data-district-detail="memory"] [data-open-memory]');await entry.click();await expect(card(page)).toBeVisible();const canonical=await page.evaluate(()=>history.state.worldTaskOrigin.pose);
  await page.goto('/world/');await page.locator('[data-world-stage]').scrollIntoViewIfNeeded();await expect(root(page)).toHaveAttribute('data-world-state','ready');await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-selected','');await page.waitForTimeout(1800);const token=await page.evaluate(()=>{const token=crypto.randomUUID();Object.assign(window,{memoryOriginDocument:token});return token;});
  if(navigation==='hash')await page.evaluate(()=>location.hash='#memory-desk/vue-js');else await page.goto('/world/#memory-desk/vue-js');
  await expect(card(page)).toBeVisible();await expect(page.locator('[data-memory-label]')).toContainText('vue-js');expect(await page.evaluate(()=>(window as unknown as {memoryOriginDocument:string}).memoryOriginDocument)).toBe(token);
  await page.locator('[data-memory-exit]').click();await expect(page).toHaveURL(/#memory$/);await expect(root(page)).toHaveAttribute('data-selected','memory');await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-selected','memory');await expect(page.locator('[data-select-district="memory"]')).toHaveAttribute('aria-pressed','true');await expect(entry).toBeVisible();await expect(page.locator('[data-world-activities] [data-open-memory]')).toBeFocused();
  await entry.click();await expect(card(page)).toBeVisible();const returned=await page.evaluate(()=>history.state.worldTaskOrigin.pose);expect(returned.worldHash).toBe('#memory');for(const key of ['position','target','quaternion'])for(let i=0;i<canonical[key].length;i++)expect(returned[key][i]).toBeCloseTo(canonical[key][i],5);
  await page.locator('[data-memory-exit]').click();await page.screenshot({path:info.outputPath(`same-document-${navigation}-return.png`)});await page.reload();await expect(root(page)).toHaveAttribute('data-world-state','ready');await expect(root(page)).toHaveAttribute('data-selected','memory');await expect(page).toHaveURL(/#memory$/);
  await info.attach('same-document-origin.json',{body:JSON.stringify({navigation,canonical,returned,hash:'#memory',selected:'memory',sameDocument:true},null,2),contentType:'application/json'});
});
