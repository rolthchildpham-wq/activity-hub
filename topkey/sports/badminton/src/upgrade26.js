(() => {
'use strict';
const T=window.Topkey,App=T?.App;
if(!T||!App||App.__upgrade26Installed)return;
App.__upgrade26Installed=true;
const $=id=>document.getElementById(id);
const fold=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const tokens=v=>fold(v).split(/\s+/).filter(Boolean);
function teamText(id){
  const t=App.state.teams?.[id]||{};
  return [t.code,t.name,t.p1,t.p2,t.dept].filter(Boolean).join(' ');
}
function matchText(m){
  if(!m)return'';
  return fold([m.code,m.id,m.category,m.stage,m.round,m.date,m.time,teamText(m.teamAId),teamText(m.teamBId)].filter(Boolean).join(' '));
}
function matchPass(m,q){
  const qs=tokens(q);if(!qs.length)return true;
  const hay=matchText(m);return qs.every(x=>hay.includes(x));
}
function findMatchForCard(card){
  const code=card?.querySelector('.tk12-match-code')?.textContent?.trim()||'';
  if(!code)return null;
  return Object.values(App.state.matches||{}).find(m=>String(m.code||m.id||'').trim()===code)||null;
}
function ensureSearchUi(){
  if($('tk16-public-search-input'))return true;
  try{window.TopkeyUpgrade16?.applyPublicFilter?.(App);}catch{}
  return !!$('tk16-public-search-input');
}
function setFiltered(el,filtered){
  if(!el)return;
  el.classList.toggle('tk26-search-hidden',!!filtered);
  el.toggleAttribute('hidden',!!filtered);
  el.setAttribute('aria-hidden',filtered?'true':'false');
}
function applyPublicSearch26(){
  const sched=$('spectator-schedule');if(!sched)return;
  ensureSearchUi();
  const input=$('tk16-public-search-input');if(!input)return;
  const raw=input.value||'';const q=fold(raw);App.publicScheduleSearch=raw;
  sched.querySelectorAll('.tk24-public-empty,.tk16-search-empty,.tk26-public-empty').forEach(x=>x.remove());
  const groups=[];let group=null,shown=0,all=0;
  [...sched.children].forEach(el=>{
    if(el.classList.contains('tk12-public-day')){
      group={header:el,total:0,visible:0};groups.push(group);return;
    }
    if(!el.classList.contains('tk12-public-match'))return;
    all++;if(group)group.total++;
    const m=findMatchForCard(el);
    // Use Firebase match/team data. Visible card text is a safe fallback while data is refreshing.
    const ok=!q||(m?matchPass(m,raw):tokens(raw).every(x=>fold(el.textContent).includes(x)));
    setFiltered(el,!ok);
    if(ok){shown++;if(group)group.visible++;}
  });
  groups.forEach(g=>{
    setFiltered(g.header,!!q&&g.visible===0);
    const span=g.header.querySelector('span');
    if(span)span.textContent=q?`${g.visible}/${g.total} trận phù hợp`:`${g.total} trận`;
  });
  const count=$('tk16-public-search-count');
  if(count)count.textContent=q?`Tìm thấy ${shown}/${all} trận`:`${all} trận trong lịch`;
  if(q&&shown===0){
    const d=document.createElement('div');d.className='empty tk26-public-empty';
    d.textContent='Không tìm thấy lịch theo tên VĐV / đội / mã trận.';sched.appendChild(d);
  }
}
function bindPublicSearch26(){
  if(!ensureSearchUi())return;
  const input=$('tk16-public-search-input');if(!input||input.dataset.u26Bound==='1')return;
  input.dataset.u26Bound='1';
  const run=()=>applyPublicSearch26();
  input.addEventListener('input',run);
  input.addEventListener('search',run);
  input.addEventListener('change',run);
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run();}});
  $('tk16-public-search-btn')?.addEventListener('click',run);
  $('tk16-public-search-clear')?.addEventListener('click',()=>setTimeout(()=>{input.value='';App.publicScheduleSearch='';applyPublicSearch26();input.focus();},0));
}
function install(){
  const base=App.renderSpectator?.bind(App);
  if(base&&!App.__u26Spectator){
    App.__u26Spectator=true;
    App.renderSpectator=function(...args){
      const out=base(...args);
      setTimeout(()=>{bindPublicSearch26();applyPublicSearch26();},0);
      return out;
    };
  }
  const rerun=()=>{if(location.hash==='#spectator')setTimeout(()=>{bindPublicSearch26();applyPublicSearch26();},0);};
  addEventListener('hashchange',rerun);
  setTimeout(rerun,0);
}
install();
window.TopkeyUpgrade26={fold,tokens,matchText,matchPass,applyPublicSearch:applyPublicSearch26};
})();
