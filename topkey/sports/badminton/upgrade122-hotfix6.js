(()=>{
'use strict';
const VERSION='u122h9-20261031';
let installed=false, timer=0, observer=null, lastSig='';
const $=id=>document.getElementById(id);
const fallbackPhrases=[
'{name} đang giữ nhịp rất tốt, pha cầu này đáng chờ đợi!',
'{name} xử lý rất gọn, khán giả đang theo dõi rất chăm chú!',
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
'{name} đang thi đấu với tinh thần rất tích cực!',
'{name} đang chọn vị trí rất thông minh, cùng chờ pha tiếp theo!',
'{name} vừa xử lý một nhịp cầu rất sáng tạo!',
'{name} giữ được sự điềm tĩnh rất đáng khen!',
'{name} đang tăng tốc rất đúng lúc!',
'{name} có bước di chuyển rất linh hoạt!',
'{name} đang tạo ra một nhịp độ thi đấu rất hấp dẫn!',
'{name} phối hợp nhịp nhàng và đầy tập trung!',
'{name} đang mang đến một pha cầu thật vui mắt!'
];
function app(){return window.Topkey?.App||null}
function ui(){return window.Topkey?.U||null}
function phrases(){return Array.isArray(window.TopkeyUpgrade121?.phrases)&&window.TopkeyUpgrade121.phrases.length?window.TopkeyUpgrade121.phrases:fallbackPhrases}
function readCourtPlayers(){
  const board=$('umpire-board'); if(!board) return [];
  const cards=[...board.querySelectorAll('.tk11-player')];
  const halves=[...board.querySelectorAll('.court-half')];
  return cards.map((el,i)=>{
    const rawName=(el.querySelector('b')?.textContent||'').trim(); if(!rawName)return null; const parsed=parseNamePrefix(rawName); const name=parsed.name||rawName;
    const half=el.closest('.court-half');
    const side=el.dataset.side||(half&&halves[0]===half?'A':'B');
    let key=el.dataset.player||'';
    if(!/^p[12]$/i.test(key)){
      const inHalf=half?[...half.querySelectorAll('.tk11-player')].indexOf(el):-1;
      key=(inHalf===1)?'p2':'p1';
    }
    const no=String(key).toLowerCase()==='p2'?'2':'1';
    const serving=el.classList.contains('serving')||/PHÁT CẦU/i.test(el.textContent||'');
    return {name,rawName,side,key:String(key).toLowerCase(),no,serving};
  }).filter(Boolean).slice(0,4);
}
function selectedPlayer(){const s=$('tk122h6-fun-player'),o=s?.selectedOptions?.[0];if(!o)return null;return {name:o.dataset.name||'',rawName:o.dataset.rawName||o.dataset.name||'',side:o.dataset.side||'',key:o.dataset.key||'',address:o.dataset.address||'',pronoun:o.dataset.pronoun||'bạn',gender:o.dataset.gender||''};}
function normalizeGender(v){v=String(v||'').trim().toUpperCase();if(['M','MALE','MAN','NAM','MEN','BOY'].includes(v))return 'M';if(['F','FEMALE','WOMAN','NU','NỮ','WOMEN','GIRL'].includes(v))return 'F';return '';}
function parseNamePrefix(raw){const src=String(raw||'').trim();const m=src.match(/^\s*(MEN|WOMEN)\s*(?:[-_:|/]+|\s+)\s*(.+)$/i);if(!m)return {name:src,gender:''};return {name:String(m[2]||'').trim(),gender:m[1].toUpperCase()==='MEN'?'M':'F'};}
function manualGender(){const v=String($('tk122h9-address-mode')?.dataset.mode||'AUTO').toUpperCase();return v==='M'||v==='F'?v:'';}
function setAddressMode(mode){mode=['M','F'].includes(mode)?mode:'AUTO';const wrap=$('tk122h9-address-mode');if(wrap)wrap.dataset.mode=mode;document.querySelectorAll('#tk122h9-address-mode [data-gender-mode]').forEach(b=>b.classList.toggle('active',b.dataset.genderMode===mode));lastSig='';refreshPlayers();}
function addressForPlayer(p){const A=app();if(!p?.name)return {address:'VĐV',pronoun:'bạn',name:'VĐV',gender:''};const pref=parseNamePrefix(p.rawName||p.name);let cleanName=pref.name||String(p.name||'').trim();let g=manualGender()||pref.gender||'';try{if(!g){const court=A?.currentCourt||$('umpire-court')?.value||$('stream-court')?.value||'';const st=A?.state?.activeMatches?.[court];const m=A?.state?.matches?.[st?.matchId]||{};const teamId=p.side==='A'?m.teamAId:m.teamBId;const team=A?.state?.teams?.[teamId]||{};g=normalizeGender(team?.[p.key+'Gender']||team?.[p.key+'_gender']||team?.players?.[p.key]?.gender||team?.members?.[p.key]?.gender);if(!g){const cat=String(m.category||team.category||'').toUpperCase();if(cat==='MEN'||cat==='MALE')g='M';else if(cat==='WOMEN'||cat==='FEMALE')g='F';}}}catch{}const title=g==='M'?'Anh':g==='F'?'Chị':'Bạn';const pronoun=g==='M'?'anh':g==='F'?'chị':'bạn';return {address:`${title} ${cleanName}`.trim(),pronoun,name:cleanName,gender:g};}
function phraseText(){const p=$('tk122h6-fun-phrase'),pl=selectedPlayer();const raw=String(p?.value||'').trim();if(!raw)return '';const a=pl?.address||((pl&&addressForPlayer(pl).address)||'VĐV');const pronoun=pl?.pronoun||((pl&&addressForPlayer(pl).pronoun)||'bạn');if(/^\s*\{name\}/.test(raw))return raw.replace('{name}',a);return `${a}, ${raw.replaceAll('{name}',pronoun).replace(/^./,c=>c.toLowerCase())}`;}
function preview(){const e=$('tk122h6-fun-preview');if(e)e.textContent=phraseText()||'Chọn VĐV 1–2 đang thi đấu và câu bình luận.'}
function refreshPlayers(){
  const sel=$('tk122h6-fun-player'),btn=$('tk122h6-fun-speak'); if(!sel)return;
  const ps=readCourtPlayers();
  const sig=ps.map(p=>[p.side,p.key,p.rawName||p.name,p.serving?1:0,manualGender()||'AUTO'].join(':')).join('|');
  if(sig!==lastSig){
    const old=sel.value; sel.innerHTML='';
    ps.forEach(p=>{const o=document.createElement('option'),a=addressForPlayer(p);o.value=`${p.side}:${p.key}`;o.dataset.name=a.name||p.name;o.dataset.rawName=p.rawName||p.name;o.dataset.side=p.side;o.dataset.key=p.key;o.dataset.address=a.address;o.dataset.pronoun=a.pronoun;o.dataset.gender=a.gender||'';o.textContent=`Đội ${p.side} · VĐV ${p.no} · ${a.address}${p.serving?' · 🏸 phát cầu':''}`;sel.appendChild(o)});
    if(!ps.length){const o=document.createElement('option');o.value='';o.textContent='Chưa có VĐV 1–2 trên sân';sel.appendChild(o)}
    if([...sel.options].some(o=>o.value===old))sel.value=old;
    lastSig=sig;
  }
  if(btn)btn.disabled=!ps.length; preview();
}
function randomPhrase(){const s=$('tk122h6-fun-phrase');if(!s)return;const list=phrases();let i=Math.floor(Math.random()*list.length);if(i===s.selectedIndex&&list.length>1)i=(i+1)%list.length;s.selectedIndex=i;preview()}
async function speak(){
  const A=app(), text=phraseText(); if(!A||!readCourtPlayers().length)return ui()?.toast?.('Chưa có VĐV 1–2 đang thi đấu','info');
  try{
    if(!A.audioUnlocked&&typeof A.unlockAudio==='function')await A.unlockAudio();
    if(typeof A.comment==='function') await Promise.resolve(A.comment(text,{kind:'FUN',priority:85,court:A.currentCourt,source:'MANUAL_FUN_FULLSCREEN_U122H6'}));
    else if('speechSynthesis'in window){speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(text))}
    ui()?.toast?.('Đã phát bình luận vui','ok');
  }catch(e){ui()?.toast?.('Không phát được bình luận: '+(e?.message||e),'err')}
}
function ensureBar(){
  const page=$('page-umpire');
  const card=page?.querySelector(':scope > .card')||page?.querySelector('.card');
  const actions=card?.querySelector('.score-actions');
  if(!card||!actions||!$('umpire-board'))return false;
  let box=$('tk122h6-funbar');
  if(!box){
    box=document.createElement('div'); box.id='tk122h6-funbar'; box.className='tk122h6-funbar';
    box.innerHTML='<div class="tk122h6-title">😊 Bình luận vui</div><select id="tk122h6-fun-player" aria-label="Chọn VĐV 1 hoặc 2 đang thi đấu"></select><div id="tk122h9-address-mode" class="tk122h9-address-mode" data-mode="AUTO" aria-label="Chọn cách xưng hô"><button type="button" class="active" data-gender-mode="AUTO">Tự động</button><button type="button" data-gender-mode="M">Anh</button><button type="button" data-gender-mode="F">Chị</button></div><select id="tk122h6-fun-phrase" aria-label="Chọn câu bình luận vui"></select><button id="tk122h6-fun-speak" class="btn ok" type="button">🎙 Nói</button><button id="tk122h6-fun-random" class="btn" type="button">🎲</button><div id="tk122h6-fun-preview" class="tk122h6-preview"></div>';
    card.insertBefore(box,actions);
    const p=$('tk122h6-fun-phrase'); phrases().forEach((x,i)=>{const o=document.createElement('option');o.value=x;o.textContent=`${i+1}. ${x.replace('{name}','[VĐV]')}`;p.appendChild(o)});
    $('tk122h6-fun-player')?.addEventListener('change',preview); document.querySelectorAll('#tk122h9-address-mode [data-gender-mode]').forEach(b=>b.addEventListener('click',()=>setAddressMode(b.dataset.genderMode)));
    p?.addEventListener('change',preview);
    $('tk122h6-fun-speak')?.addEventListener('click',speak);
    $('tk122h6-fun-random')?.addEventListener('click',randomPhrase);
  }else if(box.parentElement!==card){card.insertBefore(box,actions)}
  refreshPlayers(); return true;
}
function attachRenderHook(){
  const A=app(); if(!A||A.__u122h6Hooked)return false;
  A.__u122h6Hooked=true;
  const base=typeof A.renderUmpire==='function'?A.renderUmpire.bind(A):null;
  if(base)A.renderUmpire=function(...args){const out=base(...args);setTimeout(()=>{ensureBar();refreshPlayers()},0);return out};
  return true;
}
function tick(){attachRenderHook();if(!$('page-umpire')?.classList.contains('hidden')){ensureBar();refreshPlayers()}}
function install(){
  if(installed)return; installed=true;
  // Hide previous versions to guarantee one compact control only.
  const style=document.createElement('style');style.id='tk122h6-inline-guard';style.textContent='#tk121-fun-commentary,#tk122h3-funbar{display:none!important}';document.head.appendChild(style);
  tick();
  // H34: render hook + scoped observer are enough; avoid perpetual 700ms polling and body-wide class observation.
  const ump=$('page-umpire');
  observer=new MutationObserver(()=>{if(!ump?.classList.contains('hidden'))requestAnimationFrame(tick)});
  if(ump)observer.observe(ump,{subtree:true,childList:true});
  window.addEventListener('topkey:admin-ready',()=>setTimeout(tick,0));
  document.addEventListener('fullscreenchange',()=>setTimeout(tick,50));
  window.addEventListener('resize',()=>setTimeout(tick,80),{passive:true});
  window.TopkeyUpgrade122Hotfix6={installed:true,VERSION,ensureBar,refreshPlayers,readCourtPlayers,setAddressMode,parseNamePrefix};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
