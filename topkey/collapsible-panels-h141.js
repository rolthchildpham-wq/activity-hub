/* H141: collapsible sports navigation and optional collapsible dashboard panels.
 * No route reload, no DOM reparenting and no database interaction. */
(() => {
  'use strict';
  if (window.TopkeyCollapsibleH141) return;
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch {} }
  };
  const icons = {overview:'▦',control:'▤',teams:'♟',schedule:'▦',umpire:'◈',live:'●',
    finance:'₫',announcements:'◉',audit:'≡',health:'◷',settings:'⚙'};
  const state = {started:false,sidebar:null,folded:new Set()};
  const scope = () => 'topkey_h141_' + location.pathname.replace(/[^a-z0-9]/gi,'_');
  const mobile = () => !!window.matchMedia?.('(max-width:700px)')?.matches;
  function addSidebar() {
    const shell = document.getElementById('app-shell');
    const nav = shell?.querySelector('.topbar>.nav');
    const brand = shell?.querySelector('.topbar>.brand');
    if (!shell || !nav || !brand || document.getElementById('tk141-nav-toggle')) return false;
    const toggle = document.createElement('button');
    toggle.type = 'button';toggle.id='tk141-nav-toggle';toggle.className='tk141-nav-toggle';
    toggle.setAttribute('aria-controls','tk141-sport-navigation');
    nav.id='tk141-sport-navigation';
    const setCollapsed = (collapsed, persist=true) => {
      const on=!!collapsed;
      document.body.classList.toggle('tk141-nav-collapsed',on);
      toggle.setAttribute('aria-expanded',String(!on));
      toggle.setAttribute('aria-label',on?'Mở menu điều hướng':'Thu gọn menu điều hướng');
      toggle.textContent=on?'☰ Hiện menu':'☰ Thu menu';
      nav.setAttribute('aria-label','Điều hướng các phân hệ thể thao');
      if (mobile()) {
        nav.setAttribute('aria-hidden',String(on));
        nav.querySelectorAll('[data-tab]').forEach(item=>{if(on)item.setAttribute('tabindex','-1');else item.removeAttribute('tabindex')});
      } else {
        nav.removeAttribute('aria-hidden');
        nav.querySelectorAll('[data-tab]').forEach(item=>item.removeAttribute('tabindex'));
      }
      if (persist) storage.set(scope()+'_nav',on?'1':'0');
    };
    toggle.addEventListener('click',()=>setCollapsed(!document.body.classList.contains('tk141-nav-collapsed')));
    brand.appendChild(toggle);
    nav.querySelectorAll('[data-tab]').forEach(btn=>{
      btn.setAttribute('title',btn.textContent.trim());
      if (!btn.querySelector('.tk-h130-icon')) {
        const mark=document.createElement('span');
        mark.className='tk141-nav-icon';mark.setAttribute('aria-hidden','true');
        mark.textContent=icons[btn.dataset.tab]||'•';
        btn.prepend(mark);
      }
    });
    nav.addEventListener('click',event=>{
      if(event.target.closest('[data-tab]')&&mobile())setCollapsed(true);
    });
    window.matchMedia?.('(max-width:700px)')?.addEventListener?.('change',()=>{
      // On mobile default to hidden; on desktop retain explicit saved preference.
      setCollapsed(mobile()?true:storage.get(scope()+'_nav')==='1',false);
    });
    setCollapsed(mobile()?true:storage.get(scope()+'_nav')==='1',false);
    state.sidebar={toggle,nav,setCollapsed};
    return true;
  }
  function addPanels() {
    // Only presentation containers with a direct title are foldable. Never fold
    // live score panels, player courts, KPIs, modals, or login/auth forms.
    const root=document.getElementById('app-shell')||document.querySelector('main.wrap');
    if (!root) return;
    const candidates=root.querySelectorAll('.page .card:not(.kpi),.page .subcard,.tk-bi-hub .panel,.tk-bi-hub .exec-dashboard');
    candidates.forEach((panel,index)=>{
      if (panel.dataset.tk141Foldable || panel.closest('.modal,.court,.control-card,.login,#public-spectator,#public-register')) return;
      const heading=[...panel.children].find(child=>/^H[234]$/.test(child.tagName));
      if(!heading) return;
      panel.dataset.tk141Foldable='1';
      const id=panel.id||panel.closest('.page')?.id+'_'+index||'card_'+index;
      const key=scope()+'_panel_'+id;
      const button=document.createElement('button');
      button.type='button';button.className='tk141-panel-toggle';
      const title=heading.textContent.trim().slice(0,60)||'thẻ';
      button.setAttribute('aria-label','Thu gọn thẻ '+title);
      button.textContent='▴ Thu gọn';
      const setFold=(folded,persist=true)=>{
        panel.classList.toggle('tk141-panel-folded',folded);
        button.setAttribute('aria-expanded',String(!folded));
        button.setAttribute('aria-label',(folded?'Mở rộng':'Thu gọn')+' thẻ '+title);
        button.textContent=folded?'▾ Mở rộng':'▴ Thu gọn';
        if(persist)storage.set(key,folded?'1':'0');
      };
      button.addEventListener('click',()=>setFold(!panel.classList.contains('tk141-panel-folded')));
      panel.prepend(button);
      setFold(storage.get(key)==='1',false);
    });
  }
  function init() {
    if (state.started) return;
    state.started=true;
    addSidebar();addPanels();
    // Pages/cards may appear after Firebase auth or a report reload.
    const root=document.getElementById('app-shell')||document.querySelector('main.wrap');
    if(typeof MutationObserver==='function'&&root) {
      let pending=false;
      const observer=new MutationObserver(()=>{
        if(pending)return;
        pending=true;
        Promise.resolve().then(()=>{pending=false;addSidebar();addPanels()});
      });
      observer.observe(root,{childList:true,subtree:true});
    }
    window.addEventListener('topkey:admin-ready',()=>{addSidebar();addPanels()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.TopkeyCollapsibleH141={init,get sidebar(){return state.sidebar}};
})();
