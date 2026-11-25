<script lang="ts">
 import {tournament} from '$lib/features/tournament/store';
 import {activeLiveMatches,sortDashboardMatches,completed} from '$lib/domain';
 import {headToHead,matchScoreLabel,matchStatusLabel} from '$lib/entities/match-center';
 $: data=$tournament.data;
 $: teams=Object.entries(data.teams??{}).filter(([id,t])=>!!id&&!!t&&typeof t==='object');
 $: live=activeLiveMatches(data);
 $: upcoming=sortDashboardMatches(data.matches).filter(([,m])=>['SCHEDULED','PENDING'].includes(String(m.status||'SCHEDULED').toUpperCase())).slice(0,8);
 let teamAId='';let teamBId='';
 $: if(teams.length&&!teamAId)teamAId=teams[0][0];
 $: if(teams.length>1&&(!teamBId||teamBId===teamAId))teamBId=teams.find(([id])=>id!==teamAId)?.[0]||'';
 $: comparison=headToHead(data.matches,data.teams,teamAId,teamBId);
 $: teamA=data.teams[teamAId];$: teamB=data.teams[teamBId];
 $: totalWins=comparison.a.won+comparison.b.won;
 $: shareA=totalWins?100*comparison.a.won/totalWins:50;
 function teamName(id?:string){return data.teams?.[id||'']?.name||'Chưa xác định'}
 function isLive(status?:string){return ['LIVE','IN_PROGRESS'].includes(String(status||'').toUpperCase())}
