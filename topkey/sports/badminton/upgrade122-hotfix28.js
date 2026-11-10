(()=>{
'use strict';
const VERSION='2026.11.04-vnext-upgrade122-hotfix47-withdrawal-legacy-recovery';
const CACHE_TAG='u122h47-20261104';
const $=id=>document.getElementById(id),T=()=>window.Topkey,A=()=>T()?.App,U=()=>T()?.U;
let installed=false,lastScoreAt=0;
function role(){try{return String(T()?.Auth?.role?.()||T()?.Auth?.profile?.role||'VIEWER').toUpperCase()}catch{return'VIEWER'}}
function operator(){return ['ADMIN','UMPIRE'].includes(role())}
function current(){const a=A(),court=a?.currentCourt,s=a?.state?.activeMatches?.[court];return{a,court,s}}
function esc(s){try{return A()?.escape?.(s)||String(s??'')}catch{return String(s??'')}}
function liteOn(){return document.body.classList.contains('tk58-score-focus')&&operator()}
function syncLiteClass(){document.body.classList.toggle('tk122h28-lite',liteOn())}
function teamForSide(m,side){const a=A();return a?.state?.teams?.[side==='A'?m?.teamAId:m?.teamBId]||{}}
function fastPaint(){
 const {a,s}=current();if(!a||!s)return false;const board=$('umpire-board');if(!board)return false;
 const set=s.sets?.[Number(s.setIndex)||0]||{a:0,b:0},m=a.state?.matches?.[s.matchId]||{},Ateam=teamForSide(m,'A'),Bteam=teamForSide(m,'B');
 const strongs=board.querySelectorAll('.score-head strong');if(strongs[0])strongs[0].textContent=Number(set.a)||0;if(strongs[1])strongs[1].textContent=Number(set.b)||0;
 const service=board.querySelector('.tk11-service-line>span:first-child');if(service){const team=s.serverSide==='B'?Bteam:Ateam,name=team?.[s.serverPlayer]||'—',pos=s.positions?.[s.serverSide]?.[s.serverPlayer]||'right';service.innerHTML=`🏸 Phát cầu: <b>${esc(name)}</b> · Bên ${s.serverSide} · ${pos==='right'?'Ô CHẴN':'Ô LẺ'}`;}
 const halves=[...board.querySelectorAll('.court-half[data-side]')];
 halves.forEach(half=>{
   const side=half.dataset.side,physical=half.classList.contains('tk13-right')?'right':'left',topPos=physical==='left'?'left':'right',bottomPos=topPos==='left'?'right':'left';
   const cards=[...half.querySelectorAll('.tk11-player[data-side][data-player]')],byKey={};cards.forEach(c=>byKey[c.dataset.player]=c);
   const keys=['p1','p2'];const top=keys.find(k=>s.positions?.[side]?.[k]===topPos)||'p1',bottom=keys.find(k=>k!==top)||'p2';
   const head=half.querySelector('.tk11-team-head');[top,bottom].forEach((key,row)=>{const c=byKey[key];if(!c)return;half.appendChild(c);const serving=s.serverSide===side&&s.serverPlayer===key;c.classList.toggle('serving',serving);const no=c.querySelector('.tk11-player-no');if(no)no.textContent=physical==='left'?(row===0?'1':'2'):(row===0?'2':'1');const sm=c.querySelector('small'),pos=s.positions?.[side]?.[key]||'left';if(sm)sm.textContent=`${pos==='right'?'Ô CHẴN · BÊN PHẢI':'Ô LẺ · BÊN TRÁI'}${serving?' · 🏸 PHÁT CẦU':''}`;});
   if(head)half.prepend(head);
 });
 return true;
}
function clearAutoScoreAudio(){
 try{const E=window.TopkeyUpgrade46?.Engine;if(E?.queue)E.queue=E.queue.filter(x=>!['SCORE','BIG_LEAD','STREAK','LEAD_CHANGE'].includes(String(x?.kind||'').toUpperCase()))}catch{}
}
function manualScoreText(){const {a,s}=current();if(!a||!s)return'';const m=a.state?.matches?.[s.matchId]||{},set=s.sets?.[Number(s.setIndex)||0]||{},Ateam=teamForSide(m,'A'),Bteam=teamForSide(m,'B');return `${Ateam.name||'Đội A'} ${Number(set.a)||0}, ${Bteam.name||'Đội B'} ${Number(set.b)||0}.`;}
async function speakScore(){if(!operator())return;const text=manualScoreText();if(!text)return U()?.toast?.('Chưa có trận đang chấm','info');const b=$('tk122h28-score-speak');if(b)b.disabled=true;let ok=false;try{ok=await window.TopkeyUpgrade122Hotfix20?.emergencySpeak?.(text)}catch{}if(!ok){try{ok=await window.TopkeyUpgrade122Hotfix11?.directSpeak?.(text,{manual:true})}catch{}}if(!ok)U()?.toast?.('Không phát được bình luận điểm. Kiểm tra Audio/Piper trong Health.','err');if(b)b.disabled=false;}
function ensureManualButton(){const bar=$('tk122h6-funbar');if(!bar||!operator())return;let b=$('tk122h28-score-speak');if(!b){b=document.createElement('button');b.id='tk122h28-score-speak';b.type='button';b.className='btn secondary';b.textContent='🎙 Tỷ số';b.title='Bấm mới đọc tỷ số hiện tại';b.onclick=e=>{e.preventDefault();e.stopPropagation();speakScore()};bar.appendChild(b)}syncLiteClass();}
function patchScore(){const a=A();if(!a||a.__h28Score)return false;a.__h28Score=true;
 a.score=function(side,delta){
   const s=this.state.activeMatches?.[this.currentCourt];if(!s)return U()?.toast?.('Chưa load trận','err');
   try{
     const result=T().Scoring.point(s,side,delta,this.state.config.rules),eventAt=Date.now(),eventId=U()?.id?.('evt')||('evt_'+eventAt),evt={id:eventId,seq:(s.version||0)+1,type:Number(delta)>0?'POINT_AWARDED':'POINT_CORRECTED',side,delta,before:result.before,after:result.after,matchId:s.matchId,courtId:this.currentCourt,actorUid:T()?.Auth?.user?.uid||'local',clientAt:eventAt};
     this.state.activeMatches[this.currentCourt]=result.state;lastScoreAt=eventAt;clearAutoScoreAudio();
     if(!fastPaint())requestAnimationFrame(()=>fastPaint());
     const updates={};updates[T().Data.path('activeMatches/'+this.currentCourt)]=result.state;updates[T().Data.path('events/'+this.currentCourt+'/'+eventId)]=evt;
     Promise.resolve(T().Data.queueMulti(updates,{eventId,type:'SCORE',h28Lite:true})).catch(e=>U()?.toast?.('Điểm đã lưu local; chờ sync: '+(e?.message||e),'info'));
     if(result.setFinished){setTimeout(()=>{this.renderUmpire?.();ensureManualButton()},0);U()?.toast?.(result.matchFinished?'Set quyết định đã kết thúc.':'Set đã kết thúc. Xác nhận sang set tiếp theo.','ok')}
     return Promise.resolve(result);
   }catch(e){U()?.toast?.(e?.message||e,'err');return Promise.resolve(null)}
 };
 return true;
}
function patchRender(){const a=A();if(!a||a.__h28Render)return false;a.__h28Render=true;const base=a.renderUmpire?.bind(a);if(base)a.renderUmpire=function(...args){const out=base(...args);syncLiteClass();setTimeout(ensureManualButton,0);return out};return true;}
function stamp(){const t=T();if(t){t.VERSION=VERSION;t.CONFIG_VERSION=VERSION;t.RUNTIME_BUILD=VERSION}document.documentElement.dataset.topkeyBuild='upgrade122-hotfix36';const h=$('health-version');if(h)h.textContent=VERSION;}
function install(){if(installed)return;installed=true;patchScore();patchRender();stamp();syncLiteClass();ensureManualButton();
 document.addEventListener('fullscreenchange',()=>setTimeout(()=>{syncLiteClass();ensureManualButton()},0));window.addEventListener('topkey:admin-ready',()=>setTimeout(()=>{patchScore();patchRender();syncLiteClass();ensureManualButton();stamp()},20));
 const obs=new MutationObserver(()=>{if(liteOn())ensureManualButton()});const page=$('page-umpire');if(page)obs.observe(page,{childList:true,subtree:true});
 window.TopkeyUpgrade122Hotfix28={installed:true,VERSION,CACHE_TAG,fastPaint,speakScore,lastScoreAt:()=>lastScoreAt};}
let n=0,t=setInterval(()=>{if(A()){clearInterval(t);install()}else if(++n>300)clearInterval(t)},50);if(document.readyState!=='loading'&&A()){clearInterval(t);install()}
})();
