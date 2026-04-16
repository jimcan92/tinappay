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
			// Mas sigurado nga format para sa PocketBase
			const startOfDay = new Date();
			startOfDay.setHours(0, 0, 0, 0);

			// Ang toISOString() mohatag og format nga '2026-04-12T16:00:00.000Z'
			// Ganahan ang PocketBase og 'YYYY-MM-DD HH:mm:ss'
			const filterDate = startOfDay.toISOString().replace('T', ' ').split('.')[0];

			// Gamita ang single quotes sa sulod para sa value
			const filter = `created >= '${filterDate}'`;

			const [orders, orderItems] = await Promise.all([
				pb.collection('orders').getFullList({ filter, requestKey: null }),
				pb.collection('order_items').getFullList({
					filter,
					expand: 'product',
					requestKey: null
				})
			]);

			orderCount = orders.length;
			totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);

			criticalAlerts = await pb.collection('ingredients').getFullList({
				filter: 'current_stock <= min_stock',
				sort: 'current_stock',
				expand: 'category',
				requestKey: null
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
		} catch (error: any) {
			console.error('Dashboard fetch error:', error);
		} finally {
			loading = false;
		}
	});

	let today = new Date().toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});
</script>

<div class="mx-auto max-w-[1600px] px-6 py-8 md:px-10 md:py-10">
	{#if loading}
		<div class="flex h-[60vh] items-center justify-center">
			<BakingLoader />
		</div>
	{:else}
		<!-- Hero Header -->
		<div class="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
			<div>
				<h2 class="mb-2 text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
					Good morning, Baker.
				</h2>
				<p class="text-lg text-on-surface-variant">
					The ovens are at temperature. You have <span class="font-semibold text-primary"
						>{orderCount} orders</span
					> today.
				</p>
			</div>
			<div
				class="flex items-center gap-3 self-start rounded-2xl bg-surface-container-low px-6 py-3"
			>
				<span class="material-symbols-outlined text-primary">calendar_today</span>
				<span class="font-semibold text-on-surface">{today}</span>
			</div>
		</div>

		<!-- Bento Grid Layout -->
		<div class="grid grid-cols-12 gap-6">
			<!-- Revenue Insights -->
			<div
				class="relative col-span-12 overflow-hidden rounded-[2.5rem] bg-surface-container-lowest p-8 shadow-sm lg:col-span-8"
			>
				<div
					class="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl"
				></div>
				<div class="relative z-10 mb-8 flex items-start justify-between">
					<div>
						<h3 class="text-2xl font-bold tracking-tight text-on-surface">Revenue Insights</h3>
						<p class="text-sm font-medium text-on-surface-variant">Daily performance tracking</p>
					</div>
					<div class="flex gap-2">
						<button
							class="rounded-full bg-surface-container-high px-4 py-2 text-xs font-black tracking-widest text-on-surface uppercase"
							>Daily</button
						>
						<button
							class="rounded-full px-4 py-2 text-xs font-black tracking-widest text-on-surface-variant uppercase hover:bg-surface-container-low"
							>Weekly</button
						>
					</div>
				</div>
				<div class="relative z-10 mb-10 flex items-end gap-8">
					<div>
						<p
							class="mb-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
						>
							Total Sales
						</p>
						<p class="font-serif text-5xl font-black tracking-tighter text-on-surface">
							${totalRevenue.toFixed(2)}
						</p>
					</div>
					<div class="pb-2">
						<span
							class="flex items-center rounded-full bg-primary-container/10 px-3 py-1 text-sm font-bold text-primary"
						>
							<span class="material-symbols-outlined mr-1 text-sm">trending_up</span>
							+14.2%
						</span>
					</div>
				</div>
				<!-- Visual Data (Mini Chart) -->
				<div class="grid h-40 grid-cols-7 items-end gap-4">
					{#each [24, 32, 28, 44, 36, 40, 16] as h, i}
						<div class="group space-y-2">
							<div
								class="w-full rounded-full transition-all duration-500 {i === 3
									? 'h-full bg-primary shadow-lg shadow-primary/20'
									: 'h-[60%] bg-surface-container-high group-hover:bg-primary-container/40'}"
								style="height: {h}%"
							></div>
							<p
								class="text-center text-[10px] font-black {i === 3
									? 'text-primary'
									: 'text-on-surface-variant'}"
							>
								DAY {i + 1}
							</p>
						</div>
					{/each}
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="col-span-12 grid grid-rows-2 gap-6 lg:col-span-4">
				<div
					class="group relative flex flex-col justify-between overflow-hidden rounded-[2.5rem] bg-secondary-container p-8 transition-all hover:shadow-lg"
				>
					<div
						class="absolute -right-4 -bottom-4 opacity-10 transition-transform duration-700 group-hover:scale-110"
					>
						<span
							class="material-symbols-outlined text-[120px]"
							style="font-variation-settings: 'FILL' 1;">restaurant_menu</span
						>
					</div>
					<h3 class="text-xl leading-tight font-bold text-on-secondary-container">
						Review Artisan<br />Production Plan
					</h3>
					<a
						class="flex items-center gap-2 text-[10px] font-black tracking-widest text-on-secondary-container uppercase transition-transform hover:translate-x-1"
						href="/inventory"
					>
						Go to Inventory
						<span class="material-symbols-outlined text-sm">arrow_forward</span>
					</a>
				</div>
				<div
					class="group relative flex flex-col justify-between overflow-hidden rounded-[2.5rem] bg-tertiary-container p-8 transition-all hover:shadow-lg"
				>
					<div
						class="absolute -right-4 -bottom-4 opacity-10 transition-transform duration-700 group-hover:scale-110"
					>
						<span
							class="material-symbols-outlined text-[120px]"
							style="font-variation-settings: 'FILL' 1;">query_stats</span
						>
					</div>
					<h3 class="text-xl leading-tight font-bold text-on-tertiary-container">
						Analyze Sales<br />Volume Trends
					</h3>
					<a
						class="flex items-center gap-2 text-[10px] font-black tracking-widest text-on-tertiary-container uppercase transition-transform hover:translate-x-1"
						href="/reports"
					>
						View Analytics
						<span class="material-symbols-outlined text-sm">arrow_forward</span>
					</a>
				</div>
			</div>

			<!-- Critical Stock Table -->
			<div
				class="col-span-12 rounded-[2.5rem] bg-surface-container-lowest p-8 shadow-sm lg:col-span-7"
			>
				<div class="mb-8 flex items-center justify-between">
					<div>
						<h3 class="text-2xl font-bold tracking-tight text-on-surface">Critical Stock</h3>
						<p class="text-sm font-medium text-on-surface-variant">
							Ingredients requiring immediate replenishment
						</p>
					</div>
					<a
						href="/inventory"
						class="text-[10px] font-black tracking-widest text-primary uppercase underline decoration-primary/30 underline-offset-4"
						>Manage Inventory</a
					>
				</div>
				<div class="space-y-1">
					<!-- Table Header -->
					<div
						class="grid grid-cols-12 px-4 py-2 text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
					>
						<div class="col-span-5">Ingredient</div>
						<div class="col-span-3 text-right">Level</div>
						<div class="col-span-4 text-right">Action</div>
					</div>

					{#each criticalAlerts.slice(0, 4) as ing, i}
						<div
							class="grid grid-cols-12 items-center rounded-2xl px-4 py-4 {i % 2 === 0
								? 'bg-surface-container-low'
								: 'bg-surface-container-lowest'} group transition-colors hover:bg-surface-container-high/50"
						>
							<div class="col-span-5 flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-lg bg-surface shadow-inner"
								>
									<span class="material-symbols-outlined text-xl text-primary">grain</span>
								</div>
								<div>
									<p class="text-sm font-bold text-on-surface">{ing.name}</p>
									<p
										class="text-[10px] font-bold tracking-tighter text-on-surface-variant uppercase"
									>
										{ing.expand?.category?.name || 'Supply'}
									</p>
								</div>
							</div>
							<div class="col-span-3 text-right">
								<p class="font-serif text-base font-black text-error">
									{ing.current_stock}
									{ing.unit}
								</p>
								<p class="text-[9px] font-black text-on-surface-variant uppercase">
									Min: {ing.min_stock}
								</p>
							</div>
							<div class="col-span-4 text-right">
								<a
									href="/restock"
									class="inline-block rounded-full bg-error-container px-4 py-1.5 text-[10px] font-black tracking-widest text-on-error-container uppercase"
									>REORDER</a
								>
							</div>
						</div>
					{:else}
						<div class="py-10 text-center text-on-surface-variant/50 italic text-sm font-medium">
							All ingredients are sufficient.
						</div>
					{/each}
				</div>
			</div>

			<!-- Top Performers -->
			<div
				class="col-span-12 rounded-[2.5rem] border border-outline-variant/10 bg-surface-container-highest/30 p-8 lg:col-span-5"
			>
				<h3 class="mb-8 text-xl font-bold tracking-tight text-on-surface">
					Top Performers <span
						class="mt-1 block text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase"
						>By Daily Volume</span
					>
				</h3>
				<div class="space-y-8">
					{#each topProducts as item}
						<div class="group flex items-center gap-5">
							<div
								class="h-16 w-16 overflow-hidden rounded-2xl shadow-md transition-transform group-hover:scale-105"
							>
								{#if item.image}
									<img
										class="h-full w-full object-cover"
										src={pb.files.getUrl(item.product, item.image)}
										alt={item.name}
									/>
								{:else}
									<div
										class="flex h-full w-full items-center justify-center bg-primary/10 text-xl font-black text-primary uppercase"
									>
										{item.name.substring(0, 2)}
									</div>
								{/if}
							</div>
							<div class="flex-1">
								<p class="font-bold text-on-surface">{item.name}</p>
								<div class="mt-2.5 h-1.5 w-full rounded-full bg-surface-container-high">
									<div
										class="h-full rounded-full bg-primary"
										style="width: {Math.min(100, (item.count / 50) * 100)}%"
									></div>
								</div>
							</div>
							<div class="text-right">
								<p class="font-serif text-xl font-black text-on-surface">{item.count}</p>
								<p class="text-[9px] font-black tracking-widest text-on-surface-variant uppercase">
									Units
								</p>
							</div>
						</div>
					{:else}
						<div class="py-10 text-center text-on-surface-variant/50 italic text-sm font-medium">
							No batches recorded today.
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
