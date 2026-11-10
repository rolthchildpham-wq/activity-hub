(()=>{
'use strict';
const T=window.Topkey,App=T?.App,U105=window.TopkeyUpgrade105;
if(!T||!App||!T.Data||App.__upgrade113Installed)return;App.__upgrade113Installed=true;
const VERSION='2026.10.31-vnext-featureparity15-upgrade113-atomic-score-pipeline',BUILD='upgrade113',CACHE_TAG='u113-20261031';
const $=id=>document.getElementById(id);
const S={pending:new Map(),joined:0,scoreOnly:0,lastJoinMs:0,lastCourt:'',lastCommentId:'',contracts:['ATOMIC_SCORE_PIPELINE_001']};
const scoreCourt=updates=>{for(const k of Object.keys(updates||{})){const m=String(k).match(/\/activeMatches\/([^/]+)$/);if(m)return m[1]}return''};
const scoreEvent=updates=>Object.entries(updates||{}).find(([k,v])=>/\/events\/[^/]+\/[^/]+$/.test(String(k))&&v&&typeof v==='object')?.[1]||null;
const commentaryEntry=updates=>Object.entries(updates||{}).find(([k,v])=>/\/commentary\/[^/]+\/latest$/.test(String(k))&&v&&typeof v==='object')||null;
const commentaryCourt=key=>{const m=String(key||'').match(/\/commentary\/([^/]+)\/latest$/);return m?.[1]||''};
const baseQueueMulti=T.Data.queueMulti.bind(T.Data);
function finalize(p,reason){
  if(!p||p.done)return p?.promise;p.done=true;S.pending.delete(p.court);
  if(reason==='commentary'){S.joined++;S.lastJoinMs=Math.max(0,Math.round((performance?.now?.()||Date.now())-p.t0))}
  else S.scoreOnly++;
  renderHealth();
  Promise.resolve().then(()=>baseQueueMulti(p.updates,{...p.meta,atomicScore:true,atomicCommentary:reason==='commentary'})).then(p.resolve,p.reject);
  return p.promise;
}
if(!T.Data.__u113AtomicScore){
  T.Data.__u113AtomicScore=true;
  T.Data.queueMulti=function(updates,meta={}){
    const type=String(meta?.type||'');
    if(type==='SCORE'){
      const court=scoreCourt(updates),evt=scoreEvent(updates);
      if(!court||String(evt?.type||'')!=='POINT_AWARDED')return baseQueueMulti(updates,meta);
      const old=S.pending.get(court);if(old&&!old.done)finalize(old,'superseded');
      let resolve,reject;const promise=new Promise((res,rej)=>{resolve=res;reject=rej});
      const p={court,updates:{...(updates||{})},meta:{...meta},evt,t0:performance?.now?.()||Date.now(),promise,resolve,reject,done:false};
      S.pending.set(court,p);S.lastCourt=court;
      Promise.resolve().then(()=>{if(!p.done)finalize(p,'no-commentary')});
      return promise;
    }
    const c=commentaryEntry(updates);
    if(c){
      const [key,row]=c,court=commentaryCourt(key),p=S.pending.get(court);
      if(p&&!p.done){
        Object.assign(p.updates,updates||{});p.meta={...p.meta,commentaryId:row?.id||'',commentaryKind:row?.kind||'SCORE'};S.lastCommentId=row?.id||'';
        return finalize(p,'commentary');
      }
    }
    return baseQueueMulti(updates,meta);
  };
}
function ensureHealth(){const box=$('tk103-runtime-health');if(!box)return null;let line=$('tk113-atomic-health');if(!line){line=document.createElement('div');line.id='tk113-atomic-health';line.className='muted';box.appendChild(line)}return line}
function renderHealth(){const line=ensureHealth();if(!line)return;line.innerHTML=`Atomic Score Pipeline: <b>${S.joined?'ACTIVE':'ARMED'}</b> · joined <b>${S.joined}</b> · score-only <b>${S.scoreOnly}</b> · join <b>${S.lastJoinMs||'—'} ms</b> · court <b>${S.lastCourt||'—'}</b>`;}
function enforce(){T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;const h=$('health-version');if(h)h.textContent=VERSION;const r=$('tk55-runtime-build');if(r)r.textContent=VERSION;const t=$('tk103-runtime-health')?.querySelector('h3');if(t)t.textContent='⚡ Upgrade113 · Runtime/Latency + Atomic Score';}
const baseHealth=App.renderHealth?.bind(App);if(baseHealth&&!App.__u113Health){App.__u113Health=true;App.renderHealth=function(...a){const out=baseHealth(...a);setTimeout(()=>{enforce();renderHealth()},0);return out}}
for(const k of ['TopkeyUpgrade105','TopkeyUpgrade106','TopkeyUpgrade107','TopkeyUpgrade111','TopkeyUpgrade112']){const x=window[k];if(x)x.enforceVersion=enforce}
enforce();renderHealth();setTimeout(()=>{enforce();renderHealth()},0);setTimeout(enforce,800);setTimeout(enforce,1800);setTimeout(enforce,3200);setTimeout(enforce,4200);setTimeout(enforce,5200);setTimeout(enforce,6200);
window.addEventListener('focus',()=>{enforce();renderHealth()},{passive:true});
window.TopkeyUpgrade113={installed:true,VERSION,BUILD,CACHE_TAG,state:S,renderHealth,enforce,contract:'ATOMIC_SCORE_PIPELINE_001'};
})();
