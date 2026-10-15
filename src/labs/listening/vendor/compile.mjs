import ts from 'typescript';
import {readFileSync,writeFileSync} from 'node:fs';
const check=process.argv.includes('--check');
for(const name of ['Waveform','views']){
 const source=new URL(`./source/${name}.tsx.txt`,import.meta.url),target=new URL(`./components/${name}.js`,import.meta.url);
 const result=ts.transpileModule(readFileSync(source,'utf8'),{fileName:`${name}.tsx`,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,jsxImportSource:'react',removeComments:false,sourceMap:false}}).outputText;
 if(check){if(readFileSync(target,'utf8')!==result)throw new Error(`Compiled ${name} differs from retained source`);}else writeFileSync(target,result);
}
