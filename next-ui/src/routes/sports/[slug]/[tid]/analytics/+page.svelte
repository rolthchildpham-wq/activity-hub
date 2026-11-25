<script lang="ts">
 import {tournament} from '$lib/features/tournament/store';
 import {buildSportsAnalytics} from '$lib/entities/sports-analytics';
 import {activeLiveMatches} from '$lib/domain';
 $: data=$tournament.data;
 $: report=buildSportsAnalytics(data.matches,data.teams);
 $: live=activeLiveMatches(data);
 $: completedCount=report.statusDistribution.filter(x=>['FINISHED','WALKOVER','RETIRED','DISQUALIFIED'].includes(x.status)).reduce((n,x)=>n+x.count,0);
 $: maxActivity=Math.max(1,...report.activity.map(x=>x.total));
 $: maxTeam=Math.max(1,...report.teamRecords.slice(0,8).map(x=>x.won));
 function statusName(status:string){return ({LIVE:'Đang live',IN_PROGRESS:'Đang thi đấu',SCHEDULED:'Sắp diễn ra',PENDING:'Chờ thi đấu',FINISHED:'Hoàn tất',WALKOVER:'Bỏ cuộc',RETIRED:'Dừng trận',DISQUALIFIED:'Bị loại'} as Record<string,string>)[status]||status}
