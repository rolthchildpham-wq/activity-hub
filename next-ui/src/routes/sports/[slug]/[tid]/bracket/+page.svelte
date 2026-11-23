<script lang="ts">
 import {tournament} from '$lib/features/tournament/store';
 import {bracketRounds} from '$lib/entities/bracket';
 $: rounds=bracketRounds($tournament.data.matches);
</script>
<svelte:head><title>TOPKEY · Bảng và nhánh đấu</title></svelte:head>
<h1>Bảng và nhánh đấu</h1>
<p class="subtle">Các vòng được nhóm theo dữ liệu trận đã lưu. Không tự suy đoán đội đi tiếp khi giải chưa kết thúc.</p>
{#if !rounds.length}<p class="panel empty-panel">Giải chưa có bảng hoặc nhánh đấu.</p>
{:else}<div class="bracket-scroll"><div class="bracket-rounds">
 {#each rounds as round}<section class="bracket-column">
  <h2>{round.name}</h2>
  {#each round.matches as m}<article class="panel bracket-match">
   <small class="subtle">{m.code||m.id} · {m.status||'SCHEDULED'}</small>
   <div class="row-between"><strong>{$tournament.data.teams?.[m.teamAId||'']?.name||'Chưa xác định'}</strong><span>{m.scoreA??'—'}</span></div>
   <div class="row-between"><strong>{$tournament.data.teams?.[m.teamBId||'']?.name||'Chưa xác định'}</strong><span>{m.scoreB??'—'}</span></div>
  </article>{/each}
 </section>{/each}
 </div></div>{/if}
