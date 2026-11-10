const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const root=path.resolve(__dirname,'..'),pkg=path.resolve(root,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),sw=read('sw.js'),auth=read('src/auth.js'),app=read('src/app.js'),u55=read('src/upgrade55.js'),u88=read('src/upgrade88.js'),u90=read('src/upgrade90.js'),u92=read('src/upgrade92.js');
const build=JSON.parse(read('build.json')),manifest=JSON.parse(fs.readFileSync(path.join(pkg,'TOPKEY_PACKAGE_MANIFEST.json'),'utf8')),rules=JSON.parse(read('firebase.database.rules.json'));
const currentNum=Number((String(build.build).match(/upgrade(\d+)/)||[])[1]||0);assert(currentNum>=92,'current build must remain >= Upgrade92 baseline');assert(/^u\d+-\d{8}$/.test(build.cacheTag),'numeric cache tag required');assert(build.version.includes(build.build),'version/build mismatch');
assert(html.includes("__TOPKEY_BOOT_BUILD='"+build.build+"'")&&html.includes("__TOPKEY_BOOT_CACHE='"+build.cacheTag+"'"),'boot build/cache mismatch');
assert(html.indexOf('src/upgrade90.js')<html.lastIndexOf('src/upgrade9'),'current stability layer must load after Upgrade90');
if(currentNum<109)assert(html.includes('upgrade88.css?v='+build.cacheTag)&&html.includes('src/upgrade88.js?v='+build.cacheTag),'legacy assets must use current numeric cache tag');else assert(html.includes('viewer.')&&html.includes('admin-core.'),'route-split builds supersede direct legacy asset tags');
assert(html.includes("location.hash.startsWith('#spectator')")&&html.includes('tk-public-spectator-boot #login-screen')&&html.includes('tk-public-spectator-boot #public-spectator{display:block!important}'),'spectator first-paint public surface guard missing');
assert(html.includes('n.hash=keepHash;location.replace(n.href)'),'bootstrap updater must preserve hash');
assert(u55.includes('next.hash=keepHash'),'U55 updater must preserve hash');
assert(auth.includes("const publicViewer=location.hash.startsWith('#spectator')")&&auth.includes('signInAnonymously()'),'anonymous spectator auth missing');
assert(auth.includes('if(initialUser?.isAnonymous)')&&auth.includes('signOut()'),'anonymous auth must never enter protected app without #spectator');
assert(auth.includes("role:'VIEWER'")&&auth.includes('T.App?.startSpectator?.()'),'anonymous viewer profile/start missing');
assert(app.includes('if(this.spectatorStarted)return')&&app.includes('spectatorOffs')&&app.includes('stopSpectator()'),'spectator listener idempotence missing');
assert(u88.includes('stream.getTracks().forEach(t=>pc.addTrack(t,stream))')&&!u88.includes('getUserMedia('),'shared camera WebRTC contract broken');
assert(u90.includes("T.Data.listen('commentary/'+c+'/latest'")&&u90.includes('speechSynthesis.speak(u)'),'viewer local BLV contract broken');
assert(u92.includes("BUILD='upgrade92'")&&u92.includes('purgeLegacyShell'),'Upgrade92 compatibility layer missing');
if(currentNum<95)assert(sw.includes('./src/upgrade92.js')&&sw.includes('./tests/upgrade92_full_regression.js'),'SW Upgrade92 baseline assets missing');else assert(sw.includes('const ASSETS='),'modern minimal SW asset shell missing');
assert(fs.existsSync(path.join(root,'reset-u92.html')),'legacy reset-u92 alias missing');
assert(manifest.badmintonBuild===build.build&&manifest.cacheTag===build.cacheTag,'root package manifest stale');
const wr=rules.rules.topkey_badminton_vnext_2026.tournaments['$tid'].webrtc;assert(String(wr['.read']).includes("sign_in_provider === 'anonymous'"),'anonymous WebRTC read missing');assert(!wr['.write'],'WebRTC root broad write forbidden');
assert(String(wr['$courtId'].sessions['$sid'].request['.write']).includes("newData.child('uid').val() === auth.uid"),'anonymous request UID scope missing');
assert(String(wr['$courtId'].sessions['$sid'].answer['.write']).includes('request/uid'),'viewer answer ownership missing');
// Static local asset integrity for HTML references.
for(const m of html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)){const rel=m[1].split('?')[0];if(rel.startsWith('./'))assert(fs.existsSync(path.join(root,rel)),`missing HTML asset ${rel}`)}
// SW asset integrity and uniqueness.
const am=sw.match(/const ASSETS=(\[[\s\S]*?\]);/);assert(am,'SW ASSETS missing');const assets=JSON.parse(am[1]);assert.strictEqual(new Set(assets).size,assets.length,'duplicate SW asset');for(const a of assets){if(a==='./')continue;assert(fs.existsSync(path.join(root,a.replace(/^\.\//,''))),`missing SW asset ${a}`)}
async function authScenario(initialUser,hash='#spectator'){
  const elements={};
  const makeEl=()=>{const set=new Set();return{classList:{add:x=>set.add(x),remove:x=>set.delete(x),contains:x=>set.has(x)}}};
  for(const id of ['app-shell','login-screen','public-spectator'])elements[id]=makeEl();
  const htmlSet=new Set();let cb=null,anonCalls=0,startCalls=0,signOutCalls=0;
  const authMock={currentUser:initialUser||null,onAuthStateChanged(fn){cb=fn;queueMicrotask(()=>fn(initialUser||null));},async signInAnonymously(){anonCalls++;const user={uid:'anon-u92',isAnonymous:true};this.currentUser=user;queueMicrotask(()=>cb?.(user));return{user}},async signOut(){signOutCalls++;this.currentUser=null}};
  const win={Topkey:{U:{toast(){}},ROLES:{VIEWER:[]},ROOT:'root',Data:{auth:authMock},App:{startSpectator(){startCalls++}}}};
  const ctx={window:win,document:{getElementById:id=>elements[id]||null,documentElement:{classList:{add:x=>htmlSet.add(x),remove:x=>htmlSet.delete(x)}}},location:{hash},console,queueMicrotask,setTimeout,clearTimeout,Promise,JSON,String,Object};
  vm.runInNewContext(auth,ctx);await win.Topkey.Auth.init();await new Promise(r=>setTimeout(r,0));
  if(hash.startsWith('#spectator')){assert(elements['login-screen'].classList.contains('hidden'),'spectator auth must hide login');assert(!elements['public-spectator'].classList.contains('hidden'),'spectator auth must show public viewer');assert(win.Topkey.Auth.profile?.role==='VIEWER','spectator role must be VIEWER');assert(startCalls>=1,'spectator must start');}
  else if(initialUser?.isAnonymous){assert(signOutCalls===1,'anonymous user outside spectator must sign out');assert(!elements['login-screen'].classList.contains('hidden'),'protected route must show login after anonymous sign-out');}
  return{anonCalls,signOutCalls,user:win.Topkey.Auth.user};
}
(async()=>{const fresh=await authScenario(null);assert.strictEqual(fresh.anonCalls,1,'fresh spectator must sign in anonymously once');assert(fresh.user?.isAnonymous,'fresh spectator anonymous user missing');const restored=await authScenario({uid:'anon-restored',isAnonymous:true});assert.strictEqual(restored.anonCalls,0,'F5 restored anonymous spectator must not re-sign-in');await authScenario({uid:'anon-leak',isAnonymous:true},'');console.log('upgrade92 full regression: PASS · public viewer/auth/F5 + protected-route anon isolation + build/cache + WebRTC/TURN shell + viewer BLV + rules + asset integrity + auth mock');})().catch(e=>{console.error(e);process.exitCode=1});
