<script lang="ts">
	import { pb } from '$lib/pocketbase';
	import type { ProductsResponse, SuppliesResponse } from '$lib/pocketbase-types';
	import { branchesState } from '$lib/states/branches.svelte';
	import { inventoryState } from '$lib/states/inventory.svelte';
	import { procurementState } from '$lib/states/procurement.svelte';
	import { toastState } from '$lib/states/toast.svelte';
	import DetailsLayout from './DetailsLayout.svelte';
	import InventoryImage from './atoms/InventoryImage.svelte';
	import StatusBadge from './atoms/StatusBadge.svelte';
	import StockLevel from './atoms/StockLevel.svelte';
	import SignatureButton from '$lib/components/artisanal/SignatureButton.svelte';

	interface Props {
		type: 'product' | 'supply';
		item: ProductsResponse<any> | SuppliesResponse<any> | undefined;
		onClose: () => void;
	}

	let { type, item, onClose }: Props = $props();

	type QuickMode = 'restock' | 'waste' | 'request';
	let loading = $state(false);
	let quickMode = $state<QuickMode | null>(null);
	let quickAmount = $state(0);

	let branchId = $derived(branchesState.selectedBranchId);
	let branchName = $derived(
		branchesState.items.find((b) => b.id === branchId)?.name ?? ''
	);
	let branchStockRecord = $derived(
		item && branchId ? inventoryState.getBranchStock(type, item.id, branchId) : null
	);
	let activeBranchStock = $derived(branchStockRecord?.quantity || 0);

	let suggestedReorder = $derived.by(() => {
		if (!item || type !== 'supply') return 0;
		const max = (item as SuppliesResponse).max_stock ?? 0;
		return Math.max(0, max - activeBranchStock);
	});

	// NOTE: class strings are written out in full so Tailwind's JIT can detect them.
	const modeMeta = {
		restock: {
			label: 'Restock',
			icon: 'add_shopping_cart',
			inputLabel: 'Restock Amount',
			confirmLabel: 'Confirm Restock',
			wrapperClass: 'bg-primary/5 border-primary/15',
			labelClass: 'text-primary',
			inputClass: 'text-primary focus:ring-primary/10',
			suggestedClass: 'hover:text-primary'
		},
		waste: {
			label: 'Waste',
			icon: 'delete_sweep',
			inputLabel: 'Waste / Spoilage',
			confirmLabel: 'Record Waste',
			wrapperClass: 'bg-error/5 border-error/15',
			labelClass: 'text-error',
			inputClass: 'text-error focus:ring-error/10',
			suggestedClass: 'hover:text-error'
		},
		request: {
			label: 'Request',
			icon: 'local_shipping',
			inputLabel: 'Request Quantity',
			confirmLabel: 'Submit Request',
			wrapperClass: 'bg-tertiary/5 border-tertiary/15',
			labelClass: 'text-tertiary',
			inputClass: 'text-tertiary focus:ring-tertiary/10',
			suggestedClass: 'hover:text-tertiary'
		}
	} as const;

	function openMode(m: QuickMode) {
		quickMode = m;
		quickAmount = m === 'request' ? suggestedReorder : 0;
	}

	function closeMode() {
		quickMode = null;
		quickAmount = 0;
	}

	async function confirmAction() {
		if (!item?.id || !quickMode || quickAmount <= 0) return;
		if (!branchId) {
			toastState.error('Select a branch from the top bar first.');
			return;
		}

		loading = true;
		try {
			if (quickMode === 'request') {
				await procurementState.submitRequest(item.id, quickAmount);
				toastState.success('Purchase request submitted.');
			} else {
				const qty = quickMode === 'waste' ? -quickAmount : quickAmount;
				await pb.collection('inventory_logs').create({
					reason: quickMode,
					quantity: qty,
					user: pb.authStore.record?.id,
					...(type === 'product' ? { product: item.id } : { supply: item.id })
				});
				const existing = inventoryState.getBranchStock(type, item.id, branchId);
				if (existing) {
					await pb.collection('branch_stocks').update(existing.id, { quantity: existing.quantity + qty });
				} else {
					await pb.collection('branch_stocks').create({
						branch: branchId,
						[type === 'product' ? 'product' : 'supply']: item.id,
						quantity: qty
					});
				}
				toastState.success(quickMode === 'restock' ? 'Stock restocked.' : 'Waste recorded.');
			}
			closeMode();
		} catch (e) {
			console.error('Inventory action failed:', e);
			toastState.error('Action failed.');
		} finally {
			loading = false;
		}
	}

	let supplyItem = $derived(type === 'supply' ? (item as SuppliesResponse) : null);
</script>

