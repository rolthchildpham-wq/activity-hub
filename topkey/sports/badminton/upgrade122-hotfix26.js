(()=>{
'use strict';
const VERSION='2026.11.04-vnext-upgrade122-hotfix47-withdrawal-legacy-recovery';
const TAG='u122h47-20261104';
const BTN_ID='tk122h6-fun-speak';
let lastFireAt=0,lastText='',observer=null,timer=0;
const $=id=>document.getElementById(id);
const U=()=>window.Topkey?.U;
function funText(){
  const p=$('tk122h6-fun-player'),q=$('tk122h6-fun-phrase'),o=p?.selectedOptions?.[0],raw=String(q?.value||'').trim();
  if(!o||!raw)return'';
  const address=o.dataset.address||o.dataset.name||'VĐV',pron=o.dataset.pronoun||'bạn';
  return /^\s*\{name\}/.test(raw)?raw.replace('{name}',address):`${address}, ${raw.replaceAll('{name}',pron).replace(/^./,c=>c.toLowerCase())}`;
}
async function fireOnce(){
  const now=Date.now(),text=funText();
  if(!text)return U()?.toast?.('Chọn VĐV và câu bình luận','info');
  // Reject accidental double taps / duplicate DOM events for the exact same sentence.
  if(now-lastFireAt<900&&text===lastText)return;
  lastFireAt=now;lastText=text;
  const b=$(BTN_ID);if(b){b.disabled=true;b.dataset.h26Busy='1'}
  try{
    const H=window.TopkeyUpgrade122Hotfix11;
    if(typeof H?.playFun==='function') await H.playFun();
    else if(typeof H?.directSpeak==='function'){
      let started=false;
      const ok=await H.directSpeak(text,{manual:true,onStart:()=>{started=true;U()?.toast?.('Đang phát bình luận vui','ok')}});
      if(!ok&&!started)U()?.toast?.('Không phát được âm thanh. Kiểm tra giọng Việt/Piper trên máy.','err');
    }
  }catch(e){console.warn('H26 commentary',e);U()?.toast?.('Không phát được bình luận: '+(e?.message||e),'err')}
  finally{const x=$(BTN_ID);if(x){x.disabled=false;delete x.dataset.h26Busy}}
}
function cleanBind(){
  const old=$(BTN_ID);if(!old)return false;
  if(old.dataset.h26==='1')return true;
  // cloneNode intentionally drops addEventListener handlers and property onclick handlers.
  // This removes the Hotfix6 + Hotfix11 double binding from the same button.
  const b=old.cloneNode(true);
  b.dataset.h26='1';
  b.dataset.h11='1'; // prevent Hotfix11 bindFun() from adding a second onclick.
  b.onclick=null;
  old.replaceWith(b);
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();fireOnce()},{capture:true});
  return true;
}
function install(){
  cleanBind();
  observer=new MutationObserver(()=>requestAnimationFrame(cleanBind));
  observer.observe(document.documentElement,{subtree:true,childList:true});
  window.addEventListener('topkey:admin-ready',()=>setTimeout(cleanBind,30));
  document.addEventListener('fullscreenchange',()=>setTimeout(cleanBind,30));
  window.TopkeyUpgrade122Hotfix26={installed:true,VERSION,TAG,cleanBind,fireOnce};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
