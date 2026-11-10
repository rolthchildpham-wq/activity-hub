'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../..');
const platform=fs.readFileSync(path.join(ROOT,'topkey-platform-core.js'),'utf8');
const shared=fs.readFileSync(path.join(ROOT,'topkey-shared-auth.js'),'utf8');
const adapter=fs.readFileSync(path.join(ROOT,'sports/badminton/src/auth.js'),'utf8');
const guard=fs.readFileSync(path.join(ROOT,'topkey-hub-guard-core.js'),'utf8');
let checks=0;
const check=(v,msg)=>{assert(v,msg);checks++;console.log('PASS',msg)};
function node(hidden=false){const a=new Set(hidden?['hidden']:[]);return {hidden:false,classList:{add:x=>a.add(x),remove:x=>a.delete(x),contains:x=>a.has(x),toggle(x,on){on?a.add(x):a.delete(x)}},textContent:'',dataset:{},addEventListener(){}}}
function makeAuth({sport='badminton',initial='u1',profile=null,failReads=0}={}){
 const stats={signOut:0,signIn:0,reads:0,ready:0,afterLogin:0,redirects:[],invalidations:0,watchers:[],lastEvent:null};
 const users={u1:{uid:'u1',email:'a@invalid.test',isAnonymous:false},u2:{uid:'u2',email:'b@invalid.test',isAnonymous:false}};
 const profiles={u1:profile||{role:'ADMIN',active:true,displayName:'Administrator'},u2:{role:'VIEWER',active:true}};
 const elements={'app-shell':node(true),'login-screen':node(false),'auth-retry-profile':node(true),'topkey-auth-hint':node(false),'public-spectator':node(true)};
 const listeners=[];
 const auth={currentUser:users[initial]||null,onAuthStateChanged(cb){listeners.push(cb);Promise.resolve().then(()=>cb(this.currentUser));return()=>{}},async signInWithEmailAndPassword(){stats.signIn++;this.currentUser=users.u1;return{user:this.currentUser}},async signOut(){stats.signOut++;this.currentUser=null;for(const cb of listeners)Promise.resolve().then(()=>cb(null))},async setPersistence(){} };
 const db={ref(p){return {async once(){if(p.endsWith('/users/u1')||p.endsWith('/users/u2')){stats.reads++;if(failReads-->0)throw Error('network failure');return{val:()=>profiles[p.split('/').pop()]}}return{val:()=>({title:'ok'})}},on(event,cb){stats.watchers.push({p,cb})},off(){},limitToFirst(){return this}}}};
 const Topkey={ROOT:'topkey_'+sport+'_vnext_2026',AUTH_ROOT:'topkey_'+sport+'_vnext_2026',SPORT:{key:sport,name:sport},ROLES:{ADMIN:['overview'],BTC:['overview'],VIEWER:['overview'],UMPIRE:['overview']},U:{toast(){}},Data:{auth,db,tid:'__testlab_h118',ready:true},App:{offs:[],afterLogin(){stats.afterLogin++},applyRole(){},renderAll(){},subscribe(){},heartbeat(){}}};
 const sessionStorage={setItem(){},removeItem(){},getItem(){return null}};
 const context={Topkey,window:null,console,document:{readyState:'complete',getElementById:id=>elements[id]||null},location:{hash:'',search:'?tid=__testlab_h118',href:'https://example.test/sports/'+sport+'/index.html?tid=__testlab_h118',replace:url=>stats.redirects.push(url)},sessionStorage,localStorage:{setItem(){},getItem(){return''}},history:{replaceState(){}},URL,URLSearchParams,Date,Math,Promise,setTimeout,clearTimeout,CustomEvent:class CustomEvent{constructor(type,opt){this.type=type;this.detail=opt.detail}},firebase:{auth:{Auth:{Persistence:{LOCAL:'local'}}}},dispatchEvent(e){if(e.type==='topkey:admin-ready'){stats.ready++;stats.lastEvent=e.detail}},TopkeyHubSession:{adoptFirebaseUser(){},markAuthenticated(){},markLoggedOut(){},beginLogin(){},loginFailed(){},invalidate(){stats.invalidations++},normalizeSportScope:p=>p.sportScope||p.assignedSport||'',canProfileAccess:p=>p.active!==false&&p.status!=='DISABLED'&&(!p.sportScope||p.role==='ADMIN'||p.sportScope===sport)}};
 context.window=context;vm.createContext(context);vm.runInContext(platform,context);vm.runInContext(shared,context);vm.runInContext(adapter,context);
 return {stats,auth,profiles,context,service:Topkey.Auth,elements,listeners};
}
async function run(){
 const a=makeAuth();await a.service.init();
 check(a.stats.reads===1&&a.stats.ready===1&&a.stats.afterLogin===1,'Restored admin verifies one Firebase profile and starts app once');
 check(a.stats.signOut===0&&!a.elements['app-shell'].classList.contains('hidden'),'Restored admin never triggers redundant sign-out or login screen');
 check(a.stats.lastEvent.verified===true&&a.stats.lastEvent.sport==='badminton','Admin ready event requires a verified server-side role');
 await a.service._h108HandleState(a.auth.currentUser);
 check(a.stats.reads===1&&a.stats.ready===1,'Repeated auth state does not duplicate profile reads or ready event');
 await a.service._h108HandleState(null);
 check(a.stats.reads===1&&a.stats.ready===1,'Delayed stale null observer does not clear a live Firebase session');
 check(!a.elements['app-shell'].classList.contains('hidden')&&a.stats.signOut===0,'Stale null observer does not reopen login or sign out');
 const b=makeAuth({failReads:1});await b.service.init();
 check(b.stats.ready===0&&b.elements['app-shell'].classList.contains('hidden'),'Transient Firebase profile failure never grants access');
 await b.service.retryProfile();
 check(b.stats.reads===2&&b.stats.ready===1&&b.stats.signOut===0,'Retry reuses Firebase session without reloading, retyping password or signing out');
 const c=makeAuth({failReads:1});await c.service.init();await c.service.login('a@invalid.test','password');
 check(c.stats.signIn===1&&c.stats.reads===2&&c.stats.ready===1,'Same-UID login explicitly retries profile even without another auth-state event');
 const d=makeAuth({sport:'badminton',profile:{role:'BTC',sportScope:'volleyball',active:true}});await d.service.init();
 check(d.stats.ready===0&&d.stats.redirects.length===1,'Wrong-sport BTC is rejected before app-ready');
 check(d.stats.signOut===0,'Wrong-sport denial does not sign out other sport sessions');
 const e=makeAuth({sport:'volleyball',profile:{role:'BTC',sportScope:'volleyball',active:true}});await e.service.init();
 check(e.stats.ready===1&&e.stats.signOut===0,'Authorized BTC uses identical shared session logic in VNext sport');
 const f=makeAuth({profile:{role:'ADMIN',status:'DISABLED',active:true}});await f.service.init();
 check(f.stats.ready===0&&f.stats.redirects.length===1,'Disabled profile is rejected even when role says ADMIN');
 const g=makeAuth({profile:{role:'VIEWER',active:true}});await g.service.init();
 g.profiles.u1={role:'VIEWER',active:false};g.stats.watchers[0].cb({val:()=>g.profiles.u1});
 check(g.stats.ready===1&&g.stats.redirects.length===1,'Realtime permission revocation immediately closes the protected sport');
 const sports=['badminton','football','volleyball','running','shuttle','handmade','cooking'];
 for(const sport of sports){const x=makeAuth({sport});await x.service.init();check(x.stats.ready===1&&x.stats.signOut===0,`Shared verified login supports ${sport}`)}
 for(const f of ['sports/badminton/src/auth.js','sports/vnext/src/auth.js'])check(fs.readFileSync(path.join(ROOT,f),'utf8').includes('TopkeySharedAuth.create(T)'),`${f} references common implementation`);
 check(!fs.readFileSync(path.join(ROOT,'sports/badminton/assets/u122/admin-core.h85full.js'),'utf8').includes("window.__TOPKEY_ADMIN_READY=true;window.dispatchEvent(typeof CustomEvent==='function'?new CustomEvent('topkey:admin-ready')"),'Badminton core no longer fires premature admin-ready');
 function runGuard({sport='badminton',ticket='good',stored='good',publicHash='',onUrl=true}={}){
  const stats={redirect:[],store:new Map()};
  if(stored)stats.store.set('topkey_hub_session_v86',JSON.stringify({sport,nonce:stored,createdAt:Date.now(),touchedAt:Date.now(),phase:'SELECTED',build:'v'}));
  const search=onUrl?`?entry=hub&hubTicket=${ticket}&sport=${sport}&v=v`:`?sport=${sport}&v=v`;
  const ctx={window:null,document:{},console,Promise,setTimeout,clearTimeout,URL,URLSearchParams,Date,JSON,String,Number,Math,encodeURIComponent,location:{search,hash:publicHash,pathname:sport==='badminton'?'/sports/badminton/index.html':'/sports/vnext/index.html',replace:u=>stats.redirect.push(u)},sessionStorage:{getItem:k=>stats.store.get(k)||null,setItem:(k,v)=>stats.store.set(k,v),removeItem:k=>stats.store.delete(k)},TopkeyRelease:{cacheTag:'v'}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(platform,ctx);vm.runInContext(guard,ctx);vm.runInContext(fs.readFileSync(path.join(ROOT,'sports/badminton/hub-entry-guard.js'),'utf8'),ctx);return{ctx,stats};
 }
 const h=runGuard();check(h.ctx.__TOPKEY_HUB_ENTRY_VALID===true&&!h.stats.redirect.length,'Guard accepts an authentic Hub nonce');
 const i=runGuard({stored:'old',ticket:'forged'});check(i.stats.redirect.length===1&&!i.ctx.__TOPKEY_HUB_ENTRY_VALID,'Guard rejects mismatched Hub nonce instead of minting a new session');
 const j=runGuard({stored:null});check(j.stats.redirect.length===1,'Direct protected URL without Hub ticket is rejected');
 const k=runGuard({onUrl:false});check(k.ctx.__TOPKEY_HUB_ENTRY_VALID===true,'Browser refresh keeps a valid Hub session without resubmitting login');
 const l=runGuard({stored:null,publicHash:'#spectator'});check(l.ctx.__TOPKEY_HUB_ENTRY_VALID===true,'Public spectator route stays accessible without Hub session');
 const report={checks,pass:true,context:'Node vm with mocked Firebase/DOM (no production access)'};
 fs.writeFileSync(path.join(__dirname,'SHARED_AUTH_VM_RESULTS.json'),JSON.stringify(report,null,2)+'\n');
 console.log('H118_SHARED_AUTH_VM',checks+'/'+checks,'PASS');
}
run().catch(e=>{console.error('FAIL',e);process.exit(1)});
