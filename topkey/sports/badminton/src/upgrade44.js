(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U||App.__upgrade44Installed)return;
App.__upgrade44Installed=true;
const VERSION='2026.10.28-vnext-featureparity15-upgrade44';
const CACHE_TAG='u44-20261028';
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;
const $=id=>document.getElementById(id);
const tr=(vi,en,zh)=>{const l=window.TopkeyI18n?.language||'vi';return l==='en'?en:l==='zh'?zh:vi;};
function pad(n){return String(n).padStart(2,'0');}
function localParts(ms){const d=new Date(Number(ms)||Date.now());return{date:`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,time:`${pad(d.getHours())}:${pad(d.getMinutes())}`};}
function fmtDate(v){const p=String(v||'').split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:String(v||'');}
function actualParts(m){
  if(!m?.actualFinishedAt||m.actualFinishSource!=='UMPIRE_SAVE_END')return null;
  const fallback=localParts(m.actualFinishedAt),date=m.actualFinishedDate||fallback.date,time=m.actualFinishedTime||fallback.time;
  return{date,time,at:Number(m.actualFinishedAt)||0,by:m.actualFinishedBy||''};
}
function actualText(m){const p=actualParts(m);return p?`${fmtDate(p.date)} ${p.time}`:'';}
function findAdminMatch(row){
  const id=row?.dataset?.matchId;if(id&&App.state.matches?.[id])return App.state.matches[id];
  const code=row?.cells?.[0]?.textContent?.trim()||'';return Object.values(App.state.matches||{}).find(m=>String(m.code||m.id||'').trim()===code)||null;
}
function findPublicMatch(card){
  const id=card?.dataset?.matchId;if(id&&App.state.matches?.[id])return App.state.matches[id];
  const code=card?.querySelector?.('.tk12-match-code')?.textContent?.trim()||'';return Object.values(App.state.matches||{}).find(m=>String(m.code||m.id||'').trim()===code)||null;
}
function enhanceAdminActualTimes(){
  const box=$('matches-list');if(!box)return;
  box.querySelectorAll('tr.tk12-match-row').forEach(row=>{
    row.querySelectorAll('.tk44-actual-time').forEach(x=>x.remove());
    const m=findAdminMatch(row),text=actualText(m);if(!m||m.status!=='FINISHED'||!text)return;
    const cell=row.cells?.[3];if(!cell)return;
    const line=document.createElement('div');line.className='tk44-actual-time';line.title=tr('Ghi tự động đúng lúc trọng tài bấm KẾT THÚC và lưu trận','Recorded automatically when the umpire presses END and saves the match','裁判点击结束并保存比赛时自动记录');
    line.innerHTML=`<span>${tr('Thực tế','Actual','实际')}</span><b>${text}</b>`;cell.appendChild(line);
  });
}
function enhancePublicActualTimes(){
  const box=$('spectator-schedule');if(!box)return;
  box.querySelectorAll('.tk12-public-match').forEach(card=>{
    card.querySelectorAll('.tk44-actual-time').forEach(x=>x.remove());
    const m=findPublicMatch(card),text=actualText(m);if(!m||m.status!=='FINISHED'||!text)return;
    card.dataset.matchId=m.id;
    const main=card.querySelector('.tk12-match-main');if(!main)return;
    const line=document.createElement('small');line.className='tk44-actual-time';line.innerHTML=`<span>${tr('Thực tế kết thúc','Actual finish','实际结束')}</span><b>${text}</b>`;main.appendChild(line);
  });
}
function installRenderPatches(){
  const bm=App.renderMatches?.bind(App);if(bm&&!App.__u44Matches){App.__u44Matches=true;App.renderMatches=function(...args){const out=bm(...args);enhanceAdminActualTimes();setTimeout(enhanceAdminActualTimes,0);return out;};}
  const bp=App.renderSpectator?.bind(App);if(bp&&!App.__u44Spectator){App.__u44Spectator=true;App.renderSpectator=function(...args){const out=bp(...args);enhancePublicActualTimes();setTimeout(enhancePublicActualTimes,0);return out;};}
}
async function endMatch44(){
  const s=this.state.activeMatches?.[this.currentCourt];if(!s)return;
  const ok=await U.confirmDanger(tr('Kết thúc trận đấu','Finish match','结束比赛'),tr('Sẽ khóa điểm, cập nhật BXH và ghi ngày giờ kết thúc thực tế.','Scores will be locked, standings updated, and the actual finish date/time recorded.','将锁定比分、更新排名并记录实际结束日期时间。'),tr('KẾT THÚC','FINISH','结束'));
  if(!ok)return;
  const m=this.state.matches?.[s.matchId],w=T.Scoring.winner(s.sets,this.state.config.rules);if(!m)return U.toast(tr('Không tìm thấy trận','Match not found','找不到比赛'),'err');if(!w)return U.toast(tr('Chưa xác định đội thắng đủ set','Winner is not determined yet','尚未确定达到获胜局数的队伍'),'err');
  const now=Date.now(),lp=localParts(now),uid=T.Auth.user?.uid||'local';
  const after={...m,status:'FINISHED',sets:s.sets,winnerId:w==='A'?m.teamAId:m.teamBId,finishedAt:now,updatedAt:now,actualFinishedAt:now,actualFinishedDate:lp.date,actualFinishedTime:lp.time,actualFinishedTimezoneOffset:new Date(now).getTimezoneOffset(),actualFinishedBy:uid,actualFinishSource:'UMPIRE_SAVE_END'};
  const c=this.state.courts?.[this.currentCourt],eventId=U.id('evt');
  const evt={id:eventId,type:'MATCH_FINISHED',matchId:m.id,courtId:this.currentCourt,winnerId:after.winnerId,clientAt:now,actorUid:uid,actualFinishedAt:now,actualFinishedDate:lp.date,actualFinishedTime:lp.time,actualFinishedTimezoneOffset:new Date(now).getTimezoneOffset(),actualFinishSource:'UMPIRE_SAVE_END'};
  const updates={};updates[T.Data.path('matches/'+m.id)]=after;updates[T.Data.path('activeMatches/'+this.currentCourt)]=null;if(c)updates[T.Data.path('courts/'+this.currentCourt)]={...c,status:'AVAILABLE',activeMatchId:'',updatedAt:now};updates[T.Data.path('events/'+this.currentCourt+'/'+eventId)]=evt;
  await T.Data.queueMulti(updates,{eventId,type:'MATCH_FINISHED',actualFinishedAt:now});
  await T.Data.audit('FINISH','match',m.id,m,after);
  this.comment?.(`${tr('Kết thúc trận đấu','Match finished','比赛结束')}. ${this.teamName(after.winnerId)} ${tr('giành chiến thắng','wins','获胜')}.`);
  U.toast(tr(`Đã lưu giờ kết thúc thực tế ${fmtDate(lp.date)} ${lp.time}`,`Actual finish time saved: ${fmtDate(lp.date)} ${lp.time}`,`已保存实际结束时间 ${fmtDate(lp.date)} ${lp.time}`),'ok');
}
function installUmpireFinish(){App.endMatch=endMatch44;}
const baseRenderHealth=App.renderHealth?.bind(App);
function renderHealth44(...args){const out=baseRenderHealth?.(...args);U.setText?.('health-version',VERSION);document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=VERSION);return out;}
async function hardenServiceWorker44(){if(!('serviceWorker' in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update();}catch{}}catch(e){console.warn('Upgrade44 SW refresh',e);}}
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild='upgrade44';try{renderHealth44();}catch{}}
function install(){App.renderHealth=renderHealth44;installRenderPatches();installUmpireFinish();stamp();enhanceAdminActualTimes();enhancePublicActualTimes();setTimeout(()=>{stamp();enhanceAdminActualTimes();enhancePublicActualTimes();},0);setTimeout(stamp,800);hardenServiceWorker44();}
install();window.addEventListener('focus',()=>{stamp();hardenServiceWorker44();},{passive:true});window.addEventListener('topkey:languagechange',()=>{enhanceAdminActualTimes();enhancePublicActualTimes();});
window.TopkeyUpgrade44={installed:true,VERSION,actualParts,actualText,localParts,enhanceAdminActualTimes,enhancePublicActualTimes,endMatch44};
})();
