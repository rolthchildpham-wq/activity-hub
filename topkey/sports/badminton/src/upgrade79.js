(() => {
'use strict';
const T=window.Topkey,App=T?.App,U77=window.TopkeyUpgrade77;if(!T||!App||!U77||App.__upgrade79Installed)return;
App.__upgrade79Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade79-ai-endpoint-root-fix';
const CACHE_TAG='u79-20261029',BUILD='upgrade79',AI_ENDPOINT='/api/ai-shuttle-analyze';
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);const h=document.getElementById('health-version');if(h)h.textContent=VERSION;return out};
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade79 SW refresh',e)}}
refreshSW();
window.TopkeyUpgrade79={installed:true,VERSION,CACHE_TAG,BUILD,AI_ENDPOINT};
})();
