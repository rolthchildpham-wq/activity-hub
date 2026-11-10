(()=>{
'use strict';
const VERSION='2026.11.04-vnext-upgrade122-hotfix47-withdrawal-legacy-recovery';
const TAG='u122h47-20261104';
const labels=['STT / Mã','Trận','Vòng','Thời gian','Sân','Trạng thái','Tỷ số set','Đổi trạng thái','Thao tác'];
let raf=0,observer=null;
function role(){try{return String(window.Topkey?.Auth?.role?.()||window.Topkey?.Auth?.profile?.role||'').toUpperCase()}catch{return''}}
function syncRole(){const admin=role()==='ADMIN';document.body.classList.toggle('tk37-admin-mobile',admin);document.documentElement.classList.toggle('tk37-admin-mobile',admin);return admin}
function decorateSchedule(){if(!syncRole())return;const box=document.getElementById('matches-list');if(!box)return;for(const tr of box.children){if(!(tr instanceof HTMLElement))continue;if(tr.classList.contains('tk12-day-row')){tr.dataset.tk37Mobile='day';continue}const cells=[...tr.children];cells.forEach((td,i)=>{if(td instanceof HTMLElement&&td.dataset.tk37Label!==labels[i])td.dataset.tk37Label=labels[i]||`Cột ${i+1}`});tr.dataset.tk37Mobile='match'}}
function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;decorateSchedule()})}
function hook(){syncRole();schedule();const shell=document.getElementById('app-shell');if(shell&&!observer){observer=new MutationObserver(schedule);observer.observe(shell,{childList:true,subtree:true})}}
window.addEventListener('topkey:admin-ready',()=>setTimeout(hook,0),{passive:true});
window.addEventListener('topkey:tab-change',schedule,{passive:true});
window.addEventListener('resize',schedule,{passive:true});
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-tab="schedule"]'))setTimeout(schedule,0)},true);
setTimeout(hook,0);setTimeout(hook,700);
window.TopkeyUpgrade122Hotfix37={version:VERSION,tag:TAG,decorateSchedule,syncRole};
})();
