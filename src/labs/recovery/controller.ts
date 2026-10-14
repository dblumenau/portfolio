interface ClientEvent { action: string; seconds: number; }
interface EngineEvent { seconds: number; kind: string; event_type?: string; characters?: number; message?: string; }
interface Execution { client_events: ClientEvent[]; engine_events: EngineEvent[]; partial_answer: string; final_answer: string; checks: { partial_characters: number; recovered_characters: number; }; }
const root=document.querySelector<HTMLElement>('[data-recovery-lab]');
if(root){
  const data=JSON.parse(root.querySelector('#rl-data')!.textContent!) as Execution;
  const get=<T extends HTMLElement>(selector:string)=>root.querySelector<T>(selector)!;
  const eventTime=(name:string)=>data.client_events.find(e=>e.action===name)!.seconds;
  const disconnect=eventTime('disconnect'),retrieval=eventTime('retrieve_response');
  const stored=data.engine_events.find(e=>e.message?.includes('stored in Redis'))!.seconds;
  const detected=data.engine_events.find(e=>e.message?.includes('entering background mode'))!.seconds;
  const play=get<HTMLButtonElement>('[data-action="play"]'),recover=get<HTMLButtonElement>('[data-action="recover"]');
  const slider=get<HTMLInputElement>('[data-playhead]'),answer=get('[data-answer]');
  let time=0,playing=false,frame=0,last=0,lastPhase='',lastEventSignature='';
  const commas=(value:number)=>value.toLocaleString('en');
  function engineCount(){
    if(time>=stored)return data.checks.recovered_characters;
    const text=data.engine_events.filter(e=>e.event_type==='text'&&e.seconds<=time).at(-1);
    return text?.characters??0;
  }
  function render(){
    const offline=time>=disconnect,complete=time>=stored,retrieved=time>=retrieval;
    const phase=retrieved?'recovered':complete?'stored':offline?'disconnected':time>0?'connected':'ready';
    root!.dataset.phase=phase;root!.dataset.playing=String(playing);
    get('[data-clock]').textContent=`${time.toFixed(2)}s`;
    slider.value=String(time);
    play.firstChild!.textContent=playing?'Pause replay ':time>=stored?'Replay the task ':time>0?'Resume replay ':'Play the recorded task ';
    recover.disabled=!complete||retrieved;
    get('[data-action="disconnect"]').textContent=offline?'View disconnect again':'Jump to disconnect';
    get('[data-client-state]').textContent=retrieved?'Recovered':offline?'Disconnected':time>0?'Connected':'Ready';
    get('[data-engine-state]').textContent=complete?'Result stored':time>0?'Working':'Ready';
    const count=engineCount();
    get('[data-engine-count]').textContent=commas(count);
    const clientCount=retrieved?data.checks.recovered_characters:offline?data.checks.partial_characters:count;
    get('[data-mobile-client]').textContent=`${commas(clientCount)} characters`;
    get('[data-mobile-engine]').textContent=`${commas(count)} characters`;
    get('[data-mobile-client-state]').textContent=retrieved?'Recovered':offline?'Disconnected':'Connected';
    get('[data-mobile-engine-state]').textContent=complete?'Result stored':time>0?'Working':'Ready';
    get('[data-client-count]').textContent=`${commas(clientCount)} characters ${retrieved?'recovered':'received'}`;
    get('[data-client-route]').textContent=retrieved?'GET result / 200':offline?'SSE closed':'POST /stream';
    get('[data-machine-state]').textContent=complete?'Turn completed':offline?'Continues after disconnect':time>0?'Preparing the checklist':'Waiting for the task';
    get('[data-storage-state]').textContent=complete?'Final answer & timeline saved':time>0?'Turn still running':'Awaiting completion';
    get('[data-storage-code]').textContent=complete?'READY':time>0?'202':'—';
    get('[data-link-label]').textContent=retrieved?'GET / 200':offline?'SSE closed':'SSE';
    get('[data-freeze-note]').hidden=!offline||retrieved;
    get('[data-placeholder]').hidden=clientCount>0;
    const text=retrieved?data.final_answer:offline?data.partial_answer:data.final_answer.slice(0,count);
    answer.textContent=text.replace(/\*\*/g,'');
    // Keep the finishing artifact visible at recovery; earlier frames show its beginning.
    if(phase==='recovered'&&lastPhase!=='recovered')answer.scrollTop=answer.scrollHeight;
    if(phase!=='recovered'&&lastPhase==='recovered')answer.scrollTop=0;
    if(phase!==lastPhase){
      get('[data-status]').textContent=phase==='recovered'?'The answer arrived: 2,632 characters, the same final text, and two successful reads.':phase==='stored'?'The engine has finished. The full answer is stored; replay its retrieval to collect it.':phase==='disconnected'?'The browser freezes at 23 characters. Follow the engine as the same turn continues.':phase==='connected'?'The browser and engine share one turn. The recorded connection closes at 1.25 seconds.':'Start the replay, or jump to the moment the connection closed.';
    }
    const logs:Array<[number,string]>=[[0,'Subscription turn · no tools or MCP']];
    if(time>=disconnect)logs.push([disconnect,'Browser closes its actual transport']);
    if(time>=detected)logs.push([detected,'Engine detects disconnect · policy hold']);
    if(time>=eventTime('running_result_check'))logs.push([eventTime('running_result_check'),'Result route returns running · HTTP 202']);
    if(complete)logs.push([stored,'Final text & timeline stored in Redis']);
    if(retrieved)logs.push([retrieval,'Stored answer retrieved · HTTP 200']);
    const sig=logs.length.toString();
    if(sig!==lastEventSignature){
      const list=get<HTMLOListElement>('[data-events]');list.replaceChildren(...logs.map(([t,label])=>{const li=document.createElement('li');const stamp=document.createElement('time');stamp.textContent=`+${t.toFixed(2)}s`;li.append(stamp,document.createTextNode(label));return li;}));
      lastEventSignature=sig;
    }
    lastPhase=phase;
  }
  function reveal(){if(matchMedia('(max-width:700px)').matches)get('.rl-command').scrollIntoView({block:'start',behavior:'smooth'});}
  function stop(){playing=false;cancelAnimationFrame(frame);}
  function seek(next:number){stop();time=Math.max(0,Math.min(retrieval,next));render();}
  function tick(now:number){
    const delta=last?(now-last)/1000:0;last=now;time=Math.min(stored,time+delta);
    if(time>=stored)stop();render();if(playing)frame=requestAnimationFrame(tick);
  }
  function start(){playing=true;last=0;render();frame=requestAnimationFrame(tick);}
  play.addEventListener('click',()=>{if(playing){stop();render();}else{if(time>=stored)time=0;start();}reveal();});
  get('[data-action="disconnect"]').addEventListener('click',()=>{seek(disconnect);start();reveal();});
  recover.addEventListener('click',()=>{seek(retrieval);reveal();});
  get('[data-action="reset"]').addEventListener('click',()=>seek(0));
  slider.addEventListener('input',()=>seek(Number(slider.value)));
  root.querySelectorAll<HTMLButtonElement>('[data-seek]').forEach(button=>button.addEventListener('click',()=>{seek(Number(button.dataset.seek));reveal();}));
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing){stop();render();}});
  render();
}
