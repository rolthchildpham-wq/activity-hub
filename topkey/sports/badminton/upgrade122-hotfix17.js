(function(){
'use strict';
const TAG='u122h33-20261103';
const $=id=>document.getElementById(id);
function currentRole(){return String(window.Topkey?.Auth?.role?.()||'').toUpperCase()}
function isAdmin(){return currentRole()==='ADMIN'}
let observer=null,raf=0,wrapped=false;
function dateFromHeader(row){
  const s=row?.textContent||'';
  let m=s.match(/\b(\d{4})-(\d{2})-(\d{2})\b/); if(m)return `${m[1]}-${m[2]}-${m[3]}`;
  m=s.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/); if(m)return `${m[3]}-${m[2]}-${m[1]}`;
  return '';
}
function openOptimizer(date){
  if(!isAdmin()){window.Topkey?.U?.toast?.('Chỉ ADMIN được sắp time trong ngày.','err');return}
  const h15=window.TopkeyUpgrade122Hotfix15;
  if(h15?.openDay)return h15.openDay(date);
  const h13=window.TopkeyUpgrade122Hotfix13;
  if(h13?.openDay)return h13.openDay(date);
  window.Topkey?.U?.toast?.('Bộ sắp time chưa sẵn sàng. Hãy tải lại trang.','err');
}
function ensureDayButton(row){
  if(!isAdmin()){row?.querySelectorAll?.('.tk-h17-day-btn,.tk-h13-day-btn,.tk-h15-day-btn').forEach(x=>x.remove());return}
  const date=dateFromHeader(row); if(!date)return;
  const head=row.querySelector('.tk12-day-head'); if(!head)return;
  // Repair stale wrappers from H13/H15/H17. Never wrap the count in a SPAN because
  // admin render helpers update `.tk12-day-head span.textContent` and would delete the button.
  head.querySelectorAll('.tk-h17-right,.tk-h15-wrap').forEach(w=>{
    const count=[...w.children].find(x=>x.tagName==='SPAN'&&!x.classList.contains('tk-h17-right'));
    if(count)head.insertBefore(count,w);
    w.remove();
  });
  head.querySelectorAll('.tk-h13-day-btn,.tk-h15-day-btn').forEach(x=>x.remove());
  const count=[...head.children].find(x=>x.tagName==='SPAN'&&!x.classList.contains('tk-h18-day-btn'));
  if(count)count.style.marginLeft='auto';
  let button=head.querySelector('.tk-h17-day-btn');
  if(!button){
    button=document.createElement('button');
    button.type='button';button.className='btn mini tk-h17-day-btn';
    button.textContent='⏱ Sắp time';
    button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openOptimizer(button.dataset.date||date)});
    head.appendChild(button);
  }
  button.dataset.date=date;
  button.title='Sắp lại giờ thi đấu trong ngày '+date;
  button.style.cssText='display:inline-flex!important;align-items:center;justify-content:center;gap:5px;white-space:nowrap;margin-left:10px;flex:0 0 auto;position:relative;z-index:8';
}
function mount(){raf=0;const box=$('matches-list');if(!box)return false;if(!isAdmin()){box.querySelectorAll('.tk-h17-day-btn,.tk-h13-day-btn,.tk-h15-day-btn').forEach(x=>x.remove());return true}[...box.querySelectorAll('tr.tk12-day-row')].forEach(ensureDayButton);return true}
function scheduleMount(){if(raf)return;raf=requestAnimationFrame(mount)}
function watch(){const box=$('matches-list');if(!box)return false;if(observer)observer.disconnect();observer=new MutationObserver(()=>scheduleMount());observer.observe(box,{childList:true,subtree:true,characterData:true});mount();return true}
function wrapRender(){const App=window.Topkey?.App;if(!App||wrapped)return false;const prev=App.renderMatches?.bind(App);if(typeof prev!=='function')return false;wrapped=true;App.renderMatches=function(...args){const out=prev(...args);queueMicrotask(scheduleMount);setTimeout(scheduleMount,60);setTimeout(scheduleMount,220);return out};return true}
function install(){wrapRender();watch();window.addEventListener('topkey:tab-change',()=>setTimeout(()=>{wrapRender();watch();},40),{passive:true});window.addEventListener('topkey:admin-ready',()=>setTimeout(()=>{wrapRender();watch();},80),{passive:true});window.addEventListener('pageshow',()=>setTimeout(()=>{wrapRender();watch();},120),{passive:true});setInterval(()=>{wrapRender();mount()},1400);window.TopkeyUpgrade122Hotfix17={TAG,mount,watch,ensureDayButton,isAdmin}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
