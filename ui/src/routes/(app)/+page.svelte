<script lang="ts">
	import { onMount } from 'svelte';
	import { pb } from '$lib/pocketbase';
	import BakingLoader from '$lib/components/BakingLoader.svelte';

	let totalRevenue = $state(0);
	let orderCount = $state(0);
	let criticalAlerts = $state<any[]>([]);
	let topProducts = $state<any[]>([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			const startOfDay = new Date();
			startOfDay.setHours(0, 0, 0, 0);
			const filter = `created >= "${startOfDay.toISOString().replace('T', ' ')}"`;

			const orders = await pb.collection('orders').getFullList({ filter });
			orderCount = orders.length;
			totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);

			criticalAlerts = await pb.collection('ingredients').getFullList({
				filter: 'current_stock <= min_stock',
				sort: 'current_stock',
                expand: 'category'
			});

			const orderItems = await pb.collection('order_items').getFullList({
				filter,
				expand: 'product'
			});

			const salesMap = new Map();
			orderItems.forEach((item) => {
				const prodId = item.product;
				if (item.expand && item.expand.product) {
					const current = salesMap.get(prodId) || { 
                        name: item.expand.product.name, 
                        count: 0, 
                        image: item.expand.product.image, 
                        product: item.expand.product, 
                        price: item.expand.product.price 
                    };
					current.count += item.quantity;
					salesMap.set(prodId, current);
				}
			});

			topProducts = Array.from(salesMap.values())
				.sort((a, b) => b.count - a.count)
				.slice(0, 3);
		} catch (error) {
			console.error('Dashboard error:', error);
		} finally {
			loading = false;
		}
	});

	let today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
</script>

