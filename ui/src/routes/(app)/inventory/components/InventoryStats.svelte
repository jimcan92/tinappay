<script lang="ts">
	import { inventoryState } from '$lib/state/inventory.svelte';

	let criticalCount = $derived(
		inventoryState.supplies.items.filter(
			(i) => (i.current_stock ?? 0) <= (i.min_stock ?? 0)
		).length
	);

	let sufficientCount = $derived(
		inventoryState.supplies.items.filter(
			(i) => (i.current_stock ?? 0) > (i.min_stock ?? 0)
		).length
	);

	let stabilityPercentage = $derived(
		inventoryState.supplies.items.length > 0
			? ((sufficientCount / inventoryState.supplies.items.length) * 100).toFixed(0)
			: 0
	);
</script>

<div class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
	<div
		class="relative col-span-2 overflow-hidden rounded-[2rem] bg-surface-container-lowest p-6 shadow-sm"
	>
		<div
			class="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl"
		></div>
		<div class="relative z-10">
			<span class="text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
				>Operational Health</span
			>
			<div class="mt-4 flex items-end justify-between">
				<div>
					<p class="font-serif text-3xl leading-none font-black text-on-surface">
						{sufficientCount}
					</p>
					<p
						class="mt-1 text-[10px] font-bold tracking-wider text-on-surface-variant uppercase"
					>
						Sufficient Supplies
					</p>
				</div>
				<div class="text-right">
					<p class="font-serif text-3xl leading-none font-black text-primary">
						{stabilityPercentage}%
					</p>
					<p
						class="mt-1 text-[10px] font-bold tracking-wider text-on-surface-variant uppercase"
					>
						Stability
					</p>
				</div>
			</div>
		</div>
	</div>
	<div
		class="relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-error/10 bg-error-container/10 p-6"
	>
		<div class="absolute -top-4 -right-4 opacity-10">
			<span
				class="material-symbols-outlined text-[80px]"
				style="font-variation-settings: 'FILL' 1;">warning</span
			>
		</div>
		<div class="relative z-10">
			<p class="font-serif text-2xl leading-none font-black text-error">{criticalCount}</p>
			<p
				class="mt-1 text-[10px] font-bold tracking-wider text-on-error-container/80 uppercase"
			>
				Critical Low
			</p>
		</div>
	</div>
	<div class="flex flex-col justify-between rounded-[2rem] bg-tertiary-container p-6">
		<p class="font-serif text-2xl leading-none font-black text-on-surface">
			{inventoryState.products.items.length}
		</p>
		<p
			class="mt-1 text-[10px] font-bold tracking-wider text-on-tertiary-container/80 uppercase"
		>
			SKUs Active
		</p>
	</div>
</div>
