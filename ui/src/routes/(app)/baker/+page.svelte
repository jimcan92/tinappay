<script lang="ts">
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
	import SignatureButton from '$lib/components/artisanal/SignatureButton.svelte';
	import BakingLoader from '$lib/components/BakingLoader.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import { pb } from '$lib/pocketbase';
	import type { CategoriesResponse, ProductsResponse, SuppliesResponse } from '$lib/pocketbase-types';
	import { branchesState } from '$lib/states/branches.svelte';
	import { inventoryState } from '$lib/states/inventory.svelte';
	import { bakerState, type SectionSupply } from '$lib/states/baker.svelte';
	import { toastState } from '$lib/states/toast.svelte';
	import { onMount } from 'svelte';

	let { data } = $props();

	const userId = $derived(data.user?.id ?? '');
	const today = new Date().toISOString().slice(0, 10);

	let shift = $state<'day' | 'night'>('day');
	let date = $state(today);
	let fetching = $state(true);

	type SectionSupplyColumn = { supplyId: string; supplyName: string; unit: string };
	type SectionItem = {
		productId: string; productName: string; unit: string;
		yield_qty: number; supplyQtys: Record<string, number>;
	};
	type Section = {
		category: CategoriesResponse;
		items: SectionItem[];
		supplyColumns: SectionSupplyColumn[];
		batchSupplies: SectionSupply[];
	};

	let sections = $state<Section[]>([]);
	let allProducts = $state<ProductsResponse<{ category: CategoriesResponse }>[]>([]);
	let allSupplies = $state<SuppliesResponse[]>([]);
	let allCategories = $state<CategoriesResponse[]>([]);

	let catPickerOpen = $state(false);
	let availableCategories = $derived(
		allCategories.filter((c) => !sections.some((s) => s.category.id === c.id))
	);

	let pickerOpen = $state(false);
	let pickerMode = $state<'product' | 'col-supply' | 'batch-supply'>('product');
	let pickerSectionIdx = $state(-1);
	let pickerSearch = $state('');

	let pickerCategoryId = $derived(sections[pickerSectionIdx]?.category.id ?? '');

	let pickerProducts = $derived(
		allProducts.filter(
			(p) =>
				p.expand?.category?.id === pickerCategoryId &&
				!sections[pickerSectionIdx]?.items.some((i) => i.productId === p.id) &&
				(p.name ?? '').toLowerCase().includes(pickerSearch.toLowerCase())
		)
	);
	let pickerSupplies = $derived(
		allSupplies.filter((s) => {
			const sec = sections[pickerSectionIdx];
			if (!sec) return false;
			const match = (s.name ?? '').toLowerCase().includes(pickerSearch.toLowerCase());
			if (pickerMode === 'col-supply') return !sec.supplyColumns.some((c) => c.supplyId === s.id) && match;
			return !sec.batchSupplies.some((b) => b.supplyId === s.id) && match;
		})
	);

	let canSubmit = $derived(sections.some((s) => s.items.some((i) => i.yield_qty > 0)));

	// name col has a minimum so it never collapses; supply/yield cols fixed
	function gridCols(n: number) {
		const sup = n > 0 ? Array(n).fill('5rem').join(' ') + ' ' : '';
		return `grid-template-columns: minmax(6rem, 1fr) ${sup}2.25rem 5rem 1.75rem`;
	}

	onMount(async () => {
		await Promise.all([inventoryState.init(), branchesState.load()]);
		allProducts = await pb.collection('products').getFullList({ expand: 'category', sort: 'name', requestKey: 'baker-products' });
		allSupplies = await pb.collection('supplies').getFullList({ sort: 'name', requestKey: 'baker-supplies' });
		const catMap = new Map<string, CategoriesResponse>();
		for (const p of allProducts) {
			const cat = p.expand?.category;
			if (cat?.production && !catMap.has(cat.id)) catMap.set(cat.id, cat);
		}
		allCategories = Array.from(catMap.values());
		await bakerState.loadHistory(userId);
		fetching = false;
	});

	function addCategory(cat: CategoriesResponse) {
		sections.push({ category: cat, items: [], supplyColumns: [], batchSupplies: [] });
		catPickerOpen = false;
	}
	function removeSection(si: number) { sections.splice(si, 1); }

	function openProductPicker(si: number) { pickerMode = 'product'; pickerSectionIdx = si; pickerSearch = ''; pickerOpen = true; }
	function openSupplyColumnPicker(si: number) { pickerMode = 'col-supply'; pickerSectionIdx = si; pickerSearch = ''; pickerOpen = true; }
	function openBatchSupplyPicker(si: number) { pickerMode = 'batch-supply'; pickerSectionIdx = si; pickerSearch = ''; pickerOpen = true; }

	function addProduct(product: ProductsResponse<any>) {
		const sec = sections[pickerSectionIdx];
		if (!sec) return;
		const supplyQtys: Record<string, number> = {};
		for (const col of sec.supplyColumns) supplyQtys[col.supplyId] = 0;
		sec.items.push({ productId: product.id, productName: product.name, unit: product.unit || 'pcs', yield_qty: 0, supplyQtys });
		pickerOpen = false;
	}
	function addSupplyColumn(supply: SuppliesResponse) {
		const sec = sections[pickerSectionIdx];
		if (!sec) return;
		sec.supplyColumns.push({ supplyId: supply.id, supplyName: supply.name, unit: supply.unit || 'kg' });
		for (const item of sec.items) item.supplyQtys[supply.id] = 0;
		pickerOpen = false;
	}
	function addBatchSupply(supply: SuppliesResponse) {
		const sec = sections[pickerSectionIdx];
		if (!sec) return;
		sec.batchSupplies.push({ supplyId: supply.id, supplyName: supply.name, unit: supply.unit || 'kg', quantity: 0, categoryId: sec.category.id });
		pickerOpen = false;
	}
	function pickerConfirm(item: any) {
		if (pickerMode === 'product') addProduct(item);
		else if (pickerMode === 'col-supply') addSupplyColumn(item);
		else addBatchSupply(item);
	}

	function removeItem(si: number, ii: number) { sections[si].items.splice(ii, 1); }
	function removeSupplyColumn(si: number, ci: number) {
		const colId = sections[si].supplyColumns[ci].supplyId;
		sections[si].supplyColumns.splice(ci, 1);
		for (const item of sections[si].items) delete item.supplyQtys[colId];
	}
	function removeBatchSupply(si: number, bi: number) { sections[si].batchSupplies.splice(bi, 1); }

	async function handleSubmit() {
		if (!canSubmit) return;
		const allItems = sections.flatMap((s) =>
			s.items.map((i) => ({ productId: i.productId, productName: i.productName, unit: i.unit, yield_qty: i.yield_qty }))
		);
		const allSupplies2: SectionSupply[] = sections.flatMap((s) => [
			...s.batchSupplies,
			...s.supplyColumns.flatMap((col) =>
				s.items.filter((i) => (i.supplyQtys[col.supplyId] ?? 0) > 0).map((i) => ({
					supplyId: col.supplyId, supplyName: col.supplyName, unit: col.unit,
					quantity: i.supplyQtys[col.supplyId], categoryId: s.category.id
				}))
			)
		]);
		try {
			await bakerState.submitReport({ bakerId: userId, shift, date, sectionItems: allItems, sectionSupplies: allSupplies2 });
			sections = [];
			toastState.success('Production report submitted. Inventory updated.');
		} catch (e) {
			console.error(e);
			toastState.error('Failed to submit report.');
		}
	}

	let expandedLog = $state<string | null>(null);
