<script lang="ts">
 import {page} from '$app/stores';
 import {sports,legacyHref} from '$lib/domain';
 $: sport=sports.find(x=>x.key===$page.params.slug);
</script>
<svelte:head><title>TOPKEY · Trọng tài</title></svelte:head>
<h1>Trọng tài</h1>
<section class="panel">
 <h2>Điều khiển trận đấu có bảo vệ quyền ghi</h2>
 <p class="subtle">Bộ máy chấm điểm thực tế của từng môn có quy tắc riêng về set, hiệp, tỷ số, giao quyền, audit và quyền trọng tài. Chưa được phép dùng thao tác cộng điểm chung từ bản mẫu để ghi vào production.</p>
 {#if sport}<a href={legacyHref(sport.key)} class="button primary">Mở bảng điều khiển trọng tài hiện tại ↗</a>{/if}
</section>
