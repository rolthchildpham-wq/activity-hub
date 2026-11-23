<script lang="ts">
 export let title:string;
 export let value:string|number;
 export let hint='';
 export let accent:'green'|'blue'|'orange'|'purple'='green';
</script>
<section class="panel kpi accent-{accent}" aria-label={title}>
 <span>{title}</span>
 <strong>{value}</strong>
 {#if hint}<small>{hint}</small>{/if}
</section>
