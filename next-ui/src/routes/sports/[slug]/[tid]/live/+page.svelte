<script lang="ts">
 import {tournament} from '$lib/features/tournament/store';
 import {completed,type Match} from '$lib/domain';
 $: active=Object.entries($tournament.data.matches??{}).filter((v):v is [string,Match]=>!!v[1]&&['LIVE','IN_PROGRESS'].includes(v[1].status||''));
</script>
<svelte:head><title>TOPKEY · Trực tiếp tỷ số</title></svelte:head>
<div class="row-between"><h1>Trực tiếp tỷ số</h1><span class="tag">● Firebase realtime</span></div>
<p class="subtle">Theo dõi tỷ số từ dữ liệu trận hiện tại. Chế độ trọng tài ghi điểm vẫn dùng giao diện hiện hành.</p>
{#if !active.length}<p class="panel empty-panel">Không có trận đang Live trong dữ liệu giải.</p>
{:else}<div class="live-grid">{#each active as [id,m]}
 <section class="panel live-match"><span class="match-status live">● LIVE</span>
  <p class="subtle">{m.stage||m.group||'Đang thi đấu'}</p>
  <div class="live-score"><div><strong>{$tournament.data.teams?.[m.teamAId||'']?.name||'Đội A'}</strong></div>
   <span>{m.scoreA??'—'} : {m.scoreB??'—'}</span>
   <div><strong>{$tournament.data.teams?.[m.teamBId||'']?.name||'Đội B'}</strong></div>
  </div>
  <small class="subtle">Trận {m.code||id}</small>
 </section>{/each}</div>{/if}
