<script lang="ts">
	import InventoryList from '../components/InventoryList.svelte';
	import InventoryDetails from '../components/InventoryDetails.svelte';
	import InventorySearch from '../components/InventorySearch.svelte';
	import SignatureButton from '$lib/components/artisanal/SignatureButton.svelte';
	import { inventoryState } from '$lib/state/inventory.svelte';
	import { categoriesState } from '$lib/state/categories.svelte';
	import { onMount } from 'svelte';
	import type { ProductsResponse } from '$lib/pocketbase-types';

	let searchQuery = $state('');
	let selectedCategoryId = $state<string | null>(null);
	let selectedItemId = $state<string | null>(null);
	let showForm = $state(false);

	let selectedItem = $derived(
		inventoryState.products.items.find((p) => p.id === selectedItemId)
	);

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

	function startAdding() {
		selectedItemId = null;
		showForm = true;
	}

	function handleClose() {
		showForm = false;
		selectedItemId = null;
	}
</script>

<svelte:head>
	<title>Products | TinAPPay</title>
</svelte:head>

<div class="flex h-full w-full overflow-hidden">
	<div class="flex flex-1 flex-col overflow-hidden">
		<!-- Search & Actions -->
		<div class="flex flex-shrink-0 items-center justify-between gap-4 px-6 pb-6 md:px-8 lg:px-10">
			<div class="flex-1">
				<InventorySearch activeTab="products" bind:searchQuery bind:selectedCategoryId />
			</div>
			<SignatureButton onclick={startAdding} size="md">
				<span class="material-symbols-outlined">add_circle</span>
				New Product
			</SignatureButton>
		</div>

		<!-- List -->
		<div class="no-scrollbar flex-1 overflow-y-auto px-6 pb-10 md:px-8 lg:px-10">
			<InventoryList 
				type="product" 
				items={filteredProducts} 
				bind:selectedItemId 
				onEdit={(id) => { selectedItemId = id; showForm = false; }} 
			/>
		</div>
	</div>

	<!-- Side Details -->
	{#if showForm || selectedItemId}
		<InventoryDetails 
			type="product"
			item={selectedItem}
			{showForm}
			onClose={handleClose}
			onSaved={handleClose}
			onDeleted={() => { selectedItemId = null; showForm = false; }}
		/>
	{/if}
</div>

<!-- Mobile FAB -->
<button
	onclick={startAdding}
	class="fixed right-6 bottom-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-2xl transition-transform active:scale-95 lg:hidden"
>
	<span class="material-symbols-outlined">add</span>
</button>
