<script lang="ts">
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
	import BakingLoader from '$lib/components/BakingLoader.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import Select from '$lib/components/Select.svelte';
	import SignatureButton from '$lib/components/artisanal/SignatureButton.svelte';
	import PaginatedTable from '$lib/components/PaginatedTable.svelte';
	import InventoryImage from '../../inventory/components/atoms/InventoryImage.svelte';
	import { fileUrl } from '$lib/pocketbase';
	import { categoriesState } from '$lib/states/categories.svelte';
	import { inventoryState } from '$lib/states/inventory.svelte';
	import { procurementState } from '$lib/states/procurement.svelte';
	import { toastState } from '$lib/states/toast.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount, tick } from 'svelte';
	import type { SuppliesResponse } from '$lib/pocketbase-types';

	let fetching = $state(true);
	let searchQuery = $state('');
	let selectedCategoryId = $state('');
	let dialogMode = $state<'add' | 'edit' | null>(null);
	let editingId = $state<string | null>(null);
	let saving = $state(false);
	let confirmDelete = $state(false);
	let imagePreview = $state<string | null>(null);

	let form = $state({
		name: '',
		category: '',
		unit: 'pcs' as 'kg' | 'g' | 'mL' | 'L' | 'pcs',
		min_stock: 0,
		max_stock: 0,
		description: '',
		barcode: '',
		supplier: '',
		image: null as File | null
	});

	let editingItem = $derived(
		inventoryState.supplies.items.find((s) => s.id === editingId) as SuppliesResponse<any> | undefined
	);

	let categoryOptions = $derived([
		{ value: '', label: 'All Categories' },
		...categoriesState.supplyCategories.map((c) => ({ value: c.id, label: c.name })),
		{ value: '__new__', label: 'New Category', action: true }
	]);

	let formCategoryOptions = $derived([
		...categoriesState.supplyCategories.map((c) => ({ value: c.id, label: c.name })),
		{ value: '__new__', label: 'New Category', action: true }
	]);

	let supplierOptions = $derived([
		{ value: '', label: 'No supplier' },
		...procurementState.suppliers.map((s) => ({ value: s.id, label: s.name }))
	]);

	const UNIT_OPTIONS = [
		{ value: 'pcs', label: 'Pieces (pcs)' },
		{ value: 'kg', label: 'Kilograms (kg)' },
		{ value: 'g', label: 'Grams (g)' },
		{ value: 'L', label: 'Liters (L)' },
		{ value: 'mL', label: 'Milliliters (mL)' }
	];

	// Scanner State & Logic
	let showScanner = $state(false);
	const scannerSupported =
		typeof window !== 'undefined' &&
		'BarcodeDetector' in window &&
		!!navigator.mediaDevices?.getUserMedia;
	let videoEl = $state<HTMLVideoElement | null>(null);
	let scanStream: MediaStream | null = null;
	let scanRafId: number | null = null;

	async function openScanner() {
		try {
			scanStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment' }
			});
		} catch {
			try {
				scanStream = await navigator.mediaDevices.getUserMedia({ video: true });
			} catch (err: any) {
				toastState.error(`Camera error: ${err?.name ?? 'Unknown'}. Enter barcode manually.`);
				return;
			}
		}
		showScanner = true;
		await tick();
		if (videoEl) {
			videoEl.srcObject = scanStream;
			await videoEl.play();
			beginScan();
		}
	}

	function beginScan() {
		// @ts-ignore
		const detector = new BarcodeDetector({
			formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
		});
		async function scanTick() {
			if (!showScanner || !videoEl) return;
			try {
				const codes = await detector.detect(videoEl);
				if (codes.length > 0) {
					form.barcode = codes[0].rawValue;
					closeScanner();
					toastState.success(`Barcode detected: ${form.barcode}`);
					return;
				}
			} catch {}
			scanRafId = requestAnimationFrame(scanTick);
		}
		scanRafId = requestAnimationFrame(scanTick);
	}

	function closeScanner() {
		if (scanRafId !== null) { cancelAnimationFrame(scanRafId); scanRafId = null; }
		scanStream?.getTracks().forEach((t) => t.stop());
		scanStream = null;
		showScanner = false;
	}

	let filteredSupplies = $derived(
		(inventoryState.supplies.items as SuppliesResponse<any>[]).filter((s) => {
			const matchesCat = selectedCategoryId ? s.category === selectedCategoryId : true;
			const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesCat && matchesSearch;
		})
	);

	onMount(async () => {
		await Promise.all([categoriesState.init(), inventoryState.init(), procurementState.load()]);
		fetching = false;
		const editId = page.url.searchParams.get('edit');
		if (editId) {
			const target = inventoryState.supplies.items.find((s) => s.id === editId) as SuppliesResponse<any> | undefined;
			if (target) openEdit(target);
		}
	});

	function openAdd() {
		editingId = null;
		form = {
			name: '',
			category: categoriesState.supplyCategories[0]?.id || '',
			unit: 'pcs',
			min_stock: 10,
			max_stock: 100,
			description: '',
			barcode: '',
			supplier: '',
			image: null
		};
		imagePreview = null;
		confirmDelete = false;
		dialogMode = 'add';
	}

	function openEdit(item: SuppliesResponse<any>) {
		editingId = item.id;
		form = {
			name: item.name || '',
			category: item.category || '',
			unit: (item.unit as any) || 'pcs',
			min_stock: item.min_stock || 0,
			max_stock: item.max_stock || 0,
			description: item.description || '',
			barcode: item.barcode || '',
			supplier: (item as any).supplier || '',
			image: null
		};
		imagePreview = null;
		confirmDelete = false;
		dialogMode = 'edit';
	}

	function closeDialog() { dialogMode = null; editingId = null; closeScanner(); }

	function handleImageChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) { form.image = file; imagePreview = URL.createObjectURL(file); }
	}

	async function handleSave() {
		if (!form.name.trim()) { toastState.error('Name is required.'); return; }
		if (!form.category) { toastState.error('Please select a category.'); return; }
		saving = true;
		try {
			const fd = new FormData();
			fd.append('name', form.name.trim());
			fd.append('category', form.category);
			fd.append('unit', form.unit);
			fd.append('min_stock', String(parseInt(String(form.min_stock)) || 0));
			fd.append('max_stock', String(parseInt(String(form.max_stock)) || 0));
			fd.append('barcode', form.barcode.trim());
			fd.append('supplier', form.supplier || '');
			if (form.description) fd.append('description', form.description);
			if (form.image) fd.append('images', form.image);

			if (dialogMode === 'add') {
				await inventoryState.createSupply(fd);
				toastState.success('Supply created.');
			} else if (editingId) {
				await inventoryState.updateSupply(editingId, fd);
				toastState.success('Supply updated.');
			}
			closeDialog();
		} catch (e: any) {
			const msg = e?.data ? Object.values(e.data).map((f: any) => f?.message).filter(Boolean).join(', ') : '';
			toastState.error(msg || 'Failed to save supply.');
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		if (!editingId) return;
		if (!confirmDelete) { confirmDelete = true; return; }
		saving = true;
		try {
			await inventoryState.deleteSupply(editingId);
			toastState.success('Supply deleted.');
			closeDialog();
		} catch {
			toastState.error('Failed to delete supply.');
		} finally {
			saving = false;
			confirmDelete = false;
		}
	}
</script>

<svelte:head><title>Supplies | Management</title></svelte:head>

<div class="no-scrollbar h-full overflow-y-auto px-6 py-8 md:px-10">

	<!-- Toolbar -->
	<div class="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
		<div class="relative flex-1">
			<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
			<input bind:value={searchQuery} type="text" placeholder="Search supplies..." class="h-12 w-full rounded-full border-none bg-surface-container-low pl-12 pr-4 text-sm font-medium shadow-inner outline-none focus:ring-2 focus:ring-primary/20" />
		</div>
		<div class="flex w-full items-center gap-3 md:w-auto">
			<Select
				value={selectedCategoryId}
				onchange={(v) => { if (v === '__new__') goto('/management/supplies/categories'); else selectedCategoryId = v; }}
				options={categoryOptions}
				placeholder="All Categories"
				class="flex-1 md:w-48 md:flex-none"
			/>
			<SignatureButton onclick={openAdd} size="md" class="flex-1 md:flex-none">
				<span class="material-symbols-outlined text-base">add_circle</span>
				<span class="truncate">New Supply</span>
			</SignatureButton>
		</div>
	</div>

	<!-- Table -->
	{#if fetching}
		<div class="flex h-48 items-center justify-center"><BakingLoader /></div>
	{:else}
		<ArtisanalCard level="lowest" class="overflow-hidden border border-outline-variant/10 p-0 shadow-sm">
			<PaginatedTable
				items={filteredSupplies}
				pageSize={10}
				tableClass="w-full min-w-[640px] border-collapse text-left"
				emptyMessage="No supplies found"
			>
				{#snippet header()}
					<tr class="bg-surface-container-low text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
						<th class="px-6 py-4">Supply Item</th>
						<th class="px-4 py-4">Category</th>
						<th class="px-4 py-4">Barcode</th>
						<th class="px-4 py-4">Unit</th>
						<th class="px-4 py-4">Limits (Min/Max)</th>
						<th class="px-4 py-4">Description</th>
					</tr>
				{/snippet}
				{#snippet row(supply)}
					<tr
						onclick={() => openEdit(supply)}
						class="cursor-pointer transition-colors hover:bg-surface-container-low/50"
					>
						<td class="px-6 py-4">
							<div class="flex items-center gap-3">
								<InventoryImage record={supply} size="md" />
								<p class="font-bold text-on-surface">{supply.name}</p>
							</div>
						</td>
						<td class="px-4 py-4">
							<span class="rounded-lg bg-surface-container px-3 py-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
								{supply.expand?.category?.name || '—'}
							</span>
						</td>
						<td class="px-4 py-4">
							<code class="text-[10px] font-bold text-on-surface-variant">{supply.barcode || '—'}</code>
						</td>
						<td class="px-4 py-4">
							<span class="text-sm font-bold text-on-surface">{supply.unit || 'pcs'}</span>
						</td>
						<td class="px-4 py-4">
							<div class="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
								<span class="text-error/70">{supply.min_stock || 0}</span>
								<span class="opacity-20">/</span>
								<span class="text-primary/70">{supply.max_stock || 0}</span>
							</div>
						</td>
						<td class="px-4 py-4 max-w-[200px]">
							<p class="truncate text-sm text-on-surface-variant/60">{supply.description || '—'}</p>
						</td>
					</tr>
				{/snippet}
			</PaginatedTable>
		</ArtisanalCard>
	{/if}
</div>

<!-- Add / Edit Dialog -->
<Dialog
	open={dialogMode !== null}
	title={dialogMode === 'add' ? 'New Supply' : 'Edit Supply'}
	onClose={closeDialog}
	size="md"
>
	<div class="space-y-6">
		<!-- Scanner View -->
		{#if showScanner}
			<div class="relative overflow-hidden rounded-2xl bg-black shadow-xl">
				<!-- svelte-ignore a11y_media_has_caption -->
				<video bind:this={videoEl} class="h-48 w-full object-cover"></video>
				<div class="absolute inset-0 flex items-center justify-center border-2 border-primary/30">
					<div class="h-1 w-full bg-primary/40 shadow-[0_0_10px_rgba(var(--color-primary),0.8)]"></div>
				</div>
				<button onclick={closeScanner} class="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/80">
					<span class="material-symbols-outlined text-sm">close</span>
				</button>
			</div>
		{/if}

		<div class="grid grid-cols-[auto_1fr] gap-6">
			<!-- Image picker -->
			<label class="group relative cursor-pointer">
				<div class="h-[140px] w-[140px] overflow-hidden rounded-3xl border-2 border-outline-variant/20 bg-surface-container-low shadow-inner transition-all group-hover:border-primary/30">
					{#if imagePreview}
						<img src={imagePreview} alt="" class="h-full w-full object-cover" />
					{:else if editingItem?.images?.length}
						<img src={fileUrl(editingItem, editingItem.images[0])} alt="" class="h-full w-full object-cover" />
					{:else}
						<div class="flex h-full w-full items-center justify-center bg-primary/5">
							<span class="material-symbols-outlined text-5xl text-primary/20">inventory_2</span>
						</div>
					{/if}
				</div>
				<div class="absolute -right-1 -bottom-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg ring-4 ring-surface">
					<span class="material-symbols-outlined text-lg">photo_camera</span>
				</div>
				<input type="file" accept="image/*" class="hidden" onchange={handleImageChange} />
			</label>

			<div class="flex flex-col justify-center gap-5">
				<div class="space-y-1.5">
					<label for="sup-name" class="px-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Supply Name</label>
					<input id="sup-name" bind:value={form.name} type="text" placeholder="e.g. Bread Flour" class="h-12 w-full rounded-2xl border-none bg-surface-container-low px-5 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-primary/20" />
				</div>
				
				<div class="space-y-1.5">
					<p class="px-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Unit</p>
					<Select bind:value={form.unit} options={UNIT_OPTIONS} />
				</div>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div class="space-y-1.5">
				<p class="px-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Category</p>
				<Select
					bind:value={form.category}
					options={formCategoryOptions}
					onchange={(v) => { if (v === '__new__') goto('/management/supplies/categories'); }}
					placeholder="Select category"
				/>
			</div>
			<div class="space-y-1.5">
				<p class="px-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Usual Supplier</p>
				<Select
					bind:value={form.supplier}
					options={supplierOptions}
					placeholder="No supplier"
				/>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div class="space-y-1.5">
				<label for="sup-min" class="px-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Min Limit</label>
				<input id="sup-min" bind:value={form.min_stock} type="number" class="h-11 w-full rounded-xl border-none bg-surface-container-low px-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-primary/20" />
			</div>
			<div class="space-y-1.5">
				<label for="sup-max" class="px-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Max Limit</label>
				<input id="sup-max" bind:value={form.max_stock} type="number" class="h-11 w-full rounded-xl border-none bg-surface-container-low px-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-primary/20" />
			</div>
		</div>

		<div class="space-y-1.5">
			<label for="sup-barcode" class="px-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Barcode / SKU</label>
			<div class="relative">
				<input id="sup-barcode" bind:value={form.barcode} type="text" placeholder="Scan or enter code" class="h-12 w-full rounded-2xl border-none bg-surface-container-low pl-5 pr-12 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-primary/20" />
				{#if scannerSupported}
					<button 
						onclick={openScanner}
						class="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-xl text-primary hover:bg-primary/10 transition-colors"
						title="Scan Barcode"
					>
						<span class="material-symbols-outlined">barcode_scanner</span>
					</button>
				{/if}
			</div>
		</div>

		<div class="space-y-1.5">
			<label for="sup-desc" class="px-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Description</label>
			<textarea id="sup-desc" bind:value={form.description} placeholder="Supply notes..." rows="2" class="w-full resize-none rounded-2xl border-none bg-surface-container-low px-5 py-4 text-sm font-medium shadow-inner outline-none focus:ring-2 focus:ring-primary/20"></textarea>
		</div>
	</div>

	{#snippet footer()}
		<div class="flex gap-2">
			{#if dialogMode === 'edit'}
				{#if confirmDelete}
					<button
						onclick={handleDelete}
						disabled={saving}
						class="flex h-12 items-center gap-2 rounded-2xl bg-error px-4 text-sm font-black text-on-error transition-all hover:brightness-110 disabled:opacity-40"
					>
						<span class="material-symbols-outlined text-base">warning</span>
						Confirm delete
					</button>
					<button onclick={() => (confirmDelete = false)} class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-container-low text-on-surface-variant hover:bg-surface-container">
						<span class="material-symbols-outlined text-base">close</span>
					</button>
				{:else}
					<button
						onclick={handleDelete}
						disabled={saving}
						class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-on-surface-variant transition-all hover:bg-error/10 hover:text-error disabled:opacity-40"
					>
						<span class="material-symbols-outlined text-base">delete</span>
					</button>
					<SignatureButton onclick={handleSave} disabled={saving} class="flex-1">
						<span class="material-symbols-outlined">{saving ? 'hourglass_empty' : 'save'}</span>
						{saving ? 'Saving…' : 'Save Changes'}
					</SignatureButton>
				{/if}
			{:else}
				<SignatureButton onclick={handleSave} disabled={saving} class="flex-1">
					<span class="material-symbols-outlined">{saving ? 'hourglass_empty' : 'add_circle'}</span>
					{saving ? 'Saving…' : 'Create Supply'}
				</SignatureButton>
			{/if}
		</div>
	{/snippet}
</Dialog>

<style>
	.no-scrollbar::-webkit-scrollbar { display: none; }
	.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
