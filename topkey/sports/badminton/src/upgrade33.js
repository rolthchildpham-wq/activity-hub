(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,Up9=window.TopkeyUpgrade9,Up20=window.TopkeyUpgrade20;
if(!T||!App||!U||App.__upgrade33Installed)return;
App.__upgrade33Installed=true;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fold=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const samePlayer=(a,b)=>!!fold(a)&&fold(a)===fold(b);
const fmtDate=v=>{const p=String(v||'').split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:String(v||'')};
const localISO=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const lang=()=>window.TopkeyI18n?.language||'vi';
const tr=(vi,en,zh)=>lang()==='en'?en:lang()==='zh'?zh:vi;
const participants=m=>[m.teamAId,m.teamBId].filter(Boolean);
const teamPeople=id=>{const t=App.state.teams?.[id]||{};return [t.p1,t.p2].map(x=>String(x||'').trim()).filter(Boolean)};
const matchPeople=m=>{const seen=new Set(),out=[];participants(m).flatMap(teamPeople).forEach(n=>{const k=fold(n);if(k&&!seen.has(k)){seen.add(k);out.push(n)}});return out};
const toMin=t=>{const[a,b]=String(t||'00:00').split(':').map(Number);return(a||0)*60+(b||0)};
const minToTime=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
const DRAFT_KEY=()=>`topkey_scheduler_player_rules_v33:${T.Data?.tid||'main_2026'}`;
const selections={busy:new Set(),priority:new Set(),limit:new Set()};
let renderTimer=0;

function cfg(){
  const s=App.state.config?.scheduler||{},base=typeof App.schedulerConfig==='function'?App.schedulerConfig():{};
  return {...base,
    playerBusy:Array.isArray(s.playerBusy)?s.playerBusy:(base.playerBusy||[]),
    playerPriority:Array.isArray(s.playerPriority)?s.playerPriority:(base.playerPriority||[]),
    playerDailyLimits:Array.isArray(s.playerDailyLimits)?s.playerDailyLimits:(base.playerDailyLimits||[]),
    playerTimeWindows:Array.isArray(s.playerTimeWindows)?s.playerTimeWindows:(base.playerTimeWindows||[])
  };
}
async function saveCfg(next,type){
  if(typeof App.saveSchedulerConfig==='function')await App.saveSchedulerConfig(next,type);
  else if(Up9?.saveScheduler)await Up9.saveScheduler(next,type);
  else await T.Data.queueSet('config/scheduler',next,{type});
  App.state.config=App.state.config||{};App.state.config.scheduler=next;
  renderAll();
}
function dateRange(from,to){
  if(!from||!to||to<from)return[];
  if(typeof App.dateRange==='function')return App.dateRange(from,to,true);
  const out=[],d=new Date(from+'T12:00:00'),end=new Date(to+'T12:00:00');
  for(let i=0;d<=end&&i<370;i++,d.setDate(d.getDate()+1))out.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
  return out;
}
function directory(){
  const map=new Map();
  Object.values(App.state.teams||{}).filter(t=>!t.withdrawn).forEach(t=>{
    [t.p1,t.p2].forEach(raw=>{const name=String(raw||'').trim(),key=fold(name);if(!key)return;let p=map.get(key);if(!p){p={key,name,categories:new Set(),teams:[]};map.set(key,p)}
      if(t.category)p.categories.add(String(t.category));p.teams.push({id:t.id,code:t.code||'',name:t.name||'',category:t.category||''});
    });
  });
  return [...map.values()].map(p=>({...p,categories:[...p.categories].sort(),teams:p.teams.sort((a,b)=>String(a.code).localeCompare(String(b.code)))})).sort((a,b)=>a.name.localeCompare(b.name,'vi'));
}
function personMeta(name){
  const p=directory().find(x=>samePlayer(x.name,name));if(!p)return {categories:[],teams:[]};return p;
}
function personSubtitle(p){
  const cats=(p.categories||[]).join(' · ')||tr('Chưa có nội dung','No category','暂无项目');
  const teams=(p.teams||[]).map(t=>t.code||t.name).filter(Boolean).join(', ');
  return teams?`${cats} · ${teams}`:cats;
}
function saveDraft(){
  try{const values={};['busy','priority','limit'].forEach(kind=>{const prefix=`tk33-${kind}`;values[kind]={search:$(`${prefix}-search`)?.value||'',from:$(`${prefix}-from`)?.value||'',to:$(`${prefix}-to`)?.value||'',max:$(`${prefix}-max`)?.value||'',selected:[...selections[kind]]};});localStorage.setItem(DRAFT_KEY(),JSON.stringify({version:33,updatedAt:Date.now(),values}));}catch{}
}
function readDraft(){try{return JSON.parse(localStorage.getItem(DRAFT_KEY())||'null')}catch{return null}}
function restoreDraft(){
  const d=readDraft()?.values||{};
  ['busy','priority','limit'].forEach(kind=>{const v=d[kind]||{},prefix=`tk33-${kind}`;if(v.search!==undefined&&$(`${prefix}-search`))$(`${prefix}-search`).value=v.search;if(v.from&&$(`${prefix}-from`))$(`${prefix}-from`).value=v.from;if(v.to&&$(`${prefix}-to`))$(`${prefix}-to`).value=v.to;if(v.max&&$(`${prefix}-max`))$(`${prefix}-max`).value=v.max;selections[kind]=new Set(Array.isArray(v.selected)?v.selected:[]);});
}
function defaultDates(){const from=$('auto-date')?.value||localISO(),to=$('auto-end-date')?.value||from;return{from,to};}
function setDefaultDates(){const d=defaultDates();['busy','priority','limit'].forEach(kind=>{const f=$(`tk33-${kind}-from`),t=$(`tk33-${kind}-to`);if(f&&!f.value)f.value=d.from;if(t&&!t.value)t.value=d.to;});}

function playerPickerHTML(kind){return `<div class="tk33-player-tools"><div class="field"><label>${tr('Tìm VĐV','Find player','查找运动员')}</label><input id="tk33-${kind}-search" type="search" autocomplete="off" placeholder="${tr('VD: BẮC, TÂN, 夏...','e.g. BẮC, TÂN, 夏...','例如：BẮC、TÂN、夏...')}"></div><div class="tk33-picker-actions"><button id="tk33-${kind}-all" class="btn mini" type="button">${tr('Chọn tất cả','Select all','全选')}</button><button id="tk33-${kind}-none" class="btn mini" type="button">${tr('Bỏ chọn','Clear','清除')}</button></div></div><div id="tk33-${kind}-picker" class="tk33-player-picker"></div>`;}
function ensureUI(){
  const stack=document.querySelector('#page-schedule .scheduler-rule-stack');if(!stack)return false;
  document.querySelector('.scheduler-priority')?.classList.add('tk33-legacy-hidden');
  document.querySelector('.scheduler-limit')?.classList.add('tk33-legacy-hidden');
  $('tk9-player-busy-card')?.classList.add('tk33-legacy-hidden');
  $('tk9-quick-limit-card')?.classList.add('tk33-legacy-hidden');
  if($('tk33-player-busy-card'))return true;
  const busy=document.createElement('div');busy.id='tk33-player-busy-card';busy.className='subcard tk33-rule-card tk33-busy-card';busy.innerHTML=`<h3>👤 ${tr('NGÀY BẬN THEO VĐV','PLAYER BUSY DAYS','按运动员设置不可用日期')}</h3><p class="note">${tr('Chọn VĐV theo tên. Nếu một người tham gia nhiều nội dung, ngày bận áp dụng cho tất cả đội/nội dung của người đó. Sau khi lưu có thể xóa/thêm từng ngày ngay tại dòng VĐV.','Select players by name. If one player joins multiple categories, busy days apply across every team/category. Add or remove individual dates directly from the player row.','按姓名选择运动员。同一运动员参加多个项目时，不可用日期会作用于其所有队伍/项目；保存后可在运动员行中逐日添加或删除。')}</p><div class="tk33-rule-toolbar"><div class="field"><label>${tr('Từ ngày','From date','开始日期')}</label><input id="tk33-busy-from" type="date"></div><div class="field"><label>${tr('Đến ngày','To date','结束日期')}</label><input id="tk33-busy-to" type="date"></div><button id="tk33-busy-apply" class="btn warn" type="button">+ ${tr('Ghi nhận ngày bận','Save busy days','保存不可用日期')}</button></div>${playerPickerHTML('busy')}<div id="tk33-busy-list" class="tk33-person-list"></div>`;
  const priority=document.createElement('div');priority.id='tk33-player-priority-card';priority.className='subcard tk33-rule-card tk33-priority-card';priority.innerHTML=`<h3>⭐ ${tr('ƯU TIÊN XẾP LỊCH THEO VĐV / NHIỀU NỘI DUNG','PLAYER PRIORITY ACROSS CATEGORIES','按运动员跨项目优先排程')}</h3><p class="note">${tr('Ưu tiên theo tên VĐV thay vì chỉ theo một đội. Người tham gia MEN + MIX sẽ được ưu tiên trên cả hai nội dung trong các ngày đã chọn.','Prioritize by player name instead of a single team. A player in MEN + MIX is prioritized across both categories on the selected dates.','按运动员姓名而非单一队伍设置优先级。参加 MEN + MIX 的运动员会在所选日期跨两个项目获得优先排程。')}</p><div class="tk33-rule-toolbar"><div class="field"><label>${tr('Từ ngày','From date','开始日期')}</label><input id="tk33-priority-from" type="date"></div><div class="field"><label>${tr('Đến ngày','To date','结束日期')}</label><input id="tk33-priority-to" type="date"></div><button id="tk33-priority-apply" class="btn ok" type="button">⭐ ${tr('Áp dụng ưu tiên','Apply priority','应用优先')}</button></div>${playerPickerHTML('priority')}<div id="tk33-priority-list" class="tk33-person-list"></div><details id="tk33-legacy-team-priority" class="tk33-legacy-box"><summary>${tr('Quy tắc ưu tiên theo đội từ phiên bản cũ','Legacy team-priority rules','旧版队伍优先规则')} <span id="tk33-legacy-priority-count" class="pill">0</span></summary><p class="note">${tr('Các rule cũ vẫn có hiệu lực. Có thể xóa tại đây; rule mới nên tạo theo VĐV.','Legacy rules remain active. Remove them here; create new rules by player.','旧规则仍然有效。可在此删除；新规则建议按运动员创建。')}</p><div id="tk33-legacy-priority-list" class="rule-list"></div></details>`;
  const limit=document.createElement('div');limit.id='tk33-player-limit-card';limit.className='subcard tk33-rule-card tk33-limit-card';limit.innerHTML=`<h3>🔢 ${tr('GIỚI HẠN SỐ TRẬN / NGÀY THEO VĐV (GỘP 2 CÀI ĐẶT CŨ)','PLAYER MATCHES/DAY LIMIT (MERGED)','按运动员设置每日比赛上限（合并旧设置）')}</h3><p class="note">${tr('Đây là khối duy nhất thay cho “Thiết lập nhiều đội thi đấu nhiều trận/ngày” và “Ngoại lệ 2–4 trận/ngày”. Giới hạn được tính trên TỔNG số trận của VĐV trong tất cả nội dung. Rule đội cũ vẫn được đọc để tương thích dữ liệu cũ.','This single block replaces both legacy daily-limit panels. The limit is counted across ALL matches the player has in every category. Legacy team rules remain readable for backward compatibility.','此区块合并两个旧的每日场次设置。上限按运动员在所有项目中的比赛总数计算；旧队伍规则仍会读取以兼容历史数据。')}</p><div class="tk33-rule-toolbar"><div class="field"><label>${tr('Từ ngày','From date','开始日期')}</label><input id="tk33-limit-from" type="date"></div><div class="field"><label>${tr('Đến ngày','To date','结束日期')}</label><input id="tk33-limit-to" type="date"></div><div class="field"><label>${tr('Tối đa / VĐV / ngày','Max / player / day','每名运动员每日上限')}</label><select id="tk33-limit-max"><option value="1">1 ${tr('trận/ngày','match/day','场/天')}</option><option value="2">2 ${tr('trận/ngày','matches/day','场/天')}</option><option value="3">3 ${tr('trận/ngày','matches/day','场/天')}</option><option value="4">4 ${tr('trận/ngày','matches/day','场/天')}</option></select></div><button id="tk33-limit-apply" class="btn primary" type="button">+ ${tr('Áp dụng giới hạn','Apply limit','应用上限')}</button></div>${playerPickerHTML('limit')}<div id="tk33-limit-list" class="tk33-person-list"></div><details id="tk33-legacy-team-limits" class="tk33-legacy-box"><summary>${tr('Quy tắc giới hạn theo đội từ phiên bản cũ','Legacy team-limit rules','旧版队伍上限规则')} <span id="tk33-legacy-count" class="pill">0</span></summary><p class="note">${tr('Các rule này vẫn có hiệu lực để không làm mất cấu hình cũ. Có thể xóa từng rule tại đây; rule mới nên tạo theo VĐV ở phía trên.','These rules remain active so old configuration is not lost. You may remove them here; create new rules by player above.','这些规则仍然有效以避免丢失旧配置。可在此逐条删除；新规则建议在上方按运动员创建。')}</p><div id="tk33-legacy-limit-list" class="rule-list"></div></details>`;
  const teamBusy=document.querySelector('.scheduler-busy'),withdraw=document.querySelector('.scheduler-withdraw');
  if(teamBusy){teamBusy.after(busy);busy.after(priority);priority.after(limit);}else if(withdraw){stack.insertBefore(busy,withdraw);busy.after(priority);priority.after(limit);}else stack.append(busy,priority,limit);
  bindUI();restoreDraft();setDefaultDates();renderAll();return true;
}
function bindUI(){
  ['busy','priority','limit'].forEach(kind=>{
    $(`tk33-${kind}-search`)?.addEventListener('input',()=>{renderPicker(kind);saveDraft()});
    $(`tk33-${kind}-all`)?.addEventListener('click',()=>{directory().forEach(p=>selections[kind].add(p.key));renderPicker(kind);saveDraft()});
    $(`tk33-${kind}-none`)?.addEventListener('click',()=>{selections[kind].clear();renderPicker(kind);saveDraft()});
    $(`tk33-${kind}-from`)?.addEventListener('change',saveDraft);$(`tk33-${kind}-to`)?.addEventListener('change',saveDraft);
  });
  $('tk33-limit-max')?.addEventListener('change',saveDraft);
  $('tk33-busy-apply')?.addEventListener('click',()=>applyRange('busy'));
  $('tk33-priority-apply')?.addEventListener('click',()=>applyRange('priority'));
  $('tk33-limit-apply')?.addEventListener('click',()=>applyRange('limit'));
  addEventListener('pagehide',saveDraft);
}
function renderPicker(kind){
  const box=$(`tk33-${kind}-picker`);if(!box)return;const q=fold($(`tk33-${kind}-search`)?.value||''),players=directory();box.replaceChildren();
  players.filter(p=>!q||fold(`${p.name} ${personSubtitle(p)}`).includes(q)).forEach(p=>{const label=document.createElement('label');label.className='tk33-player-pick';const cb=document.createElement('input');cb.type='checkbox';cb.dataset.playerKey=p.key;cb.checked=selections[kind].has(p.key);cb.onchange=()=>{cb.checked?selections[kind].add(p.key):selections[kind].delete(p.key);saveDraft()};const text=document.createElement('span');text.innerHTML=`<b>${esc(p.name)}</b><small>${esc(personSubtitle(p))}</small>`;label.append(cb,text);box.appendChild(label)});
  if(!box.children.length){const e=document.createElement('span');e.className='muted';e.textContent=tr('Không tìm thấy VĐV','No players found','未找到运动员');box.appendChild(e)}
}
function selectedPlayers(kind){const dir=directory(),keys=selections[kind];return dir.filter(p=>keys.has(p.key));}
function normalizePlayerRows(rows,kind){
  const map=new Map();(rows||[]).forEach(r=>{if(!r?.name||!r?.date)return;const key=`${fold(r.name)}|${r.date}`;if(kind==='limit'){const max=Math.max(1,Math.min(4,Number(r.max)||1));map.set(key,{...r,max});}else map.set(key,{...r});});return [...map.values()].sort((a,b)=>fold(a.name).localeCompare(fold(b.name))||String(a.date).localeCompare(String(b.date)));
}
async function applyRange(kind){
  const players=selectedPlayers(kind),from=$(`tk33-${kind}-from`)?.value,to=$(`tk33-${kind}-to`)?.value||from,dates=dateRange(from,to);
  if(!players.length)return U.toast(tr('Chọn ít nhất 1 VĐV','Select at least one player','请至少选择一名运动员'),'err');
  if(!from||!to||to<from||!dates.length)return U.toast(tr('Chọn khoảng ngày hợp lệ','Choose a valid date range','请选择有效日期范围'),'err');
  const next=cfg(),field=kind==='busy'?'playerBusy':kind==='priority'?'playerPriority':'playerDailyLimits';next[field]=Array.isArray(next[field])?next[field]:[];const max=kind==='limit'?Math.max(1,Math.min(4,Number($('tk33-limit-max')?.value)||1)):null;
  for(const p of players)for(const date of dates){const key=next[field].findIndex(r=>samePlayer(r.name,p.name)&&r.date===date);const row=kind==='limit'?{name:p.name,date,max,updatedAt:Date.now()}:{name:p.name,date,updatedAt:Date.now()};if(key>=0)next[field][key]={...next[field][key],...row};else next[field].push(row);}
  next[field]=normalizePlayerRows(next[field],kind);
  await saveCfg(next,kind==='busy'?'SCHED_PLAYER_BUSY_RANGE':kind==='priority'?'SCHED_PLAYER_PRIORITY_RANGE':'SCHED_PLAYER_DAILY_LIMIT_RANGE');selections[kind].clear();renderPicker(kind);saveDraft();
  U.toast(kind==='limit'?tr(`Đã đặt tối đa ${max} trận/ngày cho ${players.length} VĐV trên ${dates.length} ngày`,`Set max ${max} matches/day for ${players.length} players across ${dates.length} days`,`已为 ${players.length} 名运动员在 ${dates.length} 天内设置每日最多 ${max} 场`):tr(`Đã lưu ${players.length} VĐV · ${dates.length} ngày`,`Saved ${players.length} players · ${dates.length} days`,`已保存 ${players.length} 名运动员 · ${dates.length} 天`),'ok');
}
async function removePlayerDate(kind,name,date){const next=cfg(),field=kind==='busy'?'playerBusy':kind==='priority'?'playerPriority':'playerDailyLimits';next[field]=(next[field]||[]).filter(r=>!(samePlayer(r.name,name)&&r.date===date));await saveCfg(next,`SCHED_PLAYER_${kind.toUpperCase()}_REMOVE_DATE`);}
async function removePlayerAll(kind,name){const next=cfg(),field=kind==='busy'?'playerBusy':kind==='priority'?'playerPriority':'playerDailyLimits';next[field]=(next[field]||[]).filter(r=>!samePlayer(r.name,name));await saveCfg(next,`SCHED_PLAYER_${kind.toUpperCase()}_REMOVE_ALL`);}
async function addOneDate(kind,name,row){const date=row.querySelector('.tk33-add-date')?.value;if(!date)return U.toast(tr('Chọn ngày cần thêm','Choose a date to add','请选择要添加的日期'),'err');const next=cfg(),field=kind==='busy'?'playerBusy':kind==='priority'?'playerPriority':'playerDailyLimits';next[field]=Array.isArray(next[field])?next[field]:[];const max=kind==='limit'?Math.max(1,Math.min(4,Number(row.querySelector('.tk33-add-max')?.value)||1)):null;const i=next[field].findIndex(r=>samePlayer(r.name,name)&&r.date===date),value=kind==='limit'?{name,date,max,updatedAt:Date.now()}:{name,date,updatedAt:Date.now()};if(i>=0)next[field][i]={...next[field][i],...value};else next[field].push(value);next[field]=normalizePlayerRows(next[field],kind);await saveCfg(next,`SCHED_PLAYER_${kind.toUpperCase()}_ADD_DATE`);}
function grouped(rows){const map=new Map();(rows||[]).forEach(r=>{const key=fold(r.name);if(!key||!r.date)return;if(!map.has(key))map.set(key,{name:r.name,rows:[]});map.get(key).rows.push(r)});return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'vi')).map(g=>({...g,rows:g.rows.sort((a,b)=>String(a.date).localeCompare(String(b.date)))}));}
function renderRuleList(kind){
  const box=$(`tk33-${kind}-list`);if(!box)return;const c=cfg(),rows=kind==='busy'?c.playerBusy:kind==='priority'?c.playerPriority:c.playerDailyLimits;box.replaceChildren();
  grouped(rows).forEach(g=>{const meta=personMeta(g.name),row=document.createElement('div');row.className='tk33-person-row';const head=document.createElement('div');head.className='tk33-person-head';head.innerHTML=`<div><b>👤 ${esc(g.name)}</b><small>${esc(personSubtitle(meta))}</small></div>`;const del=document.createElement('button');del.type='button';del.className='btn mini danger';del.textContent=tr('Xóa VĐV','Remove player','删除运动员');del.onclick=()=>removePlayerAll(kind,g.name);head.appendChild(del);const chips=document.createElement('div');chips.className='tk33-date-chips';g.rows.forEach(r=>{const chip=document.createElement('span');chip.className='tk33-date-chip';const label=kind==='limit'?`${fmtDate(r.date)} · ${Number(r.max)||1}/${tr('ngày','day','天')}`:kind==='priority'?`⭐ ${fmtDate(r.date)}`:`⛔ ${fmtDate(r.date)}`;chip.innerHTML=`<span>${esc(label)}</span>`;const x=document.createElement('button');x.type='button';x.textContent='×';x.title=tr('Xóa ngày này','Remove this date','删除此日期');x.onclick=()=>removePlayerDate(kind,g.name,r.date);chip.appendChild(x);chips.appendChild(chip)});const add=document.createElement('div');add.className='tk33-add-one';add.innerHTML=`<input class="tk33-add-date" type="date">${kind==='limit'?`<select class="tk33-add-max"><option value="1">1/${tr('ngày','day','天')}</option><option value="2">2/${tr('ngày','day','天')}</option><option value="3">3/${tr('ngày','day','天')}</option><option value="4">4/${tr('ngày','day','天')}</option></select>`:''}<button class="btn mini primary" type="button">+ ${tr('Thêm ngày','Add date','添加日期')}</button>`;add.querySelector('.tk33-add-date').value=$('auto-date')?.value||localISO();add.querySelector('button').onclick=()=>addOneDate(kind,g.name,row);row.append(head,chips,add);box.appendChild(row)});
  if(!box.children.length){const e=document.createElement('div');e.className='muted tk33-empty';e.textContent=kind==='busy'?tr('Chưa có ngày bận theo VĐV.','No player busy days.','暂无运动员不可用日期。'):kind==='priority'?tr('Chưa có ngày ưu tiên theo VĐV.','No player priority dates.','暂无运动员优先日期。'):tr('Chưa có giới hạn trận/ngày theo VĐV.','No player daily match limits.','暂无运动员每日比赛上限。');box.appendChild(e)}
}
async function removeLegacyPriority(index){const next=cfg();if(!Array.isArray(next.priority)||!next.priority[index])return;next.priority.splice(index,1);await saveCfg(next,'SCHED_LEGACY_TEAM_PRIORITY_REMOVE');}
function renderLegacyPriority(){const c=cfg(),rows=Array.isArray(c.priority)?c.priority:[],box=$('tk33-legacy-priority-list'),count=$('tk33-legacy-priority-count');if(count)count.textContent=String(rows.length);if(!box)return;box.replaceChildren();rows.forEach((r,i)=>{const d=document.createElement('div');d.className='rule-chip';const t=App.state.teams?.[r.teamId],sp=document.createElement('span');sp.textContent=`${t?.code||''} · ${t?.name||r.teamId} · ${fmtDate(r.from)} → ${fmtDate(r.to)}`;const b=document.createElement('button');b.className='btn mini danger';b.type='button';b.textContent='×';b.onclick=()=>removeLegacyPriority(i);d.append(sp,b);box.appendChild(d)});if(!rows.length){const e=document.createElement('span');e.className='muted';e.textContent=tr('Không còn rule ưu tiên theo đội cũ.','No legacy team-priority rules.','没有旧版队伍优先规则。');box.appendChild(e)}}
async function removeLegacyLimit(index){const next=cfg();if(!Array.isArray(next.limits)||!next.limits[index])return;next.limits.splice(index,1);await saveCfg(next,'SCHED_LEGACY_TEAM_LIMIT_REMOVE');}
function renderLegacyLimits(){const c=cfg(),rows=Array.isArray(c.limits)?c.limits:[],box=$('tk33-legacy-limit-list'),count=$('tk33-legacy-count');if(count)count.textContent=String(rows.length);if(!box)return;box.replaceChildren();rows.forEach((r,i)=>{const d=document.createElement('div');d.className='rule-chip';const t=App.state.teams?.[r.teamId],s=document.createElement('span');s.textContent=`${t?.code||''} · ${t?.name||r.teamId} · ${fmtDate(r.from)} → ${fmtDate(r.to)} · ${Number(r.max)||1}/${tr('ngày','day','天')}`;const b=document.createElement('button');b.className='btn mini danger';b.type='button';b.textContent='×';b.onclick=()=>removeLegacyLimit(i);d.append(s,b);box.appendChild(d)});if(!rows.length){const e=document.createElement('span');e.className='muted';e.textContent=tr('Không còn rule đội cũ.','No legacy team rules.','没有旧版队伍规则。');box.appendChild(e)}}
function renderAll(){clearTimeout(renderTimer);renderTimer=setTimeout(()=>{if(!ensureUI())return;['busy','priority','limit'].forEach(kind=>{renderPicker(kind);renderRuleList(kind)});renderLegacyPriority();renderLegacyLimits();},0);}

