/* H202: VNext dashboard reflects actual loaded tournament state. No Firebase writes. */
(()=>{'use strict';
if(window.__TOPKEY_PUBLIC_ROUTE||window.TopkeyDashboardH202)return;
const $=id=>document.getElementById(id),items=x=>Object.values(x||{}).filter(v=>v&&typeof v==='object');
const done=m=>['FINISHED','WALKOVER','RETIRED','DISQUALIFIED'].includes(m.status);
const live=m=>['LIVE','IN_PROGRESS'].includes(m.status);
const names={GROUP:'Vòng bảng',ROUND_ROBIN:'Vòng tròn',KNOCKOUT:'Loại trực tiếp',QUARTERFINAL:'Tứ kết',SEMIFINAL:'Bán kết',FINAL:'Chung kết',UNSPECIFIED:'Chưa phân giai đoạn'};
const formatNames={GROUP_KNOCKOUT:'Vòng bảng → Loại trực tiếp',ROUND_ROBIN:'Vòng tròn',KNOCKOUT:'Loại trực tiếp'};
const loaded=new Set();
function install(){
 const T=window.Topkey,app=T?.App;
 if(!app?.renderBranch||app.__h202||!['football','volleyball','shuttle','running','cooking','handmade'].includes(T?.SPORT?.key))return false;
 const overview=$('page-overview');if(!overview)return false;
 app.__h202=true;window.__TOPKEY_DASHBOARD_H202_OWNS_CHARTS=true;
 const panel=document.createElement('section');panel.id='tk202-status';panel.className='tk202-status';
 panel.innerHTML='<div class="tk202-head"><strong>Tiến độ và thể thức giải đấu</strong><span id="tk202-environment"></span></div><p id="tk202-source"></p><div id="tk202-stages"></div><div id="tk202-groups"></div><p id="tk202-warning" role="status"></p>';
 const chart=$('h201-analytics');if(chart)chart.after(panel);else overview.querySelector(':scope > .grid.g4')?.after(panel);
 function render(){
   const s=app.state||{}, teams=items(s.teams),matches=items(s.matches),active=items(s.activeMatches);
   const t=String(T.Data?.tid||''),test=t.startsWith('__testlab_');
   $('tk202-environment').textContent=(test?'TEST LAB':'PRODUCTION')+' · '+(t||'Chưa xác định mã giải');
   const finished=matches.filter(done).length;
   const liveIds=new Set(matches.filter(live).map(m=>m.id));
   active.filter(x=>x.started&&!x.finished).forEach(x=>liveIds.add(x.matchId));
   const metrics=[teams.length,teams.filter(x=>x.checkedIn===true).length,liveIds.size,finished];
   const max=Math.max(1,...metrics);
   const ready=loaded.has('teams')&&loaded.has('matches');
   const chart=$('h201-analytics');
   chart?.querySelectorAll('.h201-bar-row').forEach((row,i)=>{row.querySelector('.h201-fill').style.width=100*metrics[i]/max+'%';row.querySelector('strong').textContent=ready?String(metrics[i]):'—'});
   const donut=chart?.querySelector('.h201-donut');
   if(donut){const pct=teams.length?Math.min(100,Math.round(metrics[1]*100/teams.length)):0;
     donut.style.background='conic-gradient(#12a58d 0 '+pct+'%, #e8f2ef '+pct+'% 100%)';
     donut.querySelector('strong').textContent=loaded.has('teams')&&teams.length?pct+'%':'—';
     const text=chart.querySelector('.h201-explain');if(text)text.textContent=loaded.has('teams')?(teams.length?metrics[1]+' / '+teams.length+' đã điểm danh':'Chưa có đội/VĐV'):'Đang xác nhận dữ liệu';
   }
   const cfg=s.config||{},format=String(cfg.appearance?.format||cfg.format||cfg.rules?.format||'').toUpperCase();
   $('tk202-source').textContent='Thể thức: '+(formatNames[format]||format||'Chưa được cấu hình')+' · '+matches.length+' trận · '+finished+' hoàn tất · '+liveIds.size+' LIVE';
   const phase=new Map(),groups=new Map();
   for(const m of matches){
     const key=String(m.stage||'UNSPECIFIED').toUpperCase(),data=phase.get(key)||{total:0,finished:0,live:0};
     data.total++;if(done(m))data.finished++;if(live(m))data.live++;phase.set(key,data);
     if(key!=='GROUP'&&key!=='ROUND_ROBIN')continue;
     const group=String(m.groupId??m.groupName??m.group??m.pool??'').trim();if(!group)continue;
     const gKey=String(m.category||'')+'|'+group,g=groups.get(gKey)||{group,cat:String(m.category||''),n:0,done:0};
     g.n++;if(done(m))g.done++;groups.set(gKey,g);
   }
   const stages=$('tk202-stages');stages.replaceChildren();
   if(!matches.length)stages.textContent=loaded.has('matches')?'Chưa có trận đấu trong giải này.':'Đang tải lịch thi đấu…';
   for(const [key,d] of phase){
     const box=document.createElement('div');box.className='tk202-phase';
     const label=document.createElement('strong');label.textContent=names[key]||key;
     const progress=document.createElement('span');progress.textContent=d.finished+'/'+d.total+' hoàn tất'+(d.live?' · '+d.live+' đang Live':'');
     const track=document.createElement('div');track.className='tk202-track';const fill=document.createElement('span');fill.style.width=100*d.finished/d.total+'%';track.append(fill);
     box.append(label,progress,track);stages.append(box);
   }
   const groupBox=$('tk202-groups');groupBox.replaceChildren();
   for(const g of groups.values()){const el=document.createElement('span');el.textContent=(g.cat?g.cat+' · ':'')+'Bảng '+g.group+': '+g.done+'/'+g.n+' trận';groupBox.append(el)}
   const warnings=[];
   if(!ready)warnings.push('Chưa tải đủ danh sách đội và lịch thi đấu.');
   if((phase.has('GROUP')||format==='GROUP_KNOCKOUT')&&!groups.size)warnings.push('Vòng bảng có trong lịch, nhưng chưa tìm thấy mã bảng trong bản ghi trận: không tự suy đoán bảng đấu.');
   if(test)warnings.push('Test Lab: giao diện không thay thế kết quả kiểm thử thực tế và báo cáo PASS/FAIL.');
   $('tk202-warning').textContent=warnings.join(' ');
 }
 const original=app.renderBranch.bind(app);
 app.renderBranch=function(branch){const result=original(branch);if(['teams','matches','activeMatches','config'].includes(branch))loaded.add(branch);render();return result};
 render();window.TopkeyDashboardH202={install,render};return true;
}
function boot(){if(install())return;window.__TOPKEY_VNEXT_BOOT?.then(install).catch(()=>{});window.addEventListener('topkey:admin-ready',install,{once:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();