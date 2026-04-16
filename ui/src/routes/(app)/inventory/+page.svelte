<script lang="ts">
	import InventoryStats from './components/InventoryStats.svelte';
	import InventoryNavCard from './components/atoms/InventoryNavCard.svelte';
	import InventoryActivityLog from './components/InventoryActivityLog.svelte';
	import { categoriesState } from '$lib/state/categories.svelte';
	import { inventoryState } from '$lib/state/inventory.svelte';
	import { onMount } from 'svelte';

	onMount(async () => {
		await Promise.all([categoriesState.init(), inventoryState.init()]);
	});
</script>

<svelte:head>
	<title>Inventory Hub | TinAPPay ERP</title>
</svelte:head>

<div class="h-full overflow-y-auto no-scrollbar px-6 pb-10 md:px-8 lg:px-10">
	<div class="max-w-7xl">
		<!-- Summary Stats -->
		<section class="mb-12">
			<InventoryStats />
		</section>

		<!-- Navigation Grid -->
		<section class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			<InventoryNavCard 
				title="Products" 
				description="Manage finished bakery products, pricing, and fulfillment availability."
				icon="bakery_dining"
				href="/inventory/products"
				color="primary"
			/>
			<InventoryNavCard 
				title="Raw Supplies" 
				description="Track flour, butter, sugar and other ingredients. Monitor stock limits."
				icon="egg"
				href="/inventory/supplies"
				color="secondary"
			/>
			<InventoryNavCard 
				title="Categories" 
				description="Organize your inventory with custom product and supply categories."
				icon="category"
				href="/inventory/categories"
				color="tertiary"
			/>
		</section>

		<!-- Recent Activity Log -->
		<section class="mt-12">
			<InventoryActivityLog />
		</section>
	</div>
</div>

