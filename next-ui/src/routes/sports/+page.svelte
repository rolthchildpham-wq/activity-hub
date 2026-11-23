<script lang="ts">
 import {base} from '$app/paths';
 import {sports,legacyHref} from '$lib/domain';
</script>
<svelte:head><title>TOPKEY · Bộ môn</title></svelte:head>
<main class="dashboard">
 <a class="viewer-link" href={base+'/'}>← Tổng quan TOPKEY</a>
 <h1>Tất cả bộ môn</h1><p class="subtle">Chọn bộ môn để mở giải. Các thao tác điều hành hiện vẫn được bảo vệ trong hệ thống cũ.</p>
 <div class="sports-directory">{#each sports as s}
  <a href={s.key==='vlog'?legacyHref(s.key):base+'/sports/'+s.key} class="panel sport-tile"><span aria-hidden="true">{s.icon}</span><strong>{s.name}</strong><small>Xem giải đấu →</small></a>
 {/each}</div>
</main>
