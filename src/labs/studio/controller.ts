import { createIcon } from '../../ui/icons';
import { createDoc, backgrounds, rolePresets } from './model';
import type { DecodedBackground } from './types';
import { render } from './render';
import { frameIndexAt } from './frames';
import { bakeShaderBackground } from './shaderBackground';
import { createExportCanvas, canvasToBlob } from './canvas';
import { fontsReady } from './fonts';

export function initializeStudio(root:HTMLElement):void {
 const canvas=root.querySelector<HTMLCanvasElement>('[data-canvas]')!;
 const ctx=canvas.getContext('2d',{alpha:false});
 const mini=root.querySelector<HTMLElement>('[data-mini]')!;
 const miniCanvas=root.querySelector<HTMLCanvasElement>('[data-mini-canvas]')!;
 const miniCtx=miniCanvas.getContext('2d',{alpha:false});
 const status=root.querySelector<HTMLElement>('[data-status]')!;
 const capability=root.querySelector<HTMLElement>('[data-capability]')!;
 const form=root.querySelector<HTMLFormElement>('[data-controls]')!;
 const play=root.querySelector<HTMLButtonElement>('[data-action="play"]')!;
 const timeInput=root.querySelector<HTMLInputElement>('[data-control="time"]')!;
 const progress=root.querySelector<HTMLProgressElement>('[data-progress]')!;
 const cancel=root.querySelector<HTMLButtonElement>('[data-action="cancel"]')!;
 const mp4=root.querySelector<HTMLButtonElement>('[data-action="mp4"]')!;
 if(!ctx){status.textContent='This browser could not open a drawing canvas.';root.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=true);return;}
 const scope=new AbortController();
 let doc=createDoc(),time=0,lastStamp=0,raf=0,lastFrame=-1,playing=true,visible=true,stageVisible=true,formVisible=false,disposed=false,ready=false;
 let bake:AbortController|null=null,clip:AbortController|null=null,baking=false,requested=doc.backgroundId;
 let downloads=new Set<string>(),downloadTimers=new Set<ReturnType<typeof setTimeout>>();
 const brands=(navigator as Navigator & {userAgentData?:{brands?:{brand:string}[]}}).userAgentData?.brands;
 const videoCapable=typeof VideoEncoder!=='undefined'&&typeof VideoFrame!=='undefined'&&!!brands?.some(b=>b.brand==='Chromium');
 capability.textContent=videoCapable?'MP4 is encoded on this device. A 4-second silent loop.':'PNG and JPG work here. A 4-second MP4 needs a compatible Chrome or Edge encoder.';
 function say(message:string){if(!disposed)status.textContent=message;}
 function release(bg:DecodedBackground|null){bg?.frames.forEach(f=>{if('close'in f.image)f.image.close();else{f.image.width=0;f.image.height=0;}});}
 function draw(){if(disposed)return;render(ctx!,doc,time);miniCtx?.drawImage(canvas,0,0,216,216);lastFrame=frameIndexAt(doc.background,time);root.dataset.frame=String(lastFrame);root.dataset.time=String(time);timeInput.value=String(Math.floor(time));root.querySelector('output[data-time]')!.textContent=`${(time/1000).toFixed(2)} s`;}
 function tick(stamp:number){raf=0;if(disposed)return;if(playing&&ready&&visible&&!document.hidden&&!clip){if(lastStamp)time=(time+Math.min(stamp-lastStamp,100))%4000;if(frameIndexAt(doc.background,time)!==lastFrame)draw();}lastStamp=stamp;if(visible&&!document.hidden)raf=requestAnimationFrame(tick);}
 function wake(){lastStamp=0;if(!raf&&!disposed&&visible&&!document.hidden)raf=requestAnimationFrame(tick);}
 function setPlay(value:boolean){playing=value;play.replaceChildren(createIcon(value?'pause':'play'));play.setAttribute('aria-pressed',String(value));play.setAttribute('aria-label',value?'Pause animation':'Play animation');wake();}
 function controls(){const busy=baking||!!clip||!ready;root.querySelectorAll<HTMLButtonElement>('[data-action="png"],[data-action="jpg"]').forEach(b=>b.disabled=busy);mp4.disabled=busy||!videoCapable||!doc.background?.animated;form.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLButtonElement>('input,select,button').forEach(e=>e.disabled=!!clip);root.setAttribute('aria-busy',String(baking||!!clip));}
 function still(id:string):DecodedBackground {const preset=backgrounds.find(b=>b.id===id)!;const image=document.createElement('canvas');image.width=image.height=512;const c=image.getContext('2d')!;const g=c.createLinearGradient(0,0,512,512);g.addColorStop(0,preset.colorBack);g.addColorStop(1,preset.colorTint);c.fillStyle=g;c.fillRect(0,0,512,512);return {id,width:512,height:512,frames:[{image,delayMs:4000}],totalMs:4000,animated:false};}
 async function chooseBackground(id:string){requested=id;bake?.abort();if(baking)return;baking=true;controls();
  while(!disposed){const wanted=requested;const controller=new AbortController();bake=controller;say('Mixing the animated ink…');let next:DecodedBackground|null=null;
   try {next=await bakeShaderBackground(backgrounds.find(b=>b.id===wanted)!,{size:512,fps:16,durationMs:4000,blendMs:1000,signal:controller.signal});}
   catch(error){if(controller.signal.aborted){if(disposed)break;continue;}next=still(wanted);say('Animation is unavailable on this device. Your still print is ready to download.');}
   if(disposed||controller.signal.aborted||requested!==wanted){release(next);if(disposed)break;continue;}
   release(doc.background);doc.background=next;doc.backgroundId=wanted;time=0;lastFrame=-1;ready=true;capability.textContent=next.animated?(videoCapable?'MP4 is encoded on this device. A 4-second silent loop.':'PNG and JPG work here. A 4-second MP4 needs a compatible Chrome or Edge encoder.'):'Animation is unavailable here. PNG and JPG still prints are ready.';root.dataset.background=wanted;root.dataset.ready='true';draw();if(next.animated)say('Your print is ready. Make it yours, then take it away.');break;
  }
  bake=null;baking=false;controls();wake();
 }
 function syncWords(){const value=(id:string)=>form.querySelector<HTMLInputElement>(`[data-control="${id}"]`)!.value;doc.customTemplate={prefix:value('prefix'),headline:value('headline')};doc.eventName.text=value('event');doc.name.text=value('name');doc.title.text=value('detail');}
 function selected(selector:string,attr:string,value:string){root.querySelectorAll<HTMLElement>(selector).forEach(b=>b.setAttribute('aria-pressed',String(b.getAttribute(attr)===value)));}
 function download(blob:Blob,extension:string){if(disposed)return;const url=URL.createObjectURL(blob);downloads.add(url);const a=document.createElement('a');a.href=url;a.download=`studio-print.${extension}`;a.click();const timer=setTimeout(()=>{URL.revokeObjectURL(url);downloads.delete(url);downloadTimers.delete(timer);},1500);downloadTimers.add(timer);}
 async function imageExport(type:'png'|'jpg'){const exportTime=time;setPlay(false);draw();const {canvas:surface,ctx:context}=createExportCanvas();render(context,doc,exportTime);try {download(await canvasToBlob(surface,type==='png'?'image/png':'image/jpeg',.95),type);say(`${type.toUpperCase()} downloaded. 1080 × 1080 pixels, exactly this frame.`);}catch(error){say(error instanceof Error?error.message:'The image could not be encoded. Try another format.');}finally{surface.width=surface.height=0;}}
 async function videoExport(){clip=new AbortController();const signal=clip.signal;controls();progress.hidden=false;cancel.hidden=false;progress.value=0;say('Printing 120 frames locally…');try {const {exportMp4}=await import('./exportMp4');const blob=await exportMp4(doc,{signal,onProgress:(done,total)=>{progress.value=done/total*100;say(`Printing your loop · ${Math.round(done/total*100)}%`);}});if(!signal.aborted){download(blob,'mp4');say('MP4 downloaded. 4 seconds · 1080 × 1080 · silent loop.');}}catch(error){say(signal.aborted?'Clip cancelled. Your print is still here.':error instanceof Error?error.message:'This device could not encode the clip. PNG and JPG are ready.');}finally{clip=null;progress.hidden=true;cancel.hidden=true;controls();wake();}}
 root.addEventListener('input',event=>{const target=event.target as HTMLInputElement;if(!target.dataset.control||clip)return;switch(target.dataset.control){case 'time':time=Number(target.value);setPlay(false);break;case 'ink':doc.textColor=target.value;break;case 'font':doc.font=target.value as typeof doc.font;break;case 'scale':doc.headlineScale=Number(target.value)/100;root.querySelector('[data-scale]')!.textContent=`${target.value}%`;break;case 'role':{const preset=rolePresets.find(p=>p.id===target.value)!;doc.templateId=preset.id;form.querySelector<HTMLInputElement>('[data-control="prefix"]')!.value=preset.prefix;form.querySelector<HTMLInputElement>('[data-control="headline"]')!.value=preset.headline;syncWords();break;}default:doc.templateId='custom';form.querySelector<HTMLSelectElement>('[data-control="role"]')!.value='custom';syncWords();}draw();},{signal:scope.signal});
 root.addEventListener('click',event=>{const button=(event.target as Element).closest<HTMLButtonElement>('button');if(!button||button.disabled)return;if(button.dataset.background&&!clip){selected('[data-background]','data-background',button.dataset.background);void chooseBackground(button.dataset.background);return;}if(button.dataset.composition&&!clip){doc.composition=button.dataset.composition as typeof doc.composition;selected('[data-composition]','data-composition',doc.composition);draw();return;}switch(button.dataset.action){case 'return':canvas.scrollIntoView({behavior:'smooth',block:'center'});break;case 'play':setPlay(!playing);break;case 'png':void imageExport('png');break;case 'jpg':void imageExport('jpg');break;case 'mp4':void videoExport();break;case 'cancel':clip?.abort();break;case 'reset':{const background=doc.background;doc=createDoc();doc.background=background;form.reset();selected('[data-composition]','data-composition',doc.composition);selected('[data-background]','data-background',doc.backgroundId);root.querySelector('[data-scale]')!.textContent='100%';time=0;setPlay(true);draw();void chooseBackground(doc.backgroundId);break;}}},{signal:scope.signal});
 form.addEventListener('submit',e=>e.preventDefault(),{signal:scope.signal});
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.target===canvas)stageVisible=entry.isIntersecting;if(entry.target===form)formVisible=entry.isIntersecting;}visible=stageVisible||formVisible;mini.hidden=stageVisible||!formVisible;if(!visible){cancelAnimationFrame(raf);raf=0;}else wake();},{rootMargin:'0px'});observer.observe(canvas);observer.observe(form);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();},{signal:scope.signal});
 function dispose(){disposed=true;bake?.abort();clip?.abort();cancelAnimationFrame(raf);observer.disconnect();scope.abort();release(doc.background);doc.background=null;downloads.forEach(url=>URL.revokeObjectURL(url));downloadTimers.forEach(clearTimeout);canvas.width=canvas.height=0;miniCanvas.width=miniCanvas.height=0;}
 window.addEventListener('pagehide',event=>{if(!event.persisted)dispose();else{cancelAnimationFrame(raf);raf=0;}},{signal:scope.signal});window.addEventListener('pageshow',wake,{signal:scope.signal});
 void fontsReady().then(()=>{if(!disposed){draw();void chooseBackground(doc.backgroundId);}}).catch(()=>say('The local typefaces could not load. Reload to try again.'));
}
