(()=>{'use strict';
const BUILD=window.TopkeyRelease?.cacheTag||'',VERSION=window.TopkeyRelease?.version||'';
const expected={root:{url:'./release.json'},badminton:{url:'./sports/badminton/build.json'},vnext:{url:'./sports/vnext/build.json'}};
const state={build:BUILD,version:VERSION,status:'CHECKING',root:null,badminton:null,vnext:null,errors:[],checkedAt:0};let checkInFlight=null;
const fetchJson=async url=>{const u=new URL(url,location.href);u.searchParams.set('__release_probe',Date.now()+'_'+Math.random().toString(36).slice(2));const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),5500);try{const r=await fetch(u,{cache:'no-store',signal:controller.signal,headers:{'Cache-Control':'no-cache, no-store, must-revalidate','Pragma':'no-cache'}});if(!r.ok)throw new Error(url+' HTTP '+r.status);return await r.json()}catch(e){if(e?.name==='AbortError')throw new Error(url+' timeout 5.5s · kiểm tra lại kết nối');throw e}finally{clearTimeout(timeout)}};
const same=x=>String(x?.cacheTag||'')===BUILD&&String(x?.version||'')===VERSION;
function ensureBanner(){let el=document.getElementById('topkey-release-health');if(el)return el;el=document.createElement('section');el.id='topkey-release-health';el.className='panel hidden';el.style.cssText='margin-bottom:18px;border-color:#f59e0b';const main=document.querySelector('main.wrap')||document.body;main.prepend(el);return el}
function branchForLink(a){const h=String(a?.getAttribute('href')||'');return h.includes('/badminton/')?'badminton':h.includes('/vnext/')?'vnext':''}
function setBlocked(branch,blocked,msg=''){document.querySelectorAll('a.sport').forEach(a=>{if(branchForLink(a)!==branch)return;a.dataset.releaseBlocked=blocked?'1':'0';a.setAttribute('aria-disabled',blocked?'true':'false');a.style.opacity=blocked?'.55':'';a.style.cursor=blocked?'not-allowed':'';if(blocked)a.title=msg;else a.removeAttribute('title')})}
function render(){const el=ensureBanner(),badOk=same(state.badminton),vnOk=same(state.vnext),rootOk=same(state.root);setBlocked('badminton',!(rootOk&&badOk),'Deploy Cầu lông chưa đồng bộ '+(window.TopkeyRelease?.releaseId||'UNKNOWN'));setBlocked('vnext',!(rootOk&&vnOk),'Deploy VNext chưa đồng bộ '+(window.TopkeyRelease?.releaseId||'UNKNOWN'));if(state.status==='OK'){el.classList.add('hidden');el.innerHTML='';return}el.classList.remove('hidden');const parts=[];if(!rootOk)parts.push('Hub/root');if(!badOk)parts.push('Cầu lông');if(!vnOk)parts.push('VNext');el.innerHTML='<b>⚠️ Deploy chưa đồng bộ - tạm khóa mở môn</b><div class="muted" style="margin-top:6px">'+(window.TopkeyRelease?.releaseId||'Phiên bản hiện tại')+' yêu cầu Hub, Cầu lông và VNext cùng một release. Chưa khớp: '+(parts.join(', ')||'đang kiểm tra')+'. Hãy deploy toàn bộ gói ZIP, không chép rời từng thư mục.</div><div class="muted" style="margin-top:8px;overflow-wrap:anywhere">'+state.errors.map(x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;')).join(' | ')+'</div><button type="button" id="topkey-release-recheck" style="margin-top:10px;padding:8px 14px;cursor:pointer">Kiểm tra lại phiên bản</button>'}
function check(){
 if(checkInFlight)return checkInFlight;
 const promise=(async()=>{
  state.status='CHECKING';state.errors=[];state.root=null;state.badminton=null;state.vnext=null;render();
  const jobs=Object.entries(expected).map(async([k,v])=>{try{state[k]=await fetchJson(v.url)}catch(e){state[k]=null;state.errors.push(String(e?.message||e))}});
  await Promise.all(jobs);state.checkedAt=Date.now();state.status=BUILD&&VERSION&&same(state.root)&&same(state.badminton)&&same(state.vnext)?'OK':'MISMATCH';render();return state;
 })();checkInFlight=promise;promise.finally(()=>{if(checkInFlight===promise)checkInFlight=null}).catch(()=>{});return promise;
}

function canLaunch(sport){const branch=sport==='badminton'?'badminton':'vnext';return state.status==='OK'&&same(state[branch])&&same(state.root)}
document.addEventListener('click',e=>{const a=e.target.closest?.('a.sport');if(a&&a.dataset.releaseBlocked==='1'){e.preventDefault();e.stopImmediatePropagation();ensureBanner().scrollIntoView({behavior:'smooth',block:'center'});return}const b=e.target.closest?.('#testlab-run');if(b){const sport=document.getElementById('testlab-sport')?.value||'badminton';if(!canLaunch(sport)){e.preventDefault();e.stopImmediatePropagation();ensureBanner().scrollIntoView({behavior:'smooth',block:'center'})}}},true);
const qs=new URLSearchParams(location.search);if(qs.get('reason')==='deploy-mismatch'){const el=ensureBanner();el.classList.remove('hidden');el.innerHTML='<b>⚠️ Phát hiện phiên bản không đồng bộ</b><div class="muted" style="margin-top:6px">Trang môn và Hub không cùng release. Hệ thống đã chặn đăng nhập để tránh vòng lặp session. Deploy lại toàn bộ bộ phát hành hiện hành.</div>'}
document.addEventListener('click',e=>{if(e.target?.id==='topkey-release-recheck')check().catch(()=>{})});
window.TopkeyReleaseHealth={BUILD,VERSION,state,check,canLaunch,ready:null};
window.TopkeyReleaseHealth.ready=check();
window.addEventListener('pageshow',()=>setTimeout(()=>check().catch(()=>{}),0),{passive:true});
})();
