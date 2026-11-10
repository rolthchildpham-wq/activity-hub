const fs=require('fs'),vm=require('vm'),assert=require('assert');
class Store{constructor(){this.m=new Map()}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}key(i){return [...this.m.keys()][i]||null}get length(){return this.m.size}}
function el(){return {textContent:'',title:'',onclick:null,dataset:{},classList:{add(){},remove(){},contains(){return false}},querySelector(){return null}}}
(async()=>{
 const els={};for(const id of ['health-version','tk55-runtime-build','tk55-server-build','tk55-update-state','tk55-check-update','tk-release-badge'])els[id]=el();
 const store=new Store();let replaced='';let server={build:'upgrade122',cacheTag:'u122h96-20261108',version:'2026.11.08-vnext-upgrade122-hotfix96-header-reference-layout'};
 const hubState={sport:'badminton',nonce:'n1',createdAt:Date.now(),touchedAt:Date.now(),phase:'AUTHENTICATED',authUid:'uid-admin',authenticatedAt:Date.now(),build:'u122h83-20261107'};
 const ctx={console,URL,URLSearchParams,Blob,Date,Math,Promise,setTimeout:(f)=>{f();return 1},clearTimeout(){},setInterval:(f)=>{f();return 1},clearInterval(){},sessionStorage:store,caches:{async keys(){return ['topkey-vnext-2026-old','topkey-firebase-sdk-9.23.0']},async delete(){return true}},navigator:{serviceWorker:{async register(){return {async update(){},waiting:null,installing:null}}}},location:{href:'https://topkey-activity-management.edgeone.dev/sports/badminton/index.html?sport=badminton',pathname:'/sports/badminton/index.html',search:'?sport=badminton',hash:'',replace(u){replaced=u}},document:{readyState:'complete',documentElement:{dataset:{}},getElementById(id){return els[id]||null},addEventListener(){}},fetch:async()=>({ok:true,async json(){return server}}),window:null};ctx.window=ctx;ctx.Topkey={Data:{auth:{currentUser:{uid:'uid-admin'}}},Auth:{user:{uid:'uid-admin'}}};ctx.window.Topkey=ctx.Topkey;ctx.window.TopkeyHubSession={sport:'badminton',read(){return hubState},write(s){Object.assign(hubState,s);return s}};ctx.window.TopkeyUpgrade55={checkServerBuild(){throw new Error('legacy updater should be replaced')}};ctx.window.addEventListener=()=>{};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('sports/badminton/upgrade122-hotfix85.js','utf8'),ctx);
 const V='2026.11.08-vnext-upgrade122-hotfix96-header-reference-layout';
 assert.equal(ctx.Topkey.VERSION,V);assert.equal(ctx.__TOPKEY_BOOT_VERSION,V);assert.equal(ctx.__TOPKEY_BOOT_CACHE,'u122h96-20261108');
 // legacy writers must no longer downgrade authority
 ctx.Topkey.VERSION='2026.10.29-vnext-featureparity15-upgrade55';ctx.__TOPKEY_BOOT_VERSION='2026.11.05-vnext-upgrade122-hotfix53';ctx.__TOPKEY_BOOT_CACHE='u122h53';ctx.TopkeyUpgrade122Hotfix85.stamp();
 assert.equal(ctx.Topkey.VERSION,V);assert.equal(ctx.__TOPKEY_BOOT_VERSION,V);assert.equal(ctx.__TOPKEY_BOOT_CACHE,'u122h96-20261108');
 replaced='';const same=await ctx.TopkeyUpgrade122Hotfix85.safeCheck({manual:true});assert.equal(same,true);assert.equal(replaced,'');assert(/Không reload/.test(els['tk55-update-state'].textContent));
 // Real newer server: one controlled reload, authenticated handoff is stored.
 server={build:'upgrade122-hotfix88',cacheTag:'u122h88-20261108',version:'2026.11.08-vnext-upgrade122-hotfix88-next'};replaced='';await ctx.TopkeyUpgrade122Hotfix85.safeCheck({manual:true});assert(replaced.includes('u122h88-20261108'));const h=JSON.parse(store.getItem('topkey_safe_update_handoff_v86'));assert.equal(h.uid,'uid-admin');assert.equal(h.sport,'badminton');assert.equal(hubState.phase,'AUTHENTICATED');assert.equal(hubState.authUid,'uid-admin');
 console.log('UPDATE_AUTHORITY_H92_OK');
})().catch(e=>{console.error(e);process.exit(1)});