<DetailsLayout {onClose}>
	{#snippet header()}
		{#if item}
			<header class="flex items-start gap-5 border-b border-outline-variant/10 p-6">
				<InventoryImage record={item} size="xl" />
				<div class="min-w-0 flex-1">
					<div class="mb-3 flex items-start justify-between gap-3">
						<h3 class="line-clamp-2 font-serif text-2xl font-black leading-tight tracking-tight text-on-surface">
							{item.name}
						</h3>
						<div class="flex shrink-0 gap-1.5">
							<a
								href="/management/{type === 'product' ? 'products' : 'supplies'}?edit={item.id}"
								class="flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-variant transition-all hover:bg-surface-container"
								title="Edit in Management"
							>
								<span class="material-symbols-outlined text-lg">edit</span>
							</a>
							<button
								onclick={onClose}
								class="flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-variant transition-all hover:bg-surface-container"
							>
								<span class="material-symbols-outlined text-lg">close</span>
							</button>
						</div>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<StatusBadge
							{type}
							current={activeBranchStock}
							min={supplyItem?.min_stock}
						/>
						{#if type === 'product'}
							<span class="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 font-serif text-xs font-black text-primary">
								₱{(item as ProductsResponse).price?.toFixed(2)}
							</span>
						{/if}
						{#if branchName}
							<span class="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-on-surface-variant">
								<span class="material-symbols-outlined text-[12px] text-primary">location_on</span>
								{branchName}
							</span>
						{/if}
					</div>
				</div>
			</header>
		{/if}
	{/snippet}

	{#if item}
		<div class="space-y-6 p-6">
			<!-- Quick action -->
			<section>
				{#if quickMode}
					{@const m = modeMeta[quickMode]}
					<div class="space-y-4 rounded-2xl border p-5 {m.wrapperClass}">
						<div class="flex items-center justify-between">
							<p class="text-[10px] font-black uppercase tracking-widest {m.labelClass}">
								{m.inputLabel} ({(item as any).unit || 'units'})
							</p>
							{#if quickMode === 'request' && suggestedReorder > 0 && quickAmount !== suggestedReorder}
								<button
									onclick={() => (quickAmount = suggestedReorder)}
									class="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/60 transition-colors {m.suggestedClass}"
								>
									Use suggested: {suggestedReorder}
								</button>
							{/if}
						</div>
						<input
							type="number"
							min="1"
							bind:value={quickAmount}
							class="h-14 w-full rounded-xl border-none bg-surface-container-lowest px-5 text-2xl font-black shadow-inner outline-none focus:ring-4 {m.inputClass}"
							placeholder="0"
						/>
						<div class="flex gap-2">
							<SignatureButton
								onclick={confirmAction}
								disabled={loading || quickAmount <= 0}
								class="h-11 flex-1"
								size="md"
							>
								{loading ? 'Saving…' : m.confirmLabel}
							</SignatureButton>
							<button
								onclick={closeMode}
								class="flex h-11 w-11 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container"
							>
								<span class="material-symbols-outlined">close</span>
							</button>
						</div>
					</div>
				{:else}
					<div class="grid gap-2 {type === 'supply' ? 'grid-cols-3' : 'grid-cols-2'}">
						<button
							onclick={() => openMode('restock')}
							class="group flex flex-col items-center gap-2 rounded-2xl border border-primary/10 bg-primary/5 px-3 py-4 transition-all hover:bg-primary/10"
						>
							<span class="material-symbols-outlined text-primary transition-transform group-hover:scale-110">add_shopping_cart</span>
							<span class="text-[10px] font-black uppercase tracking-widest text-primary">Restock</span>
						</button>
						<button
							onclick={() => openMode('waste')}
							class="group flex flex-col items-center gap-2 rounded-2xl border border-error/10 bg-error/5 px-3 py-4 transition-all hover:bg-error/10"
						>
							<span class="material-symbols-outlined text-error transition-transform group-hover:scale-110">delete_sweep</span>
							<span class="text-[10px] font-black uppercase tracking-widest text-error">Waste</span>
						</button>
						{#if type === 'supply'}
							<button
								onclick={() => openMode('request')}
								class="group flex flex-col items-center gap-2 rounded-2xl border border-tertiary/10 bg-tertiary/5 px-3 py-4 transition-all hover:bg-tertiary/10"
							>
								<span class="material-symbols-outlined text-tertiary transition-transform group-hover:scale-110">local_shipping</span>
								<span class="text-[10px] font-black uppercase tracking-widest text-tertiary">Request</span>
							</button>
						{/if}
					</div>
				{/if}
			</section>

			{#if supplyItem}
				<section class="space-y-3">
					<div class="flex items-center justify-between px-1">
						<h4 class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Stock Level</h4>
						{#if suggestedReorder > 0}
							<span class="text-[10px] font-bold text-on-surface-variant/60">
								Reorder: <span class="font-black text-tertiary">+{suggestedReorder} {supplyItem.unit}</span>
							</span>
						{/if}
					</div>
					<StockLevel
						current={activeBranchStock}
						min={supplyItem.min_stock ?? 0}
						max={supplyItem.max_stock ?? 1}
						unit={supplyItem.unit ?? ''}
					/>
					<div class="flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
						<span>Min · <span class="font-black text-on-surface-variant">{supplyItem.min_stock ?? 0} {supplyItem.unit}</span></span>
						<span>Max · <span class="font-black text-on-surface-variant">{supplyItem.max_stock ?? 0} {supplyItem.unit}</span></span>
					</div>
				</section>
			{/if}

			{#if item.description}
				<section class="space-y-2">
					<h4 class="px-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Notes</h4>
					<p class="text-sm leading-relaxed font-medium text-on-surface/80">
						{item.description}
					</p>
				</section>
			{/if}

			<div class="flex items-center gap-1.5 border-t border-outline-variant/5 pt-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">
				<span class="material-symbols-outlined text-sm">schedule</span>
				Last updated · {new Date(item.updated).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
			</div>
		</div>
	{/if}
</DetailsLayout>
