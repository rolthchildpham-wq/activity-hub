<script lang="ts">
 import type {TournamentSnapshot,Match} from '$lib/domain';
 export let data:TournamentSnapshot;
 $: matches=Object.entries(data.matches??{})
  .filter((item):item is [string,Match]=>!!item[1]&&typeof item[1]==='object')
  .sort((a,b)=>((a[1].date||'')+' '+(a[1].time||'')).localeCompare((b[1].date||'')+' '+(b[1].time||'')));
</script>
<section class="panel">
 <div class="panel-heading"><h3>Lịch và kết quả</h3><span class="tag">{matches.length} trận</span></div>
 {#if matches.length===0}<p class="subtle">Chưa có trận đấu.</p>
 {:else}<div class="table-scroll"><table>
  <thead><tr><th>Trận</th><th>Ngày / Giờ</th><th>Đội A</th><th>Đội B</th><th>Bảng / Vòng</th><th>Trạng thái</th></tr></thead>
  <tbody>{#each matches as [id,m]}
   <tr><td>{m.code||m.id||id}</td><td>{m.date||'—'} {m.time||''}</td>
    <td>{data.teams?.[m.teamAId||'']?.name||'—'}</td>
    <td>{data.teams?.[m.teamBId||'']?.name||'—'}</td>
    <td>{m.groupName||m.groupId||m.group||m.stage||'—'}</td>
    <td><span class:live={m.status==='LIVE'} class="match-status">{m.status||'SCHEDULED'}</span></td>
   </tr>
  {/each}</tbody>
 </table></div>{/if}
</section>
