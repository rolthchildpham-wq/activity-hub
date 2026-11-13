/* TOPKEY H130 persistent sidebar: no auth, Firebase, route reload or DOM remount. */
(()=>{'use strict';
if(window.TopkeySidebarH130)return;
const KEY='topkey_badminton_sidebar_collapsed_h130';
const icons={overview:'▦',control:'▤',teams:'♙',schedule:'▦',umpire:'◈',live:'●',finance:'₫',announcements:'◉',audit:'≡',health:'◷',settings:'⚙'};
const init=()=>{
 const app=document.getElementById('app-shell');
 const nav=app?.querySelector('.topbar>.nav');
 if(!app||!nav||document.getElementById('tk-h130-sidebar-toggle'))return;
 const body=document.body;
 const isMobile=()=>window.matchMedia?.('(max-width:700px)')?.matches;
 const store=value=>{try{localStorage.setItem(KEY,value?'1':'0')}catch{}};
 const setCollapsed=(value,{persist=true}={})=>{
  const collapsed=!!value&&!isMobile();
  body.classList.toggle('tk-h130-collapsed',collapsed);
  toggle.setAttribute('aria-expanded',String(!collapsed));
  toggle.setAttribute('aria-label',collapsed?'Mở rộng menu bên trái':'Thu gọn menu về bên trái');
  toggle.title=collapsed?'Mở rộng menu':'Thu gọn menu';
  icon.textContent=collapsed?'›':'‹';
  label.textContent=collapsed?'Mở rộng':'Thu gọn';
  if(persist)store(collapsed);
 };
 for(const button of nav.querySelectorAll('[data-tab]')){
  if(button.querySelector('.tk-h130-icon'))continue;
  const name=String(button.dataset.tab||'');
  const title=button.textContent.trim();
  button.replaceChildren();
  const glyph=document.createElement('span');glyph.className='tk-h130-icon';glyph.setAttribute('aria-hidden','true');glyph.textContent=icons[name]||'•';
  const caption=document.createElement('span');caption.className='tk-h130-label';caption.textContent=title;
  button.append(glyph,caption);button.setAttribute('aria-label',title);button.title=title;
 }
 const toggle=document.createElement('button');toggle.type='button';toggle.id='tk-h130-sidebar-toggle';toggle.className='tk-h130-sidebar-toggle';
 const icon=document.createElement('span');icon.className='tk-h130-toggle-icon';icon.setAttribute('aria-hidden','true');
 const label=document.createElement('span');label.className='tk-h130-toggle-label';toggle.append(icon,label);
 toggle.onclick=()=>setCollapsed(!body.classList.contains('tk-h130-collapsed'));
 nav.appendChild(toggle);
 const credit=document.createElement('span');credit.className='tk-h130-credit';credit.textContent='Thiết kế bởi BacPham';nav.appendChild(credit);
 const cleanLegacy=()=>{
  for(const button of nav.querySelectorAll('button:not([data-tab]):not(#tk-h130-sidebar-toggle)')){
   if(/thu gọn|mở rộng|thu gon|mo rong/i.test(button.textContent||''))button.classList.add('tk-h130-legacy-toggle');
  }
 };
 cleanLegacy();
 const observer=typeof MutationObserver==='function'?new MutationObserver(cleanLegacy):null;
 observer?.observe(nav,{childList:true});
 setTimeout(()=>observer?.disconnect(),12000);
 window.matchMedia?.('(max-width:700px)')?.addEventListener?.('change',()=>setCollapsed(body.classList.contains('tk-h130-collapsed'),{persist:false}));
 let saved='0';try{saved=localStorage.getItem(KEY)||'0'}catch{};
 setCollapsed(saved==='1',{persist:false});
 window.TopkeySidebarH130=Object.freeze({installed:true,setCollapsed,get collapsed(){return body.classList.contains('tk-h130-collapsed')}});
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
