<script lang="ts">
 import {page} from '$app/stores';
 import {base} from '$app/paths';
 import {tournament,metrics} from '$lib/features/tournament/store';
 import DashboardStats from '$lib/widgets/DashboardStats.svelte';
 import {sports,legacyHref,type SportKey} from '$lib/domain';
 $: sport=sports.find(x=>x.key===$page.params.slug);
 $: root=base+'/sports/'+$page.params.slug+'/'+$page.params.tid;
</script>
<svelte:head><title>TOPKEY · Tổng quan giải</title></svelte:head>
<h1>Tổng quan giải {sport?.name||''}</h1><p class="subtle">Chỉ số theo dữ liệu đã đồng bộ thực tế.</p>
<DashboardStats data={$tournament.data}/>
<div class="module-cards">
 {#each [
  ['schedule','Lịch thi đấu','📅'],['bracket','Vòng bảng / Nhánh đấu','🏆'],
  ['live','Live Score','🔴'],['referee','Trọng tài','⚖'],['leaderboard','Bảng xếp hạng','📊'],
  ['check-in','Điểm danh','✓'],['finance','Tài chính','₫'],['history','Nhật ký','◷']
 ] as item}
  <a href={root+'/'+item[0]} class="panel module-card"><strong>{item[2]} {item[1]}</strong><span>Xem dữ liệu →</span></a>
 {/each}
</div>
{#if sport}
 <a href={legacyHref(sport.key,String($page.params.tid||''))} class="button primary">Mở chức năng vận hành hiện tại ↗</a>
{/if}
