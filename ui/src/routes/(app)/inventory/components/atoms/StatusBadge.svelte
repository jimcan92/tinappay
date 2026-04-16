<script lang="ts">
	interface Props {
		type: 'product' | 'supply';
		current?: number;
		min?: number;
	}

	let { type, current, min }: Props = $props();

	let isLow = $derived(type === 'supply' && current !== undefined && min !== undefined && current <= min);
</script>

{#if type === 'product'}
	<span
		class="inline-block rounded-md bg-tertiary-container px-2.5 py-1 text-[9px] font-black tracking-widest text-on-tertiary-container uppercase"
		>Active</span
	>
{:else}
	<span
		class="inline-block rounded-md px-2.5 py-1 text-[9px] font-black tracking-widest uppercase {isLow
			? 'bg-error-container text-on-error-container'
			: 'bg-tertiary-container text-on-tertiary-container'}"
	>
		{isLow ? 'Critical' : 'Optimal'}
	</span>
{/if}
