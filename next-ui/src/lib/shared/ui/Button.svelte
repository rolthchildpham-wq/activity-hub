<script lang="ts">
 export let variant:'primary'|'neutral'|'outline'|'text'='primary';
 export let size:'sm'|'md'='md';
 export let loading=false;
 export let disabled=false;
 export let type:'button'|'submit'|'reset'='button';
 const variants={primary:'primary',neutral:'neutral',outline:'outline',text:'text-button'};
 const sizes={sm:'ui-button-sm',md:'ui-button-md'};
</script>
<button {type} class="button {variants[variant]} {sizes[size]}" disabled={loading||disabled} aria-busy={loading} on:click>
 {#if loading}<span class="ui-button-spinner" aria-hidden="true"></span>{/if}
 <slot/>
</button>
