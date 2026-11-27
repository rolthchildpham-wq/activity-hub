/* H240 workspace controller: one active workspace, no empty layout tracks. */
(()=>{'use strict';
 const main=document.querySelector('main.wrap'),nav=document.querySelector('.tk210-nav');
 if(!main||!nav)return;
 const groups={
  'topkey-home':['.tk-bi-hero','.tk-bi-section-heading','#topkey-sports'],
  'topkey-sports':['.tk-bi-section-heading','#topkey-sports'],
  'executive-dashboard':['#executive-dashboard'],
  'system-admin-launch':['#password-change-launch','#system-admin-launch','.testlab-panel']
 };
 const all=[...new Set(Object.values(groups).flat())].map(s=>[s,[...main.querySelectorAll(s)]]);
 const footer=main.querySelector('.footer');
 function activate(id,{hash=false,scroll=true}={}){
  if(!groups[id])id='topkey-home';
  for(const [selector,nodes] of all)for(const node of nodes){
   const visible=groups[id].includes(selector);
   node.classList.toggle('hub-workspace-hidden',!visible);
   node.setAttribute('aria-hidden',String(!visible));
   if('inert'in node)node.inert=!visible;
   if(selector==='#executive-dashboard')node.classList.toggle('hidden',!visible);
  }
  if(footer){footer.hidden=true;footer.setAttribute('aria-hidden','true')}
  nav.querySelectorAll('a[href^="#"]').forEach(a=>{
   const active=a.getAttribute('href')==='#'+id;
   a.classList.toggle('active',active);
   if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
  document.body.dataset.hubWorkspace=id;
  document.documentElement.dataset.hubWorkspace=id;
  main.dataset.activeWorkspace=id;
  if(hash&&location.hash!=='#'+id)history.pushState({hubWorkspace:id},'','#'+id);
  if(scroll)window.scrollTo({top:0,left:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'instant'});
 }
 nav.addEventListener('click',e=>{
  const a=e.target.closest('a[href^="#"]');if(!a)return;
  const id=a.getAttribute('href').slice(1);if(!groups[id])return;
  e.preventDefault();activate(id,{hash:true});
 });
 main.addEventListener('click',e=>{
  const a=e.target.closest('a[href^="#"]');if(!a)return;
  const id=a.getAttribute('href').slice(1);if(groups[id]){e.preventDefault();activate(id,{hash:true})}
 });
 const restore=()=>activate(location.hash.slice(1),{scroll:false});
 window.addEventListener('hashchange',restore);
 window.addEventListener('popstate',restore);
 activate(groups[location.hash.slice(1)]?location.hash.slice(1):'topkey-home',{hash:!location.hash,scroll:false});
 window.TopkeyHubWorkspaceNav={activate,groups,version:'H240'};
})();