<div class="px-6 py-8 md:px-10 md:py-10 max-w-[1600px] mx-auto">
	{#if loading}
		<div class="flex h-[60vh] items-center justify-center">
			<BakingLoader />
		</div>
	{:else}
		<!-- Hero Header -->
		<div class="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
			<div>
				<h2 class="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface mb-2">Good morning, Baker.</h2>
				<p class="text-on-surface-variant text-lg">The ovens are at temperature. You have <span class="text-primary font-semibold">{orderCount} orders</span> today.</p>
			</div>
			<div class="bg-surface-container-low px-6 py-3 rounded-2xl flex items-center gap-3 self-start">
				<span class="material-symbols-outlined text-primary">calendar_today</span>
				<span class="font-semibold text-on-surface">{today}</span>
			</div>
		</div>

		<!-- Bento Grid Layout -->
		<div class="grid grid-cols-12 gap-6">
			<!-- Revenue Insights -->
			<div class="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
				<div class="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
				<div class="flex justify-between items-start mb-8 relative z-10">
					<div>
						<h3 class="text-2xl font-bold text-on-surface tracking-tight">Revenue Insights</h3>
						<p class="text-sm text-on-surface-variant font-medium">Daily performance tracking</p>
					</div>
					<div class="flex gap-2">
						<button class="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest bg-surface-container-high text-on-surface">Daily</button>
						<button class="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-low">Weekly</button>
					</div>
				</div>
				<div class="flex items-end gap-8 mb-10 relative z-10">
					<div>
						<p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Total Sales</p>
						<p class="text-5xl font-serif font-black text-on-surface tracking-tighter">${totalRevenue.toFixed(2)}</p>
					</div>
					<div class="pb-2">
						<span class="flex items-center text-primary font-bold text-sm bg-primary-container/10 px-3 py-1 rounded-full">
							<span class="material-symbols-outlined text-sm mr-1">trending_up</span>
							+14.2%
						</span>
					</div>
				</div>
				<!-- Visual Data (Mini Chart) -->
				<div class="grid grid-cols-7 gap-4 items-end h-40">
					{#each [24, 32, 28, 44, 36, 40, 16] as h, i}
						<div class="space-y-2 group">
							<div 
								class="rounded-full w-full transition-all duration-500 {i === 3 ? 'bg-primary shadow-lg shadow-primary/20 h-full' : 'bg-surface-container-high h-[60%] group-hover:bg-primary-container/40'}"
								style="height: {h}%"
							></div>
							<p class="text-[10px] font-black text-center {i === 3 ? 'text-primary' : 'text-on-surface-variant'}">DAY {i+1}</p>
						</div>
					{/each}
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="col-span-12 lg:col-span-4 grid grid-rows-2 gap-6">
				<div class="bg-secondary-container rounded-[2.5rem] p-8 flex flex-col justify-between group overflow-hidden relative transition-all hover:shadow-lg">
					<div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
						<span class="material-symbols-outlined text-[120px]" style="font-variation-settings: 'FILL' 1;">restaurant_menu</span>
					</div>
					<h3 class="text-xl font-bold text-on-secondary-container leading-tight">Review Artisan<br/>Production Plan</h3>
					<a class="flex items-center gap-2 text-on-secondary-container font-black uppercase tracking-widest text-[10px] hover:translate-x-1 transition-transform" href="/inventory">
						Go to Inventory
						<span class="material-symbols-outlined text-sm">arrow_forward</span>
					</a>
				</div>
				<div class="bg-tertiary-container rounded-[2.5rem] p-8 flex flex-col justify-between group overflow-hidden relative transition-all hover:shadow-lg">
					<div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
						<span class="material-symbols-outlined text-[120px]" style="font-variation-settings: 'FILL' 1;">query_stats</span>
					</div>
					<h3 class="text-xl font-bold text-on-tertiary-container leading-tight">Analyze Sales<br/>Volume Trends</h3>
					<a class="flex items-center gap-2 text-on-tertiary-container font-black uppercase tracking-widest text-[10px] hover:translate-x-1 transition-transform" href="/reports">
						View Analytics
						<span class="material-symbols-outlined text-sm">arrow_forward</span>
					</a>
				</div>
			</div>

			<!-- Critical Stock Table -->
			<div class="col-span-12 lg:col-span-7 bg-surface-container-lowest rounded-[2.5rem] p-8 shadow-sm">
				<div class="flex justify-between items-center mb-8">
					<div>
						<h3 class="text-2xl font-bold text-on-surface tracking-tight">Critical Stock</h3>
						<p class="text-sm text-on-surface-variant font-medium">Ingredients requiring immediate replenishment</p>
					</div>
					<a href="/inventory" class="text-primary font-black uppercase tracking-widest text-[10px] underline underline-offset-4 decoration-primary/30">Manage Inventory</a>
				</div>
				<div class="space-y-1">
					<!-- Table Header -->
					<div class="grid grid-cols-12 px-4 py-2 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
						<div class="col-span-5">Ingredient</div>
						<div class="col-span-3 text-right">Level</div>
						<div class="col-span-4 text-right">Action</div>
					</div>
					
					{#each criticalAlerts.slice(0, 4) as ing, i}
						<div class="grid grid-cols-12 items-center px-4 py-4 rounded-2xl {i % 2 === 0 ? 'bg-surface-container-low' : 'bg-surface-container-lowest'} transition-colors hover:bg-surface-container-high/50 group">
							<div class="col-span-5 flex items-center gap-3">
								<div class="w-10 h-10 rounded-lg bg-surface flex items-center justify-center shadow-inner">
									<span class="material-symbols-outlined text-primary text-xl">grain</span>
								</div>
								<div>
									<p class="font-bold text-on-surface text-sm">{ing.name}</p>
									<p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">{ing.expand?.category?.name || 'Supply'}</p>
								</div>
							</div>
							<div class="col-span-3 text-right">
								<p class="font-serif font-black text-error text-base">{ing.current_stock} {ing.unit}</p>
								<p class="text-[9px] font-black text-on-surface-variant uppercase">Min: {ing.min_stock}</p>
							</div>
							<div class="col-span-4 text-right">
								<a href="/restock" class="inline-block px-4 py-1.5 rounded-full bg-error-container text-on-error-container text-[10px] font-black uppercase tracking-widest">REORDER</a>
							</div>
						</div>
					{:else}
						<div class="py-10 text-center text-on-surface-variant/50 italic text-sm font-medium">All ingredients are sufficient.</div>
					{/each}
				</div>
			</div>

			<!-- Top Performers -->
			<div class="col-span-12 lg:col-span-5 bg-surface-container-highest/30 rounded-[2.5rem] p-8 border border-outline-variant/10">
				<h3 class="text-xl font-bold text-on-surface mb-8 tracking-tight">Top Performers <span class="text-[10px] font-black text-on-surface-variant block uppercase tracking-[0.2em] mt-1">By Daily Volume</span></h3>
				<div class="space-y-8">
					{#each topProducts as item}
						<div class="flex items-center gap-5 group">
							<div class="w-16 h-16 rounded-2xl overflow-hidden shadow-md transition-transform group-hover:scale-105">
                                {#if item.image}
								    <img class="w-full h-full object-cover" src={pb.files.getUrl(item.product, item.image)} alt={item.name}/>
                                {:else}
                                    <div class="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase text-xl">{item.name.substring(0, 2)}</div>
                                {/if}
							</div>
							<div class="flex-1">
								<p class="font-bold text-on-surface">{item.name}</p>
								<div class="w-full bg-surface-container-high h-1.5 rounded-full mt-2.5">
									<div class="bg-primary h-full rounded-full" style="width: {Math.min(100, (item.count / 50) * 100)}%"></div>
								</div>
							</div>
							<div class="text-right">
								<p class="font-serif font-black text-on-surface text-xl">{item.count}</p>
								<p class="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Units</p>
							</div>
						</div>
					{:else}
                        <div class="py-10 text-center text-on-surface-variant/50 italic text-sm font-medium">No batches recorded today.</div>
                    {/each}
				</div>
			</div>
		</div>
	{/if}
</div>
