import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const here=dirname(fileURLToPath(import.meta.url));
const project=resolve(here,'../../../..');
const require=createRequire(import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const check=process.argv.includes('--check');
const expected={'audioRuntime.ts.txt':'768a72c288fd11807d64d2302798486cf5c020fa3760ce19bb0d7863e1dbf3b0','useWebAudioPlayer.ts.txt':'3b85ffbb132973703b23cc298cd32d059939c5576f2be891e042702fa0b74752'};
for(const [name,digest] of Object.entries(expected))if(sha(await readFile(resolve(here,'retained',name)))!==digest)throw new Error('Unmodified retained source hash mismatch: '+name);
for(const [pkg,version] of Object.entries({vue:'3.5.44',howler:'2.2.4',esbuild:'0.27.1'}))if(require(pkg+'/package.json').version!==version)throw new Error('Pin mismatch: '+pkg);
const target=resolve(here,'runtime.js');
const result=await build({absWorkingDir:project,entryPoints:[resolve(here,'entry.mjs')],outfile:target,bundle:true,minifySyntax:true,format:'esm',target:'es2022',platform:'browser',define:{'process.env.NODE_ENV':'"production"','__VUE_OPTIONS_API__':'false','__VUE_PROD_DEVTOOLS__':'false','__VUE_PROD_HYDRATION_MISMATCH_DETAILS__':'false'},write:false,metafile:true,legalComments:'eof',banner:{js:'// @ts-nocheck\n// Generated from hashed retained source by compile.mjs; see runtime.d.ts.'},alias:{'@/lib/audioRuntime':resolve(here,'retained/audioRuntime.ts.txt'),'@/lib/telemetry':resolve(here,'telemetry.ts')},plugins:[{name:'retained-typescript-bytes',setup(b){b.onLoad({filter:/\.ts\.txt$/},async args=>({contents:await readFile(args.path,'utf8'),loader:'ts',resolveDir:dirname(args.path)}));}}]});
const bytes=result.outputFiles[0].contents;
const owners=new Set(['vue','howler']);
for(const output of Object.values(result.metafile.outputs))for(const [input,detail] of Object.entries(output.inputs)){if(!detail.bytesInOutput)continue;const match=input.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/);if(match)owners.add(match[1]);}
let licenses='Audio intent sample - bundled dependency licenses\n';
for(const name of [...owners].sort()){
 const folder=dirname(require.resolve(name+'/package.json'));let text;
 for(const file of ['LICENSE','LICENSE.md','LICENSE.txt']){try{text=await readFile(resolve(folder,file),'utf8');break;}catch{}}
 if(!text)throw new Error('Missing dependency license: '+name);
 licenses+='\n\n'+name+' '+require(name+'/package.json').version+'\n'+text.trim()+'\n';
}
const provenance={sourceCommit:'93881d2eca613fde498e0933405cee3a07220a4c',status:'Unmodified retained source; ordered queue controls only',sourceSha256:expected,compiler:'esbuild 0.27.1; browser ESM ES2022; TypeScript loader; import aliases; production dependency flags and syntax folding',runtimeModuleSha256:sha(bytes),bundledDependencies:[...owners].sort(),dependencyLicenseSha256:sha(licenses)};
const outputs=new Map([[target,bytes],[resolve(here,'provenance.json'),JSON.stringify(provenance,null,2)+'\n'],[resolve(project,'public/media/audio-intent/licenses.txt'),licenses]]);
for(const [file,content] of outputs){if(check){if(!Buffer.from(await readFile(file)).equals(Buffer.from(content)))throw new Error('Compiled artifact differs: '+relative(project,file));}else{await mkdir(dirname(file),{recursive:true});await writeFile(file,content);}}
console.log(check?'Audio intent retained source and compiled artifacts match.':'Compiled unmodified audio intent source.');
