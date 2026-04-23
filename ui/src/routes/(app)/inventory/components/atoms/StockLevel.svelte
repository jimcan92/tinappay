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
			<span class="font-sans text-[10px] font-black text-on-surface-variant/60 uppercase ml-1 tracking-tighter">{unit}</span>
		</p>
	{/if}

	{#if showBar}
		<div
			class="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high transition-all lg:w-32 border border-outline-variant/5 shadow-inner"
		>
			<div
				class="h-full rounded-full transition-all duration-1000 {isLow ? 'bg-error shadow-[0_0_10px_rgba(176,37,0,0.4)]' : 'bg-primary shadow-[0_0_10px_rgba(155,64,0,0.2)]'}"
				style="width: {progress}%"
			></div>
		</div>
	{/if}
</div>
