import {copyFileSync,cpSync,existsSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=join(root,'topkey');
const built=join(root,'next-ui','build');
const output=resolve(root,process.argv[2]||'dist-edgeone');

function ensure(path,reason){
 if(!existsSync(path))throw new Error(reason+': '+path);
}
function forbiddenOutput(target){
 return target===root||target===source||target===built||
  target.startsWith(source+'/')||target.startsWith(built+'/');
}
if(forbiddenOutput(output))throw new Error('Refusing to overwrite source or app build: '+output);
ensure(join(source,'index.html'),'Missing existing TOPKEY static site');
ensure(join(source,'edgeone.json'),'Missing existing EdgeOne configuration');
ensure(join(built,'200.html'),'SvelteKit must build a client-side fallback');
ensure(join(built,'_app'),'Missing SvelteKit static assets');
rmSync(output,{recursive:true,force:true});
mkdirSync(output,{recursive:true});
cpSync(source,output,{recursive:true});
cpSync(built,join(output,'next'),{recursive:true});
// adapter-static with ssr=false and prerender=false emits 200.html but no index.html.
// EdgeOne needs a physical index.html for /next/, so reuse the SPA fallback.
if(!existsSync(join(output,'next','index.html'))){
 copyFileSync(join(output,'next','200.html'),join(output,'next','index.html'));
}

const configPath=join(output,'edgeone.json');
const original=JSON.parse(readFileSync(configPath,'utf8'));
const nextRoutes=[
 {source:'/next/sports',destination:'/next/index.html'},
 {source:'/next/sports/*',destination:'/next/index.html'}
];
const rewrites=(original.rewrites||[]).filter(rule=>!nextRoutes.some(r=>r.source===rule.source));
original.rewrites=[...nextRoutes,...rewrites];
const existingHeaders=original.headers||[];
const nextCache={source:'/next/*',headers:[{key:'Cache-Control',value:'no-cache'}]};
original.headers=[...existingHeaders.filter(rule=>rule.source!==nextCache.source),nextCache];
writeFileSync(configPath,JSON.stringify(original,null,2)+'\n','utf8');
console.log(JSON.stringify({
 status:'staged',
 output,
 legacyEntry:join(output,'index.html'),
 nextEntry:join(output,'next/index.html'),
 nextFallback:join(output,'next/200.html'),
 routes:nextRoutes
},null,2));
