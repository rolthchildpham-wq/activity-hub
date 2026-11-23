<script lang="ts">
 import {onMount} from 'svelte';
 import {page} from '$app/stores';
 import {client} from '$lib/firebase';
 import {listenLimitedBranch} from '$lib/shared/api/limited-branch';
 import {summarizeFinance,formatVND,type Transaction} from '$lib/entities/finance';
 import {sports,legacyHref} from '$lib/domain';
 import StateView from '$lib/shared/ui/StateView.svelte';
 let records:Record<string,Transaction>={},loading=true,error='';
 $: sport=sports.find(s=>s.key===$page.params.slug);
 $: totals=summarizeFinance(records);
 onMount(()=>{
  const unsubscribe=listenLimitedBranch<Transaction>(client().db,$page.params.slug as any,String($page.params.tid||''),'transactions',value=>{
   records=value;loading=false;error='';
  },e=>{error=e;loading=false});
  return unsubscribe;
 });
</script>
<svelte:head><title>TOPKEY · Tài chính</title></svelte:head>
<h1>Tài chính</h1>
<p class="subtle">Thông tin tài chính có giới hạn quyền truy cập. Các số dưới đây chỉ phản ánh tối đa 200 giao dịch gần nhất của nhánh đọc, không phải báo cáo toàn giải.</p>
{#if error}<StateView state="error" message={'Không thể đọc nhánh giao dịch: '+error}/>
{:else if loading}<StateView state="loading" message="Đang kiểm tra dữ liệu tài chính…"/>
{:else if !Object.keys(records).length}
 <section class="panel empty-panel"><p>Không có giao dịch tại nhánh dữ liệu này. Không thể kết luận giải không có thu chi.</p></section>
{:else}
 <div class="kpi-grid">
  <div class="panel kpi"><span>Thu (tối đa 200 bản ghi)</span><strong>{formatVND(totals.income)}</strong></div>
  <div class="panel kpi"><span>Chi (tối đa 200 bản ghi)</span><strong>{formatVND(totals.expense)}</strong></div>
  <div class="panel kpi"><span>Chênh lệch</span><strong>{formatVND(totals.balance)}</strong></div>
 </div>
{/if}
{#if sport}<a class="button primary" href={legacyHref(sport.key)}>Mở tài chính chính thức ↗</a>{/if}
