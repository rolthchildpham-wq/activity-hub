(()=>{
'use strict';
const CURRENT_VERSION='2026.11.04-vnext-upgrade122-hotfix47-withdrawal-legacy-recovery';
const CURRENT_BUILD='upgrade122';
const CURRENT_CACHE_TAG='u122h47-20261104';
const KEEP_CACHES=new Set(['topkey-piper-runtime-ort122-phonemize100','topkey-natural-crowd-public-domain-v1']);
const $=id=>document.getElementById(id);
let healPromise=null;
let lastHealAt=0;
window.__TOPKEY_EFFECTIVE_VERSION=CURRENT_VERSION;
window.__TOPKEY_EFFECTIVE_BUILD=CURRENT_BUILD;
window.__TOPKEY_EFFECTIVE_CACHE_TAG=CURRENT_CACHE_TAG;
function setText(el,value){ if(el && el.textContent!==value) el.textContent=value; }
function paintRuntime(){
  if(document.documentElement.dataset.topkeyBuild!==CURRENT_BUILD) document.documentElement.dataset.topkeyBuild=CURRENT_BUILD;
  setText($('health-version'),CURRENT_VERSION);
  setText($('tk55-runtime-build'),CURRENT_VERSION);
}
async function readServerBuild(){
  const u=new URL('./build.json',location.href);
  u.searchParams.set('__topkey_probe',Date.now()+'_'+Math.random().toString(36).slice(2));
  const res=await fetch(u,{cache:'no-store',headers:{'Cache-Control':'no-cache, no-store, must-revalidate','Pragma':'no-cache'}});
  if(!res.ok)throw new Error('HTTP '+res.status);
  return res.json();
}
function sameBuild(x){return String(x?.cacheTag||'')===CURRENT_CACHE_TAG && String(x?.version||'')===CURRENT_VERSION;}
async function purgeBadmintonRuntime(){
  try{
    const regs=await navigator.serviceWorker?.getRegistrations?.()||[];
    await Promise.all(regs.filter(r=>String(r.scope||'').includes('/sports/badminton/')).map(r=>r.unregister().catch(()=>false)));
  }catch{}
  try{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>!KEEP_CACHES.has(k)&&(k.startsWith('topkey-vnext-')||k.startsWith('topkey-sports-hub-'))).map(k=>caches.delete(k)));
  }catch{}
}
async function forceLatestSW(server){
  if(!('serviceWorker' in navigator)||!location.protocol.startsWith('http'))return;
  try{
    const v=encodeURIComponent(String(server?.cacheTag||CURRENT_CACHE_TAG));
    const reg=await navigator.serviceWorker.register('./sw.js?v='+v,{updateViaCache:'none'});
    await reg.update().catch(()=>{});
    const waiting=reg.waiting||reg.installing;
    if(waiting)try{waiting.postMessage({type:'SKIP_WAITING'})}catch{}
  }catch(e){console.warn('TOPKEY self-heal SW',e)}
}
async function _heal(opts={}){
  paintRuntime();
  const st=$('tk55-update-state');
  try{
    const server=await readServerBuild();
    setText($('tk55-server-build'),server.version||server.build||'unknown');
    if(sameBuild(server)){
      setText(st,'✓ Runtime và server đang cùng bản mới nhất.');
      if(opts.force) await forceLatestSW(server);
      return true;
    }
    setText(st,'↻ Phát hiện runtime cũ · đang tự đồng bộ bản mới…');
    const serverKey=String(server.cacheTag||server.version||server.build||'latest');
    const guard='topkey_autoheal_'+serverKey;
    if(sessionStorage.getItem(guard)==='1'&&!opts.force){
      setText(st,'Runtime vẫn lệch sau lần tự cập nhật. Bấm “Kiểm tra bản mới” để thử lại.');
      return false;
    }
    sessionStorage.setItem(guard,'1');
    await purgeBadmintonRuntime();
    await forceLatestSW(server);
    const u=new URL(location.href);
    u.searchParams.set('__topkey_build',server.cacheTag||server.build||Date.now());
    u.searchParams.set('__topkey_sync','1');
    location.replace(u.href);
    return false;
  }catch(e){
    setText(st,'Không kiểm tra được bản server: '+(e?.message||e));
    return false;
  }
}
function healIfNeeded(opts={}){
  const now=Date.now();
  if(!opts.force && now-lastHealAt<5000) return healPromise||Promise.resolve(true);
  if(healPromise) return healPromise;
  lastHealAt=now;
  healPromise=_heal(opts).finally(()=>{healPromise=null;});
  return healPromise;
}
function install(){
  paintRuntime();
  const btn=$('tk55-check-update');
  if(btn)btn.onclick=()=>healIfNeeded({force:true});
  setTimeout(()=>healIfNeeded(),1200);
  // One-shot repaint only; no MutationObserver loop.
  setTimeout(paintRuntime,2500);
  let focusTimer=0;
  const scheduleHeal=()=>{clearTimeout(focusTimer);focusTimer=setTimeout(()=>{paintRuntime();healIfNeeded().catch(()=>{})},800)};
  window.addEventListener('focus',scheduleHeal,{passive:true});
  window.addEventListener('pageshow',scheduleHeal,{passive:true});
  window.TopkeyUpgrade122Hotfix5={installed:true,CURRENT_VERSION,CURRENT_BUILD,CURRENT_CACHE_TAG,healIfNeeded,purgeBadmintonRuntime};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