function patchSchedulerConfig(){
  const base=App.schedulerConfig?.bind(App);if(!base||App.__u33SchedulerConfig)return;App.__u33SchedulerConfig=true;
  App.schedulerConfig=function(...args){const s=this.state.config?.scheduler||{},c=base(...args)||{};return {...c,...s,
    busy:Array.isArray(s.busy)?s.busy:(c.busy||[]),priority:Array.isArray(s.priority)?s.priority:(c.priority||[]),limits:Array.isArray(s.limits)?s.limits:(c.limits||[]),lockedDates:Array.isArray(s.lockedDates)?s.lockedDates:(c.lockedDates||[]),
    playerBusy:Array.isArray(s.playerBusy)?s.playerBusy:(c.playerBusy||[]),playerPriority:Array.isArray(s.playerPriority)?s.playerPriority:(c.playerPriority||[]),playerDailyLimits:Array.isArray(s.playerDailyLimits)?s.playerDailyLimits:(c.playerDailyLimits||[]),playerTimeWindows:Array.isArray(s.playerTimeWindows)?s.playerTimeWindows:(c.playerTimeWindows||[])
  };};
}
function playerRuleLimit(name,date,c){const xs=(c.playerDailyLimits||[]).filter(r=>r?.date===date&&samePlayer(r.name,name));return xs.length?Math.max(1,Math.min(4,Math.min(...xs.map(r=>Number(r.max)||1)))):Infinity;}
function playerPriorityWeight(m,date,c){const ps=matchPeople(m);return ps.reduce((n,p)=>n+((c.playerPriority||[]).some(r=>r?.date===date&&samePlayer(r.name,p))?1:0),0);}
function teamLegacyPriority(m,date,c){return participants(m).reduce((n,id)=>n+((c.priority||[]).some(r=>r.teamId===id&&date>=r.from&&date<=r.to)?1:0),0);}
function teamDailyLimit(id,date,c){const legacy=(c.limits||[]).filter(r=>r.teamId===id&&date>=r.from&&date<=r.to);let max=legacy.length?Math.max(...legacy.map(r=>Number(r.max)||1)):1;const playerLift=teamPeople(id).map(n=>playerRuleLimit(n,date,c)).filter(Number.isFinite);if(playerLift.length)max=Math.max(max,...playerLift);return Math.max(1,Math.min(4,max));}
function specialOrder(m,date,c){const orders=[];participants(m).forEach(id=>(c.limits||[]).forEach((r,idx)=>{if(r.teamId===id&&r.from===date&&r.to===date&&Number(r.max)>1)orders.push(Number(r.priorityOrder)||idx+1)}));return orders.length?Math.min(...orders):Infinity;}
function busyPerson(m,date,c){const ps=matchPeople(m);return (c.playerBusy||[]).some(r=>r?.name&&r?.date===date&&ps.some(p=>samePlayer(p,r.name)||fold(p).includes(fold(r.name))||fold(r.name).includes(fold(p))));}
function buildSchedulePlan(){
  const input={category:$('adv-category')?.value||'ALL',from:$('auto-date')?.value,to:$('auto-end-date')?.value,start:$('auto-time')?.value||'08:00',interval:Math.max(5,Number($('auto-interval')?.value)||35),maxDay:Math.max(1,Number($('auto-max-day')?.value)||24),includeSunday:$('auto-sunday')?.checked!==false,reschedule:$('auto-reschedule')?.checked!==false};
  if(!input.from||!input.to||input.to<input.from)throw new Error(tr('Khoảng ngày không hợp lệ','Invalid date range','日期范围无效'));
  const c=cfg(),locked=new Set(c.lockedDates||[]),dates=(typeof App.dateRange==='function'?App.dateRange(input.from,input.to,input.includeSunday):dateRange(input.from,input.to)).filter(d=>!locked.has(d)),courts=Object.values(App.state.courts||{}).sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  if(!dates.length||!courts.length)throw new Error(tr('Không có ngày hoặc sân/khu khả dụng','No available dates or courts','没有可用日期或场地'));
  const rules={...T.DEFAULT_RULES,...App.state.config?.rules},dur=Math.max(5,Number(rules.estimatedMatchMinutes)||input.interval),rest=Math.max(0,Number(rules.minRestMinutes)||0),start=toMin(input.start),matches=Object.values(App.state.matches||{}),protectedStatus=new Set(['LIVE','FINISHED','WALKOVER','RETIRED','DISQUALIFIED','SUSPENDED','CANCELLED']),activeIds=new Set(Object.values(App.state.activeMatches||{}).filter(Boolean).map(x=>x.matchId)),catOf=m=>App.normalizeCategory?App.normalizeCategory(m.category):m.category,eligible=m=>(input.category==='ALL'||catOf(m)===input.category)&&!protectedStatus.has(m.status)&&!activeIds.has(m.id)&&!App.state.teams?.[m.teamAId]?.withdrawn&&!App.state.teams?.[m.teamBId]?.withdrawn,target=matches.filter(m=>eligible(m)&&(!m.date||(input.reschedule&&m.date>=input.from&&m.date<=input.to&&!locked.has(m.date))||(!m.time||!m.courtId))),targetIds=new Set(target.map(m=>m.id));
  if(!target.length)throw new Error(tr('Không có lịch chưa đấu phù hợp để xếp','No eligible unplayed matches to schedule','没有符合条件的未赛比赛可排程'));
  const occCourt={},occTeam={},occPerson={},dayCount={},teamDay={},personDay={},key=(d,id)=>d+'|'+id,overlap=(arr,st,en,gap=0)=>(arr||[]).some(([a,b])=>st<b+gap&&en+gap>a);
  const addDayLoad=(m,d)=>{if(!d||m.status==='CANCELLED')return;dayCount[d]=(dayCount[d]||0)+1;participants(m).forEach(id=>teamDay[key(d,id)]=(teamDay[key(d,id)]||0)+1);matchPeople(m).forEach(n=>{const k=fold(n);personDay[key(d,k)]=(personDay[key(d,k)]||0)+1;});};
  const addTimeOcc=(m,d,t,cid)=>{if(!d||!t||m.status==='CANCELLED')return;const st=toMin(t),en=st+dur;participants(m).forEach(id=>(occTeam[key(d,id)]??=[]).push([st,en]));matchPeople(m).forEach(n=>(occPerson[key(d,fold(n))]??=[]).push([st,en]));if(cid)(occCourt[key(d,cid)]??=[]).push([st,en]);};
  matches.filter(m=>!targetIds.has(m.id)&&m.date&&m.status!=='CANCELLED').forEach(m=>{addDayLoad(m,m.date);if(m.time)addTimeOcc(m,m.date,m.time,m.courtId)});
  const addPlaced=(m,d,t,cid)=>{addDayLoad(m,d);addTimeOcc(m,d,t,cid)};
  const busyTeam=(id,d)=>(c.busy||[]).some(r=>r.teamId===id&&r.date===d),windowAllows=(m,d,st,en)=>typeof Up20?.windowAllows==='function'?Up20.windowAllows(m,d,st,en,c):true,earlyWeight=(m,d)=>typeof Up20?.earlyWeight==='function'?Up20.earlyWeight(m,d,c):0;
  const combinedPriority=(m,d)=>teamLegacyPriority(m,d,c)+playerPriorityWeight(m,d,c)*2;
  const bestSpecial=m=>Math.min(...dates.map(d=>specialOrder(m,d,c))),bestPriority=m=>Math.max(...dates.map(d=>combinedPriority(m,d))),bestEarly=m=>Math.max(...dates.map(d=>earlyWeight(m,d)));
  target.sort((a,b)=>bestSpecial(a)-bestSpecial(b)||bestEarly(b)-bestEarly(a)||bestPriority(b)-bestPriority(a)||String(a.code||a.id).localeCompare(String(b.code||b.id)));
  const plan=[],unplaced=[];
  for(const m of target){let best=null;for(let di=0;di<dates.length;di++){const d=dates[di],ids=participants(m),ps=matchPeople(m),pkeys=ps.map(fold);if(ids.some(id=>busyTeam(id,d))||busyPerson(m,d,c)||(dayCount[d]||0)>=input.maxDay)continue;if(ids.some(id=>(teamDay[key(d,id)]||0)>=teamDailyLimit(id,d,c)))continue;if(ps.some((p,i)=>(personDay[key(d,pkeys[i])]||0)>=playerRuleLimit(p,d,c)))continue;
      for(let slot=0;slot<300;slot++){const st=start+slot*input.interval,en=st+dur;if(en>1440)break;if(!windowAllows(m,d,st,en))continue;for(const court of courts){if(overlap(occCourt[key(d,court.id)],st,en,0))continue;if(ids.some(id=>overlap(occTeam[key(d,id)],st,en,rest)))continue;const personGap=Math.max(rest,input.interval);if(pkeys.some(k=>overlap(occPerson[key(d,k)],st,en,personGap)))continue;const order=specialOrder(m,d,c),specialScore=Number.isFinite(order)?1000000000-order*1000000:0,early=earlyWeight(m,d),earlyScore=early?50000000-slot*25000:0,priorityScore=combinedPriority(m,d)*150000,teamLoad=ids.reduce((n,id)=>n+(teamDay[key(d,id)]||0),0),personLoad=pkeys.reduce((n,k)=>n+(personDay[key(d,k)]||0),0),idealPerDay=Math.max(1,Math.ceil(target.length/dates.length)),overflowLoad=Math.max(0,(dayCount[d]||0)-idealPerDay+1),score=specialScore+earlyScore+priorityScore-overflowLoad*3000-teamLoad*1000-personLoad*1800-slot*4-di;if(!best||score>best.score)best={date:d,time:minToTime(st),courtId:court.id,score,priorityOrder:Number.isFinite(order)?order:null,earlyPriority:early};}}
    }
    if(best){const after={...m,date:best.date,time:best.time,courtId:best.courtId,status:'SCHEDULED',scheduledAt:Date.now(),schedulerVersion:T.VERSION};plan.push({before:m,after,priorityOrder:best.priorityOrder,earlyPriority:best.earlyPriority});addPlaced(after,best.date,best.time,best.courtId);}else unplaced.push(m);
  }
  return{input,plan,unplaced,rest,dur,lockedDates:[...locked],playerBusy:(c.playerBusy||[]).length,playerPriority:(c.playerPriority||[]).length,playerDailyLimits:(c.playerDailyLimits||[]).length,playerTimeWindows:(c.playerTimeWindows||[]).length,legacyTeamLimits:(c.limits||[]).length};
}
function patchSchedulerEngine(){App.buildSchedulePlan=buildSchedulePlan;if(Up9)Up9.buildSchedulePlan=buildSchedulePlan;}
function patchRender(){
  const base=App.renderSchedulerControls?.bind(App);if(base&&!App.__u33SchedulerRender){App.__u33SchedulerRender=true;App.renderSchedulerControls=function(...args){const out=base(...args);ensureUI();setDefaultDates();renderAll();return out;};}
}
function install(){patchSchedulerConfig();patchSchedulerEngine();patchRender();ensureUI();setDefaultDates();renderAll();setTimeout(()=>{ensureUI();setDefaultDates();renderAll();},0);}
install();
window.addEventListener('topkey:languagechange',()=>{const old={busy:[...selections.busy],priority:[...selections.priority],limit:[...selections.limit]};document.querySelectorAll('#tk33-player-busy-card,#tk33-player-priority-card,#tk33-player-limit-card').forEach(x=>x.remove());selections.busy=new Set(old.busy);selections.priority=new Set(old.priority);selections.limit=new Set(old.limit);ensureUI();renderAll();});
window.TopkeyUpgrade33={installed:true,cfg,directory,playerRuleLimit,teamDailyLimit,playerPriorityWeight,buildSchedulePlan,renderAll,dateRange};
})();
