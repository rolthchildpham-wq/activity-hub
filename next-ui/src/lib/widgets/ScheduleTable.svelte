<script lang="ts">
 import type {TournamentSnapshot,Match} from '$lib/domain';
 import {filterScheduleMatches,normalizeScheduleDate} from '$lib/domain';
 export let data:TournamentSnapshot;
 let query='';
 let status='ALL';
 let category='ALL';
 let from='';
 let to='';
 $: allMatches=Object.entries(data.matches??{}).filter((item):item is [string,Match]=>!!item[1]&&typeof item[1]==='object');
 $: categories=[...new Set(allMatches.map(([,m])=>m.category||'Chung'))].sort((a,b)=>a.localeCompare(b,'vi'));
 $: matches=filterScheduleMatches(data.matches,data.teams,{query,status,category,from,to});
 $: activeFilters=!!(query.trim()||status!=='ALL'||category!=='ALL'||from||to);
 function clearFilters(){query='';status='ALL';category='ALL';from='';to=''}
 function statusText(value?:string){const key=(value||'SCHEDULED').toUpperCase();return ({SCHEDULED:'Chưa đấu',PENDING:'Chờ đấu',LIVE:'Đang thi đấu',IN_PROGRESS:'Đang thi đấu',FINISHED:'Đã kết thúc',WALKOVER:'Bỏ cuộc',RETIRED:'Dừng trận',DISQUALIFIED:'Bị loại'} as Record<string,string>)[key]||key}
 function displayDate(value?:string){return normalizeScheduleDate(value)||value||'—'}
</script>
<section class="panel schedule-panel">
 <div class="panel-heading">
  <div><h3>Lịch thi đấu &amp; kết quả</h3><p class="schedule-caption">Lọc trực tiếp trên dữ liệu giải đấu đã đồng bộ</p></div>
  <span class="tag">{matches.length} / {allMatches.length} trận</span>
 </div>
 <div class="schedule-filters" aria-label="Bộ lọc lịch thi đấu">
  <label class="schedule-search">Tìm trận / đội
   <input type="search" bind:value={query} placeholder="Tên đội, mã trận, bảng đấu…" aria-label="Tìm theo tên đội, mã trận hoặc bảng đấu"/>
  </label>
  <label>Trạng thái
   <select bind:value={status} aria-label="Lọc trạng thái">
    <option value="ALL">Tất cả trạng thái</option>
    <option value="SCHEDULED">Chưa đấu</option>
    <option value="PENDING">Chờ đấu</option>
    <option value="LIVE">Đang thi đấu</option>
    <option value="IN_PROGRESS">Đang thi đấu (tiếp diễn)</option>
    <option value="FINISHED">Đã kết thúc</option>
    <option value="WALKOVER">Bỏ cuộc</option>
    <option value="RETIRED">Dừng trận</option>
    <option value="DISQUALIFIED">Bị loại</option>
   </select>
  </label>
  <label>Bảng / nội dung
   <select bind:value={category} aria-label="Lọc nội dung">
    <option value="ALL">Tất cả nội dung</option>
    {#each categories as item}<option value={item}>{item}</option>{/each}
   </select>
  </label>
  <label>Từ ngày<input type="date" bind:value={from} aria-label="Từ ngày"/></label>
  <label>Đến ngày<input type="date" bind:value={to} min={from||undefined} aria-label="Đến ngày"/></label>
  <button type="button" class="filter-reset" on:click={clearFilters} disabled={!activeFilters}>Xóa lọc</button>
 </div>
 {#if from&&to&&to<from}
  <p class="filter-note" role="alert">Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.</p>
 {:else if matches.length===0}
  <div class="schedule-empty"><strong>{allMatches.length===0?'Chưa có trận đấu trong giải này':'Không tìm thấy trận phù hợp'}</strong><p>{allMatches.length===0?'Lịch sẽ xuất hiện khi dữ liệu trận đấu được tạo.':'Thử đổi điều kiện lọc hoặc xóa bộ lọc để xem toàn bộ lịch.'}</p>{#if activeFilters}<button type="button" class="filter-reset" on:click={clearFilters}>Hiện tất cả trận</button>{/if}</div>
 {:else}
  <div class="table-scroll"><table>
   <thead><tr><th>Trận</th><th>Ngày / Giờ</th><th>Đội A</th><th>Đội B</th><th>Tỉ số</th><th>Bảng / Vòng</th><th>Trạng thái</th></tr></thead>
   <tbody>{#each matches as [id,m]}
    <tr><td><strong>{m.code||m.id||id}</strong></td><td>{displayDate(m.date)} {m.time||''}</td>
     <td>{data.teams?.[m.teamAId||'']?.name||'—'}</td>
     <td>{data.teams?.[m.teamBId||'']?.name||'—'}</td>
     <td class="schedule-score">{typeof m.scoreA==='number'?m.scoreA:'—'} <span>:</span> {typeof m.scoreB==='number'?m.scoreB:'—'}</td>
     <td>{m.groupName||m.groupId||m.group||m.stage||'—'}</td>
     <td><span class:live={['LIVE','IN_PROGRESS'].includes((m.status||'').toUpperCase())} class="match-status">{statusText(m.status)}</span></td>
    </tr>
   {/each}</tbody>
  </table></div>
 {/if}
</section>
<style>
 .schedule-caption{font-size:12px;color:#647d7d;margin:6px 0 0}
 .schedule-filters{display:grid;grid-template-columns:minmax(190px,1.6fr) repeat(4,minmax(130px,1fr)) auto;gap:10px;align-items:end;padding:14px;margin:0 0 16px;background:#f5f8f6;border:1px solid #e0e9e5;border-radius:11px}
 .schedule-filters label{display:grid;gap:6px;min-width:0;font-size:11px;font-weight:750;color:#355c55}
 .schedule-filters input,.schedule-filters select{width:100%;min-width:0;min-height:42px;border:1px solid #cbdad5;border-radius:8px;background:white;padding:8px 10px;color:#173f3b;font:inherit;font-size:12px}
 .filter-reset{min-height:42px;padding:8px 12px;border:1px solid #cbdad5;border-radius:8px;background:white;color:#315c54;font-weight:750;font-size:12px;white-space:nowrap}
 .filter-reset:disabled{opacity:.45;cursor:not-allowed}
 .filter-note{font-size:12px;color:#9a3b2e;background:#fff0eb;padding:10px 12px;border-radius:8px}
 .schedule-empty{text-align:center;padding:34px 14px;color:#355c55}
 .schedule-empty p{font-size:12px;color:#647d7d;margin:8px 0 14px}
 .schedule-score{font-weight:850;font-variant-numeric:tabular-nums;white-space:nowrap}
 .schedule-score span{color:#829590;padding:0 3px}
 @media(max-width:1100px){.schedule-filters{grid-template-columns:repeat(3,minmax(0,1fr))}.schedule-search{grid-column:span 2}}
 @media(max-width:650px){.schedule-filters{grid-template-columns:repeat(2,minmax(0,1fr));padding:10px}.schedule-search{grid-column:1/-1}.schedule-filters label{font-size:10px}.schedule-filters input,.schedule-filters select{font-size:12px}.filter-reset{grid-column:1/-1}}
</style>
