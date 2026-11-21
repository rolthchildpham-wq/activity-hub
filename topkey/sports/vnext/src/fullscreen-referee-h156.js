/* H156: remove redundant nav glyphs and expose original referee action buttons
 * when the shared Live Studio is fullscreen. No cloned action handlers.
 */
(() => {
  'use strict';
  if (window.__TOPKEY_PUBLIC_ROUTE || window.TopkeyH156) return;
  const sports = new Set(['football','volleyball']);
  const glyph=/^(?:\s*[▦▤♙◈●₫◉≡◷⚙🏐⚽🏃🧶🪶👨‍🍳]\s*)+/u;
  const labels=[
    {key:'score',label:'Điểm',test:/\+1\s*(?:điểm|bàn thắng)|\+\s*[ab]$/iu},
    {key:'timeout',label:'Timeout',test:/timeout|tạm dừng hội ý/iu},
    {key:'sub',label:'Thay người',test:/thay người|substitution/iu},
    {key:'card',label:'Thẻ / Phạt',test:/thẻ vàng|thẻ đỏ|cảnh cáo\s*\/\s*phạt|warning\s*\/\s*sanction/iu}
  ];
  const state={ready:false,observer:null,shortcuts:null,board:null,nav:null,navObserver:null};
  const $=id=>document.getElementById(id);
  function normalizeNavigation(){
    const nav=$('tk141-sport-navigation')||document.querySelector('#app-shell .topbar>.nav');
    if(!nav)return false;
    for(const button of nav.querySelectorAll('[data-tab]')){
      // H132 ::before draws one canonical glyph. Older scripts sometimes insert
      // a second icon span or literal emoji before the button label.
      for(const node of [...button.childNodes]){
        if(node.nodeType===1 && (
          node.matches?.('.tk141-nav-icon,.tk-h130-icon,.tk-nav-icon,.nav-icon,[aria-hidden="true"]')||
          (node.tagName==='SPAN' && glyph.test(node.textContent||''))
        ))node.remove();
      }
      const first=[...button.childNodes].find(n=>n.nodeType===3 && n.textContent.trim());
      if(first && glyph.test(first.textContent))first.textContent=first.textContent.replace(glyph,'').trimStart();
    }
    return true;
  }
  function matchAction(root,expression){
    return [...root.querySelectorAll('button')].find(button=>{
      const text=(button.textContent||'').replace(/\s+/g,' ').trim();
      return expression.test(text) && !button.hidden && !button.closest('[hidden],.hidden');
    })||null;
  }
  function reveal(button,pane){
    const a=pane.getBoundingClientRect();
    const b=button.getBoundingClientRect();
    const delta=b.top-a.top-100;
    pane.scrollTop=Math.max(0,pane.scrollTop+delta);
    button.classList.add('tk156-highlight');
    button.focus({preventScroll:true});
    window.setTimeout(()=>button.classList.remove('tk156-highlight'),2200);
  }
  function updateShortcuts(){
    const bar=state.shortcuts,board=state.board;
    if(!bar||!board)return;
    for(const config of labels){
      const button=bar.querySelector('[data-tk156="'+config.key+'"]');
      if(!button)continue;
      // The actual event buttons may be re-rendered at every score update.
      const present=Boolean(matchAction(board,config.test));
      button.disabled=!present;
      button.title=present?'Cuộn đến nút '+config.label:'Chưa có thao tác '+config.label+' cho trận này';
    }
  }
  function install(){
    if(state.ready)return true;
    const T=window.Topkey;
    if(!sports.has(T?.SPORT?.key)||!T.Auth?.can?.('umpire'))return false;
    const pane=$('tk144-official-pane'),board=$('umpire-board');
    if(!pane||!board || !$('tk144-live-studio'))return false;
    const bar=document.createElement('div');
    bar.id='tk156-referee-shortcuts';
    bar.className='tk156-referee-shortcuts';
    bar.setAttribute('role','group');
    bar.setAttribute('aria-label','Đi tới công cụ trọng tài');
    for(const config of labels){
      const b=document.createElement('button');
      b.type='button';b.dataset.tk156=config.key;b.textContent=config.label;
      b.addEventListener('click',()=>{
        const target=matchAction(board,config.test);
        if(target)reveal(target,pane);
        else{
          const help=bar.querySelector('.tk156-referee-help');
          if(help)help.textContent='Công cụ '+config.label+' chưa hiển thị trong trận này.';
        }
      });
      bar.appendChild(b);
    }
    const help=document.createElement('span');
    help.className='tk156-referee-help';
    help.textContent='Chọn công cụ để kéo bảng trọng tài tới nút gốc; không tự cộng điểm hoặc ghi phạt.';
    bar.appendChild(help);
    pane.insertBefore(bar,pane.firstChild);
    state.shortcuts=bar;state.board=board;state.ready=true;
    const observer=new MutationObserver(()=>updateShortcuts());
    observer.observe(board,{childList:true,subtree:true,characterData:true});
    state.observer=observer;
    updateShortcuts();
    return true;
  }
  function boot(){
    normalizeNavigation();
    if(!state.navObserver){
      const nav=$('tk141-sport-navigation')||document.querySelector('#app-shell .topbar>.nav');
      if(nav){
        let scheduled=false;
        state.navObserver=new MutationObserver(()=>{
          if(scheduled)return;
          scheduled=true;
          Promise.resolve().then(()=>{scheduled=false;normalizeNavigation()});
        });
        state.navObserver.observe(nav,{childList:true,subtree:true,characterData:true});
      }
    }
    install();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  window.__TOPKEY_VNEXT_BOOT?.then(boot).catch(()=>{});
  window.addEventListener('topkey:admin-ready',boot);
  window.TopkeyH156={normalizeNavigation,install,updateShortcuts};
})();
