const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
const code=scripts.find(x=>x.includes("contract:'STABLE_BOOTSTRAP_001'"));assert(code,'H33 bootstrap script not found');
function fakeFirebase(win){const apps=[];const authFn=()=>({currentUser:null,signInWithEmailAndPassword:async()=>({user:{uid:'u1'}}),onAuthStateChanged:()=>{}});const dbFn=()=>({ref:()=>({on:()=>{},once:async()=>({val:()=>null})})});win.firebase={apps,initializeApp(){apps.push({});return{}},app(){return{}},auth:authFn,database:dbFn};}
async function run(pub,{failCdnjs=false}={}){
 const requested=[];const listeners={};const win={__TOPKEY_IS_SPECTATOR:pub,__TOPKEY_ASSETS:{adminJs:'./assets/u122/admin-core.aaaaaaaaaaaa.js',viewerJs:'./assets/u122/viewer.bbbbbbbbbbbb.js'},addEventListener(n,f){(listeners[n]??=[]).push(f)}};
 const document={scripts:[],body:{appendChild(el){document.scripts.push(el);requested.push(el.src);queueMicrotask(()=>{if(failCdnjs&&el.src.includes('cdnjs.cloudflare.com'))return el.onerror?.();if(el.src.includes('firebase-app')){fakeFirebase(win)}else if(el.src.includes('firebase-auth')){if(!win.firebase)fakeFirebase(win)}else if(el.src.includes('firebase-database')){if(!win.firebase)fakeFirebase(win)}else if(el.src.includes('admin-core')){win.Topkey={Auth:{login:async()=>{}},App:{__staticBound:true}}}el.onload?.()})}},createElement(){return{dataset:{},src:'',async:false,onload:null,onerror:null,parentNode:{remove(){}},remove(){}}},getElementById(){return null},addEventListener(n,f){(listeners['doc:'+n]??=[]).push(f)}};
 const ctx={window:win,document,console,Error,Promise,queueMicrotask,setTimeout,clearTimeout,URL,location:{},speechSynthesis:null};win.window=win;vm.createContext(ctx);vm.runInContext(code,ctx);await new Promise(r=>setTimeout(r,80));return{requested,win};
}
(async()=>{
 const a=await run(false,{failCdnjs:true});assert(a.requested.some(x=>x.includes('cdnjs.cloudflare.com')),'primary CDN not attempted');assert(a.requested.some(x=>x.includes('gstatic.com')),'fallback CDN not attempted');assert(a.requested.some(x=>x.includes('upgrade73-preboot')),'admin preboot missing');assert(a.requested.some(x=>x.includes('admin-core')),'admin core missing');assert(a.win.__TOPKEY_BOOTSTRAP.state.core===true,'admin core not marked ready');
 const v=await run(true);assert(v.requested.some(x=>x.includes('viewer.')),'viewer bundle missing');assert(!v.requested.some(x=>x.includes('admin-core')),'viewer leaked admin core');
 console.log('PASS Hotfix33 bootstrap VM · CDN failover · route split');
})().catch(e=>{console.error(e);process.exit(1)});
