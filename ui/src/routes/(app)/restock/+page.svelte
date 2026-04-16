<script lang="ts">
	import { onMount } from 'svelte';
	import { pb } from '$lib/pocketbase';
	import SignatureButton from '$lib/components/artisanal/SignatureButton.svelte';
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
    import BakingLoader from '$lib/components/BakingLoader.svelte';

	let lowStockIngredients = $state<any[]>([]);
	let suppliers = $state<any[]>([]);
	let loading = $state(true);
	let processing = $state(false);

	let selectedIngredient = $state<any>(null);
	let restockAmount = $state(0);

	async function fetchData() {
		try {
			const [ingList, supList] = await Promise.all([
				pb.collection('ingredients').getFullList({
					filter: 'current_stock <= min_stock',
					sort: 'current_stock',
                    expand: 'category'
				}),
				pb.collection('suppliers').getFullList({ sort: 'name' })
			]);
			lowStockIngredients = ingList;
			suppliers = supList;
		} catch (error) {
			console.error('Restock fetch error:', error);
		} finally {
			loading = false;
		}
	}

	onMount(fetchData);

	function getStockPercentage(ing: any) {
		const perc = (ing.current_stock / ing.max_stock) * 100;
		return Math.round(Math.min(Math.max(perc, 0), 100));
	}

	async function handleRestock() {
		if (!selectedIngredient || restockAmount <= 0) return;
		processing = true;
		try {
			const newStock = selectedIngredient.current_stock + restockAmount;
			await pb.collection('ingredients').update(selectedIngredient.id, {
				current_stock: newStock
			});

			await pb.collection('inventory_logs').create({
				supply: selectedIngredient.id,
				quantity: restockAmount,
				reason: 'restock',
				user: pb.authStore.model?.id
			});

			await fetchData();
			selectedIngredient = null;
			restockAmount = 0;
		} catch (err) {
			console.error('Restock failed:', err);
		} finally {
			processing = false;
		}
	}
</script>

