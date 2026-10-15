import array,math,json,pathlib,wave,hashlib,os
if not os.environ.get('AUDIO_PROOF_DIR'):raise RuntimeError('Set AUDIO_PROOF_DIR; no default output location')
root=pathlib.Path(os.environ['AUDIO_PROOF_DIR']);rate=48000;frames=960;freqs=[330,440,550]
basis={f:([math.sin(2*math.pi*f*i/rate) for i in range(frames)],[math.cos(2*math.pi*f*i/rate) for i in range(frames)]) for f in freqs}
reports=[]
for path in sorted(root.glob('*.s16le')):
 raw=path.read_bytes();samples=array.array('h');samples.frombytes(raw[:len(raw)//4*4]);mono=[(samples[i]+samples[i+1])/65536 for i in range(0,len(samples),2)];segments=[];transients=[]
 with wave.open(str(path.with_suffix('.wav')),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate);w.writeframes(raw)
 for offset in range(0,len(mono)-frames+1,frames):
  x=mono[offset:offset+frames];energy=sum(v*v for v in x)
  if math.sqrt(energy/frames)<.001:continue
  correlations={}
  for f,(s,c) in basis.items():
   sd=sum(v*b for v,b in zip(x,s));cd=sum(v*b for v,b in zip(x,c));ss=sum(v*v for v in s);cc=sum(v*v for v in c);sc=sum(v*b for v,b in zip(s,c));fit=(cc*sd*sd-2*sc*sd*cd+ss*cd*cd)/(ss*cc-sc*sc);correlations[f]=min(1,math.sqrt(max(0,fit)/energy))
  frequency=max(correlations,key=correlations.get);corr=correlations[frequency]
  if corr<.8:transients.append({'seconds':offset/rate,'bestHz':frequency,'correlation':corr});continue
  if segments and segments[-1]['hz']==frequency and offset/rate-segments[-1]['end']<.041:segment=segments[-1];segment['end']=offset/rate+.02;segment['correlations'].append(corr)
  else:segments.append({'start':offset/rate,'end':offset/rate+.02,'hz':frequency,'correlations':[corr]})
 for segment in segments:
  values=segment.pop('correlations');segment['medianCorrelation']=sorted(values)[len(values)//2];center=(segment['start']+segment['end'])/2;n=min(4800,int((segment['end']-segment['start'])*rate));offset=max(0,int(center*rate)-n//2);x=mono[offset:offset+n];spectrum=[]
  for f in range(100,1001,10):
   sd=sum(v*math.sin(2*math.pi*f*i/rate) for i,v in enumerate(x));cd=sum(v*math.cos(2*math.pi*f*i/rate) for i,v in enumerate(x));spectrum.append({'hz':f,'amplitude':2*math.hypot(sd,cd)/len(x)})
  segment['fourierPeak']=max(spectrum,key=lambda v:v['amplitude']);segment['spectrum']=spectrum
 reports.append({'name':path.stem,'sampleFrames':len(mono),'peak':max(map(abs,mono),default=0),'sha256Raw':hashlib.sha256(raw).hexdigest(),'segments':segments,'lowerCorrelationWindows':transients})
checks=[]
def check(name,passed):checks.append({'name':name,'passed':bool(passed)})
for report in reports:
 name=report['name'];capture=json.loads((root/(name+'.json')).read_text());events=capture['events'];order=[s['hz'] for s in report['segments']]
 check(name+' captured real sample frames',report['sampleFrames']>48000)
 check(name+' no page/capture error',not capture['errors'] and not capture['captureErrors'])
 if name=='quiet':check('Fresh sample events remain digitally silent',report['peak']==0 and not any(e['kind'] in ['context-created','media-play'] for e in events) and capture['state']['audioArmed']=='false')
 else:
  check(name+' actual output order',order==([330] if name=='stop' else freqs));check(name+' trusted explicit intent',any(e['kind']=='listen-gesture' and e['trusted'] and e['active'] for e in events));check(name+' page stays enabled',capture['state']['audioArmed']=='true');check(name+' measured spectral peaks',[s['fourierPeak']['hz'] for s in report['segments']]==order)
  if name=='stop':check('Stop prevents queued later media playback',len([e for e in events if e['kind']=='media-play'])==1 and capture['state']['audioActive']=='false')
result={'method':'Actual portfolio candidate rendered from private Astro build, real unmodified PanelForge player, real trusted clicks and output captured through private Pulse null sink at 48kHz stereo PCM16. 20ms windows, RMS threshold .001, normalized phase-invariant sine correlation >.8. Fourier amplitude projections 100..1000Hz in 10Hz bins, centered windows up to 100ms. Complete lower-correlation windows retained. Digital-signal proof only; no physical/human audibility or gapless output claim.','checks':checks,'passed':sum(c['passed'] for c in checks),'total':len(checks),'signals':reports}
(root/'analysis.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'passed':result['passed'],'total':result['total'],'failures':[c for c in checks if not c['passed']],'orders':{r['name']:[s['hz'] for s in r['segments']] for r in reports}},indent=2))