</script>
<svelte:head><title>TOPKEY · Sports Analytics</title><meta name="description" content="Phân tích hiệu suất đội và tiến độ giải đấu từ dữ liệu trận thực tế"/></svelte:head>
<div class="analytics-page">
 <header class="analytics-heading"><div><p class="eyebrow">SPORTS ANALYTICS / TOURNAMENT INTELLIGENCE</p><h1>Phân tích hiệu suất thể thao</h1><p class="muted">Chỉ số được tính từ dữ liệu trận và đội đã lưu trong giải hiện tại. Không có số liệu mẫu.</p></div><span class="source-tag">● FIREBASE LIVE DATA</span></header>
 <section class="kpi-row">
  <article><small>TỔNG SỐ ĐỘI / VĐV</small><strong>{report.teams}</strong><span>Danh sách trong giải</span></article>
  <article><small>TỔNG SỐ TRẬN</small><strong>{report.matches}</strong><span>Đã có trong lịch / kết quả</span></article>
  <article><small>ĐANG LIVE</small><strong>{live.length}</strong><span>Trạng thái realtime</span></article>
  <article><small>TRẬN CÓ TỶ SỐ</small><strong>{report.scoredCompleted}</strong><span>Đã hoàn tất, đủ dữ liệu điểm</span></article>
 </section>
 <section class="analytics-grid">
  <article class="analytics-panel"><div class="panel-title"><div><h2>Nhịp độ thi đấu</h2><p>Trận theo ngày · tối đa 14 ngày có dữ liệu gần nhất</p></div><span class="legend"><i></i> Tổng trận</span></div>
   {#if !report.activity.length}<p class="empty">Chưa có lịch thi đấu để phân tích.</p>{:else}<div class="activity-chart" role="img" aria-label="Biểu đồ số trận theo ngày">
    {#each report.activity as day}<div class="activity-column"><strong>{day.total}</strong><div class="bar-track"><span style:height={(100*day.total/maxActivity)+'%'}></span></div><small>{day.date==='Chưa có ngày'?'—':day.date.slice(5)}</small></div>{/each}
   </div>{/if}
  </article>
  <article class="analytics-panel"><div class="panel-title"><div><h2>Trạng thái giải</h2><p>Phân bố theo trạng thái bản ghi</p></div></div>
   {#if !report.statusDistribution.length}<p class="empty">Chưa có dữ liệu.</p>{:else}<div class="status-list">{#each report.statusDistribution as item}<div><span>{statusName(item.status)}</span><strong>{item.count}</strong></div>{/each}</div>{/if}
  </article>
 </section>
 <section class="analytics-panel"><div class="panel-title"><div><h2>Hiệu suất đội / VĐV</h2><p>Thống kê từ trận hoàn tất có đủ tỷ số. Không thay thế bảng xếp hạng theo luật từng môn.</p></div><span class="source-tag">ĐỐI CHIẾU DỮ LIỆU</span></div>
  {#if !report.teamRecords.length}<p class="empty">Chưa có đội/VĐV trong giải.</p>{:else}
   <div class="team-performance"><div class="table-head"><span>Đội / VĐV</span><span>Trận</span><span>Thắng</span><span>Hòa</span><span>Thua</span><span>Điểm ghi / nhận</span><span>Tỷ lệ thắng</span></div>
    {#each report.teamRecords as team}<div class="team-row"><strong>{team.name}</strong><span>{team.played}</span><span>{team.won}</span><span>{team.drawn}</span><span>{team.lost}</span><span>{team.pointsFor} / {team.pointsAgainst}</span><div class="winrate"><span>{team.winRate}%</span><i><b style:width={team.winRate+'%'}></b></i></div></div>{/each}
   </div>
  {/if}
 </section>
 <section class="analytics-panel"><div class="panel-title"><div><h2>So sánh số trận thắng</h2><p>Top 8 đội theo số trận thắng có tỷ số hợp lệ</p></div></div>
  {#if !report.teamRecords.some(t=>t.won)}<p class="empty">Chưa có trận hoàn tất đủ tỷ số để so sánh.</p>{:else}<div class="wins-chart">{#each report.teamRecords.filter(t=>t.won>0).slice(0,8) as team}<div class="wins-row"><span>{team.name}</span><i><b style:width={(100*team.won/maxTeam)+'%'}></b></i><strong>{team.won}</strong></div>{/each}</div>{/if}
 </section>
 <p class="disclaimer">Lưu ý: dữ liệu hiện tại chưa cung cấp đồng nhất telemetry như nhịp tim, tốc độ, quãng đường hay heatmap cho mọi bộ môn. Các chỉ số thể lực và vị trí sẽ chỉ xuất hiện khi có nguồn dữ liệu đáng tin cậy tương ứng.</p>
</div>
<style>
 .analytics-page{display:grid;gap:17px;color:#e9f1f8}.analytics-heading{display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap}.eyebrow{font-size:10px;letter-spacing:.14em;color:#f39a58;font-weight:900;margin:0 0 7px}.analytics-heading h1{font-size:clamp(24px,3vw,34px);margin:0;color:#f7f9fc}.muted,.panel-title p{font-size:11px;color:#9aafc1;line-height:1.6;margin:7px 0 0}.source-tag{font-size:9px;font-weight:900;letter-spacing:.09em;color:#80e5c4;background:#153c3c;border:1px solid #285e5b;padding:8px 10px;border-radius:99px;white-space:nowrap}.kpi-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.kpi-row article,.analytics-panel{background:#111d2c;border:1px solid #2a3a4e;border-radius:14px;padding:17px;min-width:0}.kpi-row article{display:grid;gap:7px;border-top:3px solid #23c5a2}.kpi-row small{font-size:9px;color:#9eb1c2;letter-spacing:.08em;font-weight:850}.kpi-row strong{font-size:34px;color:#fff;font-variant-numeric:tabular-nums;line-height:1}.kpi-row span{font-size:10px;color:#91a7b8}.analytics-grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(250px,1fr);gap:14px}.panel-title{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:15px}.panel-title h2{font-size:16px;margin:0;color:#f4f7fa}.legend{font-size:10px;color:#a4b7c7}.legend i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#23c5a2;margin-right:5px}.activity-chart{display:flex;align-items:flex-end;gap:clamp(5px,1.3vw,14px);height:190px;padding:10px 2px 0;overflow-x:auto}.activity-column{flex:1;min-width:23px;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px}.activity-column strong{font-size:10px;color:#e8f1f8;font-variant-numeric:tabular-nums}.bar-track{height:135px;width:min(100%,30px);display:flex;align-items:flex-end;background:#243649;border-radius:7px 7px 3px 3px;overflow:hidden}.bar-track span{display:block;width:100%;min-height:2px;background:linear-gradient(180deg,#37d9b0,#167e88);border-radius:6px 6px 0 0}.activity-column small{font-size:9px;color:#9aafc1;white-space:nowrap}.status-list{display:grid;gap:0}.status-list>div{display:flex;justify-content:space-between;gap:10px;padding:11px 0;border-top:1px solid #2a3c50;font-size:11px;color:#b6c5d2}.status-list strong{font-variant-numeric:tabular-nums;color:#fff}.team-performance{overflow-x:auto}.table-head,.team-row{display:grid;grid-template-columns:minmax(145px,1.6fr) .45fr .45fr .45fr .45fr minmax(105px,.9fr) minmax(105px,.9fr);align-items:center;gap:10px;min-width:750px}.table-head{font-size:9px;color:#8fa5b8;letter-spacing:.04em;padding:10px 0;border-bottom:1px solid #34485d}.team-row{font-size:11px;color:#c4d1dc;padding:12px 0;border-bottom:1px solid #26384c}.team-row strong{color:#f4f7fa}.team-row>span{font-variant-numeric:tabular-nums}.winrate{display:grid;grid-template-columns:34px 1fr;align-items:center;gap:7px;font-variant-numeric:tabular-nums}.winrate i,.wins-row i{display:block;height:7px;background:#2b4054;border-radius:9px;overflow:hidden}.winrate b,.wins-row b{display:block;height:100%;background:#26c8a6;border-radius:9px}.wins-chart{display:grid;gap:13px}.wins-row{display:grid;grid-template-columns:minmax(100px,1fr) minmax(100px,3fr) 25px;gap:12px;align-items:center;font-size:11px;color:#c4d1dc}.wins-row strong{font-variant-numeric:tabular-nums;color:#fff}.wins-row i{height:10px}.wins-row b{background:linear-gradient(90deg,#24c5a4,#f5a05d)}.empty{padding:22px 0;text-align:center;color:#91a7b8;font-size:12px}.disclaimer{font-size:10px;color:#91a7b8;line-height:1.7;margin:0}
 @media(max-width:800px){.kpi-row{grid-template-columns:repeat(2,minmax(0,1fr))}.analytics-grid{grid-template-columns:1fr}}@media(max-width:480px){.kpi-row article{padding:12px}.kpi-row strong{font-size:28px}.analytics-panel{padding:13px}.activity-chart{height:160px}}
</style>
