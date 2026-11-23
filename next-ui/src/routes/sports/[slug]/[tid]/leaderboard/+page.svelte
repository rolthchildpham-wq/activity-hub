<script lang="ts">
 import {tournament} from '$lib/features/tournament/store';
 import {sports,legacyHref,type SportKey} from '$lib/domain';
 import {page} from '$app/stores';
 $: rows=Object.entries($tournament.data.teams??{}).filter(([id,t])=>!!t&&typeof t==='object');
 $: sport=sports.find(s=>s.key===$page.params.slug);
</script>
<svelte:head><title>TOPKEY · Bảng xếp hạng</title></svelte:head>
<h1>Bảng xếp hạng</h1>
<section class="panel" role="note">
 <h2>Cần áp dụng đúng luật từng bộ môn</h2>
 <p class="subtle">Bóng chuyền, bóng đá và cầu lông không dùng chung công thức tính điểm, set và tiêu chí xếp hạng. Bảng chính thức vẫn được tính bằng bộ máy đã xác minh của hệ thống hiện tại, không dùng công thức thắng 3 điểm chung cho tất cả môn.</p>
 {#if sport}<a class="button primary" href={legacyHref(sport.key,String($page.params.tid||''))}>Xem bảng xếp hạng chính thức ↗</a>{/if}
</section>
<section class="panel section-panel"><h2>Đội / VĐV trong giải ({rows.length})</h2>
 {#if !rows.length}<p class="subtle">Chưa có đội/VĐV.</p>
 {:else}<div class="directory-grid">{#each rows as [id,t]}
 <div class="team-item"><strong>{t.name||id}</strong><small>{t.checkedIn?'Đã điểm danh':'Chưa điểm danh'}</small></div>
 {/each}</div>{/if}
</section>