</script>
<svelte:head><title>TOPKEY · Live Match Center</title><meta name="description" content="Bảng điểm trực tiếp, trạng thái sân và đối đầu từ dữ liệu giải đấu TOPKEY"/></svelte:head>
<div class="match-center">
 <header class="center-heading"><div><p class="eyebrow">MATCH CENTER / REALTIME DATA</p><h1>Trung tâm trận đấu trực tiếp</h1><p class="subtle">Tỷ số, sân đấu và lịch thi đấu được đồng bộ từ Firebase của giải hiện tại.</p></div><div class="live-total"><i></i><strong>{live.length}</strong><span>TRẬN ĐANG LIVE</span></div></header>
 <section class="score-layout">
  <div class="score-main">
   <div class="section-head"><div><h2>Live scoreboard</h2><p class="subtle">Bảng điểm đang diễn ra</p></div><span class="live-pill"><i></i> LIVE</span></div>
   {#if !live.length}
    <div class="empty-live"><span>◉</span><h3>Chưa có trận trực tiếp</h3><p>Trận đấu sẽ tự xuất hiện khi trọng tài hoặc hệ thống chuyển trạng thái sang LIVE.</p></div>
   {:else}
    <div class="live-cards">{#each live as [id,m]}
     <article class="live-card">
      <div class="live-card-top"><span class="live-pill"><i></i> LIVE</span><span>{m.code||id}</span><span>{m.courtName||m.courtId||m.court||'Chưa gán sân'}</span></div>
      <div class="score-pair">
       <div class="competitor"><small>ĐỘI A</small><strong>{teamName(m.teamAId)}</strong></div>
       <div class="score-numbers" aria-label={'Tỉ số '+matchScoreLabel(m)}><strong>{m.scoreA??'—'}</strong><b>:</b><strong>{m.scoreB??'—'}</strong></div>
       <div class="competitor right"><small>ĐỘI B</small><strong>{teamName(m.teamBId)}</strong></div>
      </div>
      <div class="live-card-foot"><span>{m.category||'Chung'} · {m.groupName||m.groupId||m.group||m.stage||'Chưa phân bảng'}</span><span>{m.date||'Hôm nay'} {m.time||''}</span></div>
     </article>
    {/each}</div>
   {/if}
  </div>
  <aside class="center-side">
   <section class="side-panel"><div class="section-head"><div><h2>Trạng thái trận</h2><p class="subtle">Tổng hợp theo dữ liệu hiện có</p></div></div>
    <div class="status-count"><span>Đang thi đấu</span><strong>{live.length}</strong></div>
    <div class="status-count"><span>Sắp diễn ra</span><strong>{upcoming.length}</strong></div>
    <div class="status-count"><span>Đã hoàn tất</span><strong>{Object.values(data.matches??{}).filter(m=>m&&completed.has(String(m.status||'').toUpperCase())).length}</strong></div>
   </section>
   <section class="side-panel"><div class="section-head"><div><h2>Sắp diễn ra</h2><p class="subtle">Các trận chờ thi đấu tiếp theo</p></div></div>
    {#if !upcoming.length}<p class="subtle">Chưa có trận được lên lịch.</p>{:else}<div class="upcoming-list">{#each upcoming as [id,m]}
     <div class="upcoming-row"><span class="upcoming-time">{m.time||'--:--'}</span><div><strong>{teamName(m.teamAId)} vs {teamName(m.teamBId)}</strong><small>{m.date||'Chưa có ngày'} · {m.courtName||m.courtId||m.court||'Chưa gán sân'}</small></div></div>
    {/each}</div>{/if}
   </section>
  </aside>
 </section>
 <section class="h2h-panel"><div class="section-head"><div><p class="eyebrow">HEAD-TO-HEAD</p><h2>So sánh đối đầu</h2><p class="subtle">Chỉ tính trận đã hoàn tất có đủ tỷ số; không tự tạo dữ liệu khi chưa có lịch sử.</p></div></div>
  {#if teams.length<2}<p class="empty-h2h">Cần ít nhất hai đội/VĐV trong giải để so sánh.</p>{:else}
   <div class="team-selectors"><label>Đội / VĐV 1<select bind:value={teamAId}>{#each teams as [id,t]}<option value={id}>{t.name||id}</option>{/each}</select></label><label>Đội / VĐV 2<select bind:value={teamBId}>{#each teams as [id,t]}<option value={id} disabled={id===teamAId}>{t.name||id}</option>{/each}</select></label></div>
   <div class="h2h-score"><div><small>THẮNG</small><strong>{comparison.a.won}</strong><span>{teamA?.name||'Đội 1'}</span></div><div class="meeting-count"><strong>{comparison.meetings}</strong><small>TRẬN ĐỐI ĐẦU</small></div><div class="align-right"><small>THẮNG</small><strong>{comparison.b.won}</strong><span>{teamB?.name||'Đội 2'}</span></div></div>
   <div class="comparison-track" role="img" aria-label={'Tỷ lệ thắng '+Math.round(shareA)+' phần trăm so với '+Math.round(100-shareA)+' phần trăm'}><span style:width={shareA+'%'}></span><span style:width={(100-shareA)+'%'}></span></div>
   {#if comparison.available}
    <div class="record-grid"><div><small>Đã đấu · Hòa · Thua</small><strong>{comparison.a.played} · {comparison.a.drawn} · {comparison.a.lost}</strong><small>Điểm ghi / nhận</small><strong>{comparison.a.pointsFor} / {comparison.a.pointsAgainst}</strong></div><div class="align-right"><small>Đã đấu · Hòa · Thua</small><strong>{comparison.b.played} · {comparison.b.drawn} · {comparison.b.lost}</strong><small>Điểm ghi / nhận</small><strong>{comparison.b.pointsFor} / {comparison.b.pointsAgainst}</strong></div></div>
   {:else}<p class="empty-h2h">Chưa có trận đối đầu đã hoàn tất với tỷ số hợp lệ.</p>{/if}
  {/if}
 </section>
</div>
<style>
 .match-center{display:grid;gap:18px;color:#e8f0f7}.center-heading{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}.eyebrow{color:#ff9b58;font-size:10px;letter-spacing:.14em;font-weight:900;margin:0 0 7px}.center-heading h1{margin:0;font-size:clamp(24px,3vw,34px);color:#f5f8fb}.center-heading>.subtle{margin:8px 0 0}.live-total{display:grid;grid-template-columns:12px auto;align-items:center;gap:3px 8px;background:#1b2a3b;border:1px solid #314357;padding:12px 16px;border-radius:12px}.live-total i,.live-pill i{width:8px;height:8px;border-radius:50%;background:#ff5d59;box-shadow:0 0 0 4px #ff5d5926}.live-total strong{font-size:24px;font-variant-numeric:tabular-nums}.live-total span{grid-column:2;font-size:9px;color:#a9bac9;letter-spacing:.1em}.score-layout{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(260px,.9fr);gap:16px}.score-main,.side-panel,.h2h-panel{background:#111d2c;border:1px solid #2a3a4e;border-radius:15px;padding:18px;min-width:0}.section-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.section-head h2{font-size:17px;margin:0;color:#f4f7fa}.section-head p{font-size:11px;margin:5px 0 0;color:#9eafbf}.live-pill{display:inline-flex;align-items:center;gap:7px;background:#3b2029;color:#ff9692;padding:6px 9px;border-radius:99px;font-size:9px;font-weight:900;letter-spacing:.08em;white-space:nowrap}.live-pill i{width:6px;height:6px}.live-cards{display:grid;gap:12px}.live-card{background:#1b2a3b;border:1px solid #31465c;border-radius:12px;padding:14px}.live-card-top,.live-card-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;color:#9eb1c3;font-size:10px}.score-pair{display:grid;grid-template-columns:minmax(0,1fr) minmax(110px,.7fr) minmax(0,1fr);align-items:center;gap:10px;padding:20px 0}.competitor{min-width:0}.competitor small,.h2h-score small{display:block;font-size:9px;color:#94a9bb;letter-spacing:.1em;margin-bottom:6px}.competitor strong{font-size:clamp(13px,1.4vw,18px);overflow-wrap:anywhere;color:#f3f7fb}.competitor.right{text-align:right}.score-numbers{display:flex;justify-content:center;align-items:center;gap:10px;color:#fff}.score-numbers strong{font-size:clamp(28px,4vw,44px);font-variant-numeric:tabular-nums;line-height:1}.score-numbers b{color:#71869a;font-size:20px}.live-card-foot{border-top:1px solid #304255;padding-top:10px}.center-side{display:grid;gap:16px;align-content:start}.status-count{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-top:1px solid #2b3c50;color:#aebdca;font-size:12px}.status-count strong{font-size:20px;color:#f7f9fb;font-variant-numeric:tabular-nums}.upcoming-list{display:grid}.upcoming-row{display:flex;gap:11px;padding:11px 0;border-top:1px solid #2b3c50}.upcoming-time{font-size:12px;font-weight:900;color:#ffad72;font-variant-numeric:tabular-nums;min-width:43px}.upcoming-row strong,.upcoming-row small{display:block;font-size:11px;line-height:1.5}.upcoming-row small{color:#93a7b9;margin-top:3px}.h2h-panel{padding:20px}.h2h-panel .section-head{align-items:flex-end}.team-selectors{display:grid;grid-template-columns:1fr 1fr;gap:12px}.team-selectors label{display:grid;gap:6px;color:#b8c7d4;font-size:11px;font-weight:800}.team-selectors select{min-width:0;width:100%;min-height:42px;background:#1b2a3b;color:#f4f7fa;border:1px solid #40566c;border-radius:9px;padding:8px}.h2h-score{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;padding:24px 0 14px}.h2h-score>div>strong{display:block;font-size:36px;font-variant-numeric:tabular-nums;color:#fff}.h2h-score>div>span{display:block;color:#c2cfda;font-size:12px;margin-top:4px}.meeting-count{text-align:center}.meeting-count strong{font-size:26px!important}.meeting-count small{white-space:nowrap}.align-right{text-align:right}.comparison-track{height:10px;border-radius:99px;overflow:hidden;display:flex;background:#304356;gap:3px}.comparison-track span:first-child{background:#2bd4ad}.comparison-track span:last-child{background:#ff9b58}.record-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;padding-top:14px}.record-grid>div{display:grid;gap:6px}.record-grid small{color:#91a6b9;font-size:10px}.record-grid strong{font-size:13px;color:#e8f0f7;font-variant-numeric:tabular-nums}.empty-live,.empty-h2h{padding:24px;text-align:center;color:#9eafbf;font-size:12px}.empty-live>span{font-size:28px;color:#ff9b58}.empty-live h3{margin:7px 0;color:#eaf1f6;font-size:15px}.empty-live p{font-size:11px;max-width:420px;margin:0 auto;line-height:1.6}
 @media(max-width:850px){.score-layout{grid-template-columns:1fr}.center-side{grid-template-columns:1fr 1fr}}@media(max-width:560px){.center-side{grid-template-columns:1fr}.score-pair{grid-template-columns:minmax(0,1fr) minmax(95px,.65fr) minmax(0,1fr);gap:5px}.score-numbers{gap:5px}.competitor strong{font-size:12px}.live-card{padding:11px}.score-main,.side-panel,.h2h-panel{padding:13px}.team-selectors{grid-template-columns:1fr}.h2h-score{gap:7px}.h2h-score>div>strong{font-size:28px}.meeting-count strong{font-size:22px!important}}
</style>
