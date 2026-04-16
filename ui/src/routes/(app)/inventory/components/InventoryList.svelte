<script lang="ts">
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
	import type { ProductsResponse, SuppliesResponse } from '$lib/pocketbase-types';
	import { inventoryState } from '$lib/state/inventory.svelte';
	import InventoryImage from './atoms/InventoryImage.svelte';
	import StatusBadge from './atoms/StatusBadge.svelte';
	import StockLevel from './atoms/StockLevel.svelte';

	interface Props {
		type: 'product' | 'supply';
		items: (ProductsResponse<any> | SuppliesResponse<any>)[];
		selectedItemId: string | null;
		onEdit: (id: string) => void;
	}

	let { type, items, selectedItemId = $bindable(), onEdit }: Props = $props();

	function handleDelete(id: string) {
		const label = type === 'product' ? 'product' : 'supply item';
		if (confirm(`Permanently delete this ${label}?`)) {
			if (type === 'product') {
				inventoryState.deleteProduct(id);
			} else {
				inventoryState.deleteSupply(id);
			}
		}
	}
</script>

<!-- DESKTOP Table layout -->
<div class="hidden lg:block">
	<ArtisanalCard level="lowest" class="overflow-hidden border border-outline-variant/10 p-0 shadow-sm">
		<table class="w-full border-collapse text-left">
			<thead>
				<tr
					class="bg-surface-container text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
				>
					<th class="px-8 py-5">Item Details</th>
					<th class="px-6 py-5">Category</th>
					{#if type === 'product'}
						<th class="px-6 py-5 text-right">Price</th>
					{:else}
						<th class="px-6 py-5">Stock Level</th>
						<th class="px-6 py-5">Capacity</th>
					{/if}
					<th class="px-6 py-5 text-center">Status</th>
					<th class="px-8 py-5 text-right">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each items as item, i}
					<tr
						class="group transition-colors {i % 2 === 0
							? ''
							: 'bg-surface-container-low/30'} cursor-pointer hover:bg-surface-container-low/60 {selectedItemId ===
						item.id
							? 'bg-primary/5'
							: ''}"
						onclick={() => (selectedItemId = item.id)}
					>
						<td class="px-8 py-5">
							<div class="flex items-center gap-4">
								<InventoryImage record={item} size="md" />
								<div>
									<p class="font-bold text-on-surface">{item.name}</p>
									<p class="text-[10px] font-bold tracking-tighter text-on-surface-variant uppercase">
										{item.expand?.category?.name || (type === 'product' ? 'Product' : 'Supply')}
									</p>
								</div>
							</div>
						</td>
						<td class="px-6 py-5 text-sm font-medium text-on-surface-variant">
							{item.expand?.category?.name || '—'}
						</td>

						{#if type === 'product'}
							<td class="px-6 py-5 text-right font-serif font-black text-on-surface">
								₱{(item as ProductsResponse).price?.toFixed(2) ?? '0.00'}
							</td>
						{:else}
							<td class="px-6 py-5">
								<StockLevel
									current={(item as SuppliesResponse).current_stock ?? 0}
									min={(item as SuppliesResponse).min_stock ?? 0}
									max={(item as SuppliesResponse).max_stock ?? 1}
									unit={(item as SuppliesResponse).unit ?? ''}
								/>
							</td>
							<td class="px-6 py-5 text-sm font-bold text-on-surface-variant">
								{(item as SuppliesResponse).max_stock} {(item as SuppliesResponse).unit}
							</td>
						{/if}

						<td class="px-6 py-5 text-center">
							<StatusBadge
								{type}
								current={(item as SuppliesResponse).current_stock}
								min={(item as SuppliesResponse).min_stock}
							/>
						</td>

						<td class="px-8 py-5 text-right">
							<div class="flex justify-end gap-2">
								<button
									onclick={(e) => {
										e.stopPropagation();
										onEdit(item.id);
									}}
									class="rounded-xl p-2 text-primary transition-colors hover:bg-primary/10"
								>
									<span class="material-symbols-outlined">edit</span>
								</button>
								<button
									onclick={(e) => {
										e.stopPropagation();
										handleDelete(item.id);
									}}
									class="rounded-xl p-2 text-error transition-colors hover:bg-error/10"
								>
									<span class="material-symbols-outlined">delete</span>
								</button>
							</div>
						</td>
					</tr>
				{:else}
					<tr>
						<td
							colspan={type === 'product' ? 5 : 6}
							class="px-8 py-12 text-center text-on-surface-variant/50 italic"
						>
							No {type} found.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</ArtisanalCard>
</div>

<!-- MOBILE Card list -->
<div class="space-y-3 lg:hidden">
	{#each items as item}
		<button
			class="flex w-full items-center gap-4 rounded-[1.5rem] bg-surface-container-low p-4 text-left transition-all hover:shadow-sm active:scale-[0.98] {selectedItemId ===
			item.id
				? 'ring-2 ring-primary/30'
				: ''}"
			onclick={() => (selectedItemId = item.id)}
		>
			<InventoryImage record={item} size="lg" />
			<div class="min-w-0 flex-1">
				<div class="mb-1 flex items-start justify-between">
					<h4 class="truncate font-bold text-on-surface">{item.name}</h4>
					<StatusBadge
						{type}
						current={(item as SuppliesResponse).current_stock}
						min={(item as SuppliesResponse).min_stock}
					/>
				</div>

				{#if type === 'product'}
					<p class="text-xs text-on-surface-variant">
						{item.expand?.category?.name || 'Product'}
					</p>
					<p class="mt-1 font-serif text-sm font-black text-primary">
						₱{(item as ProductsResponse).price?.toFixed(2) ?? '0.00'}
					</p>
				{:else}
					<p class="mb-2 text-xs text-on-surface-variant">
						{(item as SuppliesResponse).current_stock}
						{(item as SuppliesResponse).unit} in stock
					</p>
					<StockLevel
						current={(item as SuppliesResponse).current_stock ?? 0}
						min={(item as SuppliesResponse).min_stock ?? 0}
						max={(item as SuppliesResponse).max_stock ?? 1}
						unit={(item as SuppliesResponse).unit ?? ''}
						showText={false}
					/>
				{/if}
			</div>
		</button>
	{:else}
		<div class="py-12 text-center text-on-surface-variant/50 italic font-medium">
			No {type} found.
		</div>
	{/each}
</div>
