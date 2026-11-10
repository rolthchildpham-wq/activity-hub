(() => {
'use strict';
const T=window.Topkey,App=T?.App,U46=window.TopkeyUpgrade46;
if(!T||!App||!U46?.Engine||App.__upgrade60Installed)return;
App.__upgrade60Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade60-score-first';
const CACHE_TAG='u60-20261029';
const BUILD='upgrade60';
const Engine=U46.Engine;

function scoreFirstPair(a,b,side,separator=' - '){
  a=Number(a)||0;b=Number(b)||0;
  if(a===b)return `${a} đều`;
  return String(side||'A').toUpperCase()==='B'?`${b}${separator}${a}`:`${a}${separator}${b}`;
}
function escapeRe(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function scorerFirstText(text,a,b,side){
  text=String(text||'');a=Number(a)||0;b=Number(b)||0;side=String(side||'A').toUpperCase();
  if(!text||a===b||side!=='B')return text;
  const A=escapeRe(a),B=escapeRe(b);
  // Upgrade46 full commentary uses hyphens; Upgrade48 realtime uses commas.
  // Replace only complete score pairs so names, set numbers and other figures are untouched.
  const pair=new RegExp(`(^|[^0-9])${A}\\s*([,\\-–—:])\\s*${B}(?=$|[^0-9])`,'g');
  return text.replace(pair,(all,prefix,sep)=>`${prefix}${b}${sep===','?', ':' - '}${a}`);
}

// Upgrade48 already wrapped composeScore for realtime wording. Patch the final composer
// so every transport (system voice / Piper / synced caption) receives scorer-first score order.
const baseCompose=Engine.composeScore.bind(Engine);
Engine.composeScore=function(m,result,side){
  const meta=baseCompose(m,result,side)||{};
  const a=Number(meta.after?.a??result?.after?.a??0),b=Number(meta.after?.b??result?.after?.b??0);
  meta.scoringSide=String(side||'A').toUpperCase();
  meta.scoringScore=meta.scoringSide==='B'?b:a;
  meta.opponentScore=meta.scoringSide==='B'?a:b;
  meta.scoreSpokenFirst=scoreFirstPair(a,b,meta.scoringSide,', ');
  meta.text=scorerFirstText(meta.text,a,b,meta.scoringSide);
  return meta;
};

function stamp(){
  T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;
  document.documentElement.dataset.topkeyBuild=BUILD;
  try{App.renderHealth?.()}catch{}
}
const baseHealth=App.renderHealth?.bind(App);
if(baseHealth)App.renderHealth=function(...args){
  const out=baseHealth(...args);
  try{T.U?.setText?.('health-version',VERSION)}catch{}
  document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=VERSION);
  return out;
};
async function refreshSW(){
  if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;
  try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade60 SW refresh',e)}
}
stamp();refreshSW();
window.addEventListener('focus',()=>{stamp();refreshSW()},{passive:true});
window.TopkeyUpgrade60={installed:true,VERSION,CACHE_TAG,BUILD,scoreFirstPair,scorerFirstText};
})();
