(()=>{'use strict';
const BUILD=window.TopkeyRelease?.cacheTag||'',KEY='topkey_hub_session_v86',LEGACY='topkey_hub_sport_ticket';
const SPORT_LABELS={badminton:'🏸 Cầu lông',football:'⚽ Bóng đá',volleyball:'🏐 Bóng chuyền',running:'🏃 Chạy bộ',handmade:'🧶 DIY / Handmade',shuttle:'🪶 Đá cầu',cooking:'👨‍🍳 Nấu ăn'};
function sportFromLink(a){const h=a.getAttribute('href')||'';if(h.includes('/badminton/'))return'badminton';try{return new URL(h,location.href).searchParams.get('sport')||''}catch{return''}}
function nonce(){try{return crypto.randomUUID()}catch{return 'tk_'+Date.now()+'_'+Math.random().toString(36).slice(2)}}
function currentUid(){try{const u=window.firebase?.auth?.().currentUser;return u&&!u.isAnonymous?String(u.uid||''):''}catch{return''}}
function makeSession(sport){const n=nonce(),now=Date.now(),uid=currentUid(),s={sport,nonce:n,createdAt:now,touchedAt:now,phase:uid?'AUTHENTICATED':'SELECTED',authUid:uid,authenticatedAt:uid?now:0,loginStartedAt:0,build:BUILD};try{sessionStorage.setItem(KEY,JSON.stringify(s));sessionStorage.setItem(LEGACY,JSON.stringify({sport,nonce:n,at:now,build:BUILD}));for(const x of Object.keys(SPORT_LABELS))sessionStorage.removeItem('topkey_require_fresh_login_'+x)}catch{}return s}
function targetFor(a,sport,s){const u=new URL(a.getAttribute('href')||'',location.href);u.searchParams.set('entry','hub');u.searchParams.set('hubTicket',s.nonce);u.searchParams.set('sport',sport);u.searchParams.set('v',BUILD);u.searchParams.set('__topkey_build',BUILD);return u}
function boot(){
 let navigating=false;
 document.addEventListener('click',async e=>{const a=e.target?.closest?.('a.sport');if(!a)return;const sport=sportFromLink(a);if(!sport)return;e.preventDefault();e.stopPropagation();if(navigating)return;
  const health=window.TopkeyReleaseHealth;if(!BUILD||!health){console.warn('TOPKEY: release runtime unavailable');return}
  try{await health.ready;if(!health.canLaunch(sport)){document.getElementById('topkey-release-health')?.scrollIntoView({behavior:'smooth',block:'center'});return}
   navigating=true;const s=makeSession(sport),u=targetFor(a,sport,s);location.assign(u.toString())
  }catch(err){navigating=false;console.warn('TOPKEY Hub entry blocked',err)}
 },true);
 const p=new URLSearchParams(location.search);if(p.get('access')==='denied'){const sport=p.get('sport')||'',n=document.createElement('section');n.className='panel';n.style.cssText='margin-bottom:18px;border-color:#ef4444';n.innerHTML=`<b>⛔ Không được quyền truy cập ${SPORT_LABELS[sport]||'môn đã chọn'}</b><div class="muted" style="margin-top:5px">Hãy chọn môn khác hoặc đăng nhập bằng tài khoản đã được ADMIN cấp đúng quyền.</div>`;document.querySelector('main.wrap')?.prepend(n)}
 if(p.get('reason')==='select-sport')document.documentElement.dataset.selectSport='1'
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.TopkeyHubFlow={build:BUILD,makeSession};
})();
