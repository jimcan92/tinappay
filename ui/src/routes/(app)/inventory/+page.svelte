<script lang="ts">
	import { categoriesState } from '$lib/states/categories.svelte';
	import { inventoryState } from '$lib/states/inventory.svelte';
	import { onMount } from 'svelte';
	import InventoryActivityLog from './components/InventoryActivityLog.svelte';
	import InventoryStats from './components/InventoryStats.svelte';

	onMount(async () => {
		await Promise.all([inventoryState.init(), categoriesState.init()]);
	});

	function supplyStock(supplyId: string): number {
		return inventoryState.branchStocks.items
			.filter((st) => st.supply === supplyId)
			.reduce((sum, st) => sum + (st.quantity || 0), 0);
	}

	let productCount = $derived(inventoryState.products.items.length);
	let activeProductCount = $derived(
		inventoryState.products.items.filter((p: any) => p.active !== false).length
	);
	let productCategoryCount = $derived(categoriesState.productCategories.length);

	let supplyCount = $derived(inventoryState.supplies.items.length);
	let lowStockCount = $derived(
		inventoryState.supplies.items.filter((s: any) => supplyStock(s.id) <= (s.min_stock ?? 0)).length
	);
	let supplyCategoryCount = $derived(categoriesState.supplyCategories.length);
</script>

<svelte:head>
	<title>Inventory Hub | tinAPPay ERP</title>
</svelte:head>

<div class="no-scrollbar h-full overflow-y-auto bg-surface">
	<div class="mx-auto max-w-[1600px] px-6 py-8 md:px-10">
		<!-- Summary Stats -->
		<section class="mb-6">
			<InventoryStats />
		</section>

		<!-- Compact summary nav cards -->
		<section class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
			<a
				href="/inventory/products"
				class="group flex items-center gap-5 rounded-[1.75rem] border border-primary/15 bg-primary-container/25 p-5 shadow-sm transition-all hover:border-primary/30 hover:bg-primary-container/50 hover:shadow-md active:scale-[0.99]"
			>
				<div
					class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-sm transition-all group-hover:bg-primary group-hover:text-on-primary"
				>
					<span class="material-symbols-outlined text-2xl" style="font-variation-settings:'FILL' 1"
						>bakery_dining</span
					>
				</div>
				<div class="min-w-0 flex-1">
					<div class="flex items-baseline gap-3">
						<p class="font-serif text-3xl leading-none font-black text-on-surface">
							{productCount}
						</p>
						<p class="text-xl font-black text-on-surface-variant uppercase">Products</p>
					</div>
					<p
						class="mt-1.5 text-[10px] font-bold tracking-wider text-on-surface-variant/60 uppercase"
					>
						{activeProductCount} active · {productCategoryCount}
						{productCategoryCount === 1 ? 'category' : 'categories'}
					</p>
				</div>
				<span
					class="material-symbols-outlined text-on-surface-variant/30 transition-all group-hover:translate-x-1 group-hover:text-primary"
					>chevron_right</span
				>
			</a>

			<a
				href="/inventory/supplies"
				class="group flex items-center gap-5 rounded-[1.75rem] border border-tertiary/15 bg-tertiary-container/30 p-5 shadow-sm transition-all hover:border-tertiary/30 hover:bg-tertiary-container/60 hover:shadow-md active:scale-[0.99]"
			>
				<div
					class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-tertiary/15 text-tertiary shadow-sm transition-all group-hover:bg-tertiary group-hover:text-on-tertiary"
				>
					<span class="material-symbols-outlined text-2xl" style="font-variation-settings:'FILL' 1"
						>grain</span
					>
				</div>
				<div class="min-w-0 flex-1">
					<div class="flex items-baseline gap-3">
						<p class="font-serif text-3xl leading-none font-black text-on-surface">{supplyCount}</p>
						<p class="text-xl font-black text-on-surface-variant uppercase">Supplies</p>
					</div>
					<p class="mt-1.5 text-[10px] font-bold tracking-wider uppercase">
						{#if lowStockCount > 0}
							<span class="text-error">{lowStockCount} low stock</span>
							<span class="text-on-surface-variant/60">
								· {supplyCategoryCount}
								{supplyCategoryCount === 1 ? 'category' : 'categories'}</span
							>
						{:else}
							<span class="text-on-surface-variant/60"
								>All stock healthy · {supplyCategoryCount}
								{supplyCategoryCount === 1 ? 'category' : 'categories'}</span
							>
						{/if}
					</p>
				</div>
				<span
					class="material-symbols-outlined text-on-surface-variant/30 transition-all group-hover:translate-x-1 group-hover:text-primary"
					>chevron_right</span
				>
			</a>
		</section>

		<!-- Recent Activity Log -->
		<section>
			<InventoryActivityLog />
		</section>
	</div>
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
