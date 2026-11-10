(()=>{
'use strict';
const VERSION='2026.11.04-vnext-upgrade122-hotfix47-withdrawal-legacy-recovery';
const CACHE_TAG='u122h47-20261104';
const START_MIN=17*60+15;
const T=()=>window.Topkey, App=()=>T()?.App, Data=()=>T()?.Data, U=()=>T()?.U;
const DONE=new Set(['LIVE','INTERVAL','SUSPENDED','FINISHED','WALKOVER','RETIRED','DISQUALIFIED','CANCELLED']);
let busy=false,installed=false;
function role(){try{return String(T()?.Auth?.role?.()||T()?.Auth?.profile?.role||'VIEWER').toUpperCase()}catch{return'VIEWER'}}
function admin(){return role()==='ADMIN'}
function started(m){return !!m?.startedAt||(m?.sets||[]).some(s=>Number(s?.a||s?.s1||0)>0||Number(s?.b||s?.s2||0)>0)}
function movable(m){return !!m&&!DONE.has(String(m.status||'SCHEDULED').toUpperCase())&&!started(m)}
function fmt(n){n=((Number(n)||0)%1440+1440)%1440;return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
function duration(){const n=Number(App()?.state?.config?.rules?.estimatedMatchMinutes);return Number.isFinite(n)&&n>=5?Math.round(n):20}
function entriesForDate(date){
 const src=App()?.state?.matches||{};
 return Object.entries(src).map(([key,m])=>({...(m||{}),__key:key,id:(m&&m.id)||key}))
  .filter(m=>String(m.date||'')===String(date||''))
  .sort((a,b)=>{
   const ao=Number(a.scheduleOrder),bo=Number(b.scheduleOrder),av=Number.isFinite(ao),bv=Number.isFinite(bo);
   if(av&&bv&&ao!==bo)return ao-bo;if(av!==bv)return av?-1:1;
   return String(a.time||'99:99').localeCompare(String(b.time||'99:99'))||String(a.code||'').localeCompare(String(b.code||''))||String(a.__key).localeCompare(String(b.__key));
  });
}
function canonical(order){const step=duration();return order.map((m,i)=>({key:m.__key,time:fmt(START_MIN+i*step),scheduleOrder:i,match:m}))}
function dateFromHeader(row){const b=row.querySelector('.tk12-day-head b');const raw=String(b?.textContent||'').replace(/^⭐\s*HÔM NAY\s*·\s*/i,'').trim(),m=raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);return m?`${m[3]}-${m[2]}-${m[1]}`:''}
function rowGroups(){const box=document.getElementById('matches-list');if(!box)return[];const out=[];let g=null;for(const tr of box.querySelectorAll(':scope > tr')){if(tr.classList.contains('tk12-day-row')){g={date:dateFromHeader(tr),rows:[]};out.push(g)}else if(g&&tr.classList.contains('tk12-match-row'))g.rows.push(tr)}return out}
function matchForRow(ms,tr,idx){const first=String(tr.children?.[0]?.textContent||'').replace(/[↑↓]/g,' ').trim();const code=(first.match(/M\d+/i)||[])[0]||'';return ms.find(m=>String(m.code||'').toUpperCase()===code.toUpperCase())||ms[idx]||null}
async function writeUpdates(updates,meta){const d=Data();if(!d)throw new Error('Data chưa sẵn sàng');if(d.db&&d.auth?.currentUser&&navigator.onLine!==false){await d.db.ref().update(updates);return'direct'}await d.queueMulti(updates,meta);return'queue'}
async function verify(date,expected){const d=Data();if(!d?.db||navigator.onLine===false)return {ok:true,offline:true};let source=null;try{source=await d.read('matches')}catch{return {ok:false,bad:['Không đọc lại được Firebase']}}const bad=[];for(const [key,want] of Object.entries(expected)){const got=source?.[key];if(!got||String(got.time||'')!==want.time||Number(got.scheduleOrder)!==want.scheduleOrder)bad.push(`${key}: ${got?.time||'—'} #${got?.scheduleOrder??'—'} != ${want.time} #${want.scheduleOrder}`)}return{ok:bad.length===0,bad}}
async function persistOrder(date,order,meta={}){
 const app=App(),d=Data();if(!app||!d)throw new Error('Hệ thống chưa sẵn sàng');
 const plan=canonical(order),now=Date.now(),updates={},expected={},before={};
 for(const x of plan){const old=app.state.matches?.[x.key];if(!old)continue;before[x.key]={time:old.time||'',scheduleOrder:old.scheduleOrder};expected[x.key]={time:x.time,scheduleOrder:x.scheduleOrder};updates[d.path(`matches/${x.key}/time`)]=x.time;updates[d.path(`matches/${x.key}/scheduleOrder`)]=x.scheduleOrder;updates[d.path(`matches/${x.key}/updatedAt`)]=now;old.time=x.time;old.scheduleOrder=x.scheduleOrder;old.updatedAt=now}
 app.renderMatches?.();setTimeout(()=>mount(),0);
 const mode=await writeUpdates(updates,{type:'ADMIN_DAY_ORDER_CANONICAL_H35',date,...meta});
 const check=await verify(date,expected);if(!check.ok)throw Object.assign(new Error('Firebase chưa phản ánh lịch mới: '+check.bad.join(' · ')),{before});
 await d.audit?.('ADMIN_DAY_ORDER_CANONICAL','tournament',d.tid,null,{date,start:'17:15',interval:duration(),count:plan.length,mode,version:VERSION,...meta});
 return {plan,mode,check,before};
}
async function move(key,dir){
 if(busy)return U()?.toast?.('Đang lưu thay đổi trước…','info');if(!admin())return U()?.toast?.('Chỉ ADMIN được đổi thứ tự trận','err');
 const app=App(),cur0=app?.state?.matches?.[key];if(!app||!cur0)return U()?.toast?.('Không tìm thấy trận','err');
 const rows=entriesForDate(cur0.date),i=rows.findIndex(x=>x.__key===key),j=i+dir;if(i<0||j<0||j>=rows.length)return;
 const cur=rows[i],other=rows[j];if(!movable(cur)||!movable(other))return U()?.toast?.('Chỉ đổi được các trận chưa bắt đầu','err');
 busy=true;const order=[...rows];[order[i],order[j]]=[order[j],order[i]];const backup=Object.fromEntries(rows.map(r=>[r.__key,{time:app.state.matches[r.__key]?.time||'',scheduleOrder:app.state.matches[r.__key]?.scheduleOrder}]));
 try{const out=await persistOrder(cur.date,order,{matchKey:key,direction:dir<0?'UP':'DOWN',swapWith:other.__key});U()?.toast?.(`${dir<0?'↑ Đã đưa lên':'↓ Đã đưa xuống'} ${cur.code||key} · tính lại từ 17:15, bước ${duration()} phút${out.check.offline?' · sẽ sync khi có mạng':' · Firebase đã lưu'}`,'ok')}
 catch(e){console.error('H35 move',e);for(const [k,v] of Object.entries(backup)){if(app.state.matches?.[k]){app.state.matches[k].time=v.time;app.state.matches[k].scheduleOrder=v.scheduleOrder}}app.renderMatches?.();setTimeout(()=>mount(),0);U()?.toast?.('Không đổi được thứ tự: '+(e?.message||e),'err')}
 finally{busy=false}
}
function button(txt,title,disabled,key,dir){const b=document.createElement('button');b.type='button';b.className='btn mini tk-h27-order-btn';b.textContent=txt;b.title=title;b.disabled=disabled;b.style.cssText='min-width:30px;padding:4px 7px;margin-right:4px';b.onclick=e=>{e.preventDefault();e.stopPropagation();move(key,dir)};return b}
function mount(){const box=document.getElementById('matches-list');if(!box)return false;box.querySelectorAll('.tk-h23-order-wrap,.tk-h24-order-wrap').forEach(x=>x.remove());if(!admin()){box.querySelectorAll('.tk-h27-order-wrap').forEach(x=>x.remove());return true}for(const g of rowGroups()){const ms=entriesForDate(g.date);g.rows.forEach((tr,idx)=>{const m=matchForRow(ms,tr,idx);if(!m)return;const td=tr.firstElementChild;if(!td)return;let w=td.querySelector('.tk-h27-order-wrap');if(w&&w.dataset.matchKey===m.__key)return;w?.remove();const pos=ms.findIndex(x=>x.__key===m.__key),prev=ms[pos-1],next=ms[pos+1],can=movable(m);w=document.createElement('span');w.className='tk-h27-order-wrap';w.dataset.matchKey=m.__key;w.style.cssText='display:inline-flex;align-items:center;margin-right:6px;vertical-align:middle';w.append(button('↑','Đưa trận lên trước và tính lại giờ từ 17:15',!can||pos<=0||!movable(prev),m.__key,-1),button('↓','Đưa trận xuống sau và tính lại giờ từ 17:15',!can||pos<0||pos>=ms.length-1||!movable(next),m.__key,1));td.prepend(w)})}return true}
function stamp(){const t=T();if(t){t.VERSION=VERSION;t.CONFIG_VERSION=VERSION;t.RUNTIME_BUILD=VERSION}document.documentElement.dataset.topkeyBuild='upgrade122-hotfix36';const h=document.getElementById('health-version');if(h)h.textContent=VERSION}
function install(){if(installed)return;installed=true;stamp();mount();['topkey:admin-ready','topkey:tab-change','pageshow','focus'].forEach(ev=>window.addEventListener(ev,()=>setTimeout(()=>{stamp();mount()},50),{passive:true}));window.TopkeyUpgrade122Hotfix27={VERSION,CACHE_TAG,move,mount,entriesForDate,canonical,persistOrder,duration}}
let n=0,iv=setInterval(()=>{if(T()?.App){clearInterval(iv);install()}else if(++n>200)clearInterval(iv)},50);if(document.readyState!=='loading'&&T()?.App){clearInterval(iv);install()}
})();
