<script lang="ts">
 import {tournament} from '$lib/features/tournament/store';
 import {bracketRounds} from '$lib/entities/bracket';
 import {bracketMatchView,bracketStatusLabel} from '$lib/entities/bracket-view';
 import {completed} from '$lib/domain';
 $: data=$tournament.data;
 $: rounds=bracketRounds(data.matches);
 $: total=rounds.reduce((n,r)=>n+r.matches.length,0);
 $: finished=rounds.reduce((n,r)=>n+r.matches.filter(m=>completed.has(String(m.status||'').toUpperCase())).length,0);
</script>
<svelte:head><title>TOPKEY · Tournament Bracket</title><meta name="description" content="Sơ đồ vòng đấu, kết quả và đội thắng từ dữ liệu giải TOPKEY"/></svelte:head>
<div class="bracket-page">
 <header class="bracket-heading"><div><p class="eyebrow">TOURNAMENT CENTER / BRACKET VIEWER</p><h1>Bảng đấu &amp; nhánh loại trực tiếp</h1><p class="muted">Sơ đồ được dựng từ mã vòng, bảng và kết quả đã lưu. Không tự đoán đội đi tiếp.</p></div><div class="bracket-kpis"><span><strong>{total}</strong> TRẬN</span><span><strong>{finished}</strong> HOÀN TẤT</span></div></header>
 {#if !rounds.length}
  <section class="empty-bracket"><span>🏆</span><h2>Chưa có dữ liệu bảng đấu</h2><p>Hãy tạo lịch và phân vòng trong hệ thống quản lý giải. Sơ đồ sẽ tự cập nhật khi dữ liệu xuất hiện.</p></section>
 {:else}
  <div class="bracket-legend"><span><i class="winner-dot"></i> Đội thắng đã xác định</span><span><i class="live-dot"></i> Trận đang diễn ra</span><span><i class="pending-dot"></i> Chưa có kết quả</span></div>
  <div class="bracket-scroll" tabindex="0" aria-label="Sơ đồ nhánh đấu, cuộn ngang để xem các vòng">
   <div class="bracket-rounds">
    {#each rounds as round,i}
     <section class="bracket-round">
      <header><small>VÒNG {String(i+1).padStart(2,'0')}</small><h2>{round.name}</h2><span>{round.matches.length} trận</span></header>
      <div class="round-matches">
       {#each round.matches as match}
        {@const view=bracketMatchView(match.id,match,data.teams)}
        <article class="bracket-match" class:match-live={view.status==='LIVE'||view.status==='IN_PROGRESS'}>
         <div class="match-head"><span>{view.code}</span><span class:status-live={view.status==='LIVE'||view.status==='IN_PROGRESS'}>{bracketStatusLabel(view.status)}</span></div>
         <div class="competitor" class:winner={view.winnerId===view.teamAId&&!!view.winnerId}><span class="team-name">{view.teamAName}</span><strong>{view.scoreA??'—'}</strong></div>
         <div class="competitor" class:winner={view.winnerId===view.teamBId&&!!view.winnerId}><span class="team-name">{view.teamBName}</span><strong>{view.scoreB??'—'}</strong></div>
         {#if view.winnerId}<div class="winner-label">✓ ĐÃ XÁC ĐỊNH ĐỘI THẮNG</div>{:else if completed.has(view.status)}<div class="winner-label neutral-label">Chưa xác định người thắng từ tỷ số</div>{/if}
        </article>
       {/each}
      </div>
     </section>
    {/each}
   </div>
  </div>
  <p class="bracket-footnote">Kết quả hòa, trận walkover hoặc trận thiếu tỷ số không được tự gán người thắng. Bảng xếp hạng vòng bảng chính thức vẫn tuân theo luật riêng của từng bộ môn.</p>
 {/if}
</div>
<style>
 .bracket-page{display:grid;gap:16px;color:#eaf1f7}.bracket-heading{display:flex;justify-content:space-between;align-items:center;gap:15px;flex-wrap:wrap}.eyebrow{font-size:10px;letter-spacing:.14em;color:#f4a05e;font-weight:900;margin:0 0 7px}.bracket-heading h1{font-size:clamp(24px,3vw,34px);margin:0;color:#f6f9fc}.muted{font-size:11px;color:#9caec0;line-height:1.6;margin:7px 0 0}.bracket-kpis{display:flex;gap:8px}.bracket-kpis span{background:#18283a;border:1px solid #30445a;padding:10px 13px;border-radius:10px;font-size:9px;color:#9fb1c2;letter-spacing:.08em}.bracket-kpis strong{font-size:20px;color:#f6f9fc;font-variant-numeric:tabular-nums;margin-right:5px}.bracket-legend{display:flex;gap:17px;flex-wrap:wrap;color:#9fb1c2;font-size:10px}.bracket-legend span{display:flex;align-items:center;gap:6px}.bracket-legend i{width:7px;height:7px;border-radius:50%;display:inline-block}.winner-dot{background:#27d5a8}.live-dot{background:#ff625f}.pending-dot{background:#8095a9}.bracket-scroll{overflow-x:auto;padding:5px 2px 16px;scrollbar-color:#40566c #162538}.bracket-rounds{display:flex;align-items:stretch;gap:28px;min-width:max-content}.bracket-round{width:260px;display:flex;flex-direction:column;gap:14px;position:relative}.bracket-round:not(:last-child):after{content:'›';position:absolute;right:-21px;top:48%;font-size:27px;color:#607b91}.bracket-round>header{padding:12px 14px;background:#1a2b3d;border:1px solid #30465c;border-radius:11px}.bracket-round>header small{font-size:9px;letter-spacing:.1em;color:#f3a05d;font-weight:900}.bracket-round>header h2{font-size:14px;color:#f1f6fa;margin:5px 0}.bracket-round>header span{font-size:10px;color:#9aafc0}.round-matches{display:flex;flex-direction:column;justify-content:space-around;gap:16px;flex:1}.bracket-match{background:#111d2c;border:1px solid #2b4055;border-radius:12px;padding:12px;box-shadow:0 8px 20px #06101d33;min-width:0}.bracket-match.match-live{border-color:#b75c58;box-shadow:0 0 0 1px #b75c5833}.match-head{display:flex;justify-content:space-between;gap:8px;color:#8fa6b9;font-size:9px;margin-bottom:9px}.match-head span:last-child{font-weight:850}.match-head .status-live{color:#ff8e89}.competitor{display:flex;justify-content:space-between;align-items:center;gap:9px;padding:9px 7px;border-radius:7px;border-bottom:1px solid #27394c;color:#bdcad6;font-size:11px}.competitor:last-of-type{border-bottom:0}.competitor strong{font-size:14px;color:#f0f5f9;font-variant-numeric:tabular-nums}.competitor.winner{background:#123d39;color:#c9f9e8}.competitor.winner .team-name{font-weight:900;color:#8de5c6}.competitor.winner strong{color:#8de5c6}.team-name{overflow-wrap:anywhere}.winner-label{font-size:8px;color:#69d9b2;font-weight:900;letter-spacing:.06em;padding:8px 5px 0}.neutral-label{color:#92a7b8}.bracket-footnote{font-size:10px;color:#91a6b8;line-height:1.7;margin:0}.empty-bracket{padding:42px 18px;text-align:center;background:#111d2c;border:1px dashed #40556a;border-radius:14px}.empty-bracket>span{font-size:32px}.empty-bracket h2{font-size:18px;margin:9px 0;color:#f2f6fa}.empty-bracket p{font-size:11px;color:#9aafc1;max-width:420px;margin:auto;line-height:1.6}
</style>
