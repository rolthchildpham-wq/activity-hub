/* H144 — Unified Live Studio for VNext football and volleyball.
   Reuses (never clones) the existing umpire card to preserve score handlers,
   identity, Firebase listeners and officiating permissions.
   Fullscreen changes presentation only; camera publishing is unchanged. */
(() => {
  'use strict';
  if (window.__TOPKEY_PUBLIC_ROUTE) return;
  const allowedSports = new Set(['football', 'volleyball']);
  const $ = id => document.getElementById(id);
  const state = {installed:false, active:false, root:null, umpireCard:null,
    anchor:null, layout:'auto', fullscreen:false};
  const isUmpire = T => Boolean(T?.Auth?.can?.('umpire'));
  const isLive = T => Boolean(T?.Auth?.can?.('live'));
  function install() {
    const T=window.Topkey, app=T?.App;
    if(state.installed || !allowedSports.has(T?.SPORT?.key) ||
      !app?.showTab || !app?.renderOfficial || !app?.renderLiveScore) return false;
    const live=$('page-live'), umpire=$('page-umpire'),
      liveGrid=live?.querySelector(':scope > .grid'),
      umpireCard=umpire?.querySelector(':scope > .card'),
      videoCard=$('video-box')?.closest('.card');
    if(!live || !umpireCard || !liveGrid || !videoCard) return false;
    state.installed=true;state.umpireCard=umpireCard;

    const studio=document.createElement('section');
    studio.id='tk144-live-studio';
    studio.className='tk144-studio';
    studio.dataset.orientation='auto';
    studio.setAttribute('aria-label','Live Studio — camera và điều khiển tỷ số');
    const header=document.createElement('div');header.className='tk144-header';
    const heading=document.createElement('h2');heading.textContent='🎥 Live Studio · Camera + Trọng tài';
    const controls=document.createElement('div');controls.className='tk144-toolbar';
    const mode=document.createElement('select');mode.id='tk144-orientation';
    mode.setAttribute('aria-label','Chọn kiểu hiển thị Live Studio');
    for (const [value,label] of [
      ['auto','Tự động theo màn hình'],['portrait','Đứng toàn màn hình'],['landscape','Ngang toàn màn hình']
    ]) {
      const option=document.createElement('option');option.value=value;option.textContent=label;mode.appendChild(option);
    }
    const full=document.createElement('button');full.id='tk144-enter-fullscreen';
    full.type='button';full.className='btn primary';full.textContent='⛶ Toàn màn hình';
    const leave=document.createElement('button');leave.id='tk144-exit-fullscreen';
    leave.type='button';leave.className='btn';leave.textContent='✕ Thoát toàn màn hình';
    leave.hidden=true;
    const toggle=document.createElement('button');toggle.id='tk144-toggle-umpire';
    toggle.type='button';toggle.className='btn';toggle.textContent='Ẩn bảng trọng tài';
    controls.append(mode,full,leave,toggle);header.append(heading,controls);
    const hint=document.createElement('p');hint.id='tk144-status';hint.className='tk144-status';
    hint.setAttribute('role','status');hint.textContent='Bố cục tự điều chỉnh trên điện thoại hoặc PC.';
    const workspace=document.createElement('div');workspace.id='tk144-workspace';workspace.className='tk144-workspace';
    const video=document.createElement('div');video.className='tk144-video-pane';
    const officials=document.createElement('div');officials.id='tk144-official-pane';officials.className='tk144-official-pane';
    const officialHeading=document.createElement('p');officialHeading.className='tk144-pane-label';
    officialHeading.textContent='Điều khiển điểm · Sân đang Live';
    officials.appendChild(officialHeading);
    workspace.append(video,officials);
    studio.append(header,hint,workspace);
    live.insertBefore(studio,liveGrid);
    video.appendChild(videoCard); // Moves the actual player and source selectors (preserves MediaStream).
    state.root=studio;state.active=true;

    const umpireAnchor=document.createComment('H144 original umpire card');
    umpireCard.parentNode.insertBefore(umpireAnchor,umpireCard);
    state.anchor=umpireAnchor;
    const attachUmpire=()=>{
      if(!isUmpire(T)){
        if(state.umpireCard.parentNode===officials)restoreUmpire();
        officials.hidden=true;toggle.hidden=true;
        return;
      }
      officials.hidden=false;toggle.hidden=false;
      if(state.umpireCard.parentNode!==officials){
        officials.appendChild(state.umpireCard);
      }
    };
    const restoreUmpire=()=>{
      if(state.anchor.parentNode && state.umpireCard.parentNode!==state.anchor.parentNode)
        state.anchor.parentNode.insertBefore(state.umpireCard,state.anchor.nextSibling);
    };
    const syncCourt=()=>{
      const selected=$('stream-court')?.value;
      const target=$('umpire-court');
      if(selected && target && target.value!==selected){
        target.value=selected;
        app.currentCourt=selected;
        app.renderOfficial();
        app.renderLiveScore();
      }
    };

    const updateUi=()=>{
      const active=Boolean(document.fullscreenElement===studio || studio.classList.contains('tk144-pseudo-fullscreen'));
      state.fullscreen=active;
      full.hidden=active;leave.hidden=!active;
      studio.dataset.orientation=mode.value;
      if(active && mode.value==='landscape' && window.matchMedia?.('(orientation:portrait)')?.matches){
        hint.textContent='Hãy xoay ngang điện thoại nếu trình duyệt không hỗ trợ khóa xoay.';
      }else{
        hint.textContent='Video và điều khiển điểm dùng chung một phiên trận đấu.';
      }
    };
    const unlock=async()=>{
      try{if(screen.orientation?.unlock)screen.orientation.unlock()}catch{}
    };
    async function enterFullscreen(){
      if(!isLive(T)) return;
      studio.classList.remove('tk144-pseudo-fullscreen');
      let usedNative=false;
      try{
        if(studio.requestFullscreen){
          await studio.requestFullscreen({navigationUI:'hide'});
          usedNative=true;
        }
      }catch(e){
        hint.textContent='Trình duyệt không cho toàn màn hình thực; dùng chế độ toàn màn hình trong trang.';
      }
      if(!usedNative)studio.classList.add('tk144-pseudo-fullscreen');
      if(usedNative && mode.value!=='auto'){
        try{await screen.orientation?.lock?.(mode.value)}catch{
          hint.textContent='Trình duyệt không hỗ trợ khóa xoay. Hãy xoay điện thoại thủ công.';
        }
      }
      updateUi();
    }
    async function exitFullscreen(){
      if(document.fullscreenElement===studio){
        try{await document.exitFullscreen()}catch{}
      }
      studio.classList.remove('tk144-pseudo-fullscreen');
      await unlock();updateUi();
    }
    mode.addEventListener('change',async()=>{
      state.layout=mode.value;
      if(state.fullscreen && document.fullscreenElement===studio && mode.value!=='auto'){
        try{await screen.orientation?.lock?.(mode.value)}
        catch{hint.textContent='Không khóa được chiều màn hình. Hãy xoay thiết bị thủ công.'}
      }else if(mode.value==='auto')await unlock();
      updateUi();
    });
    full.addEventListener('click',enterFullscreen);
    leave.addEventListener('click',exitFullscreen);
    document.addEventListener('fullscreenchange',updateUi);
    toggle.addEventListener('click',()=>{
      const hidden=officials.classList.toggle('tk144-collapsed');
      toggle.textContent=hidden?'Hiện bảng trọng tài':'Ẩn bảng trọng tài';
      toggle.setAttribute('aria-expanded',String(!hidden));
    });

    // The original app's "Toàn màn hình" used pseudo-fullscreen only for the video.
    // Replace its action so the *whole* studio (video + scoring) expands together.
    const oldFullscreen=$('stream-full');
    if(oldFullscreen){
      oldFullscreen.onclick=enterFullscreen;
      oldFullscreen.textContent='⛶ Toàn màn hình Studio';
    }
    $('stream-court')?.addEventListener('change',syncCourt);
    // Avoid duplicate dashboards by moving the original umpire card, not cloning it.
    const originalShowTab=app.showTab.bind(app);
    app.showTab=function(tab){
      if(tab==='umpire')restoreUmpire();
      const result=originalShowTab(tab);
      if(tab==='live' && isLive(T)){attachUmpire();syncCourt()}
      return result;
    };
    const originalRenderOfficial=app.renderOfficial.bind(app);
    app.renderOfficial=function(...args){
      const result=originalRenderOfficial(...args);
      if(state.active && app.currentTab==='live')syncCourt();
      return result;
    };
    const logout=$('logout-btn');
    logout?.addEventListener('click',()=>{
      void exitFullscreen();restoreUmpire();
    });
    attachUmpire();
    if(app.currentTab==='umpire')restoreUmpire();
    if(app.currentTab==='live')syncCourt();
    updateUi();
    window.TopkeyLiveStudioH144={enterFullscreen,exitFullscreen,
      restoreUmpire,get active(){return state.active}};
    return true;
  }
  const ready=()=>{if(install())return;
    window.__TOPKEY_VNEXT_BOOT?.then(install).catch(()=>{});
    window.addEventListener('topkey:admin-ready',install,{once:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});
  else ready();
})();
