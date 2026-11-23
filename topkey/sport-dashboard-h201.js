/* H201: Dashboard visualization from the existing TOPKEY live KPI elements.
   No Firebase listeners, mocked records, auth changes or duplicated data writes. */
(() => {
  'use strict';
  if (window.__TOPKEY_PUBLIC_ROUTE || window.TopkeyDashboardH201) return;
  const ids=['kpi-teams','kpi-ready','kpi-live','kpi-finished'];
  const names=['Đội / VĐV','Đã điểm danh','Đang Live','Đã hoàn tất'];
  function init() {
    const overview=document.getElementById('page-overview');
    if(!overview || document.getElementById('h201-analytics')) return false;
    const outer=document.createElement('section');
    outer.id='h201-analytics';outer.setAttribute('aria-label','Biểu đồ hoạt động giải đấu');
    outer.innerHTML='<div class="h201-panel"><h2>Phân tích hoạt động giải đấu</h2><p class="h201-sub">Dữ liệu đồng bộ từ các chỉ số hiện có</p><div class="h201-bars"></div></div><div class="h201-panel"><h2>Tỷ lệ điểm danh</h2><p class="h201-sub">Số đội hoặc vận động viên đã check-in</p><div class="h201-donut" role="img" aria-label="Tỷ lệ điểm danh"><div class="h201-donut-inner"><strong>—</strong><small>đã điểm danh</small></div></div><p class="h201-explain"></p></div>';
    const rows=ids.map((id,i)=>{
      const row=document.createElement('div');row.className='h201-bar-row';
      const label=document.createElement('span');label.textContent=names[i];
      const track=document.createElement('div');track.className='h201-track';
      const fill=document.createElement('div');fill.className='h201-fill';track.appendChild(fill);
      const value=document.createElement('strong');value.textContent='—';
      row.append(label,track,value);
      outer.querySelector('.h201-bars').appendChild(row);
      return {fill,value};
    });
    const kpis=ids.map(id=>document.getElementById(id));
    const read=el=>{const txt=(el?.textContent||'').trim();return /^\d+$/.test(txt)?Number(txt):null};
    let pending=false;
    function update() {
      pending=false;
      if (window.__TOPKEY_DASHBOARD_H202_OWNS_CHARTS) return;
      const values=kpis.map(read);
      // A placeholder ('…'), unavailable counter or missing node is not zero.
      // Never display invented statistics before all source KPIs are available.
      if(values.some(value=>value===null)){
        rows.forEach(row=>{row.fill.style.width='0%';row.value.textContent='—'});
        const donut=outer.querySelector('.h201-donut');
        donut.style.background='#e8f2ef';
        donut.querySelector('strong').textContent='—';
        donut.setAttribute('aria-label','Tỷ lệ điểm danh đang tải');
        outer.querySelector('.h201-explain').textContent='Đang tải dữ liệu giải đấu';
        return;
      }
      const max=Math.max(1,...values);
      values.forEach((n,i)=>{rows[i].fill.style.width=(Math.max(0,n)/max*100)+'%';rows[i].value.textContent=String(n)});
      const total=values[0],checked=values[1];
      const ratio=total>0?Math.max(0,Math.min(100,checked/total*100)):0;
      const display=total>0?Math.round(ratio)+'%':'—';
      const donut=outer.querySelector('.h201-donut');
      donut.style.background='conic-gradient(#12a58d 0 '+ratio+'%,#e8f2ef '+ratio+'% 100%)';
      donut.querySelector('strong').textContent=display;
      donut.setAttribute('aria-label','Tỷ lệ điểm danh: '+display);
      outer.querySelector('.h201-explain').textContent=total>0?checked+' / '+total+' đã check-in':'Chưa có dữ liệu đội hoặc vận động viên';
    }
    const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(update)};
    const observer=new MutationObserver(schedule);
    kpis.filter(Boolean).forEach(el=>observer.observe(el,{childList:true,characterData:true,subtree:true}));
    const first=overview.querySelector(':scope > .grid.g4');
    if(first)first.after(outer);else overview.prepend(outer);
    update();
    window.TopkeyDashboardH201={update};
    return true;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
