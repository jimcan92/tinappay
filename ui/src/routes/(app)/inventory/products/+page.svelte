<script lang="ts">
	import type { ProductsResponse } from '$lib/pocketbase-types';
	import { categoriesState } from '$lib/states/categories.svelte';
	import { inventoryState } from '$lib/states/inventory.svelte';
	import { onMount } from 'svelte';
	import InventoryDetails from '../components/InventoryDetails.svelte';
	import InventoryList from '../components/InventoryList.svelte';
	import InventorySearch from '../components/InventorySearch.svelte';

	let searchQuery = $state('');
	let selectedCategoryId = $state<string | null>(null);
	let selectedItemId = $state<string | null>(null);

	let selectedItem = $derived(inventoryState.products.items.find((p) => p.id === selectedItemId));

	let filteredProducts = $derived(
		(inventoryState.products.items as ProductsResponse[]).filter((p) => {
			const matchesCat = selectedCategoryId ? p.category === selectedCategoryId : true;
			const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesCat && matchesSearch;
		})
	);

	onMount(async () => {
		await Promise.all([categoriesState.init(), inventoryState.init()]);
	});

	function handleClose() {
		selectedItemId = null;
	}
</script>

<svelte:head>
	<title>Product Stock | tinAPPay ERP</title>
</svelte:head>

<div class="flex h-full w-full overflow-hidden bg-surface">
	<div class="flex flex-1 flex-col overflow-hidden">
		<!-- Search -->
		<div class="flex flex-shrink-0 px-6 py-8 md:px-8 lg:px-10">
			<div class="flex-1">
				<InventorySearch activeTab="products" bind:searchQuery bind:selectedCategoryId />
			</div>
		</div>

		<!-- List -->
		<div class="no-scrollbar flex-1 overflow-y-auto px-6 pb-10 md:px-8 lg:px-10">
			<InventoryList
				type="product"
				items={filteredProducts}
				bind:selectedItemId
			/>
		</div>
	</div>

	<!-- Side Details -->
	{#if selectedItemId}
		<InventoryDetails
			type="product"
			item={selectedItem}
			onClose={handleClose}
		/>
	{/if}
</div>
