<script lang="ts">
 import {tournament} from '$lib/features/tournament/store';
 import {byDate} from '$lib/entities/schedule';
 $: groups=byDate($tournament.data.matches);
</script>
<svelte:head><title>TOPKEY · Lịch thi đấu</title></svelte:head>
<h1>Lịch thi đấu</h1><p class="subtle">Lịch và trạng thái trận được đọc trực tiếp theo giải hiện tại.</p>
{#if !groups.length}<p class="panel empty-panel">Chưa có trận được xếp lịch.</p>
{:else}{#each groups as group}
 <section class="panel section-panel"><h2>{group.date}</h2>
 {#each group.matches as m}
  <div class="row-between match-line">
   <div><strong>{$tournament.data.teams?.[m.teamAId||'']?.name||'Chưa có đội A'} vs {$tournament.data.teams?.[m.teamBId||'']?.name||'Chưa có đội B'}</strong>
    <p class="subtle">{m.time||'Chưa xếp giờ'} · {m.groupName||m.groupId||m.group||m.stage||'Chưa phân bảng'}</p></div>
   <span class="match-status" class:live={m.status==='LIVE'}>{m.status||'SCHEDULED'}</span>
  </div>
 {/each}</section>
{/each}{/if}
