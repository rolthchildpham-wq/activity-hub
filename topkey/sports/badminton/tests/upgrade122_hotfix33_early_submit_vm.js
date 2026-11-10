const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
const code=scripts.find(x=>x.includes("contract:'STABLE_BOOTSTRAP_001'"));assert(code,'H33 bootstrap script not found');
(async()=>{
 const docListeners={}; let signIns=0; let coreLoads=0;
 const win={__TOPKEY_IS_SPECTATOR:false,__TOPKEY_ASSETS:{adminJs:'./assets/u122/admin-core.test.js',viewerJs:'./assets/u122/viewer.test.js'},addEventListener(){}};
 const fakeAuth={currentUser:null,signInWithEmailAndPassword:async(e,p)=>{signIns++;assert.equal(e,'admin@example.com');assert.equal(p,'pw');return{user:{uid:'u1'}}},onAuthStateChanged(){}};
 const firebase={apps:[],initializeApp(){this.apps.push({});return{}},app(){return{}},auth:()=>fakeAuth,database:()=>({ref:()=>({on(){},once:async()=>({val:()=>null})})})};
 const document={scripts:[],head:{appendChild(){}},body:{appendChild(el){document.scripts.push(el);setTimeout(()=>{
   if(el.src.includes('firebase-app')) win.firebase=firebase;
   if(el.src.includes('admin-core')) {coreLoads++; win.Topkey={Auth:{login:async(e,p)=>fakeAuth.signInWithEmailAndPassword(e,p)},App:{__staticBound:true}};}
   el.onload?.();
 }, el.src.includes('admin-core')?35:2)}},createElement(){return{dataset:{},src:'',async:false,onload:null,onerror:null,parentNode:{remove(){}},remove(){}}},getElementById(){return null},addEventListener(n,f){(docListeners[n]??=[]).push(f)}};
 const ctx={window:win,document,console,Error,Promise,queueMicrotask,setTimeout,clearTimeout,URL,location:{},speechSynthesis:null}; win.window=win; vm.createContext(ctx); vm.runInContext(code,ctx);
 const btn={disabled:false,textContent:'Đăng nhập an toàn'};
 const form={id:'login-form',email:{value:'admin@example.com'},password:{value:'pw'},querySelector:()=>btn};
 const ev={target:form,preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true}};
 await Promise.all((docListeners.submit||[]).map(fn=>fn(ev)));
 await new Promise(r=>setTimeout(r,120));
 assert(ev.prevented && ev.stopped,'early submit was not exclusively intercepted');
 assert.equal(coreLoads,1,'admin core should load once');
 assert.equal(signIns,1,'signIn must fire exactly once');
 assert(win.__TOPKEY_BOOTSTRAP.state.core===true,'core readiness not recorded');
 console.log('PASS Hotfix33 early-submit VM · one core load · one signIn');
})().catch(e=>{console.error(e);process.exit(1)});
