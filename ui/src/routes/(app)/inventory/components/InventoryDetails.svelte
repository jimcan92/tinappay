<script lang="ts">
	import SignatureButton from '$lib/components/artisanal/SignatureButton.svelte';
	import { pb } from '$lib/pocketbase';
	import type { ProductsResponse, SuppliesResponse } from '$lib/pocketbase-types';
	import { categoriesState } from '$lib/state/categories.svelte';
	import { inventoryState } from '$lib/state/inventory.svelte';
	import { onMount, untrack } from 'svelte';
	import DetailsLayout from './DetailsLayout.svelte';
	import InventoryImage from './atoms/InventoryImage.svelte';
	import StatusBadge from './atoms/StatusBadge.svelte';
	import StockLevel from './atoms/StockLevel.svelte';

	interface Props {
		type: 'product' | 'supply';
		item: ProductsResponse<any> | SuppliesResponse<any> | undefined;
		showForm: boolean;
		onClose: () => void;
		onSaved?: () => void;
		onDeleted?: (id: string) => void;
	}

	let { type, item, showForm, onClose, onSaved, onDeleted }: Props = $props();

	let loading = $state(false);
	let isEditing = $state(false);

	let formData = $state({
		name: '',
		description: '',
		price: 0,
		category: '',
		unit: 'pcs',
		current_stock: 0,
		min_stock: 10,
		max_stock: 100,
		image: null as File | null
	});

	let isNewMode = $derived(showForm && !item);
	let isFormActive = $derived(isEditing || isNewMode);

	$effect(() => {
		if (isFormActive) {
			untrack(() => initForm(item));
		}
	});

	function initForm(record?: any) {
		if (record) {
			isEditing = true;
			formData = {
				name: record.name || '',
				description: record.description || '',
				price: record.price || 0,
				category: record.category || '',
				unit: record.unit || 'pcs',
				current_stock: record.current_stock || 0,
				min_stock: record.min_stock || 0,
				max_stock: record.max_stock || 100,
				image: null
			};
		} else {
			isEditing = false;
			const categories = type === 'product' ? categoriesState.productCategories : categoriesState.supplyCategories;
			formData = {
				name: '',
				description: '',
				price: 0,
				category: categories[0]?.id || '',
				unit: 'pcs',
				current_stock: 0,
				min_stock: 10,
				max_stock: 100,
				image: null
			};
		}
	}

	async function handleSave() {
		if (!formData.name || !formData.category) return;

		loading = true;
		try {
			const data = new FormData();
			const fieldsToUpload = type === 'product' 
				? ['name', 'description', 'price', 'category'] 
				: ['name', 'description', 'unit', 'current_stock', 'min_stock', 'max_stock', 'category'];
			
			fieldsToUpload.forEach(key => {
				const val = (formData as any)[key];
				if (val !== undefined && val !== null) {
					data.append(key, val.toString());
				}
			});

			if (formData.image) {
				data.append('images', formData.image);
			}

			if (isEditing && item?.id) {
				if (type === 'product') await inventoryState.updateProduct(item.id, data);
				else await inventoryState.updateSupply(item.id, data);
			} else {
				if (type === 'product') await inventoryState.createProduct(data);
				else await inventoryState.createSupply(data);
			}

			if (onSaved) await onSaved();
			isEditing = false;
		} catch (e) {
			console.error(`${type} save error:`, e);
		} finally {
			loading = false;
		}
	}

	async function handleDelete() {
		if (!item?.id) return;
		if (!confirm(`Permanently delete this ${type}?`)) return;

		loading = true;
		try {
			if (type === 'product') await inventoryState.deleteProduct(item.id);
			else await inventoryState.deleteSupply(item.id);
			if (onDeleted) onDeleted(item.id);
		} catch (e) {
			console.error(`${type} delete error:`, e);
		} finally {
			loading = false;
		}
	}

	async function handleQuickLog(reason: 'restock' | 'waste' | 'adjustment', quantity: number) {
		if (!item?.id) return;
		loading = true;
		try {
			// 1. Create the inventory log
			const logData: any = {
				reason,
				quantity,
				user: pb.authStore.model?.id
			};
			if (type === 'product') logData.product = item.id;
			else logData.supply = item.id;

			await pb.collection('inventory_logs').create(logData);

			// 2. Update the item's stock
			const currentStock = type === 'product' ? (item as any).stock : (item as any).current_stock;
			const newStock = (currentStock || 0) + quantity;

			if (type === 'product') {
				await inventoryState.updateProduct(item.id, { stock: newStock });
			} else {
				await inventoryState.updateSupply(item.id, { current_stock: newStock });
			}

			if (onSaved) await onSaved();
		} catch (e) {
			console.error('Quick log failed:', e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		categoriesState.init();
	});
</script>

<DetailsLayout {onClose}>
	{#snippet header()}
		{#if item && !isFormActive}
			<header class="relative flex-shrink-0 overflow-hidden border-b border-outline-variant/10 p-8">
				<div class="absolute -right-10 -bottom-10 opacity-5">
					<span class="material-symbols-outlined text-[12rem]">
						{type === 'product' ? 'bakery_dining' : 'inventory_2'}
					</span>
				</div>
				<div class="relative z-10 mb-6 flex items-start justify-between">
					<InventoryImage record={item} size="xl" />
					<div class="flex gap-2">
						<button
							onclick={() => initForm(item)}
							class="flex h-11 w-11 items-center justify-center rounded-2xl border border-outline-variant/10 bg-white text-on-surface-variant shadow-sm transition-all hover:bg-primary hover:text-white"
						>
							<span class="material-symbols-outlined">edit</span>
						</button>
						<button
							onclick={handleDelete}
							class="flex h-11 w-11 items-center justify-center rounded-2xl border border-outline-variant/10 bg-white text-error shadow-sm transition-all hover:bg-error hover:text-white"
						>
							<span class="material-symbols-outlined">delete</span>
						</button>
						<button
							onclick={onClose}
							class="flex h-11 w-11 items-center justify-center rounded-2xl border border-outline-variant/10 bg-white text-on-surface-variant shadow-sm transition-all lg:hidden"
						>
							<span class="material-symbols-outlined">close</span>
						</button>
					</div>
				</div>
				<div class="relative z-10">
					<h3 class="mb-2 font-serif text-3xl font-black tracking-tight text-on-surface">
						{item.name}
					</h3>
					<div class="flex flex-wrap items-center gap-3">
						<StatusBadge 
							{type} 
							current={(item as SuppliesResponse).current_stock} 
							min={(item as SuppliesResponse).min_stock} 
						/>
						{#if type === 'product'}
							<span class="font-serif text-sm font-black text-primary">
								₱{(item as ProductsResponse).price?.toFixed(2)}
							</span>
						{/if}
					</div>
				</div>
			</header>
		{:else}
			<header class="flex flex-shrink-0 items-center justify-between border-b border-outline-variant/10 p-8">
				<div>
					<h3 class="font-serif text-2xl font-black tracking-tight">
						{isEditing ? 'Edit' : 'Add New'} {type === 'product' ? 'Product' : 'Supply'}
					</h3>
					<p class="mt-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">
						Inventory Management
					</p>
				</div>
				<button onclick={onClose} class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container-low">
					<span class="material-symbols-outlined">close</span>
				</button>
			</header>
		{/if}
	{/snippet}

	{#if item && !isFormActive}
		<div class="no-scrollbar flex-1 space-y-8 overflow-y-auto p-8">
			<!-- Quick Actions -->
			<section class="grid grid-cols-2 gap-4">
				<button
					onclick={() => {
						const amount = prompt(`How much ${item.name} to restock? (${(item as any).unit || 'units'})`);
						if (amount && !isNaN(Number(amount))) {
							handleQuickLog('restock', Number(amount));
						}
					}}
					class="flex flex-col items-center justify-center gap-3 rounded-[2rem] border border-outline-variant/10 bg-primary/5 p-6 transition-all hover:bg-primary/10 group"
				>
					<div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
						<span class="material-symbols-outlined">add_shopping_cart</span>
					</div>
					<span class="text-[10px] font-black uppercase tracking-widest text-primary">Restock</span>
				</button>
				<button
					onclick={() => {
						const amount = prompt(`How much ${item.name} is waste/spoiled? (${(item as any).unit || 'units'})`);
						if (amount && !isNaN(Number(amount))) {
							handleQuickLog('waste', -Number(amount));
						}
					}}
					class="flex flex-col items-center justify-center gap-3 rounded-[2rem] border border-outline-variant/10 bg-error/5 p-6 transition-all hover:bg-error/10 group"
				>
					<div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-error/10 text-error transition-transform group-hover:scale-110">
						<span class="material-symbols-outlined">delete_sweep</span>
					</div>
					<span class="text-[10px] font-black uppercase tracking-widest text-error">Waste</span>
				</button>
			</section>

			{#if type === 'supply'}
				<section>
					<h4 class="mb-3 px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">
						Stock Status
					</h4>
					<StockLevel 
						current={(item as SuppliesResponse).current_stock ?? 0}
						min={(item as SuppliesResponse).min_stock ?? 0}
						max={(item as SuppliesResponse).max_stock ?? 1}
						unit={(item as SuppliesResponse).unit ?? ''}
					/>
					<div class="mt-4 grid grid-cols-2 gap-3">
						<div class="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4">
							<p class="mb-1 text-[9px] font-black text-on-surface-variant uppercase">Minimum</p>
							<p class="font-serif text-sm font-black text-on-surface">{(item as SuppliesResponse).min_stock} {(item as SuppliesResponse).unit}</p>
						</div>
						<div class="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4">
							<p class="mb-1 text-[9px] font-black text-on-surface-variant uppercase">Maximum</p>
							<p class="font-serif text-sm font-black text-on-surface">{(item as SuppliesResponse).max_stock} {(item as SuppliesResponse).unit}</p>
						</div>
					</div>
				</section>
			{/if}

			{#if item.description}
				<section>
					<h4 class="mb-3 px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">Notes</h4>
					<p class="rounded-r-2xl border-l-4 border-primary/20 bg-primary/5 py-2 pl-5 text-sm leading-relaxed font-medium text-on-surface italic">
						"{item.description}"
					</p>
				</section>
			{/if}

			<section>
				<div class="flex items-center gap-4 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5">
					<div class="flex h-11 w-11 items-center justify-center rounded-xl border border-outline-variant/10 bg-white text-primary shadow-sm">
						<span class="material-symbols-outlined">schedule</span>
					</div>
					<div>
						<h5 class="text-[11px] font-black tracking-tight text-on-surface uppercase">Last Updated</h5>
						<p class="mt-0.5 text-xs font-medium text-on-surface-variant">
							{new Date(item.updated).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
						</p>
					</div>
				</div>
			</section>
		</div>
	{:else}
		<div class="space-y-6 p-8">
			<div class="space-y-2">
				<label for="name" class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">Name</label>
				<input id="name" bind:value={formData.name} type="text" class="h-14 w-full rounded-2xl border-none bg-surface-container-low px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20" placeholder="Item name..." />
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<label for="category" class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">Category</label>
					<select id="category" bind:value={formData.category} class="h-14 w-full rounded-2xl border-none bg-surface-container-low px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20">
						<option value="" disabled>Select Category</option>
						{#each (type === 'product' ? categoriesState.productCategories : categoriesState.supplyCategories) as cat}
							<option value={cat.id}>{cat.name}</option>
						{/each}
					</select>
				</div>
				{#if type === 'product'}
					<div class="space-y-2">
						<label for="price" class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">Price (₱)</label>
						<input id="price" bind:value={formData.price} type="number" step="0.01" class="h-14 w-full rounded-2xl border-none bg-surface-container-low px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20" />
					</div>
				{:else}
					<div class="space-y-2">
						<label for="unit" class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">Unit</label>
						<select id="unit" bind:value={formData.unit} class="h-14 w-full rounded-2xl border-none bg-surface-container-low px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20">
							<option value="kg">kg</option>
							<option value="g">g</option>
							<option value="L">L</option>
							<option value="mL">mL</option>
							<option value="pcs">pcs</option>
						</select>
					</div>
				{/if}
			</div>

			{#if type === 'supply'}
				<div class="grid grid-cols-3 gap-3">
					<div class="space-y-2">
						<label for="current" class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">Current</label>
						<input id="current" bind:value={formData.current_stock} type="number" class="h-14 w-full rounded-2xl border-none bg-surface-container-low px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20" />
					</div>
					<div class="space-y-2">
						<label for="min" class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">Min</label>
						<input id="min" bind:value={formData.min_stock} type="number" class="h-14 w-full rounded-2xl border-none bg-surface-container-low px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20" />
					</div>
					<div class="space-y-2">
						<label for="max" class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">Max</label>
						<input id="max" bind:value={formData.max_stock} type="number" class="h-14 w-full rounded-2xl border-none bg-surface-container-low px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20" />
					</div>
				</div>
			{/if}

			<div class="space-y-2">
				<label for="description" class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">Description</label>
				<textarea id="description" bind:value={formData.description} class="h-28 w-full resize-none rounded-2xl border-none bg-surface-container-low p-6 text-sm font-medium focus:ring-2 focus:ring-primary/20" placeholder="Notes..."></textarea>
			</div>

			<div class="space-y-2">
				<label for="image" class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">Image</label>
				<div class="flex items-center gap-4 rounded-2xl border-2 border-dashed border-outline-variant/20 bg-surface-container-low/30 p-4">
					<span class="material-symbols-outlined text-3xl text-on-surface-variant/40">camera_alt</span>
					<input id="image" type="file" accept="image/*" onchange={(e) => (formData.image = e.currentTarget.files?.[0] || null)} class="flex-1 text-xs font-bold text-on-surface-variant file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-[10px] file:font-black file:text-primary hover:file:bg-primary/20" />
				</div>
			</div>
		</div>
	{/if}

	{#snippet footer()}
		<footer class="flex-shrink-0 border-t border-outline-variant/10 p-8">
			{#if item && !isFormActive}
				<button
					onclick={() => initForm(item)}
					class="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-gradient-to-br from-primary to-primary-container text-sm font-black tracking-widest text-on-primary uppercase shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
				>
					<span class="material-symbols-outlined">edit</span>
					Edit {type === 'product' ? 'Product' : 'Supply'}
				</button>
			{:else}
				<SignatureButton disabled={loading} onclick={handleSave} class="h-14 w-full" size="lg">
					{loading ? 'Saving...' : isEditing ? 'Update Item' : 'Create Item'}
				</SignatureButton>
			{/if}
		</footer>
	{/snippet}
</DetailsLayout>
