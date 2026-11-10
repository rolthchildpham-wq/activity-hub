(()=>{
'use strict';
const BUILD='upgrade122';
const CACHE_TAG='u122h33-20261103';
const VERSION='2026.11.03-vnext-upgrade122-hotfix33-stable-runtime';
const $=id=>document.getElementById(id);
let wrapped=false;
let checking=null;
let lastCheck=0;

window.__TOPKEY_EFFECTIVE_BUILD=BUILD;
window.__TOPKEY_EFFECTIVE_CACHE_TAG=CACHE_TAG;
window.__TOPKEY_EFFECTIVE_VERSION=VERSION;

function paint(){
  try{
    document.documentElement.dataset.topkeyBuild=BUILD;
    if(window.Topkey){
      window.Topkey.VERSION=VERSION;
      window.Topkey.CONFIG_VERSION=VERSION;
      window.Topkey.RUNTIME_BUILD=VERSION;
    }
  }catch{}
  const h=$('health-version'); if(h&&h.textContent!==VERSION) h.textContent=VERSION;
  const r=$('tk55-runtime-build'); if(r&&r.textContent!==VERSION) r.textContent=VERSION;
}

function installRenderAuthority(){
  const App=window.Topkey?.App;
  if(!App||wrapped)return false;
  wrapped=true;
  const base=typeof App.renderHealth==='function'?App.renderHealth.bind(App):null;
  App.renderHealth=function(...args){
    const out=base?base(...args):undefined;
    queueMicrotask(paint);
    return out;
  };
  paint();
  return true;
}

async function serverBuild(){
  const u=new URL('./build.json',location.href);
  u.searchParams.set('__topkey_probe',Date.now()+'_'+Math.random().toString(36).slice(2));
  const r=await fetch(u,{cache:'no-store',headers:{'Cache-Control':'no-cache, no-store, must-revalidate','Pragma':'no-cache'}});
  if(!r.ok)throw new Error('HTTP '+r.status);
  return r.json();
}

async function ensureLatest(force=false){
  if(checking)return checking;
  const now=Date.now();
  if(!force&&now-lastCheck<5000)return true;
  lastCheck=now;
  checking=(async()=>{
    paint();
    const st=$('tk55-update-state');
    try{
      const b=await serverBuild();
      const sv=String(b.version||b.build||'unknown');
      const ss=$('tk55-server-build'); if(ss)ss.textContent=sv;
      const same=String(b.cacheTag||'')===CACHE_TAG&&String(b.version||'')===VERSION;
      if(same){
        if(st)st.textContent='✓ Runtime và server đang cùng '+VERSION+'.';
        return true;
      }
      if(st)st.textContent='↻ Có bản mới trên server · đang chuyển sang bản mới…';
      // No sticky one-shot guard: use a short retry counter per target so a failed update cannot deadlock forever.
      const target=String(b.cacheTag||b.version||b.build||'latest');
      const key='topkey_h16_retry_'+target;
      const state=JSON.parse(sessionStorage.getItem(key)||'{"n":0,"t":0}');
      if(!force&&state.n>=2&&Date.now()-state.t<30000){
        if(st)st.textContent='⚠ Cập nhật chưa hoàn tất. Bấm “Kiểm tra bản mới” để thử lại ngay.';
        return false;
      }
      sessionStorage.setItem(key,JSON.stringify({n:(state.n||0)+1,t:Date.now()}));
      try{
        const regs=await navigator.serviceWorker?.getRegistrations?.()||[];
        await Promise.all(regs.filter(x=>String(x.scope||'').includes('/sports/badminton/')).map(x=>x.unregister().catch(()=>false)));
      }catch{}
      try{
        const keys=await caches.keys();
        await Promise.all(keys.filter(k=>!['topkey-piper-runtime-ort122-phonemize100','topkey-natural-crowd-public-domain-v1'].includes(k)&&(k.startsWith('topkey-vnext-')||k.startsWith('topkey-sports-hub-'))).map(k=>caches.delete(k)));
      }catch{}
      if('serviceWorker' in navigator&&location.protocol.startsWith('http')){
        try{
          const reg=await navigator.serviceWorker.register('./sw.js?v='+encodeURIComponent(target),{updateViaCache:'none'});
          await reg.update().catch(()=>{});
          const w=reg.waiting||reg.installing; if(w)try{w.postMessage({type:'SKIP_WAITING'})}catch{}
        }catch{}
      }
      const u=new URL(location.href);
      u.searchParams.set('__topkey_build',target);
      u.searchParams.set('__topkey_sync',Date.now().toString(36));
      location.replace(u.href);
      return false;
    }catch(e){
      if(st)st.textContent='Không kiểm tra được build server: '+(e?.message||e);
      return false;
    }
  })().finally(()=>{checking=null});
  return checking;
}

function install(){
  paint();
  installRenderAuthority();
  const btn=$('tk55-check-update'); if(btn)btn.onclick=()=>ensureLatest(true);
  setTimeout(()=>ensureLatest(false),700);
  // Low-frequency idempotent repaint only; no MutationObserver and no DOM feedback loop.
  setInterval(()=>{paint();installRenderAuthority()},3000);
  window.addEventListener('topkey:admin-ready',()=>{installRenderAuthority();paint();setTimeout(()=>ensureLatest(false),250)}, {passive:true});
  window.addEventListener('pageshow',()=>setTimeout(()=>ensureLatest(false),400),{passive:true});
  window.TopkeyUpgrade122Hotfix16={installed:true,BUILD,CACHE_TAG,VERSION,paint,ensureLatest};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
