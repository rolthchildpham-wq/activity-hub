/* TOPKEY H130 Hub compact — DOM-only, no Firebase calls, no auth handlers. */
(()=>{'use strict';
const init=()=>{
 const top=document.querySelector('header.top');
 if(!top||document.documentElement.dataset.tkHub130)return;
 document.documentElement.dataset.tkHub130='1';
 const status=top.querySelector('.status');
 if(status){
   // Replace static explanatory badges only. Runtime warnings live elsewhere.
   status.replaceChildren();
   const pill=document.createElement('span');
   pill.className='pill';
   pill.textContent='TOPKEY VNext 2026 · Đang hoạt động';
   status.appendChild(pill);
 }
 const footer=document.querySelector('main.wrap>.footer');
 if(footer&&!footer.querySelector('.tk-h130-credit')){
   const credit=document.createElement('span');credit.className='tk-h130-credit';
   credit.textContent=' · Thiết kế bởi BacPham';
   footer.appendChild(credit);
 }
 const hero=document.querySelector('main.wrap>.tk-bi-hero');
 if(hero)hero.setAttribute('aria-hidden','true');
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
