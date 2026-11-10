(() => {
'use strict';
const T=window.Topkey,App=T?.App,U9=window.TopkeyUpgrade9;
if(!T||!App||!U9||window.__TOPKEY_H61_PERMISSION_HARD_HIDE__)return;
window.__TOPKEY_H61_PERMISSION_HARD_HIDE__=true;
const VERSION='2026.11.06-vnext-upgrade122-hotfix61-permission-hard-hide-autolayout';
const CACHE_TAG='u122h61-20261106';
T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;window.__TOPKEY_BOOT_VERSION=VERSION;window.__TOPKEY_BOOT_CACHE=CACHE_TAG;
const role=()=>String(T.Auth?.role?.()||T.Auth?.profile?.role||'VIEWER').toUpperCase();
const FALLBACK={
 ADMIN:{overview:'edit',control:'edit',teams:'edit',schedule:'edit',umpire:'edit',live:'edit',finance:'edit',announcements:'edit',audit:'edit',health:'edit',settings:'edit',publicLinks:'edit'},
 BTC:{overview:'view',control:'edit',teams:'edit',schedule:'edit',umpire:'view',live:'edit',finance:'view',announcements:'edit',audit:'view',health:'view',settings:'view',publicLinks:'edit'},
 UMPIRE:{overview:'view',control:'edit',teams:'none',schedule:'view',umpire:'edit',live:'edit',finance:'none',announcements:'view',audit:'none',health:'view',settings:'none',publicLinks:'none'},
 VIEWER:{overview:'view',control:'none',teams:'none',schedule:'view',umpire:'none',live:'view',finance:'none',announcements:'view',audit:'none',health:'none',settings:'none',publicLinks:'none'},
 LIVE_ONLY:{overview:'none',control:'none',teams:'none',schedule:'none',umpire:'none',live:'view',finance:'none',announcements:'none',audit:'none',health:'none',settings:'none',publicLinks:'none'}
};
function mode(module,detail){
 const r=role(); if(r==='ADMIN')return'edit';
 const p=T.Auth?.profile?.permissions||{};
 const d=detail?String(p.details?.[`${module}:${detail}`]||'').toLowerCase():'';
 if(['none','view','edit'].includes(d))return d;
 const m=String(p.modules?.[module]||'').toLowerCase();
 if(['none','view','edit'].includes(m))return m;
 return FALLBACK[r]?.[module]||'none';
}
function mark(el,m){if(!el)return;el.classList.toggle('tk61-permission-hidden',m==='none');el.classList.toggle('tk61-readonly',m==='view');}
function card(el){return el?.closest?.('.card,.subcard,.tk9-card')||el;}
function wrap(el,kind){if(!el)return el;if(kind==='card')return card(el);if(kind==='table')return el.closest('.table-wrap')||card(el);if(kind==='row')return el.closest('tr,.list-card,.checkin-row')||el;return el;}
const RULES=[
 ['#page-overview .grid.g4','overview','stats','self'],['#tk9-top3-section','overview','top3','card'],
 ['#court-form','control','courts','card'],['#courts-list','control','courts','card'],
 ['#team-form','teams','add','card'],['#tk9-registration-admin','teams','registration','card'],['#registration-list','teams','registration','card'],['#tk9-approved-singles-wrap','teams','registration','card'],['.tk9-draw-launch','teams','registration','card'],
 ['#checkin-list','teams','checkin','card'],['#checkin-search','teams','checkin','card'],
 ['#teams-list','teams','list','card'],['#team-template','teams','list','self'],['#team-import','teams','list','self'],['#team-export','teams','list','self'],
 ['#match-form','schedule','create','card'],['#round-robin-gen','schedule','create','self'],['#match-import','schedule','create','self'],['#match-export','schedule','create','self'],
 ['#schedule-auto','schedule','smart','card'],['#schedule-preview','schedule','smart','card'],['.scheduler-rule-stack','schedule','smart','self'],['#tk9-player-busy-card','schedule','smart','card'],['#tk9-quick-limit-card','schedule','smart','card'],
 ['#schedule-delete-open','schedule','delete','self'],['#schedule-delete-open-2','schedule','delete','self'],
 ['#standings-list','schedule','standings','card'],['#ranking-head','schedule','standings','card'],
 ['#umpire-board','umpire','view','self'],['#page-umpire .score-actions','umpire','score','self'],['#umpire-start','umpire','score','self'],['#umpire-end','umpire','score','self'],['#single-actions','umpire','score','self'],
 ['#video-box','live','view','self'],['#live-score','live','view','self'],['#live-caption','live','view','self'],['#stream-apply','live','configure','self'],['#stream-type','live','configure','self'],['#stream-url','live','configure','self'],['#stream-court','live','configure','self'],['#audio-unlock','live','commentary','self'],['#commentary-test','live','commentary','self'],['#commentary-list','live','commentary','self'],
 ['#finance-list','finance','view','table'],['#finance-form','finance','edit','self'],['#finance-export-zip','finance','export','self'],
 ['#announcement-list','announcements','view','card'],['#announcements-list','announcements','view','card'],['#announcement-form','announcements','edit','card'],
 ['#audit-list','audit','view','card'],['#page-health','health','view','self'],
 ['#rules-form','settings','config','card'],['#user-form','settings','accounts','card'],['#users-list','settings','accounts','card'],['#tk9-permission-card','settings','accounts','card'],['#tk9-appearance-card','settings','appearance','card'],['#tk9-security-card','settings','security','card'],['#tk9-lifecycle-card','settings','finish','card'],['#export-backup','settings','backup','self'],['#import-backup','settings','backup','self'],['#migrate-legacy','settings','backup','self'],
 ['#tk14-public-links-card','publicLinks','manage','card']
];
function applyRules(){
 if(!T.Auth?.user)return;
 document.querySelectorAll('.tk61-permission-hidden,.tk61-readonly').forEach(el=>{el.classList.remove('tk61-permission-hidden','tk61-readonly')});
 for(const [sel,m,d,k] of RULES){const md=mode(m,d);document.querySelectorAll(sel).forEach(el=>mark(wrap(el,k),md));}
 // Generic future-proof hooks.
 document.querySelectorAll('[data-permission-module]').forEach(el=>{const m=el.dataset.permissionModule,d=el.dataset.permissionDetail||'';mark(wrap(el,el.dataset.permissionScope||'self'),mode(m,d));});
 // Hide whole tabs when module has no access.
 document.querySelectorAll('[data-tab]').forEach(btn=>{const tab=btn.dataset.tab;mark(btn,mode(tab));});
 // Never leave a page selected when its tab became hidden.
 const active=document.querySelector('[data-tab].active');if(active?.classList.contains('tk61-permission-hidden')){
   const next=[...document.querySelectorAll('[data-tab]')].find(b=>!b.classList.contains('tk61-permission-hidden'));
   if(next&&next.dataset.tab!==App.currentTab)App.showTab?.(next.dataset.tab);
 }
 collapseEmpty();
}
function isGone(el){if(!el)return true;return el.classList.contains('tk61-permission-hidden')||el.classList.contains('tk9-hidden-permission')||el.classList.contains('hidden')||getComputedStyle(el).display==='none';}
function collapseEmpty(){
 // Remove visual shells whose actual payload is fully permission-hidden.
 document.querySelectorAll('.card,.subcard').forEach(c=>{
   if(c.id==='tk14-public-links-card')return;
   const managed=[...c.querySelectorAll('.tk61-permission-hidden,.tk9-hidden-permission')];
   if(!managed.length){c.classList.remove('tk61-empty-shell');return;}
   const payload=[...c.querySelectorAll('form,table,.table-wrap,.action-bar,button,input,select,textarea,[id$="-list"],[id$="-grid"],.tk9-actions,.score-actions')].filter(x=>!['H1','H2','H3','P'].includes(x.tagName));
   const visible=payload.some(x=>!isGone(x)&&!x.closest('.tk61-permission-hidden,.tk9-hidden-permission'));
   c.classList.toggle('tk61-empty-shell',!visible);
 });
 // Empty action bars and split toolbars should not reserve space.
 document.querySelectorAll('.action-bar,.tk9-actions,.rule-toolbar').forEach(g=>{
   const visible=[...g.children].some(x=>!isGone(x));g.classList.toggle('tk61-empty-shell',!visible);
 });
 document.documentElement.classList.add('tk61-auto-layout');
}
const basePerm=U9.applyPermissionsDom?.bind(U9);
if(basePerm&&!U9.__h61Perm){U9.__h61Perm=true;U9.applyPermissionsDom=function(...a){const r=basePerm(...a);queueMicrotask(applyRules);return r};}
const baseAll=App.renderAll?.bind(App);if(baseAll&&!App.__h61All){App.__h61All=true;App.renderAll=function(...a){const r=baseAll(...a);queueMicrotask(applyRules);return r};}
const baseBranch=App.renderBranch?.bind(App);if(baseBranch&&!App.__h61Branch){App.__h61Branch=true;App.renderBranch=function(...a){const r=baseBranch(...a);queueMicrotask(applyRules);return r};}
const baseRole=App.applyRole?.bind(App);if(baseRole&&!App.__h61Role){App.__h61Role=true;App.applyRole=function(...a){const r=baseRole(...a);queueMicrotask(applyRules);return r};}
let timer=0;const obs=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(applyRules,60)});obs.observe(document.body,{childList:true,subtree:true});
setTimeout(applyRules,0);setTimeout(applyRules,600);
window.TopkeyUpgrade122Hotfix61={VERSION,CACHE_TAG,mode,applyRules,collapseEmpty};
})();
