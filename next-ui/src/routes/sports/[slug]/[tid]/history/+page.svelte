<script lang="ts">
 import {onDestroy} from 'svelte';
 import {afterNavigate} from '$app/navigation';
 import {page} from '$app/stores';
 import {client} from '$lib/firebase';
 import {listenLimitedBranch} from '$lib/shared/api/limited-branch';
 import {sports,legacyHref,type SportKey} from '$lib/domain';
 import StateView from '$lib/shared/ui/StateView.svelte';
 type Entry={action?:string;actor?:string;clientAt?:number;entityType?:string;entityId?:string};
 let entries:Array<Entry&{id:string}>=[],loading=true,error='';
 let unsubscribe:(()=>void)|undefined;
 $: sport=sports.find(s=>s.key===$page.params.slug);
 afterNavigate(()=>{
  unsubscribe?.();unsubscribe=undefined;entries=[];loading=true;error='';
  const slug=$page.params.slug as SportKey,tid=String($page.params.tid||'');
  try{
   unsubscribe=listenLimitedBranch<Entry>(client().db,slug,tid,'audit',records=>{
    entries=Object.entries(records).filter((item):item is [string,Entry]=>!!item[1]&&typeof item[1]==='object')
     .map(([id,value])=>({...value,id}))
     .sort((a,b)=>(b.clientAt||0)-(a.clientAt||0)).slice(0,200);
    loading=false;error='';
   },message=>{error=message;loading=false});
  }catch(e){error=e instanceof Error?e.message:String(e);loading=false}
 });
 onDestroy(()=>unsubscribe?.());
 const format=(at?:number)=>at?new Date(at).toLocaleString('vi-VN'):'Chưa có giờ';
</script>
<svelte:head><title>TOPKEY · Nhật ký</title></svelte:head>
<h1>Nhật ký hoạt động</h1><p class="subtle">Hiển thị tối đa 200 thao tác gần nhất theo thời gian ghi nhận clientAt.</p>
{#if error}<StateView state="error" message={'Không thể đọc nhật ký audit: '+error}/>
{:else if loading}<StateView state="loading"/>
{:else if !entries.length}<p class="panel empty-panel">Không có bản ghi trong nhánh audit.</p>
{:else}<section class="panel section-panel">{#each entries as entry}
 <article class="match-line"><div class="row-between"><strong>{entry.action||'Thao tác'}</strong><small class="subtle">{format(entry.clientAt)}</small></div>
 <p class="subtle">{entry.entityType||'—'} / {entry.entityId||'—'} {entry.actor?'· bởi '+entry.actor:''}</p>
 </article>{/each}</section>{/if}
{#if sport}<a class="button outline" href={legacyHref(sport.key,String($page.params.tid||''))}>Mở nhật ký hệ thống hiện tại ↗</a>{/if}
