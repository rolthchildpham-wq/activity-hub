const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..');
function store(){let o={};return {getItem:k=>o[k]||null,setItem:(k,v)=>{o[k]=v},removeItem:k=>{delete o[k]}}}
function node(){const set=new Set(['hidden']);return{dataset:{},textContent:'',hidden:false,addEventListener(){},remove(){},querySelector(){return null},classList:{add:k=>set.add(k),remove:k=>set.delete(k),contains:k=>set.has(k),toggle:(k,v)=>v===true?set.add(k):v===false?set.delete(k):set.delete(k)},style:{}}}
const badBundle=fs.readFileSync(path.join(root,'sports/badminton/assets/u122/admin-core.h85full.js'),'utf8');
const a=badBundle.indexOf('/* SOURCE: ./src/auth.js */'),b=badBundle.indexOf('/* SOURCE: ./src/app.js */');assert(a>=0&&b>a);
const scripts={badminton:badBundle.slice(a,b),vnext:fs.readFileSync(path.join(root,'sports/vnext/src/auth.js'),'utf8')};
const sharedAuth=fs.readFileSync(path.join(root,'topkey-shared-auth.js'),'utf8');
const platform=fs.readFileSync(path.join(root,'topkey-platform-core.js'),'utf8');
async function check(sport,profile){
 const nodes={ 'app-shell':node(),'login-screen':node(),'public-spectator':node(),'public-register':node()};
 let callbacks=0,afterLogin=0,redirects=0;const user={uid:'uid-'+sport,email:'test@example.invalid',isAnonymous:false};
 const auth={currentUser:user,onAuthStateChanged(cb){callbacks++;Promise.resolve().then(()=>cb(user));return()=>{}},signOut:async()=>{},setPersistence:async()=>{}};
 const ref=()=>({once:async()=>{if(!profile)throw new Error('permission-denied');return{val:()=>profile}},on(){},off(){},limitToFirst(){return this}});
 const T={ROOT:'topkey_badminton_vnext_2026',AUTH_ROOT:'topkey_badminton_vnext_2026',SPORT:{key:sport,name:sport},DEFAULT_RULES:{},ROLES:{ADMIN:['overview'],BTC:['overview'],VIEWER:['overview']},U:{toast(){}},Data:{auth,db:{ref},tid:'__testlab_h108',flushQueue:async()=>{}},App:{afterLogin(){afterLogin++},applyRole(){},renderAll(){},subscribe(){},heartbeat(){}}};
 const location={pathname:'/sports/'+(sport==='badminton'?'badminton':'vnext')+'/index.html',hash:'',search:'?tid=__testlab_h108',href:'http://example.invalid/sports/'+sport+'/index.html',replace:()=>redirects++};
 const local=store();local.setItem('topkey_profile_'+user.uid,JSON.stringify({role:'ADMIN',active:true}));local.setItem('topkey_'+sport+'_profile_'+user.uid,JSON.stringify({role:'ADMIN',active:true}));
 const ctx={window:null,Topkey:T,localStorage:local,sessionStorage:store(),location,URL,URLSearchParams,console,Promise,Date,JSON,String,Math,Number,setTimeout,clearTimeout,queueMicrotask,encodeURIComponent,CustomEvent:class CustomEvent{constructor(type,options){this.type=type;this.detail=options?.detail}},dispatchEvent(){},document:{readyState:'complete',getElementById:id=>nodes[id]||(nodes[id]=node()),documentElement:{classList:node().classList}},firebase:{auth:{Auth:{Persistence:{LOCAL:'LOCAL'}}}}};
 ctx.window=ctx;ctx.TopkeyHubSession={needsFreshLogin:()=>false,markAuthenticated:()=>{},normalizeSportScope:p=>p.sportScope||'',canProfileAccess:p=>p.active!==false};
 vm.createContext(ctx);vm.runInContext(platform,ctx);vm.runInContext(sharedAuth,ctx);vm.runInContext(scripts[sport==='badminton'?'badminton':'vnext'],ctx);await ctx.Topkey.Auth.init();await new Promise(r=>setTimeout(r,35));await ctx.Topkey.Auth.init();
 assert.strictEqual(callbacks,1,'must attach exactly one auth observer');
 if(!profile){assert.strictEqual(ctx.Topkey.Auth._profileVerifiedUid,'');assert.strictEqual(afterLogin,0);assert(nodes['app-shell'].classList.contains('hidden'),'forged cached ADMIN must not open admin');}
 else{assert.strictEqual(ctx.Topkey.Auth._profileVerifiedUid,user.uid);assert(ctx.Topkey.Auth.profile.role==='ADMIN');assert(afterLogin>=1);}
 return {sport,hasProfile:!!profile,observerCount:callbacks,authorized:!!ctx.Topkey.Auth._profileVerifiedUid,afterLogin,redirects};
}
(async()=>{let results=[];for(const s of ['badminton','football']){results.push(await check(s,null));results.push(await check(s,{role:'ADMIN',active:true}))}console.log('PASS H108 auth live-profile-only & single-observer',JSON.stringify(results));fs.writeFileSync(path.join(root,'H108_AUTH_SECURITY_TEST.json'),JSON.stringify({results,pass:true},null,2));})().catch(e=>{console.error(e);process.exit(1)});
