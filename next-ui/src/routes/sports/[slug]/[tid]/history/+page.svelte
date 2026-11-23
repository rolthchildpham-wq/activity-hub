<script lang="ts">
 import {onMount} from 'svelte';
 import {page} from '$app/stores';
 import {client} from '$lib/firebase';
 import {listenLimitedBranch} from '$lib/shared/api/limited-branch';
 import {sports,legacyHref} from '$lib/domain';
 import StateView from '$lib/shared/ui/StateView.svelte';
 type Entry={action?:string;by?:string;at?:number;detail?:string};
 let entries:Array<Entry&{id:string}>=[],loading=true,error='';
 $: sport=sports.find(s=>s.key===$page.params.slug);
 onMount(()=>{
  const off=listenLimitedBranch<Entry>(client().db,$page.params.slug as any,String($page.params.tid||''),'logs',records=>{
   entries=Object.entries(records).filter(([id,v])=>!!v&&typeof v==='object')
    .map(([id,v])=>({...v,id})).sort((a,b)=>(b.at||0)-(a.at||0));
   loading=false;error='';
  },e=>{error=e;loading=false});
  return off;
 });
 const format=(at?:number)=>at?new Date(at).toLocaleString('vi-VN'):'Chưa có giờ';
</script>
<svelte:head><title>TOPKEY · Nhật ký</title></svelte:head>
<h1>Nhật ký hoạt động</h1><p class="subtle">Tối đa 200 bản ghi gần nhất của nhánh nhật ký được cấp quyền.</p>
{#if error}<StateView state="error" message={'Không thể đọc nhật ký: '+error}/>
{:else if loading}<StateView state="loading"/>
{:else if !entries.length}<p class="panel empty-panel">Không có bản ghi trong nhánh nhật ký này.</p>
{:else}<section class="panel section-panel">{#each entries as entry}
 <article class="match-line"><div class="row-between"><strong>{entry.action||'Thao tác'}</strong><small class="subtle">{format(entry.at)}</small></div>
 <p class="subtle">{entry.detail||''} {entry.by?'· '+entry.by:''}</p></article>
{/each}</section>{/if}
{#if sport}<a class="button outline" href={legacyHref(sport.key)}>Mở nhật ký hệ thống hiện tại ↗</a>{/if}
