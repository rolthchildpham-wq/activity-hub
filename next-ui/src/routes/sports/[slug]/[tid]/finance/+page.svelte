<script lang="ts">
 import {onDestroy} from 'svelte';
 import {afterNavigate} from '$app/navigation';
 import {page} from '$app/stores';
 import {client} from '$lib/firebase';
 import {listenLimitedBranch} from '$lib/shared/api/limited-branch';
 import {summarizeFinance,formatVND,type Transaction} from '$lib/entities/finance';
 import {sports,legacyHref,type SportKey} from '$lib/domain';
 import StateView from '$lib/shared/ui/StateView.svelte';
 let records:Record<string,Transaction>={},loading=true,error='';
 let unsubscribe:(()=>void)|undefined;
 $: sport=sports.find(s=>s.key===$page.params.slug);
 $: totals=summarizeFinance(records);
 afterNavigate(()=>{
  unsubscribe?.();unsubscribe=undefined;records={};loading=true;error='';
  const slug=$page.params.slug as SportKey,tid=String($page.params.tid||'');
  try{
   unsubscribe=listenLimitedBranch<Transaction>(client().db,slug,tid,'finance',value=>{
    records=value;loading=false;error='';
   },message=>{error=message;loading=false});
  }catch(e){error=e instanceof Error?e.message:String(e);loading=false}
 });
 onDestroy(()=>unsubscribe?.());
</script>
<svelte:head><title>TOPKEY · Tài chính</title></svelte:head>
<h1>Tài chính</h1>
<p class="subtle">Số liệu lấy từ toàn bộ nhánh finance của giải theo quyền tài khoản. Tổng thu/chi bao gồm cả khoản đang chờ duyệt, không đồng nghĩa đã thanh toán.</p>
{#if error}<StateView state="error" message={'Không thể đọc nhánh finance: '+error}/>
{:else if loading}<StateView state="loading" message="Đang kiểm tra dữ liệu tài chính…"/>
{:else if !Object.keys(records).length}
 <section class="panel empty-panel"><p>Không có giao dịch được ghi nhận tại nhánh finance.</p></section>
{:else}
 <div class="kpi-grid">
  <div class="panel kpi"><span>Khoản thu ghi nhận</span><strong>{formatVND(totals.income)}</strong></div>
  <div class="panel kpi"><span>Khoản chi ghi nhận</span><strong>{formatVND(totals.expense)}</strong></div>
  <div class="panel kpi"><span>Chênh lệch ghi nhận</span><strong>{formatVND(totals.balance)}</strong></div>
 </div>
 <p class="subtle">Khoản đang yêu cầu duyệt: {totals.requested}. Xác minh trạng thái đã thu/chi trên hệ thống chính thức.</p>
{/if}
{#if sport}<a class="button primary" href={legacyHref(sport.key,String($page.params.tid||''))}>Mở tài chính chính thức ↗</a>{/if}
