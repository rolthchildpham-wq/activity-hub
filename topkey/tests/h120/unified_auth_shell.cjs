const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const listeners=new Map();
const auth={currentUser:null};
const db={ref(){return {}}};
const firebase={
 apps:[{}],
 initializeApp(){},
 app(){return {name:'[DEFAULT]'}},
 auth(){return auth},
 database(){return db}
};
let createCount=0,initCount=0,attachCount=0,coreCount=0;
const Topkey={
 SPORT:{key:'badminton',name:'Cầu lông'},
 ROOT:'topkey_badminton_vnext_2026',
 AUTH_ROOT:'topkey_badminton_vnext_2026'
};
const document={
 scripts:[],head:{append(){}},readyState:'complete',
 createElement(){return {dataset:{},setAttribute(){},remove(){}}},
 getElementById(){return null},addEventListener(){}
};
const ctx={
 console,setTimeout,clearTimeout,URL,URLSearchParams,
 window:null,document,firebase,Topkey,
 location:{search:'',hash:'',href:'https://example.test/sports/badminton/index.html'},
 localStorage:{getItem(){return null},setItem(){},removeItem(){}},
 addEventListener(type,fn){const rows=listeners.get(type)||[];rows.push(fn);listeners.set(type,rows)},
 dispatchEvent(event){for(const fn of listeners.get(event.type)||[])fn(event);return true},
 CustomEvent:class CustomEvent{constructor(type,options={}){this.type=type;this.detail=options.detail}},
 TopkeySharedAuth:{create(T){
   createCount++;
   return {
    async init(){initCount++},
    async attachApp(){attachCount++},
    login:async()=>{},
    ensureAuth(){return T.Data.auth}
   };
  }}
};
ctx.window=ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('topkey-platform-core.js','utf8'),ctx,{filename:'topkey-platform-core.js'});

(async()=>{
 const controller=ctx.TopkeyPlatform.startSport({
  config:{apiKey:'x',databaseURL:'https://db.test'},
  async loadCore(){coreCount++;Topkey.App={afterLogin(){}};return Topkey}
 });
 assert(controller&&controller.ready&&controller.ensureCore,'startSport must return a shared controller');
 await controller.ready;
 assert.equal(createCount,1,'the auth service must be created once');
 assert.equal(initCount,1,'the auth observer must start once');
 assert.equal(coreCount,0,'signed-out boot must not download the business core');
 assert.equal(Topkey.Data.auth,auth,'the lightweight shell must own the Firebase auth instance');
 assert.equal(Topkey.Data.db,db,'the lightweight shell must own the Firebase database instance');

 const first=controller.ensureCore(),second=controller.ensureCore();
 assert.strictEqual(first,second,'concurrent hydration must share the same promise');
 await first;
 assert.equal(coreCount,1,'the business core must hydrate once');
 assert.equal(attachCount,1,'the verified auth service must attach the hydrated app once');

 ctx.dispatchEvent(new ctx.CustomEvent('topkey:admin-ready',{detail:{uid:'u1',sport:'badminton'}}));
 await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(coreCount,1,'admin-ready after hydration must not load the core again');
 console.log('H120_UNIFIED_AUTH_SHELL_OK');
})().catch(error=>{console.error(error);process.exitCode=1});
