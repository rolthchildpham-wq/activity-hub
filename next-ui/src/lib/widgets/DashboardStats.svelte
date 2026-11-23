<script lang="ts">
 import Card from '$lib/shared/ui/Card.svelte';
 import {summarize,groupPhases,type TournamentSnapshot} from '$lib/domain';
 export let data:TournamentSnapshot;
 $: stats=summarize(data);
 $: phases=groupPhases(data.matches);
 $: percentage=stats.teams?Math.round(100*stats.checkedIn/stats.teams):null;
</script>
<div class="kpi-grid">
 <Card title="Đội / VĐV" value={stats.teams} hint="Đã đăng ký" accent="green"/>
 <Card title="Đã điểm danh" value={stats.checkedIn} hint={'Trên tổng '+stats.teams} accent="blue"/>
 <Card title="Trận đang Live" value={stats.live} hint="Theo trạng thái trận / sân" accent="orange"/>
 <Card title="Đã hoàn tất" value={stats.completed} hint={'Trên '+stats.scheduled+' trận'} accent="purple"/>
</div>
<div class="analysis-grid">
 <section class="panel">
  <div class="panel-heading"><h3>Tiến độ thi đấu</h3><span class="tag">Theo dữ liệu giải</span></div>
  {#if phases.length===0}
   <p class="subtle">Chưa có lịch thi đấu.</p>
  {:else}
   <div class="progress-list">
    {#each phases as phase}
     <div class="progress-item">
      <div><strong>{phase.name}</strong><span>{phase.done} / {phase.total} trận</span></div>
      <div class="track"><div class="fill" style:width={(phase.total?100*phase.done/phase.total:0)+'%'}></div></div>
     </div>
    {/each}
   </div>
  {/if}
 </section>
 <section class="panel">
  <div class="panel-heading"><h3>Điểm danh</h3><span class="tag">Realtime</span></div>
  <div class="donut" style:--fraction={(percentage??0)+'%'}>
   <div><strong>{percentage===null?'—':percentage+'%'}</strong><small>đã check-in</small></div>
  </div>
  <p class="subtle centered">{stats.checkedIn} / {stats.teams} đội hoặc VĐV</p>
 </section>
</div>
