(()=>{
'use strict';
const VERSION='2026.11.04-vnext-upgrade122-hotfix47-withdrawal-legacy-recovery';
const CACHE_TAG='u122h47-20261104';
const T=()=>window.Topkey,A=()=>T()?.App,U=()=>T()?.U,$=id=>document.getElementById(id);
const MODE_KEY='topkey_h30_commentary_mode',RULE_KEY='topkey_h30_commentary_rules';
const LABELS={SCORE:'Mỗi điểm',STREAK:'Streak / chuỗi điểm',LEAD_CHANGE:'Đổi bên dẫn',BIG_LEAD:'Dẫn cách biệt',DEUCE:'Deuce / cân bằng',GAME_POINT:'Game point',MATCH_POINT:'Match point',COMEBACK:'Comeback',SET_FINISH:'Kết thúc set',MATCH_FINISH:'Kết thúc trận'};
const DEFAULT_RULES={SCORE:false,STREAK:true,LEAD_CHANGE:true,BIG_LEAD:true,DEUCE:true,GAME_POINT:true,MATCH_POINT:true,COMEBACK:true,SET_FINISH:true,MATCH_FINISH:true};
let installed=false;
function readMode(){try{return localStorage.getItem(MODE_KEY)||'MANUAL'}catch{return'MANUAL'}}
function saveMode(v){const x=v==='AUTO'?'AUTO':'MANUAL';try{localStorage.setItem(MODE_KEY,x);localStorage.setItem('topkey_auto_blv',x==='AUTO'?'1':'0')}catch{}return x}
function readRules(){try{return{...DEFAULT_RULES,...JSON.parse(localStorage.getItem(RULE_KEY)||'{}')}}catch{return{...DEFAULT_RULES}}}
function saveRules(p){const x={...readRules(),...p};try{localStorage.setItem(RULE_KEY,JSON.stringify(x))}catch{}return x}
function operator(){try{return['ADMIN','UMPIRE'].includes(String(T()?.Auth?.role?.()||T()?.Auth?.profile?.role||'VIEWER').toUpperCase())}catch{return false}}
function allowed(kind){const k=String(kind||'SCORE').toUpperCase();return readMode()==='AUTO'&&readRules()[k]!==false}
function syncAutoCheckbox(){const auto=$('auto-commentary'),on=readMode()==='AUTO';if(auto){auto.checked=on;auto.disabled=false}try{window.TopkeyUpgrade78?.saveSettings?.({userEnabled:on})}catch{}}
function renderState(){
 const mode=readMode(),rules=readRules();
 document.querySelectorAll('[data-h30-mode]').forEach(b=>{const on=b.dataset.h30Mode===mode;if(b.classList.contains('active')!==on)b.classList.toggle('active',on)});
 document.querySelectorAll('[data-h30-rule]').forEach(el=>{const c=rules[el.dataset.h30Rule]!==false,d=mode!=='AUTO';if(el.checked!==c)el.checked=c;if(el.disabled!==d)el.disabled=d});
 const s=$('tk122h30-status');if(s){const txt=mode==='AUTO'?'AUTO theo rule · chỉ các trigger đang bật mới phát':'MANUAL-only · +1/-1 không tự phát; dùng nút 🎙 khi cần';if(s.textContent!==txt)s.textContent=txt}
 syncAutoCheckbox();
}
function ensureUi(){
 const host=$('tk46-controls')||$('auto-commentary')?.closest('.card');if(!host||$('tk122h30-rules'))return false;
 const triggerHtml=Object.entries(LABELS).map(([k,v])=>`<label><input type="checkbox" data-h30-rule="${k}"> ${v}</label>`).join('');
 const box=document.createElement('div');box.id='tk122h30-rules';box.className='tk122h30-rules';
 box.innerHTML=`<div class="tk122h30-title">🎙 Chế độ & trigger bình luận</div><div class="tk122h30-mode"><button type="button" data-h30-mode="MANUAL">Manual-only</button><button type="button" data-h30-mode="AUTO">Auto theo rule</button></div><div id="tk122h30-status" class="tk122h30-status"></div><div class="tk122h30-grid">${triggerHtml}</div><div class="tk122h30-note">Auto vẫn dùng mật độ BLV hiện có. Với “Mỗi điểm”, nên chọn mật độ HIGH nếu muốn đọc gần như mọi điểm.</div>`;
 host.prepend(box);
 box.querySelectorAll('[data-h30-mode]').forEach(b=>b.onclick=()=>{saveMode(b.dataset.h30Mode);if(readMode()==='MANUAL')window.TopkeyUpgrade122Hotfix29?.clearScoreQueue?.({stopCurrent:true});renderState();U()?.toast?.(readMode()==='AUTO'?'Đã bật Auto BLV theo rule':'Đã chuyển sang Manual-only','ok')});
 box.querySelectorAll('[data-h30-rule]').forEach(c=>c.onchange=()=>{saveRules({[c.dataset.h30Rule]:!!c.checked});renderState()});
 renderState();return true;
}
function patchScore(){
 const a=A();if(!a||a.__h30Score)return !!a;const base=a.score?.bind(a);if(!base)return false;a.__h30Score=true;
 a.score=async function(side,delta,...args){
   const out=await base(side,delta,...args);if(Number(delta)<=0||readMode()!=='AUTO'||!out)return out;
   try{
     const E=window.TopkeyUpgrade46?.Engine,s=out.state||this.state.activeMatches?.[this.currentCourt],m=s&&this.state.matches?.[s.matchId];if(!E||!m)return out;
     const meta=E.composeScore?.(m,out,side);if(!meta||!allowed(meta.kind))return out;
     E.enqueue({...meta,id:`h30_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,source:'AUTO',eventAt:Date.now()});
   }catch(e){console.warn('H30 Auto rule',e)}
   return out;
 };
 return true;
}
function patchAutoToggle(){const el=$('auto-commentary');if(!el||el.dataset.h30==='1')return;el.dataset.h30='1';el.onchange=e=>{saveMode(e.target.checked?'AUTO':'MANUAL');renderState();if(!e.target.checked)window.TopkeyUpgrade122Hotfix29?.clearScoreQueue?.({stopCurrent:true})}}
function stamp(){const t=T();if(t){t.VERSION=VERSION;t.CONFIG_VERSION=VERSION;t.RUNTIME_BUILD=VERSION}document.documentElement.dataset.topkeyBuild='upgrade122-hotfix33';const h=$('health-version');if(h)h.textContent=VERSION}
function install(){
 if(installed)return;installed=true;ensureUi();patchScore();patchAutoToggle();renderState();stamp();
 window.addEventListener('topkey:admin-ready',()=>setTimeout(()=>{ensureUi();patchScore();patchAutoToggle();renderState();stamp()},30));
 // H34: no broad MutationObserver here. H30 used to observe page-live/page-settings and
 // call renderState() from its own DOM writes, which could create an infinite mutation loop
 // and freeze the main thread immediately after login. Mount/update only from real lifecycle events.
 window.addEventListener('topkey:tab-change',()=>setTimeout(()=>{ensureUi();patchAutoToggle();renderState()},0),{passive:true});
 window.TopkeyUpgrade122Hotfix30={installed:true,VERSION,CACHE_TAG,readMode,saveMode,readRules,saveRules,allowed};
}
let n=0,t=setInterval(()=>{if(A()&&window.TopkeyUpgrade122Hotfix29&&window.TopkeyUpgrade46){clearInterval(t);install()}else if(++n>300)clearInterval(t)},50);
if(document.readyState!=='loading'&&A()&&window.TopkeyUpgrade122Hotfix29&&window.TopkeyUpgrade46){clearInterval(t);install()}
})();
