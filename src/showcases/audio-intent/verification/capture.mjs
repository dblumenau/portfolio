import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { openSync, closeSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { resolve } from 'node:path';
if (!process.env.AUDIO_PROOF_DIR || !process.env.AUDIO_PROOF_URL || !process.env.AUDIO_PROOF_PULSE) throw new Error('Set AUDIO_PROOF_DIR, AUDIO_PROOF_URL and AUDIO_PROOF_PULSE for private capture. No default output directory.');
const dir=resolve(process.env.AUDIO_PROOF_DIR),origin=process.env.AUDIO_PROOF_URL,pulse=process.env.AUDIO_PROOF_PULSE;
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,ignoreDefaultArgs:['--mute-audio'],env:{...process.env,PULSE_SERVER:pulse,PULSE_SINK:'proof'}});
const context=await browser.newContext({viewport:{width:1440,height:1050},serviceWorkers:'block'});
const requests=[],blocked=[],results=[],captures=new Set();
context.on('request',r=>requests.push(r.url()));
await context.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():(blocked.push(r.request().url()),r.abort()));
await context.addInitScript(()=>{
 const events=[];window.__audioProof=events;const record=(kind,data={})=>events.push({kind,ms:performance.now(),...data});
 const play=HTMLMediaElement.prototype.play,pause=HTMLMediaElement.prototype.pause,seen=new WeakSet();
 HTMLMediaElement.prototype.play=function(...args){if(!seen.has(this)){seen.add(this);for(const kind of ['playing','ended','error'])this.addEventListener(kind,()=>record('media-'+kind,{src:this.currentSrc||this.src,time:this.currentTime}));}record('media-play',{src:this.currentSrc||this.src});return play.apply(this,args);};
 HTMLMediaElement.prototype.pause=function(...args){record('media-pause');return pause.apply(this,args);};
 const Native=window.AudioContext;window.AudioContext=new Proxy(Native,{construct(Target,args){record('context-created',{active:navigator.userActivation.isActive});return Reflect.construct(Target,args);}});
 document.addEventListener('click',e=>{if(e.target.closest('[data-audio-listen]'))record('listen-gesture',{trusted:e.isTrusted,active:navigator.userActivation.isActive});},true);
});
async function run(name){
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto(origin+'/features/voice-conversation-loop/#sound-when-you-choose');await page.waitForFunction(()=>document.querySelector('[data-audio-intent]')?.getAttribute('data-audio-ready')==='true');
 const section=page.locator('[data-audio-intent]');await section.scrollIntoViewIfNeeded();
 const fd=openSync(dir+'/'+name+'.s16le','w'),capture=spawn('parec',['--server='+pulse,'--device=proof.monitor','--format=s16le','--rate=48000','--channels=2','--latency-msec=20'],{stdio:['ignore',fd,'pipe']});const owned={capture,fd};captures.add(owned);let captureErrors='';capture.stderr.on('data',v=>captureErrors+=v);
 await page.waitForTimeout(2300);
 if(name==='quiet'){await section.locator('select').selectOption('ordered');await section.locator('summary').click();await section.locator('[data-audio-incoming]').click();await page.waitForTimeout(1000);}else{
 await section.locator('select').selectOption(name==='ordered'?'ordered':'reordered');await section.locator('[data-audio-listen]').click();
 if(name==='stop'){await page.waitForFunction(()=>window.__audioProof.some(e=>e.kind==='media-playing'));await page.waitForTimeout(220);await section.locator('[data-audio-stop]').click();await page.waitForTimeout(900);}else await page.waitForFunction(()=>document.querySelector('[data-audio-message]')?.textContent==='Queue finished. This page stays enabled.');
 await page.waitForTimeout(200);
 }
 const proof=await page.evaluate(()=>({events:window.__audioProof,state:{...document.querySelector('[data-audio-intent]').dataset},message:document.querySelector('[data-audio-message]').textContent}));
 capture.kill('SIGTERM');await once(capture,'exit');closeSync(fd);captures.delete(owned);
 const result={name,...proof,errors,captureErrors};results.push(result);await writeFile(dir+'/'+name+'.json',JSON.stringify(result,null,2)+'\n');await page.close();
}
try{for(const name of ['quiet','reordered','ordered','stop'])await run(name);await writeFile(dir+'/browser-capture.json',JSON.stringify({browser:browser.version(),origin,requests,blocked,cases:results,method:'Actual candidate page, unmodified source, trusted native clicks, real Howler playback; native browser API forwarding only; private Pulse null-sink monitor capture; no physical audibility claim'},null,2)+'\n');}
finally{for(const {capture,fd}of captures){capture.kill('SIGTERM');closeSync(fd);}await browser.close();}
