<script lang="ts">
	interface Props {
		type: 'product' | 'supply';
		current?: number;
		min?: number;
	}

	let { type, current, min }: Props = $props();

	let isLow = $derived(current !== undefined && min !== undefined && current <= min);
</script>

{#if type === 'product'}
	<span
		class="inline-block rounded-md bg-tertiary-container px-2.5 py-1 text-[9px] font-black tracking-widest text-on-tertiary-container uppercase border border-tertiary-container"
		>Live Item</span
	>
{:else}
	<span
		class="inline-block rounded-md px-2.5 py-1 text-[9px] font-black tracking-widest uppercase border {isLow
			? 'bg-error-container text-on-error-container border-error-container animate-pulse'
			: 'bg-tertiary-container text-on-tertiary-container border-tertiary-container'}"
	>
		{isLow ? 'Critical' : 'Stock OK'}
	</span>
{/if}
