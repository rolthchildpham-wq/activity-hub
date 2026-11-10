(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U||App.__upgrade62Installed)return;
App.__upgrade62Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade62-compact-header';
const CACHE_TAG='u62-20261029';
const BUILD='upgrade62';
const KEY='topkey_u62_header_collapsed';
const $=id=>document.getElementById(id);
const TAB_LABEL={overview:'Tổng quan',control:'Điều hành sân',teams:'Đội & Check-in',schedule:'Lịch & BXH',umpire:'Trọng tài',live:'Live & BLV',finance:'Tài chính',announcements:'Thông báo',audit:'Audit',health:'Health',settings:'Cài đặt'};
let currentTab='umpire';

function stamp(){
  T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;
  document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h)h.textContent=VERSION;
}
function storedCollapsed(){try{return sessionStorage.getItem(KEY)==='1'}catch{return false}}
function storeCollapsed(v){try{sessionStorage.setItem(KEY,v?'1':'0')}catch{}}
function updateCompactTitle(){
  const el=$('tk62-compact-title');if(!el)return;
  const active=document.querySelector('.nav button.active')?.dataset?.tab||currentTab||'umpire';
  currentTab=active;
  el.textContent=`🏸 TOPKEY · ${TAB_LABEL[active]||'Điều hành'}`;
}
function setCollapsed(v,{persist=true}={}){
  document.body.classList.toggle('tk62-header-collapsed',!!v);
  if(persist)storeCollapsed(!!v);
  const b=$('tk62-header-toggle');if(b){b.setAttribute('aria-expanded',String(!v));b.textContent='↑ Thu gọn'}
  const e=$('tk62-header-expand');if(e)e.setAttribute('aria-expanded',String(!v));
  updateCompactTitle();
  // Recalculate sticky offsets/layout after changing header height.
  requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
}
function ensureControls(){
  const topbar=document.querySelector('#app-shell .topbar');
  const nav=topbar?.querySelector('.nav');
  if(!topbar||!nav)return;
  let toggle=$('tk62-header-toggle');
  if(!toggle){
    toggle=document.createElement('button');
    toggle.id='tk62-header-toggle';toggle.type='button';toggle.className='btn mini';
    toggle.textContent='↑ Thu gọn';toggle.title='Thu gọn phần đầu để dành chỗ cho màn Trọng tài';
    toggle.setAttribute('aria-controls','tk62-compactbar');toggle.setAttribute('aria-expanded','true');
    toggle.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setCollapsed(true)});
    nav.appendChild(toggle);
  }
  let compact=$('tk62-compactbar');
  if(!compact){
    compact=document.createElement('div');compact.id='tk62-compactbar';compact.setAttribute('role','region');compact.setAttribute('aria-label','Thanh TOPKEY thu gọn');
    const title=document.createElement('div');title.id='tk62-compact-title';title.className='tk62-compact-title';
    const expand=document.createElement('button');expand.id='tk62-header-expand';expand.type='button';expand.className='btn mini';expand.textContent='↓ Mở rộng';expand.title='Hiện menu, tài khoản và các chức năng phía trên';expand.setAttribute('aria-expanded','false');
    expand.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setCollapsed(false)});
    compact.append(title,expand);topbar.appendChild(compact);
  }
  updateCompactTitle();
  if(storedCollapsed())setCollapsed(true,{persist:false});
}

const baseShowTab=App.showTab?.bind(App);
if(baseShowTab)App.showTab=function(tab,...args){currentTab=tab||currentTab;const out=baseShowTab(tab,...args);setTimeout(()=>{ensureControls();updateCompactTitle()},0);return out};
const baseHealth=App.renderHealth?.bind(App);
if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out};

async function refreshSW(){
  if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;
  try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade62 SW refresh',e)}
}
function install(){stamp();ensureControls();refreshSW();setTimeout(()=>{stamp();ensureControls()},100);setTimeout(ensureControls,900)}
install();
window.addEventListener('focus',()=>{stamp();ensureControls();refreshSW()},{passive:true});
window.addEventListener('pageshow',ensureControls,{passive:true});
window.TopkeyUpgrade62={installed:true,VERSION,CACHE_TAG,BUILD,setCollapsed,ensureControls};
})();
