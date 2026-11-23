<script lang="ts">
 export let state:'loading'|'error'|'empty'|'ready'='loading';
 export let message='';
</script>
{#if state==='loading'}
 <section class="panel empty-panel" role="status" aria-live="polite">
  <div class="spinner" aria-hidden="true"></div>
  <h3>Đang tải dữ liệu…</h3><p class="subtle">{message||'Đang kết nối tới giải đấu.'}</p>
 </section>
{:else if state==='error'}
 <section class="panel empty-panel" role="alert">
  <h3>Không thể tải dữ liệu</h3><p class="alert">{message||'Kiểm tra mã giải và quyền truy cập.'}</p>
 </section>
{:else if state==='empty'}
 <section class="panel empty-panel" role="status">
  <h3>Chưa có dữ liệu để hiển thị</h3>
  <p class="subtle">{message||'Vui lòng chọn mã giải và tài khoản có quyền xem.'}</p>
 </section>
{/if}
