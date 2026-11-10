(()=>{'use strict';
const BUILD=window.TopkeyRelease?.cacheTag||'',VERSION=window.TopkeyRelease?.version||'',SPORT=(location.pathname.toLowerCase().includes('/badminton/')?'badminton':String(window.TopkeyHubSession?.sport||new URLSearchParams(location.search).get('sport')||'')),T=window.Topkey=window.Topkey||{},HANDOFF='topkey_safe_update_handoff_v86';
const $=id=>document.getElementById(id);
function pin(obj,key,value){try{Object.defineProperty(obj,key,{configurable:true,enumerable:true,get(){return value},set(_){}})}catch{try{obj[key]=value}catch{}}}
function pinAuthority(){pin(T,'VERSION',VERSION);pin(T,'CONFIG_VERSION',VERSION);pin(T,'RUNTIME_BUILD',VERSION);pin(window,'__TOPKEY_BOOT_VERSION',VERSION);pin(window,'__TOPKEY_BOOT_CACHE',BUILD);document.documentElement.dataset.topkeyBuild=window.TopkeyRelease?.build||'unknown'}
function setHealth(server,state){const h=$('health-version'),r=$('tk55-runtime-build'),s=$('tk55-server-build'),st=$('tk55-update-state');if(h)h.textContent=VERSION;if(r)r.textContent=VERSION;if(s&&server)s.textContent=server;if(st&&state)st.textContent=state;const b=$('tk-release-badge');if(b)b.textContent='H109 · RELEASE STABILITY'}
function patchButton(){const b=$('tk55-check-update');if(!b)return false;b.textContent='↻ Kiểm tra bản mới';b.title='Kiểm tra build server; không reload nếu server đã cùng phiên bản hiện tại và giữ phiên đăng nhập khi cập nhật';b.onclick=()=>safeCheck({manual:true});return true}
function stamp(){pinAuthority();setHealth();patchButton()}
async function fetchBuild(){const u=new URL('./build.json',location.href);u.searchParams.set('__topkey_probe',Date.now()+'_'+Math.random().toString(36).slice(2));const r=await fetch(u,{cache:'no-store',headers:{'Cache-Control':'no-cache, no-store, must-revalidate','Pragma':'no-cache'}});if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}
function currentHub(){try{return window.TopkeyHubSession?.read?.()||null}catch{return null}}
function prepareHandoff(){try{const user=T.Data?.auth?.currentUser||T.Auth?.user||null,hub=currentHub(),uid=String(user?.uid||hub?.authUid||'');const sport=String(window.TopkeyHubSession?.sport||SPORT||hub?.sport||'badminton');if(hub&&uid){const next={...hub,sport,phase:'AUTHENTICATED',authUid:uid,authenticatedAt:Number(hub.authenticatedAt||Date.now()),touchedAt:Date.now(),build:BUILD};try{window.TopkeyHubSession?.write?.(next)}catch{}sessionStorage.setItem(HANDOFF,JSON.stringify({uid,sport,at:Date.now(),hub:next}))}return {uid,sport}}catch{return {uid:'',sport:SPORT}}}

async function verifiedRelease(data){
 const version=String(data?.version||''),tag=String(data?.cacheTag||'');
 if(!version||!tag)return false;
 const paths=['../../release.json','../../sports/badminton/build.json','../../sports/vnext/build.json'];
 const snapshots=await Promise.all(paths.map(async path=>{
  const u=new URL(path,location.href);u.searchParams.set('__topkey_verify',String(Date.now()));
  const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw new Error('Manifest '+path+' HTTP '+r.status);
  return r.json();
 }));
 return snapshots.every(x=>String(x?.cacheTag||'')===tag&&String(x?.version||'')===version);
}
function offerUpdate(data){
 const c=$('tk55-check-update');if(!c)return;
 let b=$('tk103-apply-update');
 if(!b){b=document.createElement('button');b.id='tk103-apply-update';b.className='btn mini';b.type='button';b.textContent='Áp dụng cập nhật';c.insertAdjacentElement('afterend',b)}
 b.hidden=false;b.disabled=false;
 b.onclick=async()=>{
  if(b.disabled)return;b.disabled=true;
  try{
   if(!await verifiedRelease(data)){setHealth(data.version,'Hub, Cầu lông và VNext chưa đồng bộ phiên bản. Không tải lại.');return}
   if(typeof confirm==='function'&&!confirm('Các thành phần đã đồng bộ. Áp dụng bản mới và tải lại trang môn này?'))return;
   await controlledReload(data);
  }catch(e){setHealth(data.version,'Không kiểm tra được phiên bản: '+String(e?.message||e))}
  finally{b.disabled=false}
 };
}

async function controlledReload(data){const hand=prepareHandoff();setHealth(data.version||data.build,'Có build mới · đang cập nhật có bảo toàn phiên đăng nhập…');try{if('serviceWorker'in navigator){const reg=await navigator.serviceWorker.register('./sw.js?v='+encodeURIComponent(data.cacheTag||Date.now())+'&_='+Date.now(),{updateViaCache:'none'});try{await reg.update()}catch{};try{reg.waiting?.postMessage({type:'SKIP_WAITING'})}catch{};try{reg.installing?.postMessage({type:'SKIP_WAITING'})}catch{}}}catch(e){console.warn('H88 SW update',e)}
try{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('topkey-vnext-')&&!k.includes('firebase')&&!k.includes('piper')).map(k=>caches.delete(k)))}catch{}
const u=new URL(location.href);u.searchParams.delete('v');u.searchParams.delete('__topkey_build');u.searchParams.set('__topkey_reload',String(Date.now()));if(hand.sport)u.searchParams.set('sport',hand.sport);location.replace(u.href);return true}
async function safeCheck({manual=false}={}){stamp();setHealth('Đang kiểm tra…',manual?'Đang kiểm tra build server, phiên đăng nhập sẽ được giữ nguyên…':'Đang kiểm tra build server…');try{const data=await fetchBuild(),sv=String(data.version||''),st=String(data.cacheTag||''),same=sv===VERSION&&st===BUILD;if(same){const apply=$('tk103-apply-update');if(apply)apply.hidden=true;setHealth(sv,'✓ Runtime và server cùng phiên bản hiện tại. Không tải lại; phiên đăng nhập được giữ nguyên.');return true}setHealth(sv,'Có build mới trên server. '+(manual?'Đang cập nhật có bảo toàn phiên…':'Không tự reload để bảo toàn phiên đăng nhập.'));if(manual)offerUpdate(data);return false}catch(e){setHealth('Không đọc được','Không kiểm tra được build server: '+(e?.message||e));return false}}
function patchLegacy(){for(const k of Object.keys(window)){if(!/^Topkey(?:Upgrade\d+|Runtime\d+)$/.test(k))continue;let x;try{x=window[k]}catch{continue}if(!x||typeof x!=='object')continue;if(typeof x.enforceVersion==='function')x.enforceVersion=stamp;if(typeof x.enforce==='function')x.enforce=stamp;for(const n of Object.keys(x))if(/^checkServerBuild\d*$/.test(n))x[n]=safeCheck}if(window.TopkeyUpgrade55)window.TopkeyUpgrade55.checkServerBuild=({manual=false}={})=>safeCheck({manual:!!manual});patchButton()}
function settle(){stamp();patchLegacy()}
settle();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',settle,{once:true});[200,600,1600,4000].forEach(ms=>setTimeout(settle,ms));window.addEventListener('focus',()=>setTimeout(settle,0),{passive:true});window.addEventListener('pageshow',()=>setTimeout(settle,0),{passive:true});
window.TopkeyUpgrade122Hotfix85={BUILD,VERSION,HANDOFF,stamp,safeCheck,controlledReload,prepareHandoff,patchLegacy};
})();