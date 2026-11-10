(()=>{
'use strict';
const T=window.Topkey,App=T?.App;
if(!T||!App||App.__upgrade106Installed)return;App.__upgrade106Installed=true;
const VERSION='2026.10.30-vnext-featureparity15-upgrade106-schedule-internal-scroll',BUILD='upgrade106',CACHE_TAG='u106-20261030';
const $=id=>document.getElementById(id);
const txt=(vi,en,zh)=>{const l=window.TopkeyI18n?.language||'vi';return l==='en'?en:l==='zh'?zh:vi};
function label(card){
  if(!card)return;
  const stat=card.querySelector('.tk105-collapse-status');
  if(!stat)return;
  stat.textContent=card.classList.contains('tk105-collapsed')
    ?txt('Đã thu gọn · xem BXH nhanh','Collapsed · standings ready','已收起 · 快速查看排名')
    :txt('Lịch đang mở · cuộn trong khung','Schedule open · scroll inside','赛程已展开 · 框内滚动');
}
function mark(){
  const pub=$('spectator-schedule')?.closest('.card');
  if(pub){pub.classList.add('u106-public-scroll');label(pub)}
  const admin=$('matches-list')?.closest('.card');
  if(admin){admin.classList.add('u106-admin-scroll');label(admin)}
}
function enforceVersion(){
  T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h)h.textContent=VERSION;
  const r=$('tk55-runtime-build');if(r)r.textContent=VERSION;
  const title=$('tk103-runtime-health')?.querySelector('h3');if(title)title.textContent='⚡ Upgrade106 · Runtime/Latency + Fast Lane';
}
async function checkServerBuild106(){
  enforceVersion();
  try{
    const u=new URL('./build.json',location.href);u.searchParams.set('__topkey_probe',Date.now()+'_'+Math.random().toString(36).slice(2));
    const res=await fetch(u,{cache:'no-store',headers:{'Cache-Control':'no-cache'}});if(!res.ok)throw new Error('HTTP '+res.status);
    const x=await res.json(),server=$('tk55-server-build');if(server)server.textContent=x.version||x.build||'unknown';
    const ok=String(x.build||'')===BUILD,st=$('tk55-update-state');if(st)st.textContent=ok?'✓ Runtime và server cùng Upgrade106.':'Runtime/server lệch build.';return ok;
  }catch(e){const st=$('tk55-update-state');if(st)st.textContent='Không đọc được build server: '+(e?.message||e);return false}
}
function install(){mark();enforceVersion()}
const bs=App.renderSpectator?.bind(App);if(bs&&!App.__u106Spectator){App.__u106Spectator=true;App.renderSpectator=function(...a){const o=bs(...a);setTimeout(mark,0);return o}}
const bm=App.renderMatches?.bind(App);if(bm&&!App.__u106Matches){App.__u106Matches=true;App.renderMatches=function(...a){const o=bm(...a);setTimeout(mark,0);return o}}
const bh=App.renderHealth?.bind(App);if(bh&&!App.__u106Health){App.__u106Health=true;App.renderHealth=function(...a){const o=bh(...a);setTimeout(enforceVersion,0);return o}}
document.addEventListener('click',e=>{if(e.target?.closest?.('.tk105-collapse-btn'))setTimeout(mark,0)},true);
window.addEventListener('topkey:languagechange',()=>setTimeout(mark,0));
window.addEventListener('hashchange',()=>setTimeout(mark,0));
window.addEventListener('focus',()=>setTimeout(enforceVersion,0),{passive:true});
install();setTimeout(install,0);setTimeout(install,700);setTimeout(enforceVersion,1800);setTimeout(enforceVersion,3200);setTimeout(enforceVersion,5000);
const check=$('tk55-check-update');if(check)check.onclick=()=>checkServerBuild106();
window.TopkeyUpgrade106={installed:true,VERSION,BUILD,CACHE_TAG,install,mark,enforceVersion,checkServerBuild106,contract:'SCHEDULE_INTERNAL_SCROLL_001'};
})();
