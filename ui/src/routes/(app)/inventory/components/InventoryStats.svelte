<script lang="ts">
	import { inventoryState } from '$lib/states/inventory.svelte';
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';

	function supplyStock(supplyId: string): number {
		return inventoryState.branchStocks.items
			.filter((st) => st.supply === supplyId)
			.reduce((sum, st) => sum + (st.quantity || 0), 0);
	}

	let criticalCount = $derived(
		inventoryState.supplies.items.filter((i) => supplyStock(i.id) <= (i.min_stock ?? 0)).length
	);

	let sufficientCount = $derived(
		inventoryState.supplies.items.filter((i) => supplyStock(i.id) > (i.min_stock ?? 0)).length
	);

	let stabilityPercentage = $derived(
		inventoryState.supplies.items.length > 0
			? ((sufficientCount / inventoryState.supplies.items.length) * 100).toFixed(0)
			: 0
	);
</script>

<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
	<ArtisanalCard level="lowest" class="col-span-2 relative overflow-hidden border border-outline-variant/10 group shadow-sm p-8">
		<div class="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
		<div class="relative z-10">
			<span class="text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
				>Operational Health</span
			>
			<div class="mt-4 flex items-end justify-between">
				<div>
					<p class="font-serif text-3xl leading-none font-black text-on-surface">
						{sufficientCount}
					</p>
					<p class="mt-1 text-[10px] font-bold tracking-wider text-on-surface-variant uppercase">
						Sufficient Supplies
					</p>
				</div>
				<div class="text-right">
					<p class="font-serif text-3xl leading-none font-black text-primary">
						{stabilityPercentage}%
					</p>
					<p class="mt-1 text-[10px] font-bold tracking-wider text-on-surface-variant uppercase">
						Stability
					</p>
				</div>
			</div>
		</div>
	</ArtisanalCard>
    
	<ArtisanalCard level="lowest" class="border border-error/10 bg-error-container/5 relative overflow-hidden group shadow-sm p-8">
		<div class="absolute -top-4 -right-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
			<span class="material-symbols-outlined text-[80px] text-error" style="font-variation-settings: 'FILL' 1;"
				>warning</span
			>
		</div>
		<div class="relative z-10 flex flex-col justify-between h-full">
            <span class="text-error"><span class="material-symbols-outlined">report</span></span>
			<div>
                <p class="font-serif text-3xl leading-none font-black text-error">{criticalCount}</p>
                <p class="mt-1 text-[10px] font-bold tracking-wider text-error/80 uppercase">
                    Critical Low
                </p>
            </div>
		</div>
	</ArtisanalCard>

	<div class="bg-tertiary-container rounded-[2.5rem] p-8 flex flex-col justify-between group relative overflow-hidden shadow-sm hover:scale-[1.02] transition-all">
        <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <span class="material-symbols-outlined text-[80px] text-on-tertiary-container" style="font-variation-settings: 'FILL' 1;">inventory</span>
        </div>
        <span class="text-on-tertiary-container"><span class="material-symbols-outlined">bakery_dining</span></span>
		<div class="relative z-10 mt-4">
            <p class="font-serif text-3xl leading-none font-black text-on-tertiary-container">
                {inventoryState.products.items.length}
            </p>
            <p class="text-on-tertiary-container/70 mt-1 text-[10px] font-bold tracking-wider uppercase">
                SKUs Active
            </p>
        </div>
	</div>
</div>