<div class="px-6 py-10 md:px-12 max-w-7xl mx-auto">
	<header class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
		<div>
			<h1 class="text-4xl md:text-5xl font-black text-on-surface tracking-tight mb-3 font-serif">Procurement</h1>
			<p class="text-on-surface-variant text-lg max-w-2xl font-medium leading-relaxed">Replenish your artisanal supplies and raw materials from trusted partners.</p>
		</div>
        <div class="flex items-center gap-3">
            {#if lowStockIngredients.length > 0}
                <div class="bg-error-container/10 text-error px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border border-error/10 animate-pulse flex items-center gap-3 shadow-sm">
                    <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">warning</span>
                    {lowStockIngredients.length} Shortages
                </div>
            {/if}
        </div>
	</header>

	{#if loading}
		<div class="flex h-64 items-center justify-center">
			<BakingLoader />
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
			<!-- Watchlist -->
			<div class="lg:col-span-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
				
				<!-- Critical Cards -->
				<section>
					<h3 class="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] mb-6 px-1">Immediate Replenishment</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						{#each lowStockIngredients.slice(0, 4) as ing}
							<ArtisanalCard level="lowest" clickable onclick={() => selectedIngredient = ing} class="border border-error/10 bg-error-container/5 relative overflow-hidden group hover:shadow-xl hover:border-error/20 transition-all">
								<div class="absolute -right-6 -top-6 opacity-5 rotate-12 transition-transform group-hover:scale-110">
									<span class="material-symbols-outlined text-[120px]">shopping_cart</span>
								</div>
								<div class="relative z-10 flex flex-col h-full">
									<div class="flex items-center justify-between mb-6">
										<span class="px-2 py-1 bg-error text-white rounded text-[9px] font-black uppercase tracking-widest">Critical</span>
										<span class="material-symbols-outlined text-error text-xl">priority_high</span>
									</div>
									<h4 class="text-2xl font-serif font-black text-on-surface mb-2">{ing.name}</h4>
									<div class="flex items-baseline gap-2 mb-6">
										<span class="text-4xl font-serif font-black text-error leading-none">{ing.current_stock}{ing.unit}</span>
										<span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">of {ing.max_stock}{ing.unit}</span>
									</div>
									<div class="mt-auto">
										<div class="h-1.5 w-full bg-surface-container rounded-full overflow-hidden mb-4 border border-outline-variant/5">
											<div class="h-full bg-error transition-all duration-1000 shadow-[0_0_10px_rgba(176,37,0,0.3)]" style="width: {getStockPercentage(ing)}%"></div>
										</div>
										<button class="text-[10px] font-black uppercase tracking-[0.2em] text-primary group-hover:gap-2 flex items-center transition-all">
											Refill Pantry <span class="material-symbols-outlined text-sm">arrow_forward</span>
										</button>
									</div>
								</div>
							</ArtisanalCard>
						{:else}
							<div class="col-span-2 py-20 rounded-[3rem] border-2 border-dashed border-outline-variant/20 flex flex-col items-center justify-center text-center bg-surface-container-low/30">
								<div class="h-20 w-20 rounded-[2.5rem] bg-tertiary-container text-tertiary flex items-center justify-center mb-6 shadow-inner border border-tertiary/10">
									<span class="material-symbols-outlined text-4xl" style="font-variation-settings: 'FILL' 1;">check_circle</span>
								</div>
								<h4 class="text-2xl font-black text-on-surface font-serif tracking-tight">Stock Healthy</h4>
								<p class="text-sm font-medium text-on-surface-variant mt-2 max-w-xs mx-auto">All bakery raw materials are currently above their critical thresholds.</p>
							</div>
						{/each}
					</div>
				</section>

				<!-- Detailed List -->
				<section>
					<h3 class="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] mb-6 px-1">Full Watchlist Register</h3>
					<ArtisanalCard level="lowest" class="p-0 overflow-hidden border border-outline-variant/10 shadow-sm">
						<table class="w-full text-left border-collapse">
							<thead>
								<tr class="bg-surface-container-low text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em]">
									<th class="px-8 py-5">Ingredient</th>
									<th class="px-6 py-5">Availability</th>
									<th class="px-6 py-5 text-center">Velocity</th>
									<th class="px-8 py-5 text-right">Batch Action</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-outline-variant/5">
								{#each lowStockIngredients as ing}
									<tr class="hover:bg-surface-container-low/40 transition-colors group">
										<td class="px-8 py-6">
											<div class="flex items-center gap-4">
												<div class="h-12 w-12 rounded-xl bg-surface-container flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:scale-105 transition-transform">
													{#if ing.image}
														<img src={pb.files.getUrl(ing, ing.image)} alt="" class="h-full w-full object-cover" />
													{:else}
														<div class="text-primary font-black text-xs uppercase opacity-40">{ing.name.substring(0, 2)}</div>
													{/if}
												</div>
												<div>
													<p class="font-bold text-on-surface text-sm">{ing.name}</p>
													<p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">{ing.expand?.category?.name || 'Raw'}</p>
												</div>
											</div>
										</td>
										<td class="px-6 py-6">
											<div class="flex items-end gap-2 mb-1.5">
												<span class="font-serif font-black text-error text-lg leading-none">{ing.current_stock}</span>
												<span class="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">{ing.unit} Left</span>
											</div>
											<div class="h-1 w-24 bg-surface-container rounded-full overflow-hidden">
												<div class="h-full bg-error transition-all duration-1000" style="width: {getStockPercentage(ing)}%"></div>
											</div>
										</td>
										<td class="px-6 py-6 text-center">
											<span class="text-[10px] font-black text-tertiary uppercase tracking-widest bg-tertiary-container/20 px-2 py-1 rounded border border-tertiary/10">Active</span>
										</td>
										<td class="px-8 py-6 text-right">
											<button onclick={() => selectedIngredient = ing} class="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all active:scale-90 shadow-sm mx-auto">
												<span class="material-symbols-outlined text-lg">add</span>
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</ArtisanalCard>
				</section>
			</div>

			<!-- Sidebar -->
			<aside class="lg:col-span-4 space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
				
				<!-- Action Card -->
				{#if selectedIngredient}
					<ArtisanalCard level="high" class="p-8 border border-primary/20 shadow-2xl relative overflow-hidden group">
						<button onclick={() => selectedIngredient = null} class="absolute top-6 right-6 h-8 w-8 rounded-full hover:bg-on-surface/5 flex items-center justify-center text-on-surface-variant transition-colors">
							<span class="material-symbols-outlined text-sm">close</span>
						</button>
						
						<h3 class="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-8">Stock Update</h3>
						
						<div class="flex items-center gap-5 mb-8">
							<div class="h-16 w-16 rounded-[1.2rem] bg-white flex items-center justify-center overflow-hidden shadow-lg border border-outline-variant/10">
								{#if selectedIngredient.image}
									<img src={pb.files.getUrl(selectedIngredient, selectedIngredient.image)} alt="" class="h-full w-full object-cover" />
								{:else}
									<span class="text-primary font-black text-lg uppercase opacity-30">{selectedIngredient.name.substring(0, 2)}</span>
								{/if}
							</div>
							<div>
								<h4 class="font-serif font-black text-xl text-on-surface leading-tight">{selectedIngredient.name}</h4>
								<p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">Arrival Confirmation</p>
							</div>
						</div>

						<div class="space-y-8">
							<div class="space-y-3">
								<label for="restock-amt" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Amount to Add ({selectedIngredient.unit})</label>
								<input 
									id="restock-amt"
									bind:value={restockAmount} 
									type="number" 
									class="w-full h-16 rounded-2xl bg-white border-none px-6 text-2xl font-black text-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-inner" 
									placeholder="0.00" 
								/>
							</div>
							<SignatureButton disabled={processing || restockAmount <= 0} onclick={handleRestock} class="w-full h-16" size="lg">
								{processing ? 'Processing Delivery...' : 'Finalize Arrival'}
							</SignatureButton>
						</div>
					</ArtisanalCard>
				{/if}

				<!-- Suppliers -->
				<section>
					<h3 class="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] mb-6 px-1">Strategic Partners</h3>
					<div class="space-y-3">
						{#each suppliers as sup}
							<div class="flex items-center justify-between p-5 rounded-3xl border border-outline-variant/10 bg-card shadow-sm hover:shadow-lg hover:border-primary/20 transition-all group">
								<div class="flex items-center gap-4">
									<div class="h-12 w-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black uppercase text-sm shadow-inner group-hover:bg-primary group-hover:text-white transition-colors border border-primary/5">
										{sup.name.substring(0, 1)}
									</div>
									<div>
										<h4 class="font-black text-on-surface text-sm leading-tight mb-0.5">{sup.name}</h4>
										<p class="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">{sup.categories || 'Materials'}</p>
									</div>
								</div>
								<div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
									<button class="h-9 w-9 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90">
										<span class="material-symbols-outlined text-base">call</span>
									</button>
									<button class="h-9 w-9 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90">
										<span class="material-symbols-outlined text-base">mail</span>
									</button>
								</div>
							</div>
						{/each}
					</div>
				</section>

				<!-- Log -->
				<section class="p-8 rounded-[2.5rem] bg-surface-container-low border border-outline-variant/5">
					<h3 class="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] mb-8">Supply Velocity</h3>
					<div class="space-y-8">
						{#each Array(3) as _, i}
							<div class="flex gap-5 relative group">
								{#if i < 2}
									<div class="absolute top-10 left-[1.15rem] w-px h-10 bg-outline-variant/20"></div>
								{/if}
								<div class="h-10 w-10 rounded-xl bg-white border border-outline-variant/10 flex items-center justify-center shrink-0 shadow-sm group-hover:border-primary/30 transition-all">
									<span class="material-symbols-outlined text-primary text-sm opacity-60 group-hover:opacity-100 group-hover:rotate-12 transition-all">local_shipping</span>
								</div>
								<div>
									<p class="text-sm font-bold text-on-surface">Batch Ref #PO-{(2048 - i)}</p>
									<p class="text-[9px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mt-1">Confirmed 2{i}h ago</p>
								</div>
							</div>
						{/each}
					</div>
				</section>
			</aside>
		</div>
	{/if}
</div>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
