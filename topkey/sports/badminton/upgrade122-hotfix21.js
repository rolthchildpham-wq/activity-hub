(function(){
'use strict';
const TAG='u122h47-20261104';
const VERSION='2026.11.04-vnext-upgrade122-hotfix47-withdrawal-legacy-recovery';
const $=id=>document.getElementById(id);
let observer=null, raf=0, installed=false;
const wrapped=new WeakSet();
function T(){return window.Topkey||null}
function role(){
  const A=T()?.Auth;
  const profile=String(A?.profile?.role||'').trim().toUpperCase();
  if(profile)return profile;
  try{return String(A?.role?.()||'').trim().toUpperCase()}catch{return ''}
}
function isAdmin(){return role()==='ADMIN'}
function dateFromHeader(row){
  const s=row?.querySelector?.('.tk12-day-head b')?.textContent||row?.textContent||'';
  let m=s.match(/\b(\d{4})-(\d{2})-(\d{2})\b/); if(m)return `${m[1]}-${m[2]}-${m[3]}`;
  m=s.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/); if(m)return `${m[3]}-${m[2]}-${m[1]}`;
  return '';
}
function openOptimizer(date){
  if(!isAdmin()){T()?.U?.toast?.('Chỉ ADMIN được sắp time trong ngày.','err');return}
  const h15=window.TopkeyUpgrade122Hotfix15;
  if(h15?.openDay)return h15.openDay(date);
  const h13=window.TopkeyUpgrade122Hotfix13;
  if(h13?.openDay)return h13.openDay(date);
  T()?.U?.toast?.('Bộ sắp time chưa sẵn sàng. Hãy tải lại trang.','err');
}
function cleanOld(head){
  head.querySelectorAll('.tk-h13-day-btn,.tk-h15-day-btn,.tk-h17-day-btn:not(.tk-h21-day-btn)').forEach(x=>x.remove());
  head.querySelectorAll('.tk-h17-right,.tk-h15-wrap').forEach(w=>{
    [...w.children].forEach(ch=>{if(ch.tagName==='SPAN')head.insertBefore(ch,w)});w.remove();
  });
}
function ensureRow(row){
  const head=row?.querySelector?.('.tk12-day-head'); if(!head)return false;
  cleanOld(head);
  if(!isAdmin()){head.querySelectorAll('.tk-h21-day-btn').forEach(x=>x.remove());return false}
  const date=dateFromHeader(row); if(!date)return false;
  const count=[...head.children].find(x=>x.tagName==='SPAN');
  if(count)count.style.marginLeft='auto';
  let b=head.querySelector('.tk-h21-day-btn');
  if(!b){
    b=document.createElement('button');
    b.type='button';
    b.className='btn mini tk-h17-day-btn tk-h21-day-btn';
    b.textContent='⏱ Sắp time';
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openOptimizer(b.dataset.date||date)});
    head.appendChild(b);
  }
  b.dataset.date=date;
  b.title='Sắp time ngày '+date+' · ADMIN';
  b.style.setProperty('display','inline-flex','important');
  b.style.setProperty('align-items','center');
  b.style.setProperty('justify-content','center');
  b.style.setProperty('white-space','nowrap');
  b.style.setProperty('margin-left','10px');
  b.style.setProperty('flex','0 0 auto');
  b.style.setProperty('position','relative');
  b.style.setProperty('z-index','20');
  return true;
}
function mount(){
  raf=0;
  const box=$('matches-list'); if(!box)return {rows:0,buttons:0,admin:isAdmin()};
  const rows=[...box.querySelectorAll('tr.tk12-day-row')];
  if(!isAdmin()){
    box.querySelectorAll('.tk-h13-day-btn,.tk-h15-day-btn,.tk-h17-day-btn,.tk-h21-day-btn').forEach(x=>x.remove());
    return {rows:rows.length,buttons:0,admin:false};
  }
  rows.forEach(ensureRow);
  const buttons=rows.filter(r=>r.querySelector('.tk-h21-day-btn')).length;
  try{window.TopkeyUpgrade122Hotfix27?.mount?.()}catch(e){console.warn('H35 order mount',e)}
  return {rows:rows.length,buttons,admin:true};
}
function scheduleMount(){if(raf)return;raf=requestAnimationFrame(()=>{mount()})}
function watch(){
  const box=$('matches-list'); if(!box)return false;
  if(observer)observer.disconnect();
  observer=new MutationObserver(()=>scheduleMount());
  observer.observe(box,{childList:true,subtree:true,characterData:true});
  scheduleMount(); return true;
}
function wrapMethod(App,name,afterDelay=0){
  const fn=App?.[name]; if(typeof fn!=='function'||wrapped.has(fn))return;
  const original=fn;
  const wrapper=function(...args){
    let out;
    try{out=original.apply(this,args)}catch(e){throw e}
    const done=()=>{setTimeout(()=>{watch();scheduleMount()},afterDelay);setTimeout(scheduleMount,80);setTimeout(scheduleMount,260)};
    if(out&&typeof out.then==='function')return out.finally(done);
    done(); return out;
  };
  wrapped.add(wrapper); App[name]=wrapper;
}
function hookApp(){
  const App=T()?.App; if(!App)return false;
  ['renderMatches','renderAll','applyRole','afterLogin','showTab'].forEach(n=>wrapMethod(App,n,n==='afterLogin'?30:0));
  return true;
}
function updateVersion(){
  const t=T(); if(t){t.CONFIG_VERSION=VERSION;t.VERSION=VERSION;t.RUNTIME_BUILD=VERSION}
  const hv=$('health-version'); if(hv)hv.textContent=VERSION;
  document.documentElement.dataset.topkeyBuild='upgrade122-hotfix36';
}
function install(){
  if(installed)return; installed=true; updateVersion(); hookApp(); watch();
  ['topkey:admin-ready','topkey:tab-change','pageshow','focus'].forEach(ev=>window.addEventListener(ev,()=>setTimeout(()=>{updateVersion();hookApp();watch();scheduleMount()},ev==='topkey:admin-ready'?120:50),{passive:true}));
  window.TopkeyUpgrade122Hotfix21={TAG,VERSION,role,isAdmin,mount,watch,openDay:openOptimizer};
}
let tries=0;const boot=setInterval(()=>{if(T()?.App){clearInterval(boot);install()}else if(++tries>300)clearInterval(boot)},50);
if(document.readyState!=='loading'&&T()?.App){clearInterval(boot);install()}
})();
