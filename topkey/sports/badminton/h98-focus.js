/* H98: explicit gesture fullscreen; fallback to focus mode where browser refuses. */
(()=>{'use strict';
 const KEY='topkey-h98-focus-v1';
 const shell=document.getElementById('app-shell');if(!shell)return;
 const button=document.createElement('button');button.id='tk98-focus-toggle';button.type='button';button.setAttribute('aria-pressed','false');
 const get=()=>{try{return sessionStorage.getItem(KEY)==='1'}catch{return false}};
 const save=v=>{try{sessionStorage.setItem(KEY,v?'1':'0')}catch{}};
 function setFocus(on){document.documentElement.classList.toggle('tk98-focus',on);document.body.classList.toggle('tk98-focus',on);button.textContent=on?'☰ Mở thanh điều hướng':'⛶ Thu nhỏ · Xem thẻ toàn màn hình';button.setAttribute('aria-pressed',String(on));save(on)}
 shell.prepend(button);setFocus(get());
 button.addEventListener('click',async()=>{
  if(document.body.classList.contains('tk98-focus')){
   setFocus(false);if(document.fullscreenElement&&document.exitFullscreen){try{await document.exitFullscreen()}catch(e){console.warn('Fullscreen exit unavailable',e)}}return;
  }
  // User gesture initiates the fullscreen request before any asynchronous work.
  const target=document.documentElement;
  let request=null;
  try{if(target.requestFullscreen)request=target.requestFullscreen({navigationUI:'hide'});else if(target.webkitRequestFullscreen)request=target.webkitRequestFullscreen()}catch(e){console.info('Fullscreen unsupported',e)}
  setFocus(true);
  if(request&&typeof request.catch==='function')request.catch(()=>{/* browser may forbid fullscreen; focus layout still works */});
 });
 document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&document.body.classList.contains('tk98-focus')){/* Keep focus layout; user may have exited fullscreen with system gesture. */}});
})();
