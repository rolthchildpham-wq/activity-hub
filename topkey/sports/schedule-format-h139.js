/* H139: two-step competition format selector, shared by football, volleyball, badminton. */
(() => {
  'use strict';
  if (window.__TOPKEY_PUBLIC_ROUTE || window.__TOPKEY_IS_SPECTATOR || window.__TOPKEY_IS_REGISTER) return;
  const validSport = new Set(['football', 'volleyball', 'badminton']);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const ordered = teams => [...teams].sort((a,b) => String(a.code||a.name||'').localeCompare(String(b.code||b.name||''),'vi'));
  const sig = (a,b,category) => [a,b].sort().join('|') + '|' + category;
  const planPairs = (teams, entries, grouped) => {
    const mapped=new Map(entries.map(e=>[e.id,e.group]));
    const pairs=[];
    for(let i=0;i<teams.length;i++)for(let j=i+1;j<teams.length;j++){
      if(grouped&&mapped.get(teams[i].id)!==mapped.get(teams[j].id))continue;
      pairs.push({a:teams[i],b:teams[j],group:grouped?mapped.get(teams[i].id):''});
    }
    return pairs;
  };
  window.__TOPKEY_SCHEDULE_FORMAT_PLAN_PAIRS = planPairs;
  function boot() {
    const T = window.Topkey, app = T?.App;
    if (!T?.Data || !T?.U || !app?.state || !validSport.has(T.SPORT?.key)) return false;
    if (app.__tk139Installed) return true;
    const host = document.getElementById('round-robin-gen');
    if (!host) return false;
    app.__tk139Installed = true;
    const isAdmin = () => String(T.Auth?.role?.()||'').toUpperCase()==='ADMIN';
    const box = document.createElement('section');
    box.id = 'tk139-format';
    box.className = 'subcard';
    box.style.cssText = 'margin:14px 0;padding:16px;border:1px solid #49728b;border-radius:12px';
    box.innerHTML = '<h3>🏆 Chọn thể thức trước khi tạo lịch</h3>' +
      '<div class="form-grid">' +
      '<label>Thể thức<select id="tk139-mode"><option value="round">Vòng tròn · tất cả gặp nhau</option><option value="groups">Chia bảng · vòng tròn trong từng bảng</option></select></label>' +
      '<label>Nội dung thi đấu<select id="tk139-category"></select></label>' +
      '<label id="tk139-count-wrap" hidden>Số bảng<select id="tk139-count"><option value="2">2 bảng</option><option value="3">3 bảng</option><option value="4">4 bảng</option><option value="5">5 bảng</option><option value="6">6 bảng</option><option value="7">7 bảng</option><option value="8">8 bảng</option></select></label></div>' +
      '<p id="tk139-status" class="muted" role="status"></p>' +
      '<div id="tk139-assignments" hidden></div>' +
      '<div class="action-bar"><button type="button" id="tk139-prepare" class="btn">1. Phân bảng / Xem các cặp</button> ' +
      '<button type="button" id="tk139-save" class="btn" hidden>2. Lưu phân bảng</button> ' +
      '<button type="button" id="tk139-generate" class="btn primary" disabled>3. Xác nhận tạo lịch</button></div>';
    host.closest('.action-bar')?.parentElement?.after(box);
    host.hidden = true;
    if(!isAdmin()){box.hidden=true;return true}
    const $ = id => box.querySelector('#'+id);
    const mode=$('tk139-mode'),category=$('tk139-category'),count=$('tk139-count');
    let prepared = null, savedSignature = '';
    const activeTeams = () => ordered(Object.values(app.state.teams || {}).filter(t => !t.withdrawn && t.category === category.value));
    const assignmentsFromState = () => app.state.config?.scheduleGroups?.[category.value] || null;
    const signature = entries => entries.map(e=>e.id+':'+e.group).sort().join('|');
    const setStatus = text => {$('tk139-status').textContent=text};
    const reset = () => {prepared=null;savedSignature='';$('tk139-save').hidden=true;$('tk139-generate').disabled=true;$('tk139-assignments').hidden=true;$('tk139-assignments').replaceChildren()};
    const refreshCategories = () => {
      const current=category.value;
      const values=[...new Set(Object.values(app.state.teams||{}).filter(t=>!t.withdrawn).map(t=>t.category).filter(Boolean))].sort();
      category.replaceChildren(...values.map(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;return o}));
      if(values.includes(current))category.value=current;
      if(!values.length)setStatus('Chưa có đội hợp lệ. Hãy đăng ký đội trước khi xếp lịch.');
    };
    const applyMode = () => {
      reset();$('tk139-count-wrap').hidden=mode.value!=='groups';
      setStatus(mode.value==='groups'?'Bước 1: Phân bảng và xác nhận trước khi tạo cặp đấu.':'Vòng tròn: mỗi cặp đội trong cùng nội dung thi đấu gặp nhau một lần.');
    };
    const groupLabels = () => [...Array(Number(count.value))].map((_,i)=>String.fromCharCode(65+i));
    const rowsFromUI = () => [...box.querySelectorAll('[data-tk139-team]')].map(e=>({id:e.dataset.tk139Team,group:e.value}));
    const previewPairs = entries => planPairs(activeTeams(), entries, mode.value==='groups');
    const summary = entries => {
      const pairs=previewPairs(entries);
      const existing=new Set(Object.values(app.state.matches||{}).filter(m=>m.teamAId&&m.teamBId)
        .map(m=>sig(m.teamAId,m.teamBId,m.category)));
      return {pairs,missing:pairs.filter(p=>!existing.has(sig(p.a.id,p.b.id,category.value)))};
    };
    $('tk139-prepare').onclick=()=>{
      reset();refreshCategories();
      const teams=activeTeams();
      if(teams.length<2){setStatus('Cần ít nhất 2 đội cùng nội dung.');return}
      if(mode.value==='round'){
        prepared=teams.map(t=>({id:t.id,group:'ALL'}));
        const result=summary(prepared);
        setStatus(teams.length+' đội, '+result.pairs.length+' cặp, '+result.missing.length+' cặp chưa tạo. Hãy xác nhận trước khi ghi.');
        $('tk139-generate').disabled=!result.missing.length;
        return;
      }
      const labels=groupLabels();
      if(teams.length<labels.length*2){setStatus('Cần tối thiểu 2 đội mỗi bảng. Hãy giảm số bảng.');return}
      const prior=assignmentsFromState();
      const priorMap=new Map((prior?.entries||[]).map(e=>[e.id,e.group]));
      const list=document.createElement('div');
      list.className='form-grid';
      teams.forEach((team,i)=>{
        const label=document.createElement('label');label.textContent=(team.code||'')+' · '+(team.name||team.id);
        const select=document.createElement('select');select.dataset.tk139Team=team.id;
        labels.forEach(group=>{const o=document.createElement('option');o.value=group;o.textContent='Bảng '+group;select.appendChild(o)});
        select.value=labels.includes(priorMap.get(team.id))?priorMap.get(team.id):labels[i%labels.length];
        select.onchange=()=>{prepared=null;savedSignature='';$('tk139-save').hidden=false;$('tk139-generate').disabled=true;setStatus('Đã thay đổi phân bảng. Bấm Lưu phân bảng trước khi tạo lịch.')};
        label.appendChild(select);list.appendChild(label);
      });
      $('tk139-assignments').appendChild(list);$('tk139-assignments').hidden=false;
      $('tk139-save').hidden=false;
      setStatus('Đã phân '+teams.length+' đội vào '+labels.length+' bảng. Có thể chỉnh từng đội trước khi lưu.');
    };
    $('tk139-save').onclick=async()=>{
      if(!T.Data.connected){setStatus('Firebase chưa kết nối, chưa thể lưu phân bảng.');return}
      if(!isAdmin()){setStatus('Chỉ ADMIN được lưu phân bảng.');return}
      const entries=rowsFromUI(),labels=groupLabels();
      if(entries.length!==activeTeams().length||new Set(entries.map(e=>e.id)).size!==entries.length ||
        labels.some(g=>entries.filter(e=>e.group===g).length<2) ||
        entries.some(e=>!labels.includes(e.group))){setStatus('Mỗi bảng phải có ít nhất 2 đội, không được bỏ sót hoặc trùng đội.');return}
      const before=assignmentsFromState(),after={format:'GROUP',category:category.value,entries,updatedAt:Date.now()};
      const updates={[T.Data.path('config/scheduleGroups/'+category.value)]:after};
      $('tk139-save').disabled=true;
      try{
        await T.Data.queueMulti(updates,{type:'SCHEDULE_GROUP_ASSIGN'});
        await T.Data.audit('GROUP_ASSIGN','schedule',category.value,before,after);
        prepared=entries;savedSignature=signature(entries);
        const result=summary(entries);
        setStatus('Đã gửi lưu phân bảng. '+result.pairs.length+' cặp trong các bảng; '+result.missing.length+' cặp chưa tạo.');
        $('tk139-generate').disabled=!result.missing.length;
        $('tk139-save').hidden=true;
      }catch(e){setStatus('Lưu phân bảng thất bại: '+e.message)}
      finally{$('tk139-save').disabled=false}
    };
    $('tk139-generate').onclick=async()=>{
      if(!isAdmin()){setStatus('Chỉ ADMIN được tạo lịch.');return}
      const teams=activeTeams();
      if(!prepared||!teams.length)return;
      if(mode.value==='groups'){
        if(signature(rowsFromUI())!==savedSignature){setStatus('Phân bảng đã thay đổi; lưu lại trước khi tạo lịch.');return}
        const saved=await T.Data.read('config/scheduleGroups/'+category.value);
        if(!saved||signature(saved.entries||[])!==savedSignature){setStatus('Chưa xác nhận phân bảng đã lưu trên Firebase. Kiểm tra kết nối rồi thử lại.');return}
      }
      if(!T.Data.connected){setStatus('Firebase chưa kết nối; không tạo lịch offline.');return}
      if(prepared.length!==teams.length||prepared.some(e=>!teams.some(t=>t.id===e.id))){setStatus('Danh sách đội đã thay đổi. Chuẩn bị lại lịch.');return}
      const result=summary(prepared);
      if(!result.missing.length){setStatus('Không còn cặp đấu nào cần tạo.');return}
      if(result.missing.length>200){setStatus('Có quá 200 trận. Hãy chia thành các nội dung nhỏ hơn.');return}
      const ok=await T.U.confirmDanger('Tạo lịch '+(mode.value==='groups'?'chia bảng':'vòng tròn'),
        'Nội dung '+category.value+': thêm '+result.missing.length+' trận, không đụng tới lịch hiện tại.', 'TẠO LỊCH');
      if(!ok)return;
      const current=await T.Data.read('matches')||{};
      const existing=new Set(Object.values(current).filter(m=>m.teamAId&&m.teamBId).map(m=>sig(m.teamAId,m.teamBId,m.category)));
      const fresh=result.missing.filter(p=>!existing.has(sig(p.a.id,p.b.id,category.value)));
      if(fresh.length!==result.missing.length){setStatus('Đã có thay đổi lịch từ thiết bị khác. Hãy xem lại trước khi tạo.');return}
      const updates={},created=[],base=Object.values(current).reduce((n,m)=>Math.max(n,Number(String(m.code||'').replace(/^M/,''))||0),0);
      fresh.forEach((p,i)=>{
        const id=T.U.id('match'),m={id,code:'M'+String(base+i+1).padStart(3,'0'),
          teamAId:p.a.id,teamBId:p.b.id,category:category.value,stage:'GROUP',
          group:mode.value==='groups'?p.group:'',format:mode.value==='groups'?'GROUP':'ROUND_ROBIN',
          date:'',time:'',courtId:'',status:'SCHEDULED',sets:[],createdAt:Date.now(),
          generated:mode.value==='groups'?'GROUP_ROUND_ROBIN':'ROUND_ROBIN'};
        updates[T.Data.path('matches/'+id)]=m;created.push(id);
      });
      $('tk139-generate').disabled=true;
      try{
        await T.Data.queueMulti(updates,{type:'SCHEDULE_FORMAT_CREATE',format:mode.value});
        await T.Data.audit('GENERATE','schedule',category.value,null,{format:mode.value,created,groups:mode.value==='groups'?prepared:null});
        setStatus('Đã gửi tạo '+created.length+' trận. Kiểm tra lịch và trạng thái đồng bộ Firebase.');
      }catch(e){setStatus('Tạo lịch thất bại: '+e.message)}
    };
    mode.onchange=applyMode;category.onchange=applyMode;count.onchange=applyMode;
    refreshCategories();applyMode();
    const originalRender=app.renderTeams?.bind(app);
    if(originalRender)app.renderTeams=function(...args){const value=originalRender(...args);refreshCategories();return value};
    return true;
  }
  if(!boot()){
    window.addEventListener('topkey:admin-ready',boot,{once:true});
    window.__TOPKEY_VNEXT_BOOT?.then(boot).catch(()=>{});
    window.__TOPKEY_SPORT_BOOT?.then(boot).catch(()=>{});
    let attempts=0;
    const retry=setInterval(()=>{if(boot()||++attempts>=50)clearInterval(retry)},200);
  }
})();
