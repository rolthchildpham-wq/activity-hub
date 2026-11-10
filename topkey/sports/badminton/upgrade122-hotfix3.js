(()=>{'use strict';
const T=window.Topkey,A=T?.App,U=T?.U;if(!A||A.__u122h3FunFullscreen)return;A.__u122h3FunFullscreen=true;
const $=id=>document.getElementById(id);
const PHRASES=(window.TopkeyUpgrade121?.phrases||[
'{name} đang giữ nhịp rất tốt, pha cầu này đáng chờ đợi!',
'{name} xử lý rất gọn, khán giả chắc đang theo dõi rất chăm chú!',
'{name} đang vào guồng, cùng xem pha tiếp theo nhé!',
'{name} có một pha xử lý rất tự tin!',
'{name} đang di chuyển rất chủ động trên sân!',
'{name} giữ tinh thần thi đấu rất tốt, cố lên!',
'{name} vừa có một tình huống khá đẹp mắt!',
'{name} đang tạo nên một nhịp đấu rất thú vị!',
'{name} bình tĩnh và chắc chắn, pha tiếp theo sẽ rất đáng xem!',
'{name} đang phối hợp rất ăn ý với đồng đội!',
'{name} có phản xạ rất nhanh trong pha vừa rồi!',
'{name} đang duy trì sự tập trung rất tốt!',
'{name} xử lý cầu mềm mại và rất có ý đồ!',
'{name} đang làm cho trận đấu thêm sôi động!',
'{name} có một pha cầu khiến cả sân phải chú ý!',
'{name} đang thi đấu với tinh thần rất tích cực!'
]);
let lastSig='';
function readCourtPlayers(){
 const cards=[...document.querySelectorAll('#umpire-board .tk11-player')];
 return cards.map((el,i)=>{
   const name=(el.querySelector('b')?.textContent||'').trim();if(!name)return null;
   const side=el.dataset.side||((el.closest('.court-half')===document.querySelector('#umpire-board .court-half:first-child'))?'A':'B');
   const key=el.dataset.player||((i%2===0)?'p1':'p2');
   const no=key==='p2'?'2':'1';
   const slot=el.dataset.courtSlot||el.querySelector('.tk11-player-no')?.textContent?.trim()||'';
   const serving=el.classList.contains('serving')||/PHÁT CẦU/i.test(el.textContent||'');
   return {name,side,key,no,slot,serving};
 }).filter(Boolean).slice(0,4);
}
function phraseText(){const p=$('tk122h3-fun-phrase'),pl=$('tk122h3-fun-player');return String(p?.value||'').replaceAll('{name}',pl?.selectedOptions?.[0]?.dataset?.name||pl?.value||'VĐV')}
function renderPreview(){const e=$('tk122h3-fun-preview');if(e)e.textContent=phraseText()||'Chọn VĐV 1–2 đang thi đấu và câu bình luận.'}
function refreshPlayers(){
 const sel=$('tk122h3-fun-player'),btn=$('tk122h3-fun-speak');if(!sel)return;
 const players=readCourtPlayers();const sig=players.map(p=>[p.side,p.key,p.name,p.slot,p.serving?1:0].join(':')).join('|');
 if(sig!==lastSig){const old=sel.value;sel.innerHTML='';players.forEach(p=>{const o=document.createElement('option');o.value=`${p.side}:${p.key}`;o.dataset.name=p.name;o.textContent=`Đội ${p.side} · VĐV ${p.no} · ${p.name}${p.serving?' · 🏸 phát cầu':''}`;sel.appendChild(o)});if(!players.length){const o=document.createElement('option');o.value='';o.textContent='Chưa có VĐV 1–2 trên sân';sel.appendChild(o)}if([...sel.options].some(o=>o.value===old))sel.value=old;lastSig=sig}
 if(btn)btn.disabled=!players.length;renderPreview();
}
function randomPhrase(){const s=$('tk122h3-fun-phrase');if(!s)return;let i=Math.floor(Math.random()*PHRASES.length);if(i===s.selectedIndex)i=(i+1)%PHRASES.length;s.selectedIndex=i;renderPreview()}
async function speak(){const text=phraseText(),players=readCourtPlayers();if(!text||!players.length)return U?.toast?.('Chưa có VĐV 1–2 đang thi đấu','info');try{if(!A.audioUnlocked&&typeof A.unlockAudio==='function')await A.unlockAudio();await Promise.resolve(A.comment?.(text,{kind:'FUN',priority:85,court:A.currentCourt,source:'MANUAL_FUN_FULLSCREEN_U122H3'}));U?.toast?.('Đã phát bình luận vui','ok')}catch(e){U?.toast?.('Không phát được bình luận: '+(e?.message||e),'err')}}
function ensureBar(){
 const card=document.querySelector('#page-umpire > .card'),actions=card?.querySelector('.score-actions');if(!card||!actions)return;
 let box=$('tk122h3-funbar');if(!box){box=document.createElement('div');box.id='tk122h3-funbar';box.className='tk122h3-funbar';box.innerHTML=`<div class="tk122h3-title">😊 Bình luận vui</div><select id="tk122h3-fun-player" aria-label="Chọn VĐV 1 hoặc 2 đang thi đấu"></select><select id="tk122h3-fun-phrase" aria-label="Chọn câu bình luận vui"></select><button id="tk122h3-fun-speak" class="btn ok" type="button">🎙 Nói</button><button id="tk122h3-fun-random" class="btn" type="button">🎲</button><div id="tk122h3-fun-preview" class="tk122h3-preview"></div>`;card.insertBefore(box,actions);
 const ps=$('tk122h3-fun-phrase');PHRASES.forEach((x,i)=>{const o=document.createElement('option');o.value=x;o.textContent=`${i+1}. ${x.replace('{name}','[VĐV]')}`;ps.appendChild(o)});
 $('tk122h3-fun-player').addEventListener('change',renderPreview);ps.addEventListener('change',renderPreview);$('tk122h3-fun-speak').addEventListener('click',speak);$('tk122h3-fun-random').addEventListener('click',randomPhrase);
 }
 refreshPlayers();
}
const base=A.renderUmpire?.bind(A);if(base)A.renderUmpire=function(...args){const out=base(...args);setTimeout(()=>{ensureBar();refreshPlayers()},0);return out};
function boot(){ensureBar();refreshPlayers();setInterval(()=>{if(!$('page-umpire')?.classList.contains('hidden'))refreshPlayers()},800)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.TopkeyUpgrade122Hotfix3={installed:true,feature:'FULLSCREEN_FUN_COMMENTARY_ACTIVE_COURT_PLAYERS',refreshPlayers,readCourtPlayers};
})();
