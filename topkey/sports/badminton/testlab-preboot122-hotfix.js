(()=>{'use strict';
const SPORT='badminton',PREFIX='__testlab_u122_20261031_'+SPORT+'_',PENDING='topkey_testlab_pending_launch',MAX_AGE=180000;
const q=new URLSearchParams(location.search),urlTid=q.get('tid')||'',isSafe=t=>String(t||'').startsWith(PREFIX),isStandalone=()=>matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true;
let pending=null;try{pending=JSON.parse(localStorage.getItem(PENDING)||'null')}catch{}
const pendingOk=!!(pending&&pending.sport===SPORT&&isSafe(pending.tid)&&Date.now()-Number(pending.createdAt||0)<MAX_AGE);
function restore(tid){try{localStorage.removeItem(PENDING)}catch{}const u=new URL(location.href);u.searchParams.set('testlab','1');u.searchParams.set('reset','1');u.searchParams.set('tid',tid);u.searchParams.set('v',String(window.TopkeyRelease?.cacheTag||''));u.searchParams.set('__topkey_build',String(window.TopkeyRelease?.cacheTag||''));location.replace(u.href)}
if(q.get('testlab')==='1'&&!isSafe(urlTid)&&pendingOk){restore(pending.tid);return}
if(!urlTid&&pendingOk&&(isStandalone()||q.get('source')==='pwa')){restore(pending.tid);return}
if(isSafe(urlTid)){try{localStorage.removeItem(PENDING)}catch{};window.__TOPKEY_TESTLAB_TID=urlTid;window.__TOPKEY_TESTLAB_ACTIVE=true}
})();