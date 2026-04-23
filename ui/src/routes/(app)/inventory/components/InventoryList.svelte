<script lang="ts">
	import type { ProductsResponse, SuppliesResponse } from '$lib/pocketbase-types';
	import { branchesState } from '$lib/states/branches.svelte';
	import { inventoryState } from '$lib/states/inventory.svelte';
	import InventoryImage from './atoms/InventoryImage.svelte';
	import StatusBadge from './atoms/StatusBadge.svelte';
	import StockLevel from './atoms/StockLevel.svelte';
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
	import PaginatedTable from '$lib/components/PaginatedTable.svelte';

	interface Props {
		type: 'product' | 'supply';
		items: (ProductsResponse<any> | SuppliesResponse<any>)[];
		selectedItemId: string | null;
	}

	let { type, items, selectedItemId = $bindable() }: Props = $props();

	let branchId = $derived(branchesState.selectedBranchId);

	function getActiveStock(item: any) {
		if (!branchId) {
			return inventoryState.branchStocks.items
				.filter((st) => (type === 'product' ? st.product === item.id : st.supply === item.id))
				.reduce((sum, st) => sum + (st.quantity || 0), 0);
		}
		const bs = inventoryState.getBranchStock(type, item.id, branchId);
		return bs?.quantity || 0;
	}
</script>

<div class="w-full">
	<ArtisanalCard level="lowest" class="overflow-hidden border border-outline-variant/10 p-0 shadow-sm">
		<PaginatedTable
			{items}
			pageSize={10}
			tableClass="w-full min-w-[800px] border-collapse text-left"
			emptyMessage="No {type} found in the register."
		>
			{#snippet header()}
				<tr class="bg-surface-container text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase">
					<th class="px-8 py-5">Item Details</th>
					<th class="px-6 py-5">Category</th>
					{#if type === 'product'}
						<th class="px-6 py-5 text-right">Price</th>
						<th class="px-6 py-5 text-right">Stock</th>
					{:else}
						<th class="px-6 py-5">Stock Level</th>
						<th class="px-6 py-5">Capacity</th>
					{/if}
					<th class="px-6 py-5 text-center">Status</th>
				</tr>
			{/snippet}

			{#snippet row(item)}
				<tr
					class="hover:bg-surface-container-low/40 transition-colors group cursor-pointer {selectedItemId === item.id ? 'bg-primary/5' : ''}"
					onclick={() => (selectedItemId = item.id)}
				>
					<td class="px-8 py-5">
						<div class="flex items-center gap-4">
							<InventoryImage record={item} size="md" />
							<div>
								<p class="font-bold text-on-surface text-sm">{item.name}</p>
								<p class="text-[10px] font-bold tracking-tighter text-on-surface-variant uppercase">
									{item.expand?.category?.name || (type === 'product' ? 'Product' : 'Supply')}
								</p>
							</div>
						</div>
					</td>
					<td class="px-6 py-5 text-sm font-medium text-on-surface-variant uppercase tracking-widest">
						{item.expand?.category?.name || '—'}
					</td>

					{#if type === 'product'}
						<td class="px-6 py-5 text-right font-serif font-black text-on-surface text-base">
							₱{(item as ProductsResponse).price?.toFixed(2) ?? '0.00'}
						</td>
						<td class="px-6 py-5 text-right">
							<span class="font-serif text-base font-black text-on-surface tabular-nums">{getActiveStock(item)}</span>
							<span class="ml-1 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-tighter">{(item as ProductsResponse).unit || 'pcs'}</span>
						</td>
					{:else}
						<td class="px-6 py-5">
							<StockLevel
								current={getActiveStock(item)}
								min={(item as SuppliesResponse).min_stock ?? 0}
								max={(item as SuppliesResponse).max_stock ?? 1}
								unit={(item as SuppliesResponse).unit ?? ''}
							/>
						</td>
						<td class="px-6 py-5 text-sm font-bold text-on-surface-variant uppercase tracking-tighter">
							{(item as SuppliesResponse).max_stock}
							{(item as SuppliesResponse).unit}
						</td>
					{/if}

					<td class="px-6 py-5 text-center">
						<StatusBadge
							{type}
							current={getActiveStock(item)}
							min={(item as SuppliesResponse).min_stock}
						/>
					</td>
				</tr>
			{/snippet}
		</PaginatedTable>
	</ArtisanalCard>
</div>
