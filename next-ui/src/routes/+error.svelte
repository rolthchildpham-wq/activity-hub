<script lang="ts">
 import {page} from '$app/stores';
 import {base} from '$app/paths';
</script>
<svelte:head><title>TOPKEY · Lỗi hiển thị</title></svelte:head>
<main class="auth-screen">
 <section class="login-card" role="alert">
  <div class="logo-mark">!</div>
  <h1>Không thể hiển thị trang</h1>
  <p class="subtle">Một thành phần đã gặp lỗi. Dữ liệu giải đấu không bị thay đổi bởi trang này.</p>
  <p class="small">Mã lỗi: {$page.status || 500}</p>
  <a class="button primary" href={base+'/'}>Trở về TOPKEY Next</a>
 </section>
</main>
