(()=>{
'use strict';
const VERSION='2026.11.05-vnext-upgrade122-hotfix53-ranking-signature-logo';
const CACHE_TAG='u122h53-20261105';
const BUILD='upgrade122';
let installed=false;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const norm=v=>{const s=String(v||'MIX').trim().toUpperCase();return s==='MIXED'?'MIX':s};
const catLabel=c=>({MEN:'Đôi Nam',WOMEN:'Đôi Nữ',MIX:'Đôi Nam Nữ',MD:'Đôi Nam',WD:'Đôi Nữ',XD:'Đôi Nam Nữ'})[norm(c)]||String(c||'Nội dung');
const pairKey=(a,b)=>[String(a||''),String(b||'')].sort().join('|');
const isGroup=m=>{const s=String(m?.stage||'GROUP').trim().toUpperCase();return !s||['GROUP','ROUND_ROBIN','VONG_BANG','VÒNG BẢNG'].includes(s)};
const countedStatus=new Set(['FINISHED','WALKOVER','RETIRED','DISQUALIFIED']);
function role(){try{return window.Topkey?.Auth?.role?.()||''}catch{return ''}}
function isAdmin(){return role()==='ADMIN'}
function rules(){const T=window.Topkey,App=T?.App;return {...(T?.DEFAULT_RULES||{}),...(App?.state?.config?.rules||{})}}
function completeSet(s,m){if(!s)return false;const st=String(m?.status||'').toUpperCase();if(st==='FINISHED'||st==='WALKOVER')return num(s.a)!==num(s.b);if(s.finished===true)return true;try{return !!window.Topkey?.Scoring?.isSetWon?.(num(s.a),num(s.b),rules())}catch{return num(s.a)!==num(s.b)}}
function winnerOf(m){if(!m)return '';if(m.winnerId===m.teamAId||m.winnerId===m.teamBId)return m.winnerId;let a=0,b=0;for(const s of (m.sets||[])){if(!completeSet(s,m))continue;if(num(s.a)>num(s.b))a++;else if(num(s.b)>num(s.a))b++;}return a===b?'':(a>b?m.teamAId:m.teamBId)}
function matchSetScore(m){let a=0,b=0;for(const s of (m?.sets||[])){if(!completeSet(s,m))continue;if(num(s.a)>num(s.b))a++;else if(num(s.b)>num(s.a))b++;}return `${a}–${b}`}
function matchPointScore(m){const sets=(m?.sets||[]).filter(s=>completeSet(s,m));return sets.length?sets.map(s=>`${num(s.a)}–${num(s.b)}`).join(', '):'không có chi tiết set'}
function matchLabel(m,App){if(!m)return 'Không tìm thấy trận';const A=App.state.teams?.[m.teamAId]?.name||m.teamASnapshot?.name||m.teamAId||'Đội A',B=App.state.teams?.[m.teamBId]?.name||m.teamBSnapshot?.name||m.teamBId||'Đội B';return `${A} vs ${B}: ${matchSetScore(m)} (${matchPointScore(m)})`}
function selectAuthoritativeMatches(App,category,rankingRows){
  const groups=new Map(),selected=new Map();
  for(const m of Object.values(App.state.matches||{})){
    if(!m||!isGroup(m)||!m.teamAId||!m.teamBId)continue;
    const mc=norm(m.category||App.state.teams?.[m.teamAId]?.category||App.state.teams?.[m.teamBId]?.category);
    if(category&&mc!==norm(category))continue;
    const k=pairKey(m.teamAId,m.teamBId),arr=groups.get(k)||[];arr.push(m);groups.set(k,arr);
  }
  const priority=m=>{const st=String(m?.status||'').toUpperCase();return st==='FINISHED'?500:st==='RETIRED'?400:st==='DISQUALIFIED'?350:st==='WALKOVER'?300:0};
  const time=m=>num(m?.finishedAt||m?.updatedAt||m?.createdAt||0);
  for(const [k,list] of groups){
    const valid=list.filter(m=>countedStatus.has(String(m.status||'').toUpperCase())&&winnerOf(m));
    valid.sort((a,b)=>{const real=(a.virtualStandingOnly?0:1)-(b.virtualStandingOnly?0:1);if(real)return -real;const p=priority(b)-priority(a);if(p)return p;return time(b)-time(a)});
    if(valid[0])selected.set(k,valid[0]);
  }
  // Mirror current ranking's virtual WO for withdrawn teams if a fixture is missing.
  const rows=rankingRows||[];
  for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
    const a=rows[i],b=rows[j];if(norm(a.category)!==norm(b.category))continue;const k=pairKey(a.id,b.id);if(selected.has(k))continue;
    const wd=a.withdrawn?a:(b.withdrawn?b:null),active=!a.withdrawn?a:(!b.withdrawn?b:null);if(!wd||!active||String(wd.policy||'')!=='KEEP_PLAYED_WO')continue;
    selected.set(k,{id:'__report_virtual_wo__'+k.replace(/[^a-zA-Z0-9_-]/g,'_'),code:'WO*',stage:'GROUP',category:active.category,teamAId:active.id,teamBId:wd.id,status:'WALKOVER',winnerId:active.id,sets:[{a:11,b:0,finished:true},{a:11,b:0,finished:true}],virtualStandingOnly:true,walkoverTeamId:wd.id,walkoverReason:'MISSING_FIXTURE_WITHDRAWN'});
  }
  return [...selected.values()];
}
function miniStats(group,matches){
  const ids=new Set(group.map(r=>r.id)),map=new Map(group.map(r=>[r.id,{wins:0,points:0,setsFor:0,setsAgainst:0,pointsFor:0,pointsAgainst:0,matches:[]} ]));
  for(const m of matches){if(!ids.has(m.teamAId)||!ids.has(m.teamBId))continue;const A=map.get(m.teamAId),B=map.get(m.teamBId),w=winnerOf(m);if(!A||!B||!w)continue;let aw=0,bw=0;for(const s of (m.sets||[])){const a=num(s.a),b=num(s.b);A.pointsFor+=a;A.pointsAgainst+=b;B.pointsFor+=b;B.pointsAgainst+=a;if(completeSet(s,m)){if(a>b){A.setsFor++;B.setsAgainst++;aw++}else if(b>a){B.setsFor++;A.setsAgainst++;bw++}}}if(w===m.teamAId){A.wins++;A.points++}else{B.wins++;B.points++}A.matches.push(m);B.matches.push(m)}
  for(const x of map.values()){x.setDiff=x.setsFor-x.setsAgainst;x.pointDiff=x.pointsFor-x.pointsAgainst}
  return map;
}
function overallMetricReason(a,b){
  const checks=[
    ['Hiệu số set',a.setsFor-a.setsAgainst,b.setsFor-b.setsAgainst],
    ['Hiệu số điểm cầu',a.pointsFor-a.pointsAgainst,b.pointsFor-b.pointsAgainst],
    ['Tổng set thắng',a.setsFor,b.setsFor],
    ['Tổng điểm cầu ghi được',a.pointsFor,b.pointsFor]
  ];
  for(const [label,av,bv] of checks)if(av!==bv)return {criterion:label,text:`${label}: ${a.name} ${av>bv?'>':'<'} ${b.name} (${av} so với ${bv}).`,winner:av>bv?a.id:b.id};
  return {criterion:'Tên đội',text:`Các chỉ số vẫn bằng nhau; hệ thống dùng tên đội làm khóa ổn định cuối cùng.`,winner:String(a.name||'').localeCompare(String(b.name||''),'vi')<=0?a.id:b.id};
}
function directMatch(a,b,matches){return [...matches].reverse().find(m=>pairKey(m.teamAId,m.teamBId)===pairKey(a.id,b.id))||null}
function compareExplanation(a,b,pointGroup,matches,App){
  if(!a||!b)return {criterion:'—',text:'Không có đội để so sánh.'};
  if(a.points!==b.points)return {criterion:'Điểm BXH',text:`${a.name} có ${a.points} điểm, ${b.name} có ${b.points} điểm. Mỗi trận thắng = 1 điểm; đội có điểm cao hơn đứng trên.`,winner:a.points>b.points?a.id:b.id};
  if(pointGroup.length===2){
    const m=directMatch(a,b,matches),w=winnerOf(m);if(m&&w){const wn=w===a.id?a.name:b.name,ln=w===a.id?b.name:a.name;return {criterion:'H2H · đối đầu trực tiếp',text:`Hai đội cùng ${a.points} điểm nên xét đối đầu trực tiếp: ${wn} thắng ${ln} ${matchSetScore(m)}; chi tiết set ${matchPointScore(m)}.`,winner:w,matches:[m]}}
    return overallMetricReason(a,b);
  }
  const mini=miniStats(pointGroup,matches),A=mini.get(a.id),B=mini.get(b.id);
  if(A&&B){
    const checks=[['Điểm mini-league',A.points,B.points],['HS set mini-league',A.setDiff,B.setDiff],['HS điểm mini-league',A.pointDiff,B.pointDiff]];
    for(const [label,av,bv] of checks)if(av!==bv)return {criterion:label,text:`Nhóm ${pointGroup.length} đội cùng ${a.points} điểm được lập BXH mini. ${a.name}: mini ${A.points} điểm, HS set ${A.setDiff}, HS điểm ${A.pointDiff}; ${b.name}: mini ${B.points} điểm, HS set ${B.setDiff}, HS điểm ${B.pointDiff}. Tiêu chí phân tách: ${label}.`,winner:av>bv?a.id:b.id,mini,pointGroup};
    const tied=pointGroup.filter(r=>{const x=mini.get(r.id);return x&&x.points===A.points&&x.setDiff===A.setDiff&&x.pointDiff===A.pointDiff});
    if(tied.length===2&&tied.some(x=>x.id===a.id)&&tied.some(x=>x.id===b.id)){
      const m=directMatch(a,b,matches),w=winnerOf(m);if(m&&w)return {criterion:'H2H sau mini-league',text:`Hai đội vẫn bằng nhau sau mini-league (${A.points} điểm mini, HS set ${A.setDiff}, HS điểm ${A.pointDiff}), nên xét H2H: ${w===a.id?a.name:b.name} thắng ${w===a.id?b.name:a.name} ${matchSetScore(m)}.`,winner:w,matches:[m],mini,pointGroup};
    }
  }
  const o=overallMetricReason(a,b);o.text=`Mini-league chưa phân tách được hai đội. ${o.text}`;return o;
}
function categoryRows(App,cat){return App.ranking({category:cat}).filter(r=>norm(r.category||App.state.teams?.[r.id]?.category)===norm(cat))}
function buildModel(category){
  const T=window.Topkey,App=T?.App;if(!App?.ranking)throw new Error('Ranking Engine chưa sẵn sàng.');
  const cat=norm(category),rows=categoryRows(App,cat),matches=selectAuthoritativeMatches(App,cat,rows);
  const groups=new Map();for(const r of rows){const k=num(r.points);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r)}
  const top4=rows.slice(0,4).map((r,i)=>{
    const prev=i>0?rows[i-1]:null,next=rows[i+1]||null,pg=groups.get(num(r.points))||[r],above=prev?compareExplanation(prev,r,groups.get(num(prev.points))||[prev],matches,App):null,below=next?compareExplanation(r,next,groups.get(num(r.points))||[r],matches,App):null;
    let summary='';
    if(i===0)summary=below?`Hạng 1: ${below.text}`:`Hạng 1 do có thành tích cao nhất trong dữ liệu hiện tại.`;
    else if(i===1)summary=`Hạng 2: ${above?`xếp sau hạng 1 theo ${above.criterion}. `:''}${below?`Đồng thời đứng trên hạng 3 theo ${below.criterion}: ${below.text}`:'Không có hạng 3 để so sánh.'}`;
    else if(i===2)summary=`Hạng 3: ${above?`xếp sau hạng 2 theo ${above.criterion}. `:''}${below?`Đồng thời đứng trên hạng 4 theo ${below.criterion}: ${below.text}`:'Không có hạng 4 để so sánh.'}`;
    else summary=`Hạng 4: ${above?`xếp sau hạng 3 theo ${above.criterion}: ${above.text} `:''}${below?`Đồng thời đứng trên hạng 5 theo ${below.criterion}: ${below.text}`:'Đây là đội cuối trong dữ liệu hiện tại hoặc không có hạng 5 để so sánh.'}`;
    return {rank:i+1,row:r,summary,above,below,pointGroup:pg};
  });
  return {category:cat,categoryLabel:catLabel(cat),rows,matches,top4,generatedAt:new Date(),rules:'Điểm → H2H (2 đội) / Mini-league (3+ đội) → HS set → HS điểm → Set thắng → Điểm ghi được',tournament:App.state.config?.title||'GIẢI CẦU LÔNG ĐÔI CÔNG TY TOPKEY',tid:T.Data?.tid||''};
}
function renderMiniGroups(model){
  const groups=new Map();for(const r of model.rows){if(!groups.has(r.points))groups.set(r.points,[]);groups.get(r.points).push(r)}
  const tied=[...groups.entries()].filter(([,g])=>g.length>1);if(!tied.length)return '<p class="tk51-note">Không có nhóm đồng điểm trong nội dung này.</p>';
  return tied.map(([p,g])=>{const mini=g.length>=3?miniStats(g,model.matches):null;const rows=g.map(r=>{const x=mini?.get(r.id);return `<tr><td>${esc(r.name)}</td><td>${r.points}</td><td>${x?x.points:'H2H'}</td><td>${x?x.setDiff:'—'}</td><td>${x?x.pointDiff:'—'}</td><td>${r.setsFor-r.setsAgainst}</td><td>${r.pointsFor-r.pointsAgainst}</td></tr>`}).join('');const related=model.matches.filter(m=>g.some(r=>r.id===m.teamAId)&&g.some(r=>r.id===m.teamBId));return `<div class="tk51-tie"><h4>Nhóm ${g.length} đội cùng ${p} điểm</h4><table><thead><tr><th>Đội</th><th>Điểm BXH</th><th>Điểm mini</th><th>HS set mini</th><th>HS điểm mini</th><th>HS set toàn giải</th><th>HS điểm toàn giải</th></tr></thead><tbody>${rows}</tbody></table><div class="tk51-matchlist">${related.map(m=>`<div>• ${esc(matchLabel(m,window.Topkey.App))}${m.virtualStandingOnly?' · WO ảo':''}</div>`).join('')||'Không có trận đối đầu được tính.'}</div></div>`}).join('')
}
function reportHtml(model,standalone=false){
  const rankRows=model.rows.map((r,i)=>`<tr${i<4?' class="top"':''}><td>${i+1}</td><td>${esc(r.name)}${r.withdrawn?' <small>(Bỏ cuộc)</small>':''}</td><td>${r.played}</td><td>${r.w}-${r.l}</td><td>${r.setsFor-r.setsAgainst}</td><td>${r.pointsFor-r.pointsAgainst}</td><td>${r.setsFor}</td><td>${r.pointsFor}</td><td><b>${r.points}</b></td></tr>`).join('');
  const top=model.top4.map(x=>`<article class="tk51-explain"><h3>${['🥇','🥈','🥉','🏅'][x.rank-1]} Hạng ${x.rank}: ${esc(x.row.name)}</h3><p><b>${x.row.points} điểm</b> · ${x.row.played} trận · ${x.row.w}-${x.row.l} · HS set ${x.row.setsFor-x.row.setsAgainst} · HS điểm ${x.row.pointsFor-x.row.pointsAgainst}</p><p>${esc(x.summary)}</p></article>`).join('');
  const body=`<div class="tk51-report"><header><h1>🏆 BÁO CÁO GIẢI TRÌNH BẢNG XẾP HẠNG</h1><h2>${esc(model.tournament)} · ${esc(model.categoryLabel)}</h2><p>Xuất lúc ${model.generatedAt.toLocaleString('vi-VN')} · Tournament ID: ${esc(model.tid||'—')}</p></header><section><h3>1. Quy tắc xếp hạng</h3><p><b>${esc(model.rules)}</b></p><p>Mỗi trận thắng được 1 điểm BXH; trận thua 0 điểm. Chỉ các kết quả vòng bảng có hiệu lực được tính; với một cặp đội, hệ thống chỉ lấy một kết quả có thẩm quyền.</p></section><section><h3>2. Bảng xếp hạng ${esc(model.categoryLabel)}</h3><div class="tk51-tablewrap"><table><thead><tr><th>#</th><th>Đội</th><th>Trận</th><th>W-L</th><th>HS set</th><th>HS điểm</th><th>Set thắng</th><th>Điểm ghi</th><th>Điểm BXH</th></tr></thead><tbody>${rankRows}</tbody></table></div></section><section><h3>3. Giải trình vị trí 1–2–3–4</h3>${top||'<p>Chưa có đủ dữ liệu để giải trình Top 4.</p>'}</section><section><h3>4. Nhóm đồng điểm & mini-league</h3>${renderMiniGroups(model)}</section><footer><p>Báo cáo được sinh từ Ranking Engine đang chạy trên tài khoản Admin tại thời điểm xuất. Nếu tỷ số/trạng thái trận thay đổi, cần xuất lại báo cáo.</p></footer></div>`;
  if(!standalone)return body;
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(reportBaseName(model))}</title><style>body{font-family:Arial,sans-serif;color:#10233b;margin:28px}h1{font-size:24px}h2{font-size:18px;color:#176087}section{margin:22px 0}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #b8c9d6;padding:7px;text-align:left}th{background:#eaf4fb}.top{background:#fff8d8}.tk51-explain{border:1px solid #9fc6dc;border-left:5px solid #1593c5;padding:10px 14px;margin:10px 0;border-radius:8px}.tk51-tie{margin:14px 0}.tk51-matchlist{font-size:12px;margin-top:7px;color:#39566b}footer{margin-top:30px;font-size:11px;color:#667}@media print{button{display:none}}</style></head><body>${body}</body></html>`;
}
function csvText(model){
  const q=v=>`"${String(v??'').replace(/"/g,'""')}"`,lines=[['Hạng','Đội','Trận','Thắng','Thua','HS set','HS điểm','Set thắng','Điểm ghi','Điểm BXH'].map(q).join(',')];
  model.rows.forEach((r,i)=>lines.push([i+1,r.name,r.played,r.w,r.l,r.setsFor-r.setsAgainst,r.pointsFor-r.pointsAgainst,r.setsFor,r.pointsFor,r.points].map(q).join(',')));
  lines.push('');lines.push(q('GIẢI TRÌNH TOP 4'));model.top4.forEach(x=>lines.push([`Hạng ${x.rank}`,x.row.name,x.summary].map(q).join(',')));return '\uFEFF'+lines.join('\r\n');
}
function download(name,content,type){const T=window.Topkey;if(T?.U?.download)return T.U.download(name,new Blob([content],{type}));const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
function categories(){const App=window.Topkey?.App;const set=new Set(Object.values(App?.state?.teams||{}).map(t=>norm(t.category)).filter(Boolean));return [...set].sort((a,b)=>['MEN','WOMEN','MIX'].indexOf(a)-['MEN','WOMEN','MIX'].indexOf(b))}
function ensureStyle(){if($('tk51-style'))return;const s=document.createElement('style');s.id='tk51-style';s.textContent=`
#tk51-ranking-explain-btn{margin-left:8px}.tk51-modal{position:fixed;inset:0;background:rgba(2,12,27,.82);z-index:10080;display:flex;align-items:center;justify-content:center;padding:18px}.tk51-modal.hidden{display:none}.tk51-box{width:min(1180px,96vw);max-height:94vh;overflow:auto;background:#0c2741;color:#eaf6ff;border:1px solid #2579a5;border-radius:16px;padding:16px;box-shadow:0 20px 60px #0008}.tk51-head,.tk51-actions{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}.tk51-controls{display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin:12px 0}.tk51-controls label{display:grid;gap:4px;font-size:12px;color:#a9cce0}.tk51-controls select{min-width:190px}.tk51-preview{background:#f7fbfe;color:#102d42;border-radius:12px;padding:18px;margin-top:12px}.tk51-report header{border-bottom:2px solid #1593c5;margin-bottom:14px}.tk51-report h1{font-size:22px;margin:0 0 5px}.tk51-report h2{font-size:17px;margin:0 0 5px;color:#176087}.tk51-report h3{margin:18px 0 8px}.tk51-report table{width:100%;border-collapse:collapse;font-size:12px}.tk51-report th,.tk51-report td{border:1px solid #b8cbd8;padding:6px;text-align:left}.tk51-report th{background:#e6f3fb}.tk51-report tr.top{background:#fff7cf}.tk51-tablewrap{overflow:auto}.tk51-explain{border:1px solid #9fc6dc;border-left:5px solid #1593c5;padding:10px 12px;margin:10px 0;border-radius:8px;background:#fff}.tk51-explain p{margin:6px 0}.tk51-tie{margin:12px 0;padding:10px;border:1px dashed #8ab7ce;border-radius:8px}.tk51-matchlist{font-size:12px;color:#3e5e72;margin-top:7px}.tk51-note{color:#496a7d}.tk51-report footer{margin-top:20px;font-size:11px;color:#60788a}.tk51-pill{font-size:11px;background:#0e7490;color:#fff;padding:3px 7px;border-radius:999px}@media(max-width:720px){.tk51-box{padding:10px}.tk51-preview{padding:10px}.tk51-report{min-width:760px}.tk51-preview{overflow:auto}}`;
  document.head.appendChild(s)
}
function ensureModal(){if($('tk51-ranking-modal'))return;const d=document.createElement('div');d.id='tk51-ranking-modal';d.className='tk51-modal hidden';d.innerHTML=`<div class="tk51-box"><div class="tk51-head"><div><h2>🧾 Giải trình tính điểm & BXH</h2><p class="muted">Chọn nội dung thi đấu, tạo báo cáo và giải thích riêng vị trí 1–2–3–4.</p></div><button id="tk51-close" class="btn mini">✕ Đóng</button></div><div class="tk51-controls"><label>Nội dung<select id="tk51-category"></select></label><button id="tk51-generate" class="btn primary">⚙ Tạo báo cáo</button><button id="tk51-html" class="btn ok">⬇ Báo cáo HTML</button><button id="tk51-csv" class="btn">⬇ CSV</button><button id="tk51-print" class="btn">🖨 In / PDF</button></div><div id="tk51-status" class="tk51-pill">Sẵn sàng</div><div id="tk51-preview" class="tk51-preview"></div></div>`;document.body.appendChild(d);
  $('tk51-close').onclick=()=>d.classList.add('hidden');d.addEventListener('click',e=>{if(e.target===d)d.classList.add('hidden')});
  $('tk51-generate').onclick=generate;$('tk51-html').onclick=()=>exportHtml();$('tk51-csv').onclick=()=>exportCsv();$('tk51-print').onclick=()=>printReport();
}
let currentModel=null;
function fillCategories(){const s=$('tk51-category');if(!s)return;const current=s.value,cs=categories();s.innerHTML=cs.map(c=>`<option value="${esc(c)}">${esc(catLabel(c))}</option>`).join('');const App=window.Topkey?.App,prefer=norm(App?.quickStandingCategory||current||cs[0]);if(cs.includes(prefer))s.value=prefer}
function generate(){if(!isAdmin())return;try{const c=$('tk51-category')?.value;if(!c)throw new Error('Chưa có nội dung thi đấu.');currentModel=buildModel(c);$('tk51-preview').innerHTML=reportHtml(currentModel,false);$('tk51-status').textContent=`Đã tạo · ${currentModel.rows.length} đội · ${currentModel.matches.length} kết quả vòng bảng được chọn`;return currentModel}catch(e){$('tk51-status').textContent='Lỗi: '+(e?.message||e);throw e}}
function dateDDMMYYYY(d=new Date()){return String(d.getDate()).padStart(2,'0')+String(d.getMonth()+1).padStart(2,'0')+d.getFullYear()}
function shortTournamentName(title){
  const raw=String(title||'').replace(/\s+/g,' ').trim();
  const topkey=/TOPKEY/i.test(raw)?'TOPKEY':'';
  const turn=raw.match(/(?:LẦN|LAN|LẦN THỨ|LAN THU)\s*[-:]?\s*(\d+)/i);
  if(topkey&&turn)return `${topkey} L${turn[1]}`;
  let s=raw.replace(/GIẢI\s+CẦU\s+LÔNG(?:\s+ĐÔI)?/ig,'').replace(/CÔNG\s+TY/ig,'').replace(/[-–—]+/g,' ').replace(/\s+/g,' ').trim();
  if(!s)s=raw||'Giải';
  return s.length>42?s.slice(0,42).trim():s;
}
function safeFilePart(v){return String(v||'').replace(/[\\/:*?"<>|]/g,'-').replace(/\s+/g,' ').trim()}
function reportBaseName(model){return `${dateDDMMYYYY(model.generatedAt||new Date())}_Báo cáo BXH_${safeFilePart(model.categoryLabel)}_${safeFilePart(shortTournamentName(model.tournament))}`}
function safeName(model,ext){return `${reportBaseName(model)}.${ext}`}
function exportHtml(){const m=currentModel||generate();if(!m)return;download(safeName(m,'html'),reportHtml(m,true),'text/html;charset=utf-8')}
function exportCsv(){const m=currentModel||generate();if(!m)return;download(safeName(m,'csv'),csvText(m),'text/csv;charset=utf-8')}
function printReport(){const m=currentModel||generate();if(!m)return;const w=window.open('','_blank');if(!w)return alert('Trình duyệt đang chặn cửa sổ in.');w.document.open();w.document.write(reportHtml(m,true));w.document.close();setTimeout(()=>{w.focus();w.print()},250)}
function open(){if(!isAdmin())return;ensureStyle();ensureModal();fillCategories();$('tk51-ranking-modal').classList.remove('hidden');generate()}
function ensureButton(){
  if(!isAdmin()){$('tk51-ranking-explain-btn')?.remove();return false}
  if($('tk51-ranking-explain-btn'))return true;
  const list=$('standings-list'),card=list?.closest('.card');if(!card)return false;const h=card.querySelector('h2');if(!h)return false;
  const b=document.createElement('button');b.id='tk51-ranking-explain-btn';b.type='button';b.className='btn mini primary';b.textContent='🧾 Giải trình BXH';b.title='Giải thích cách tính điểm và xuất báo cáo BXH theo nội dung';b.onclick=open;
  h.style.display='flex';h.style.alignItems='center';h.style.flexWrap='wrap';h.appendChild(b);return true
}
function stamp(){const T=window.Topkey;if(T){T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION}window.__TOPKEY_BOOT_VERSION=VERSION;window.__TOPKEY_BOOT_CACHE=CACHE_TAG;document.documentElement.dataset.topkeyBuild=BUILD;const h=$('health-version');if(h)h.textContent=VERSION}
function install(){if(installed)return true;const T=window.Topkey,App=T?.App;if(!T||!App)return false;installed=true;ensureStyle();stamp();ensureButton();
  const oldOverview=App.renderOverview?.bind(App);if(oldOverview&&!App.__h51Overview){App.__h51Overview=true;App.renderOverview=function(...args){const out=oldOverview(...args);setTimeout(ensureButton,0);return out}}
  const oldRole=App.applyRole?.bind(App);if(oldRole&&!App.__h51Role){App.__h51Role=true;App.applyRole=function(...args){const out=oldRole(...args);setTimeout(ensureButton,0);return out}}
  window.addEventListener('focus',()=>setTimeout(()=>{stamp();ensureButton()},0),{passive:true});
  window.TopkeyUpgrade122Hotfix52={installed:true,VERSION,CACHE_TAG,buildModel,reportHtml,miniStats,compareExplanation,reportBaseName,open};return true
}
if(!install()){window.addEventListener('topkey:admin-ready',install,{once:true});let n=0;const t=setInterval(()=>{if(install()||++n>60)clearInterval(t)},250)}
})();
