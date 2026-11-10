(()=>{
'use strict';
const VERSION='2026.11.04-vnext-upgrade122-hotfix47-withdrawal-legacy-recovery';
const CACHE_TAG='u122h47-20261104';
const T=()=>window.Topkey,A=()=>T()?.App,U=()=>T()?.U,$=id=>document.getElementById(id);
const SCORE_KINDS=new Set(['SCORE','BIG_LEAD','STREAK','LEAD_CHANGE','DEUCE','GAME_POINT','MATCH_POINT','COMEBACK']);
let installed=false,lastManualText='',lastManualAt=0,manualTimer=0,manualBusy=false;
function role(){try{return String(T()?.Auth?.role?.()||T()?.Auth?.profile?.role||'VIEWER').toUpperCase()}catch{return'VIEWER'}}
function operator(){return ['ADMIN','UMPIRE'].includes(role())}
function scoreKind(x){return SCORE_KINDS.has(String(x||'').toUpperCase())}

function h30AutoMode(){try{return localStorage.getItem('topkey_h30_commentary_mode')==='AUTO'}catch{return false}}
function clearScoreQueue({stopCurrent=true}={}){
  try{
    const E=window.TopkeyUpgrade46?.Engine;
    if(E?.queue)E.queue=E.queue.filter(x=>!scoreKind(x?.kind));
    if(stopCurrent&&E?.current&&scoreKind(E.current.kind)){
      try{speechSynthesis?.cancel?.()}catch{}
      try{window.TopkeyUpgrade47?.Piper?.stop?.()}catch{}
      E.speaking=false;E.current=null;
    }
  }catch{}
}
function patchEngine(){
  const E=window.TopkeyUpgrade46?.Engine;if(!E||E.__h29)return !!E;E.__h29=true;
  const baseEnqueue=E.enqueue?.bind(E);
  if(baseEnqueue)E.enqueue=function(item){
    const source=String(item?.source||'AUTO').toUpperCase();
    if(operator()&&!h30AutoMode()&&scoreKind(item?.kind)&&!source.includes('MANUAL'))return false;
    return baseEnqueue(item);
  };
  return true;
}
function patchCommentary(){
  const a=A();if(!a||a.__h29Comment)return !!a;a.__h29Comment=true;
  const baseComment=a.comment?.bind(a);
  if(baseComment)a.comment=async function(text,meta={}){
    const source=String(meta?.source||'AUTO').toUpperCase();
    const kind=String(meta?.kind||this.__u46PendingScoreMeta?.kind||'').toUpperCase();
    if(operator()&&!h30AutoMode()&&scoreKind(kind)&&!source.includes('MANUAL')){this.__u46PendingScoreMeta=null;return null;}
    return baseComment(text,meta);
  };
  const baseSpeak=a.speakCommentary?.bind(a);
  if(baseSpeak)a.speakCommentary=function(row){
    if(operator()&&!h30AutoMode()&&scoreKind(row?.kind))return false;
    return baseSpeak(row);
  };
  return true;
}
function currentScoreText(){
  const a=A(),s=a?.state?.activeMatches?.[a.currentCourt];if(!a||!s)return'';
  const m=a.state?.matches?.[s.matchId]||{},ta=a.state?.teams?.[m.teamAId]||{},tb=a.state?.teams?.[m.teamBId]||{},set=s.sets?.[Number(s.setIndex)||0]||{};
  return `${ta.name||'Đội A'} ${Number(set.a)||0}, ${tb.name||'Đội B'} ${Number(set.b)||0}.`;
}
async function manualSpeakLatest(){
  if(!operator()||manualBusy)return false;
  const h28=window.TopkeyUpgrade122Hotfix28,lastScore=Number(h28?.lastScoreAt?.()||0),quiet=Date.now()-lastScore;
  if(quiet<550){clearTimeout(manualTimer);manualTimer=setTimeout(manualSpeakLatest,570-quiet);return false;}
  const text=currentScoreText();if(!text)return U()?.toast?.('Chưa có trận đang chấm','info');
  if(text===lastManualText&&Date.now()-lastManualAt<1800)return false;
  clearScoreQueue({stopCurrent:true});manualBusy=true;lastManualText=text;lastManualAt=Date.now();
  const b=$('tk122h28-score-speak');if(b)b.disabled=true;
  let ok=false;
  try{ok=await window.TopkeyUpgrade122Hotfix20?.emergencySpeak?.(text)}catch{}
  if(!ok){try{ok=await window.TopkeyUpgrade122Hotfix11?.directSpeak?.(text,{manual:true,source:'H29_MANUAL'})}catch{}}
  manualBusy=false;if(b)b.disabled=false;
  if(!ok)U()?.toast?.('Không phát được tỷ số. Kiểm tra Audio/Piper trong Health.','err');
  return ok;
}
function cleanManualButton(){
  const old=$('tk122h28-score-speak');if(!old||old.dataset.h29==='1')return !!old;
  const b=old.cloneNode(true);b.dataset.h29='1';b.disabled=false;
  old.replaceWith(b);
  b.onclick=e=>{e.preventDefault();e.stopPropagation();clearTimeout(manualTimer);manualTimer=setTimeout(manualSpeakLatest,80)};
  return true;
}
function patchScore(){
  const a=A();if(!a||a.__h29Score)return !!a;a.__h29Score=true;
  const base=a.score?.bind(a);if(!base)return false;
  a.score=function(side,delta,...args){
    if(!h30AutoMode())clearScoreQueue({stopCurrent:true});
    const out=base(side,delta,...args);
    // A burst of point taps only updates the latest state; never speak intermediate score rows.
    Promise.resolve(out).finally(()=>{if(!h30AutoMode())clearScoreQueue({stopCurrent:false});cleanManualButton()});
    return out;
  };
  return true;
}
function stamp(){const t=T();if(t){t.VERSION=VERSION;t.CONFIG_VERSION=VERSION;t.RUNTIME_BUILD=VERSION}document.documentElement.dataset.topkeyBuild='upgrade122-hotfix36';const h=$('health-version');if(h)h.textContent=VERSION;}
function install(){if(installed)return;installed=true;patchEngine();patchCommentary();patchScore();cleanManualButton();clearScoreQueue({stopCurrent:false});stamp();
  window.addEventListener('topkey:admin-ready',()=>setTimeout(()=>{patchEngine();patchCommentary();patchScore();cleanManualButton();clearScoreQueue({stopCurrent:false});stamp()},30));
  document.addEventListener('fullscreenchange',()=>setTimeout(cleanManualButton,30));
  const page=$('page-umpire');if(page)new MutationObserver(()=>cleanManualButton()).observe(page,{childList:true,subtree:true});
  window.TopkeyUpgrade122Hotfix29={installed:true,VERSION,CACHE_TAG,clearScoreQueue,manualSpeakLatest};
}
let n=0,t=setInterval(()=>{if(A()&&window.TopkeyUpgrade122Hotfix28){clearInterval(t);install()}else if(++n>300)clearInterval(t)},50);
if(document.readyState!=='loading'&&A()&&window.TopkeyUpgrade122Hotfix28){clearInterval(t);install()}
})();
