(() => {
'use strict';
const T=window.Topkey,App=T?.App;
if(!T||!App||App.__upgrade71Installed)return;
App.__upgrade71Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade71-set-history-strip';
const CACHE_TAG='u71-20261029',BUILD='upgrade71';
const $=id=>document.getElementById(id);

function rules(){return {...(T.DEFAULT_RULES||{}),...(App.state.config?.rules||{})};}
function esc(v){return App.escape?.(String(v??''))??String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function teamName(m,side){const id=side==='A'?m?.teamAId:m?.teamBId;return String(App.state.teams?.[id]?.name||`Đội ${side}`);}
function normalizedSet(x){if(!x)return null;return {a:Number(x.a)||0,b:Number(x.b)||0,finished:!!x.finished};}
function isCompleted(x){const s=normalizedSet(x);if(!s)return false;if(s.finished)return true;try{return !!T.Scoring?.isSetWon?.(s.a,s.b,rules());}catch{return false;}}
function setAt(s,m,index){const live=s?.sets?.[index],saved=m?.sets?.[index];if(isCompleted(live))return normalizedSet(live);if(isCompleted(saved))return normalizedSet(saved);return null;}
function completedHistory(s,m){
  const current=Math.max(0,Number(s?.setIndex)||0),rows=[];
  for(let i=0;i<=current;i++){
    let set=null;
    if(i===current){const live=normalizedSet(s?.sets?.[i]),saved=normalizedSet(m?.sets?.[i]);set=live?.finished?live:saved?.finished?saved:null;}
    else set=setAt(s,m,i);
    if(!set)continue;
    const winnerSide=set.a>set.b?'A':set.b>set.a?'B':'';if(!winnerSide)continue;
    rows.push({setNo:i+1,a:set.a,b:set.b,winnerSide,winnerName:teamName(m,winnerSide),loserName:teamName(m,winnerSide==='A'?'B':'A')});
  }
  return rows;
}
function historyText(s,m){return completedHistory(s,m).map(x=>`SET ${x.setNo}: ${x.winnerName} thắng ${x.a}–${x.b}`).join('  ·  ');}
function renderSetHistory(){
  const s=App.state.activeMatches?.[App.currentCourt],box=$('umpire-board');if(!s||!box)return;
  const m=App.state.matches?.[s.matchId];if(!m)return;
  let line=box.querySelector('.tk71-set-history');
  const rows=completedHistory(s,m);
  if(!rows.length){line?.remove();return;}
  if(!line){line=document.createElement('div');line.className='tk71-set-history';const head=box.querySelector('.score-head');(head||box).insertAdjacentElement(head?'afterend':'afterbegin',line);}
  line.setAttribute('aria-label','Kết quả các set đã hoàn thành');
  line.innerHTML=`<b>🏆 SET ĐÃ XONG</b><span class="tk71-set-chips">${rows.map(x=>`<span class="tk71-set-chip"><strong>SET ${x.setNo}</strong>: ${esc(x.winnerName)} thắng <em>${x.a}–${x.b}</em></span>`).join('')}</span>`;
}

const baseRender=App.renderUmpire?.bind(App);
if(baseRender)App.renderUmpire=function(...args){const out=baseRender(...args);renderSetHistory();return out;};

function stamp(){
  T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h)h.textContent=VERSION;
  document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=VERSION);
}
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out;};
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade71 SW refresh',e)}}
function install(){stamp();renderSetHistory();refreshSW();setTimeout(()=>{stamp();App.renderUmpire?.()},80)}
install();window.addEventListener('focus',()=>{stamp();App.renderUmpire?.();refreshSW()},{passive:true});
window.TopkeyUpgrade71={installed:true,VERSION,CACHE_TAG,BUILD,completedHistory,historyText,renderSetHistory};
})();
