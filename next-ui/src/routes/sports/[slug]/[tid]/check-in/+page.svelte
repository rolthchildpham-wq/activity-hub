<script lang="ts">
 import {tournament} from '$lib/features/tournament/store';
 import {page} from '$app/stores';
 import {sports,legacyHref} from '$lib/domain';
 $: teams=Object.entries($tournament.data.teams??{}).filter(([id,t])=>!!t&&typeof t==='object');
 $: checked=teams.filter(([id,t])=>t.checkedIn===true).length;
 $: sport=sports.find(s=>s.key===$page.params.slug);
</script>
<svelte:head><title>TOPKEY · Điểm danh</title></svelte:head>
<h1>Điểm danh</h1><p class="subtle">{checked} / {teams.length} đội hoặc vận động viên đã điểm danh.</p>
<section class="panel section-panel">
 {#if !teams.length}<p>Chưa có đội hoặc vận động viên.</p>
 {:else}{#each teams as [id,t]}<div class="row-between match-line">
  <strong>{t.name||id}</strong><span class="tag">{t.checkedIn?'✓ Đã điểm danh':'Chưa điểm danh'}</span>
 </div>{/each}{/if}
</section>
{#if sport}<p class="subtle">Để cập nhật điểm danh, mở phân hệ đã được cấp quyền của TOPKEY.</p><a class="button primary" href={legacyHref(sport.key)}>Mở quản lý điểm danh ↗</a>{/if}
