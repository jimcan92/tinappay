<script lang="ts">
	interface Props {
		current: number;
		min: number;
		max: number;
		unit: string;
		showText?: boolean;
		showBar?: boolean;
	}

	let { current, min, max, unit, showText = true, showBar = true }: Props = $props();

	let progress = $derived(Math.min(Math.max((current / (max || 1)) * 100, 0), 100));
	let isLow = $derived(current <= min);
</script>

<div class="flex flex-col gap-2">
	{#if showText}
		<p class="font-serif font-black text-on-surface">
			{current}
			<span class="font-sans text-[10px] font-bold text-on-surface-variant uppercase">{unit}</span>
		</p>
	{/if}

	{#if showBar}
		<div
			class="h-1.5 w-full overflow-hidden rounded-full bg-surface-container transition-all lg:w-32"
		>
			<div
				class="h-full rounded-full transition-all duration-700 {isLow ? 'bg-error' : 'bg-primary'}"
				style="width: {progress}%"
			></div>
		</div>
	{/if}
</div>
