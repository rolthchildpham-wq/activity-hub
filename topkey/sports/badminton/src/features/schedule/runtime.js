(()=>{
'use strict';
const T=window.Topkey,App=T?.App;if(!T||!App||window.TopkeyScheduleRuntime)return;
App.__upgrade106Installed=true;App.__upgrade107Installed=true;
const $=id=>document.getElementById(id);
const txt=(vi,en,zh)=>{const l=window.TopkeyI18n?.language||'vi';return l==='en'?en:l==='zh'?zh:vi};
function label(card){if(!card)return;const stat=card.querySelector('.tk105-collapse-status');if(!stat)return;stat.textContent=card.classList.contains('tk105-collapsed')?txt('Đã thu gọn · xem BXH nhanh','Collapsed · standings ready','已收起 · 快速查看排名'):txt('Lịch đang mở · cuộn trong khung','Schedule open · scroll inside','赛程已展开 · 框内滚动')}
function mark(){const pub=$('spectator-schedule')?.closest('.card');if(pub){pub.classList.add('u106-public-scroll');label(pub)}const admin=$('matches-list')?.closest('.card');if(admin){admin.classList.add('u106-admin-scroll');label(admin)}}
function repairSearchParents(){const admin=$('matches-list'),adminBar=$('tk16-admin-search');if(admin&&adminBar){const wrap=admin.closest('.table-wrap')||admin.parentElement,parent=wrap?.parentElement;if(parent&&adminBar.parentElement!==parent)parent.insertBefore(adminBar,wrap||null)}const pub=$('spectator-schedule'),pubBar=$('tk16-public-search');if(pub&&pubBar){const parent=pub.parentElement;if(parent&&pubBar.parentElement!==parent)parent.insertBefore(pubBar,pub)}}
function install(){repairSearchParents();mark()}
function afterRender(){setTimeout(install,0)}
window.TopkeyUIBoundary?.afterMatches?.(afterRender,'u116:schedule:matches');
window.TopkeyUIBoundary?.afterSpectator?.(afterRender,'u116:schedule:spectator');
document.addEventListener('click',e=>{if(e.target?.closest?.('.tk105-collapse-btn'))setTimeout(mark,0)},true);
window.addEventListener('topkey:languagechange',()=>setTimeout(mark,0));window.addEventListener('hashchange',()=>setTimeout(install,0));
setTimeout(install,0);setTimeout(install,120);
const api={installed:true,install,mark,repairSearchParents,contract:'SCHEDULE_FEATURE_BOUNDARY_001'};window.TopkeyScheduleRuntime=api;
window.TopkeyUpgrade106={installed:true,install,mark,contract:'SCHEDULE_INTERNAL_SCROLL_001'};
window.TopkeyUpgrade107={installed:true,install,repairSearchParents,contract:'SCHEDULE_DOM_PARENT_SAFETY_001'};
})();
