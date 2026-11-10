(()=>{'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;if(!T||!App||!U||App.__upgrade56Installed)return;
App.__upgrade56Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade56-fixer';
const CACHE_TAG='u56-20261029';
const BUILD='upgrade56';
const $=id=>document.getElementById(id);
function stamp(){T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;const h=$('health-version');if(h)h.textContent=VERSION}
function isLegacyPronunciationQueue(item){
  if(String(item?.meta?.type||'')==='PRONUNCIATION_DICTIONARY_SYNC')return true;
  return Object.keys(item?.updates||{}).some(k=>String(k).replace(/^\//,'')===`${T.ROOT}/pronunciationDictionary`);
}
async function clearLegacyPronunciationQueue(){
  try{
    const removed=await T.Data?.removeQueuedWhere?.(isLegacyPronunciationQueue)||0;
    if(removed){
      try{const key='topkey_u52_pronunciation_sync_meta',old=JSON.parse(localStorage.getItem(key)||'{}')||{},raw=String(localStorage.getItem('topkey_u46_pronunciation')||'');localStorage.setItem(key,JSON.stringify({...old,pending:!!raw,syncError:'',fixer56ClearedQueueAt:Date.now(),fixer56ClearedQueueCount:removed}))}catch{}
      console.info(`Upgrade56 cleared ${removed} legacy pronunciation queue item(s)`);
    }
    return removed;
  }catch(e){console.warn('Upgrade56 queue cleanup',e);return 0}
}
function patchRetryButton(){
  const b=$('tk19-retry-queue');if(!b||b.__u56)return;b.__u56=true;b.textContent='↻ Retry queue Firebase';
  b.onclick=async()=>{try{const r=await T.Data.retryBlocked();const msg=T.Data.blocked?`${T.Data.blocked} thay đổi vẫn bị Firebase chặn`:T.Data.pending?`${T.Data.pending} thay đổi đang chờ đồng bộ`:'Queue Firebase đã sạch';U.toast(msg,T.Data.blocked?'err':'info');return r}catch(e){U.toast('Retry queue lỗi: '+(e?.message||e),'err')}};
}
function ensureFixerHealth(){
  const page=$('page-health');if(!page||$('tk56-fixer-health'))return;
  const card=document.createElement('div');card.id='tk56-fixer-health';card.className='card';card.style.marginTop='14px';
  card.innerHTML='<div class="split"><div><h3>🛠 Upgrade56 · Firebase Fixer</h3><p class="muted">Tách lỗi từ điển khỏi ghi điểm, chặn retry PERMISSION_DENIED vô hạn và đợi Firebase Auth khôi phục trước khi flush queue.</p></div><span class="pill">FIXER56</span></div><div class="grid g2"><div class="subcard"><b>Queue chờ</b><div id="tk56-pending" class="note">0</div></div><div class="subcard"><b>Queue bị chặn</b><div id="tk56-blocked" class="note">0</div></div></div><p class="note" style="margin-top:10px">Từ điển phát âm ưu tiên nhánh dùng chung; nếu Firebase Rules trên server còn bản trước Upgrade52, ADMIN tự chuyển sang nhánh dự phòng theo tournament.</p>';
  page.appendChild(card);
}
function renderFixerHealth(){ensureFixerHealth();const p=$('tk56-pending'),b=$('tk56-blocked');if(p)p.textContent=String(T.Data?.pending||0);if(b)b.textContent=String(T.Data?.blocked||0);patchRetryButton();stamp()}
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);renderFixerHealth();return out};
const baseAfterLogin=App.afterLogin?.bind(App);if(baseAfterLogin)App.afterLogin=async function(...args){
  const out=await baseAfterLogin(...args);stamp();
  await clearLegacyPronunciationQueue();
  try{await T.Data.flushQueue({source:'auth-restored',silent:true})}catch(e){console.warn('Upgrade56 post-login queue',e)}
  try{await window.TopkeyUpgrade52?.refreshNow?.(false)}catch(e){console.warn('Upgrade56 pronunciation refresh',e)}
  renderFixerHealth();return out;
};
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade56 SW',e)}}
function install(){stamp();setTimeout(()=>{stamp();renderFixerHealth();patchRetryButton()},0);setTimeout(()=>{stamp();renderFixerHealth()},1200);refreshSW()}
install();window.addEventListener('focus',()=>{stamp();renderFixerHealth();refreshSW()},{passive:true});
window.TopkeyUpgrade56={installed:true,VERSION,CACHE_TAG,BUILD,clearLegacyPronunciationQueue,isLegacyPronunciationQueue};
})();
