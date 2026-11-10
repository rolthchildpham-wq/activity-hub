(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U46=window.TopkeyUpgrade46,U47=window.TopkeyUpgrade47,U48=window.TopkeyUpgrade48,U72=window.TopkeyUpgrade72;
if(!T||!App||!U||!U46||!U47||!U48||!U72||App.__upgrade73Installed)return;
App.__upgrade73Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade73-latency-conflict-audit';
const CACHE_TAG='u73-20261029',BUILD='upgrade73';
const $=id=>document.getElementById(id),Piper=U47.Piper,Engine=U46.Engine;
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;

const perf={lastEventAt:0,lastSpeakAt:0,lastDoneAt:0,lastStartLatency:0,lastSynthMs:0,lastTotalMs:0,samples:[]};
function record(item,start){
  const eventAt=Number(item?.eventAt||item?.createdAt||Date.now()),done=Date.now(),lat=Number(Piper.lastStartLatency)||Math.max(0,done-eventAt),synth=Number(Piper.lastSynthMs)||0,total=Math.round(performance.now()-start);
  perf.lastEventAt=eventAt;perf.lastSpeakAt=done-lat;perf.lastDoneAt=done;perf.lastStartLatency=lat;perf.lastSynthMs=synth;perf.lastTotalMs=total;perf.samples.push({at:done,latency:lat,synth,total,kind:item?.kind||''});if(perf.samples.length>20)perf.samples.shift();renderPerf();
}
const basePiperSpeak=Piper.speak?.bind(Piper);
if(basePiperSpeak)Piper.speak=async function(text,item={}){const t=performance.now();try{return await basePiperSpeak(text,item)}finally{record(item,t)}};

function avg(key){const a=perf.samples.slice(-8).map(x=>Number(x[key])||0).filter(Boolean);return a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):0;}
function renderPerf(){
  const host=$('tk48-realtime');if(host){let row=$('tk73-latency-audit');if(!row){row=document.createElement('div');row.id='tk73-latency-audit';row.className='tk73-latency-audit';host.appendChild(row)}const lat=perf.lastStartLatency||Number(Piper.lastStartLatency)||0,synth=perf.lastSynthMs||Number(Piper.lastSynthMs)||0;row.dataset.state=lat>1800?'slow':lat>900?'warn':'ok';row.textContent=lat?`⚡ Độ trễ tiếng gần nhất: ${lat} ms · synth ${synth||'—'} ms · TB8 ${avg('latency')||lat} ms`:'⚡ Bộ đo độ trễ đã sẵn sàng.';}
}
function stamp(){
  T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h)h.textContent=VERSION;
  document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=VERSION);
  renderPerf();
}
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out;};
const baseShowTab=App.showTab?.bind(App);if(baseShowTab)App.showTab=function(tab,...args){const out=baseShowTab(tab,...args);if(tab==='umpire'||tab==='live')setTimeout(renderPerf,0);return out;};
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade73 SW refresh',e)}}
function install(){stamp();renderPerf();refreshSW();setTimeout(()=>{stamp();renderPerf()},80)}
install();window.addEventListener('focus',()=>{stamp();renderPerf();refreshSW()},{passive:true});
window.TopkeyUpgrade73={installed:true,VERSION,CACHE_TAG,BUILD,perf,renderPerf};
})();
