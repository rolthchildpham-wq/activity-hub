<script lang="ts">
 import {page} from '$app/stores';
 import {base} from '$app/paths';
 import {sports} from '$lib/domain';
 let tid='main_2026';
 $: sport=sports.find(x=>x.key===$page.params.slug);
 $: valid=/^[A-Za-z0-9_-]{1,100}$/.test(tid);
</script>
<main class="dashboard">
 <a href={base+'/sports'} class="viewer-link">← Tất cả bộ môn</a>
 {#if sport}
  <h1>{sport.icon} {sport.name}</h1><p class="subtle">Mở giải đấu theo mã đã được cấp quyền.</p>
  <form class="panel tournament-picker" on:submit|preventDefault={()=>{if(valid)location.href=base+'/sports/'+sport.key+'/'+encodeURIComponent(tid)}}>
   <label for="tid-selector">Mã giải đấu</label>
   <input id="tid-selector" bind:value={tid} required pattern="[A-Za-z0-9_-]{1,100}" autocomplete="off"/>
   <button type="submit" class="button primary" disabled={!valid}>Mở giải</button>
  </form>
 {:else}<section class="panel empty-panel"><h2>Không tìm thấy bộ môn</h2></section>{/if}
</main>
