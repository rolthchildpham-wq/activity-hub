(()=>{'use strict';
const AUTH_ROOT='topkey_badminton_vnext_2026';
const HEADER_KEY='topkey_hub_header_collapsed_v120';
const mobileHeader=window.matchMedia?.('(max-width:650px)');
let headerToggle=null;
function compact(){const cards=document.querySelector('.cards'),exec=document.querySelector('#executive-dashboard');if(!cards||!exec)return;cards.classList.add('compact-sports');if(cards.nextElementSibling!==exec)exec.parentNode.insertBefore(cards,exec);const p=new URLSearchParams(location.search);if(p.get('reason')==='select-sport'){let n=cards.querySelector('.sport-picker-note');if(!n){n=document.createElement('div');n.className='sport-picker-note';cards.prepend(n)}n.textContent='ℹ️ Phiên chọn môn cũ đã hết hạn. Chọn lại môn để tiếp tục.';document.querySelectorAll('main.wrap>section.panel').forEach(x=>{if(/Hãy chọn môn từ Hub/.test(x.textContent||''))x.remove()})}}
function applyAppearance(v={}){const a=v.hubAppearance||v;const title=String(a.title||'').trim(),eyebrow=String(a.eyebrow||'').trim(),bg=String(a.background||'').trim();const h=document.querySelector('.brand-title h1'),e=document.querySelector('.brand-title .eyebrow');if(h&&title)h.textContent=title;if(e&&eyebrow)e.textContent=eyebrow;if(bg){document.body.style.setProperty('--hub-bg-image',`url(${JSON.stringify(bg)})`);document.body.classList.add('hub-custom-bg')}else document.body.classList.remove('hub-custom-bg')}
async function loadAppearance(){if(!window.firebase)return;try{const db=firebase.database(),s=await db.ref(`${AUTH_ROOT}/associationDashboard/hubAppearance`).once('value');applyAppearance(s.val()||{})}catch(e){console.warn('Hub appearance',e?.message||e)}}
function setHeaderCollapsed(value,{persist=true}={}){
 const header=document.querySelector('.top');if(!header)return false;
 const collapsed=!!mobileHeader?.matches&&!!value;
 header.classList.toggle('hub-header-collapsed',collapsed);
 if(headerToggle){headerToggle.setAttribute('aria-expanded',String(!collapsed));headerToggle.textContent=collapsed?'＋':'−';headerToggle.title=collapsed?'Mở rộng phần đầu trang':'Thu gọn phần đầu trang'}
 if(persist&&mobileHeader?.matches)try{localStorage.setItem(HEADER_KEY,collapsed?'1':'0')}catch{}
 return collapsed;
}
function setupHeaderToggle(){
 const header=document.querySelector('.top');if(!header)return;
 if(!headerToggle){headerToggle=document.createElement('button');headerToggle.type='button';headerToggle.className='hub-header-toggle';headerToggle.setAttribute('aria-label','Thu gọn hoặc mở rộng phần đầu trang');headerToggle.addEventListener('click',()=>setHeaderCollapsed(!header.classList.contains('hub-header-collapsed')));header.append(headerToggle)}
 let stored=null;try{stored=localStorage.getItem(HEADER_KEY)}catch{}
 setHeaderCollapsed(mobileHeader?.matches&&stored!=='0',{persist:false});
 mobileHeader?.addEventListener?.('change',event=>setHeaderCollapsed(event.matches&&stored!=='0',{persist:false}));
}
function boot(){setupHeaderToggle();compact();loadAppearance();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.TopkeyHubLayout94={compact,applyAppearance,setHeaderCollapsed};
})();
