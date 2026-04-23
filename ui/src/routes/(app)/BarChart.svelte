<script lang="ts">
	import type { BarData } from '$lib/states/orders.svelte';

	interface Props {
		bars: BarData[];
		emptyCount?: number;
	}

	let { bars, emptyCount = 7 }: Props = $props();

	let cols = $derived(bars.length || emptyCount);
	let hoveredIndex = $state<number | null>(null);
</script>

<!--
  Grid has no items-end — default stretch makes each column fill h-36.
  Each column is flex-col justify-end so the bar sits at the bottom.
  height: X% on the bar resolves against the full h-36 column height.
-->
<div
	class="relative z-10 grid h-36 gap-3"
	style="grid-template-columns: repeat({cols}, 1fr)"
>
	{#each bars as bar, i (bar.label)}
		<div
			class="relative flex h-full flex-col items-center justify-end"
			onmouseenter={() => (hoveredIndex = i)}
			onmouseleave={() => (hoveredIndex = null)}
			role="img"
			aria-label="{bar.label}: ₱{bar.revenue.toFixed(2)}"
		>
			<!-- Tooltip -->
			{#if hoveredIndex === i}
				<div class="absolute -top-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-xl bg-on-surface px-3 py-1.5 shadow-lg pointer-events-none">
					<p class="text-[11px] font-black text-surface">₱{bar.revenue.toFixed(2)}</p>
					<div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-on-surface"></div>
				</div>
			{/if}

			<!-- Bar -->
			<div
				class="w-full rounded-xl transition-all duration-700 {bar.highlight
					? 'bg-primary/80 shadow-lg shadow-primary/20'
					: 'bg-surface-container-high'} {hoveredIndex === i ? 'brightness-110 scale-x-105' : ''}"
				style="height: {bar.pct}%"
			></div>
		</div>
	{:else}
		{#each Array(emptyCount) as _}
			<div class="flex h-full flex-col items-center justify-end">
				<div class="w-full rounded-xl bg-surface-container-high/50" style="height: 30%"></div>
			</div>
		{/each}
	{/each}
</div>

<!-- Labels -->
<div class="relative z-10 mt-2 grid gap-3" style="grid-template-columns: repeat({cols}, 1fr)">
	{#each bars as bar, i (bar.label)}
		<p
			class="truncate text-center text-[10px] font-bold transition-colors {bar.highlight || hoveredIndex === i
				? 'text-primary'
				: 'text-on-surface-variant'}"
			title={bar.label}
		>
			{bar.label}
		</p>
	{:else}
		{#each Array(emptyCount) as _}
			<p class="text-center text-[10px] text-on-surface-variant/30">—</p>
		{/each}
	{/each}
</div>