</script>

<svelte:head><title>Production Report | tinAPPay</title></svelte:head>

<div class="no-scrollbar h-full overflow-y-auto px-6 py-8 md:px-10">
	<div class="mx-auto max-w-4xl space-y-4 md:space-y-6">

		<div class="flex flex-col gap-1">
			<h2 class="font-serif text-2xl font-black tracking-tight text-on-surface md:text-3xl">Production Report</h2>
			<p class="text-sm font-medium text-on-surface-variant">End-of-shift inventory log — products made & supplies used</p>
		</div>

		{#if fetching}
			<div class="flex h-48 items-center justify-center"><BakingLoader /></div>
		{:else}

		<!-- Date / Shift card -->
		<ArtisanalCard level="low" class="border border-outline-variant/10 shadow-sm">
			<div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Date</p>
					<input type="date" bind:value={date}
						class="mt-1 rounded-xl border-none bg-surface-container-low px-3 py-2 text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary/20" />
				</div>
				<div>
					<p class="mb-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Shift</p>
					<div class="flex h-10 rounded-full bg-surface-container-low p-1 shadow-inner">
						{#each [{ label: 'Day', value: 'day' }, { label: 'Night', value: 'night' }] as s}
							<button onclick={() => (shift = s.value as 'day' | 'night')}
								class="rounded-full px-5 text-[10px] font-black uppercase tracking-widest transition-all
									{shift === s.value ? 'bg-primary text-white shadow-lg' : 'text-on-surface-variant hover:bg-surface-container'}"
							>{s.label}</button>
						{/each}
					</div>
				</div>
			</div>
		</ArtisanalCard>

		<!-- Category cards -->
		{#each sections as section, si}
			<ArtisanalCard level="low" class="overflow-hidden border border-outline-variant/10 shadow-sm">

				<!-- Card header -->
				<div class="flex items-center justify-between border-b border-outline-variant/10 px-5 py-3">
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
							<span class="material-symbols-outlined text-sm text-primary" style="font-variation-settings:'FILL' 1">bakery_dining</span>
						</div>
						<h3 class="font-serif text-base font-black tracking-tight text-on-surface">{section.category.name}</h3>
					</div>
					<button onclick={() => removeSection(si)}
						class="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant/30 transition-all hover:bg-error/10 hover:text-error">
						<span class="material-symbols-outlined text-base">delete</span>
					</button>
				</div>

				<div class="space-y-4 p-5">

					<!-- Single flat grid: header + data rows share one grid-template-columns -->
					<div class="overflow-x-auto rounded-xl border border-outline-variant/10">
						<div class="grid min-w-full" style={gridCols(section.supplyColumns.length)}>

							<!-- Header cells (sticky top-0 per-cell so they scroll horizontally with table) -->
							<div class="sticky top-0 z-10 border-b border-outline-variant/10 bg-surface-container-low px-3 pb-2 pt-2.5 text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">
								Product
							</div>
							{#each section.supplyColumns as col, ci}
								<div class="sticky top-0 z-10 flex flex-col items-end gap-0.5 border-b border-outline-variant/10 bg-surface-container-low pb-2 pr-2 pt-2.5">
									<button onclick={() => removeSupplyColumn(si, ci)} title="Remove column"
										class="flex h-4 w-4 items-center justify-center rounded text-on-surface-variant/25 transition-all hover:text-error">
										<span class="material-symbols-outlined" style="font-size:11px">close</span>
									</button>
									<span class="text-right text-[9px] font-black uppercase tracking-widest text-on-surface-variant leading-tight">{col.supplyName}</span>
									<span class="text-right text-[8px] text-on-surface-variant/40">{col.unit}</span>
								</div>
							{/each}
							<!-- Add supply column button (in header) -->
							<div class="sticky top-0 z-10 flex items-end border-b border-outline-variant/10 bg-surface-container-low pb-2 pt-2.5">
								<button onclick={() => openSupplyColumnPicker(si)} title="Add supply column"
									class="flex h-7 w-7 items-center justify-center rounded-lg border border-dashed border-outline-variant/30 text-on-surface-variant/30 transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
									<span class="material-symbols-outlined text-sm">add</span>
								</button>
							</div>
							<!-- Yield header -->
							<div class="sticky top-0 z-10 flex flex-col items-end border-b border-outline-variant/10 bg-surface-container-low pb-2 pr-2 pt-2.5">
								<span class="text-right text-[9px] font-black uppercase tracking-widest text-primary leading-tight">Yield</span>
								<span class="text-right text-[8px] text-primary/40">pcs</span>
							</div>
							<div class="sticky top-0 z-10 border-b border-outline-variant/10 bg-surface-container-low"></div>

							<!-- Data rows (all in the same grid → guaranteed column alignment) -->
							{#each section.items as item, ii}
								{@const sep = ii < section.items.length - 1 ? 'border-b border-outline-variant/5' : ''}
								<div class="flex min-w-0 items-center px-3 py-2 {sep}">
									<span class="min-w-0 truncate text-sm font-bold text-on-surface">{item.productName}</span>
								</div>
								{#each section.supplyColumns as col}
									<div class="flex items-center py-1.5 pr-2 {sep}">
										<input type="number" min="0" step="0.01" bind:value={item.supplyQtys[col.supplyId]} placeholder="0"
											class="w-full rounded-lg border-none bg-surface-container px-1.5 py-1.5 text-right text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20" />
									</div>
								{/each}
								<div class="{sep}"></div><!-- spacer for add-col button column -->
								<div class="flex items-center py-1.5 pr-2 {sep}">
									<input type="number" min="0" bind:value={item.yield_qty} placeholder="0"
										class="w-full rounded-lg border-none bg-primary/5 px-1.5 py-1.5 text-right text-sm font-black text-primary outline-none focus:ring-2 focus:ring-primary/20" />
								</div>
								<div class="flex items-center justify-center py-1.5 {sep}">
									<button onclick={() => removeItem(si, ii)}
										class="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant/40 transition-all hover:bg-error/10 hover:text-error">
										<span class="material-symbols-outlined text-sm">close</span>
									</button>
								</div>
							{:else}
								<div style="grid-column: 1 / -1" class="py-8 text-center text-sm text-on-surface-variant/30">No products added</div>
							{/each}
						</div>

						<!-- Add product row (below grid, same container) -->
						<div class="flex justify-center border-t border-outline-variant/5 py-2">
							<button onclick={() => openProductPicker(si)} title="Add {section.category.name} product"
								class="flex h-7 w-7 items-center justify-center rounded-lg border border-dashed border-outline-variant/30 text-on-surface-variant/30 transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
								<span class="material-symbols-outlined text-sm">add</span>
							</button>
						</div>
					</div>

					<!-- Batch supplies -->
					<div class="rounded-2xl border border-outline-variant/10 bg-surface-container-low/40 p-4">
						<p class="mb-3 text-[9px] font-black uppercase tracking-widest text-on-surface-variant">Batch Supplies</p>
						{#each section.batchSupplies as sup, bi}
							<div class="mb-2 flex items-center gap-2">
								<p class="flex-1 text-sm font-bold text-on-surface">{sup.supplyName}</p>
								<input type="number" min="0" step="0.01" bind:value={sup.quantity}
									class="w-20 rounded-lg border-none bg-surface-container px-2 py-1.5 text-right text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" />
								<span class="w-7 text-[10px] text-on-surface-variant">{sup.unit}</span>
								<button onclick={() => removeBatchSupply(si, bi)}
									class="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant/40 transition-all hover:bg-error/10 hover:text-error">
									<span class="material-symbols-outlined text-sm">close</span>
								</button>
							</div>
						{/each}
						<button onclick={() => openBatchSupplyPicker(si)}
							class="mt-2 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant transition-all hover:bg-surface-container hover:text-primary">
							<span class="material-symbols-outlined text-sm">add</span>
							Add supply
						</button>
					</div>
				</div>
			</ArtisanalCard>
		{/each}

		<!-- Add category card -->
		{#if availableCategories.length > 0}
			<button onclick={() => (catPickerOpen = true)}
				class="flex w-full items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-outline-variant/20 bg-surface-container-low/30 py-7 text-on-surface-variant/40 transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary">
				<span class="material-symbols-outlined text-2xl">add</span>
				<span class="text-sm font-black uppercase tracking-widest">Add category</span>
			</button>
		{/if}

		<!-- Submit -->
		{#if sections.length > 0}
			<div class="pb-2">
				<SignatureButton onclick={handleSubmit} disabled={!canSubmit || bakerState.submitting} class="w-full" size="lg">
					<span class="material-symbols-outlined">{bakerState.submitting ? 'hourglass_empty' : 'check_circle'}</span>
					{bakerState.submitting ? 'Submitting…' : 'Submit Production Report'}
				</SignatureButton>
				{#if !canSubmit}
					<p class="mt-2 text-center text-[10px] text-on-surface-variant/50">Add at least one product with yield &gt; 0 to submit.</p>
				{/if}
			</div>
		{/if}

		<!-- Past Reports -->
		{#if bakerState.history.length > 0}
			<div>
				<p class="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Past Reports</p>
				<div class="space-y-2">
					{#each bakerState.history as log}
						<ArtisanalCard level="lowest" class="overflow-hidden border border-outline-variant/10">
							<button class="flex w-full items-center justify-between px-5 py-4 text-left"
								onclick={() => (expandedLog = expandedLog === log.id ? null : log.id)}>
								<div class="flex items-center gap-4">
									<div>
										<p class="text-sm font-bold text-on-surface">
											{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
										</p>
										<p class="text-[10px] text-on-surface-variant/60">
											{(log as any).itemCount} products · {(log as any).supplyCount} supplies
										</p>
									</div>
									<span class="rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest capitalize
										{log.shift === 'day' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}">
										{log.shift}
									</span>
								</div>
								<span class="material-symbols-outlined text-on-surface-variant/30 transition-transform {expandedLog === log.id ? 'rotate-90' : ''}">
									chevron_right
								</span>
							</button>
							{#if expandedLog === log.id && (log as any)._items}
								<div class="border-t border-outline-variant/10 px-5 pb-4 pt-3 space-y-3">
									{#if (log as any)._items.length > 0}
										<div>
											<p class="mb-2 text-[9px] font-black uppercase tracking-widest text-on-surface-variant">Products</p>
											{#each (log as any)._items as item}
												<div class="flex justify-between py-1 text-sm">
													<span class="font-medium text-on-surface">{item.expand?.product?.name ?? '—'}</span>
													<span class="font-bold text-primary">{item.yield_qty} pcs</span>
												</div>
											{/each}
										</div>
									{/if}
									{#if (log as any)._supplies.length > 0}
										<div>
											<p class="mb-2 text-[9px] font-black uppercase tracking-widest text-on-surface-variant">Supplies Used</p>
											{#each (log as any)._supplies as sup}
												<div class="flex justify-between py-1 text-sm">
													<span class="font-medium text-on-surface">{sup.expand?.supply?.name ?? '—'}</span>
													<span class="font-bold text-error">{sup.quantity} {sup.expand?.supply?.unit ?? ''}</span>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/if}
						</ArtisanalCard>
					{/each}
				</div>
			</div>
		{/if}

		{/if}
	</div>
</div>

<!-- Category picker -->
<Dialog open={catPickerOpen} title="Add Category" onClose={() => (catPickerOpen = false)} size="sm">
	<div class="space-y-1">
		{#each availableCategories as cat}
			<button onclick={() => addCategory(cat)}
				class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all hover:bg-primary/5">
				<span class="material-symbols-outlined text-primary" style="font-variation-settings:'FILL' 1">bakery_dining</span>
				<span class="text-sm font-bold text-on-surface">{cat.name}</span>
			</button>
		{:else}
			<p class="py-6 text-center text-sm text-on-surface-variant/50">All categories already added</p>
		{/each}
	</div>
</Dialog>

<!-- Supply / product picker -->
<Dialog
	open={pickerOpen}
	title={pickerMode === 'product' ? 'Add Product' : pickerMode === 'col-supply' ? 'Add Supply Column' : 'Add Batch Supply'}
	onClose={() => (pickerOpen = false)}
	size="sm"
>
	<div class="space-y-3">
		<input bind:value={pickerSearch} type="text" placeholder="Search..."
			class="h-11 w-full rounded-2xl border-none bg-surface-container-low px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20" />
		<div class="max-h-64 overflow-y-auto space-y-1">
			{#if pickerMode === 'product'}
				{#each pickerProducts as product}
					<button onclick={() => pickerConfirm(product)}
						class="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-all hover:bg-primary/5">
						<span class="text-sm font-bold text-on-surface">{product.name}</span>
						<span class="text-[10px] text-on-surface-variant">{product.unit || 'pcs'}</span>
					</button>
				{:else}
					<p class="py-6 text-center text-sm text-on-surface-variant/50">No products found</p>
				{/each}
			{:else}
				{#each pickerSupplies as supply}
					<button onclick={() => pickerConfirm(supply)}
						class="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-all hover:bg-primary/5">
						<span class="text-sm font-bold text-on-surface">{supply.name}</span>
						<span class="text-[10px] text-on-surface-variant">{supply.unit || ''}</span>
					</button>
				{:else}
					<p class="py-6 text-center text-sm text-on-surface-variant/50">No supplies found</p>
				{/each}
			{/if}
		</div>
	</div>
</Dialog>

<style>
	.no-scrollbar::-webkit-scrollbar { display: none; }
	.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
