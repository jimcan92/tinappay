<script lang="ts">
	import { onMount } from 'svelte';
	import { pb } from '$lib/pocketbase';
	import SignatureButton from '$lib/components/artisanal/SignatureButton.svelte';
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
	import BakingLoader from '$lib/components/BakingLoader.svelte';

	// --- Data ---
	let categories = $state<any[]>([]);
	let ingredients = $state<any[]>([]);
	let products = $state<any[]>([]);
	let productCategories = $state<any[]>([]);

	// --- UI State ---
	let activeTab = $state<'products' | 'ingredients' | 'categories'>('products');
	let searchQuery = $state('');
	let selectedCategoryId = $state<string | null>(null);
	let selectedItemId = $state<string | null>(null);
	let loading = $state(false);
	let fetching = $state(true);
	let showForm = $state(false);
	let isEditing = $state(false);

	// --- Ingredients Form ---
	let ingForm = $state({
		name: '',
		description: '',
		unit: 'kg',
		current_stock: 0,
		min_stock: 10,
		max_stock: 100,
		category: '',
		image: null as File | null
	});
	
	// --- Products Form ---
	let prodForm = $state({
		name: '',
		description: '',
		price: 0,
		category: '',
		image: null as File | null
	});

	// --- Derived ---
	let filteredIngredients = $derived(
		ingredients.filter((i) => {
			const matchesCat = selectedCategoryId ? i.category === selectedCategoryId : true;
			const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesCat && matchesSearch;
		})
	);

	let filteredProducts = $derived(
		products.filter((p) => {
			const matchesCat = selectedCategoryId ? p.category === selectedCategoryId : true;
			const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesCat && matchesSearch;
		})
	);

	let criticalCount = $derived(ingredients.filter((i) => i.current_stock <= i.min_stock).length);

	let selectedIngredient = $derived(
		activeTab === 'ingredients' ? ingredients.find((i) => i.id === selectedItemId) ?? null : null
	);
	let selectedProduct = $derived(
		activeTab === 'products' ? products.find((p) => p.id === selectedItemId) ?? null : null
	);

	// --- Category CRUD state ---
	let allCategories = $derived([...categories.map(c => ({...c, type: 'ingredient'})), ...productCategories.map(c => ({...c, type: 'product'}))]);
	let catNewName = $state({ product: '', ingredient: '' });
	let catEditId = $state<string | null>(null);
	let catEditName = $state('');
	let catSaving = $state(false);

	async function handleAddCategory(type: 'product' | 'ingredient') {
		const name = type === 'product' ? catNewName.product.trim() : catNewName.ingredient.trim();
		if (!name) return;
		catSaving = true;
		try {
			await pb.collection('categories').create({ name, type });
			if (type === 'product') catNewName.product = ''; else catNewName.ingredient = '';
			await fetchData();
		} catch (e) { console.error(e); } finally { catSaving = false; }
	}

	async function handleRenameCategory(id: string) {
		if (!catEditName.trim()) return;
		catSaving = true;
		try {
			await pb.collection('categories').update(id, { name: catEditName.trim() });
			catEditId = null; catEditName = '';
			await fetchData();
		} catch (e) { console.error(e); } finally { catSaving = false; }
	}

	async function handleDeleteCategory(id: string) {
		if (!confirm('Delete this category? Items using it will be unaffected.')) return;
		catSaving = true;
		try {
			await pb.collection('categories').delete(id);
			await fetchData();
		} catch (e) { console.error(e); } finally { catSaving = false; }
	}

	// --- Data Fetch ---
	async function fetchData() {
		fetching = true;
		try {
			const [catList, ingList, prodCatList, prodList] = await Promise.all([
				pb.collection('categories').getFullList({ filter: 'type="ingredient"' }),
				pb.collection('ingredients').getFullList({ expand: 'category', sort: 'name' }),
				pb.collection('categories').getFullList({ filter: 'type="product"' }),
				pb.collection('products').getFullList({ expand: 'category', sort: 'name' })
			]);
			categories = catList;
			ingredients = ingList;
			productCategories = prodCatList;
			products = prodList;
		} catch (e) {
			console.error('Inventory fetch error:', e);
		} finally {
			fetching = false;
		}
	}

	onMount(fetchData);

	// --- Helpers ---
	function getStockProgress(ing: any) {
		return Math.min(Math.max((ing.current_stock / (ing.max_stock || 1)) * 100, 0), 100);
	}

	function stockStatus(ing: any) {
		if (ing.current_stock <= ing.min_stock) return 'critical';
		if (ing.current_stock <= ing.min_stock * 1.5) return 'low';
		return 'optimal';
	}

	// --- Form Resets ---
	function resetIngForm(ing?: any) {
		ingForm = ing
			? { name: ing.name, description: ing.description || '', unit: ing.unit, current_stock: ing.current_stock, min_stock: ing.min_stock, max_stock: ing.max_stock, category: ing.category, image: null }
			: { name: '', description: '', unit: 'kg', current_stock: 0, min_stock: 10, max_stock: 100, category: categories[0]?.id || '', image: null };
	}

	function resetProdForm(prod?: any) {
		prodForm = prod
			? { name: prod.name, description: prod.description || '', price: prod.price, category: prod.category, image: null }
			: { name: '', description: '', price: 0, category: productCategories[0]?.id || '', image: null };
	}

	function startAdding() {
		selectedItemId = null;
		isEditing = false;
		showForm = true;
		if (activeTab === 'ingredients') resetIngForm();
		else resetProdForm();
	}

	function startEditing(item: any) {
		selectedItemId = item.id;
		isEditing = true;
		showForm = true;
		if (activeTab === 'ingredients') resetIngForm(item);
		else resetProdForm(item);
	}

	function cancelForm() {
		showForm = false;
		isEditing = false;
	}

	// --- CRUD ---
	async function handleSaveIngredient() {
		loading = true;
		try {
			const fd = new FormData();
			Object.entries(ingForm).forEach(([k, v]) => v !== null && fd.append(k, v as any));
			if (isEditing && selectedItemId) await pb.collection('ingredients').update(selectedItemId, fd);
			else await pb.collection('ingredients').create(fd);
			await fetchData();
			showForm = false;
			isEditing = false;
		} catch (e) { console.error(e); }
		finally { loading = false; }
	}

	async function handleSaveProduct() {
		loading = true;
		try {
			const fd = new FormData();
			Object.entries(prodForm).forEach(([k, v]) => v !== null && fd.append(k, v as any));
			if (isEditing && selectedItemId) await pb.collection('products').update(selectedItemId, fd);
			else await pb.collection('products').create(fd);
			await fetchData();
			showForm = false;
			isEditing = false;
		} catch (e) { console.error(e); }
		finally { loading = false; }
	}

	async function handleDelete(collection: string, id: string) {
		if (!confirm('Permanently delete this item?')) return;
		loading = true;
		try {
			await pb.collection(collection).delete(id);
			selectedItemId = null;
			showForm = false;
			await fetchData();
		} catch (e) { console.error(e); }
		finally { loading = false; }
	}

	function switchTab(tab: 'products' | 'ingredients' | 'categories') {
		activeTab = tab;
		selectedItemId = null;
		selectedCategoryId = null;
		searchQuery = '';
		showForm = false;
	}

	let currentCategories = $derived(activeTab === 'ingredients' ? categories : productCategories);
</script>

<svelte:head>
	<title>Inventory Control | TinAPPay ERP</title>
</svelte:head>

<!-- Main Layout -->
<div class="flex h-full w-full overflow-hidden bg-surface">

	<!-- LIST PANEL -->
	<div class="flex flex-1 flex-col overflow-hidden">
		<!-- Page Header -->
		<header class="p-6 md:p-8 lg:p-10 flex-shrink-0">
			<div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
				<div>
					<h2 class="text-3xl md:text-4xl font-serif font-black tracking-tight text-on-surface mb-1.5">Inventory Control</h2>
					<p class="text-on-surface-variant font-medium text-sm md:text-base">Manage your finished products and raw materials.</p>
				</div>
				<SignatureButton onclick={startAdding} size="md" class={activeTab === 'categories' ? 'opacity-0 pointer-events-none' : ''}>
					<span class="material-symbols-outlined">add_circle</span>
					New Item
				</SignatureButton>
			</div>

			<!-- Stats Row -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
				<div class="col-span-2 bg-surface-container-lowest p-6 rounded-[2rem] shadow-sm relative overflow-hidden">
					<div class="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-8 -mt-8 blur-2xl"></div>
					<div class="relative z-10">
						<span class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Operational Health</span>
						<div class="flex items-end justify-between mt-4">
							<div>
								<p class="text-3xl font-serif font-black text-on-surface leading-none">{ingredients.filter(i => i.current_stock > i.min_stock).length}</p>
								<p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Sufficient Supplies</p>
							</div>
							<div class="text-right">
								<p class="text-3xl font-serif font-black text-primary leading-none">{ingredients.length > 0 ? (ingredients.filter(i => i.current_stock > i.min_stock).length / ingredients.length * 100).toFixed(0) : 0}%</p>
								<p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Stability</p>
							</div>
						</div>
					</div>
				</div>
				<div class="bg-error-container/10 p-6 rounded-[2rem] border border-error/10 flex flex-col justify-between relative overflow-hidden">
					<div class="absolute -top-4 -right-4 opacity-10">
						<span class="material-symbols-outlined text-[80px]" style="font-variation-settings: 'FILL' 1;">warning</span>
					</div>
					<div class="relative z-10">
						<p class="text-2xl font-serif font-black text-error leading-none">{criticalCount}</p>
						<p class="text-[10px] font-bold text-on-error-container/80 uppercase tracking-wider mt-1">Critical Low</p>
					</div>
				</div>
				<div class="bg-tertiary-container p-6 rounded-[2rem] flex flex-col justify-between">
					<p class="text-2xl font-serif font-black text-on-surface leading-none">{products.length}</p>
					<p class="text-[10px] font-bold text-on-tertiary-container/80 uppercase tracking-wider mt-1">SKUs Active</p>
				</div>
			</div>

			<!-- Tabs -->
			<div class="flex gap-2 p-1.5 bg-surface-container-high rounded-2xl mb-6">
				<button
					onclick={() => switchTab('products')}
					class="flex flex-1 items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all {activeTab === 'products' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}"
				>
					<span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' {activeTab === 'products' ? 1 : 0};">bakery_dining</span>
					<span class="hidden sm:inline">Finished</span> Products
				</button>
				<button
					onclick={() => switchTab('ingredients')}
					class="flex flex-1 items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all {activeTab === 'ingredients' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}"
				>
					<span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' {activeTab === 'ingredients' ? 1 : 0};">egg</span>
					<span class="hidden sm:inline">Ingredients &amp;</span> Supplies
				</button>
				<button
					onclick={() => switchTab('categories')}
					class="flex flex-1 items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all {activeTab === 'categories' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}"
				>
					<span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' {activeTab === 'categories' ? 1 : 0};">category</span>
					<span class="hidden sm:inline">Categories</span>
				</button>
			</div>

			<!-- Search + Category Filter (hidden on categories tab) -->
			{#if activeTab !== 'categories'}
				<div class="flex flex-col sm:flex-row gap-3">
					<div class="relative flex-1 group">
						<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary">search</span>
						<input
							bind:value={searchQuery}
							class="w-full rounded-full border-none bg-surface-container-low py-3.5 pl-12 pr-4 text-sm font-medium transition-all focus:ring-2 focus:ring-primary/20"
							placeholder="Search {activeTab === 'products' ? 'products' : 'supplies'}..."
							type="text"
						/>
					</div>
					<div class="no-scrollbar flex gap-2 overflow-x-auto py-1">
						<button
							onclick={() => (selectedCategoryId = null)}
							class="rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap {selectedCategoryId === null ? 'bg-primary text-on-primary shadow-lg' : 'bg-surface-container-low text-on-surface-variant'}"
						>All</button>
						{#each currentCategories as cat}
							<button
								onclick={() => (selectedCategoryId = cat.id)}
								class="rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap {selectedCategoryId === cat.id ? 'bg-primary text-on-primary shadow-lg' : 'bg-surface-container-low text-on-surface-variant'}"
							>{cat.name}</button>
						{/each}
					</div>
				</div>
			{/if}
		</header>

		<!-- List Content -->
		<div class="no-scrollbar flex-1 overflow-y-auto px-6 pb-10 md:px-8 lg:px-10">
			{#if fetching}
				<div class="flex h-64 items-center justify-center">
					<BakingLoader />
				</div>
			{:else if activeTab === 'categories'}
				<!-- CATEGORIES VIEW -->
				<div class="space-y-8 max-w-2xl">
					{#each [{ type: 'product', label: 'Product Categories', icon: 'bakery_dining', list: productCategories }, { type: 'ingredient', label: 'Ingredient Categories', icon: 'egg', list: categories }] as group}
						<div>
							<div class="flex items-center gap-3 mb-4">
								<span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">{group.icon}</span>
								<h3 class="font-serif font-black text-lg text-on-surface">{group.label}</h3>
								<span class="text-xs font-black text-on-surface-variant bg-surface-container-high px-2.5 py-0.5 rounded-full">{group.list.length}</span>
							</div>

							<!-- Existing categories -->
							<div class="space-y-2 mb-4">
								{#each group.list as cat}
									<div class="flex items-center gap-3 bg-surface-container-low rounded-2xl px-5 py-3.5 group">
										{#if catEditId === cat.id}
											<input
												bind:value={catEditName}
												class="flex-1 bg-surface-container-lowest rounded-xl border-none px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20"
												onkeydown={(e) => e.key === 'Enter' && handleRenameCategory(cat.id)}
											/>
											<button onclick={() => handleRenameCategory(cat.id)} disabled={catSaving} class="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-on-primary hover:scale-105 transition-all"><span class="material-symbols-outlined text-sm">check</span></button>
											<button onclick={() => { catEditId = null; catEditName = ''; }} class="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-surface-container-high transition-all"><span class="material-symbols-outlined text-sm">close</span></button>
										{:else}
											<span class="flex-1 font-bold text-sm text-on-surface">{cat.name}</span>
											<div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
												<button onclick={() => { catEditId = cat.id; catEditName = cat.name; }} class="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-primary/10 text-primary transition-all"><span class="material-symbols-outlined text-sm">edit</span></button>
												<button onclick={() => handleDeleteCategory(cat.id)} class="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-error/10 text-error transition-all"><span class="material-symbols-outlined text-sm">delete</span></button>
											</div>
										{/if}
									</div>
								{:else}
									<p class="text-center text-on-surface-variant/50 text-sm italic py-4">No {group.label.toLowerCase()} yet.</p>
								{/each}
							</div>

							<!-- Add new category inline -->
							<div class="flex items-center gap-3">
								{#if group.type === 'product'}
									<input
										bind:value={catNewName.product}
										class="flex-1 bg-surface-container-low rounded-2xl border-none border-2 border-dashed border-outline-variant/20 px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/40"
										placeholder="New product category name..."
										onkeydown={(e) => e.key === 'Enter' && handleAddCategory('product')}
									/>
								{:else}
									<input
										bind:value={catNewName.ingredient}
										class="flex-1 bg-surface-container-low rounded-2xl border-none border-2 border-dashed border-outline-variant/20 px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/40"
										placeholder="New ingredient category name..."
										onkeydown={(e) => e.key === 'Enter' && handleAddCategory('ingredient')}
									/>
								{/if}
								<button
									onclick={() => handleAddCategory(group.type as 'product' | 'ingredient')}
									disabled={catSaving || !(group.type === 'product' ? catNewName.product.trim() : catNewName.ingredient.trim())}
									class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
								><span class="material-symbols-outlined">add</span></button>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<!-- DESKTOP: Table layout (hidden on mobile) -->
				<div class="hidden lg:block">
					<ArtisanalCard level="lowest" class="p-0 overflow-hidden shadow-sm border border-outline-variant/10">
						<table class="w-full text-left border-collapse">
							<thead>
								<tr class="bg-surface-container text-on-surface-variant text-[10px] font-black uppercase tracking-widest">
									<th class="px-8 py-5">Item Details</th>
									<th class="px-6 py-5">Category</th>
									{#if activeTab === 'ingredients'}
										<th class="px-6 py-5">Stock Level</th>
										<th class="px-6 py-5">Capacity</th>
										<th class="px-6 py-5 text-center">Status</th>
									{:else}
										<th class="px-6 py-5">Price</th>
										<th class="px-6 py-5 text-center">Status</th>
									{/if}
									<th class="px-8 py-5 text-right">Actions</th>
								</tr>
							</thead>
							<tbody>
								{#if activeTab === 'ingredients'}
									{#each filteredIngredients as ing, i}
										<tr class="transition-colors group {i % 2 === 0 ? '' : 'bg-surface-container-low/30'} hover:bg-surface-container-low/60 cursor-pointer {selectedItemId === ing.id ? 'bg-primary/5' : ''}" onclick={() => { selectedItemId = ing.id; showForm = false; }}>
											<td class="px-8 py-5">
												<div class="flex items-center gap-4">
													<div class="h-12 w-12 rounded-xl overflow-hidden bg-surface-container shadow-inner flex-shrink-0">
														{#if ing.image}
															<img src={pb.files.getUrl(ing, ing.image)} alt="" class="h-full w-full object-cover" />
														{:else}
															<div class="h-full w-full flex items-center justify-center bg-primary/5 text-primary/30 font-black text-xs uppercase">{ing.name.substring(0, 2)}</div>
														{/if}
													</div>
													<div>
														<p class="font-bold text-on-surface">{ing.name}</p>
														<p class="text-[10px] text-on-surface-variant uppercase tracking-tighter font-bold">{ing.expand?.category?.name || 'Supply'}</p>
													</div>
												</div>
											</td>
											<td class="px-6 py-5 text-sm font-medium text-on-surface-variant">{ing.expand?.category?.name || '—'}</td>
											<td class="px-6 py-5">
												<p class="font-serif font-black text-on-surface">{ing.current_stock} <span class="text-[10px] font-sans text-on-surface-variant font-bold uppercase">{ing.unit}</span></p>
												<div class="w-24 h-1.5 bg-surface-container rounded-full mt-2 overflow-hidden">
													<div class="h-full transition-all {ing.current_stock <= ing.min_stock ? 'bg-error' : 'bg-primary'}" style="width: {getStockProgress(ing)}%"></div>
												</div>
											</td>
											<td class="px-6 py-5 text-sm text-on-surface-variant font-bold">{ing.max_stock} {ing.unit}</td>
											<td class="px-6 py-5 text-center">
												<span class="px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest {ing.current_stock <= ing.min_stock ? 'bg-error-container text-on-error-container' : 'bg-tertiary-container text-on-tertiary-container'}">
													{ing.current_stock <= ing.min_stock ? 'Critical' : 'Optimal'}
												</span>
											</td>
											<td class="px-8 py-5 text-right">
												<div class="flex justify-end gap-2">
													<button onclick={(e) => { e.stopPropagation(); startEditing(ing); }} class="p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors"><span class="material-symbols-outlined">edit</span></button>
													<button onclick={(e) => { e.stopPropagation(); handleDelete('ingredients', ing.id); }} class="p-2 rounded-xl hover:bg-error/10 text-error transition-colors"><span class="material-symbols-outlined">delete</span></button>
												</div>
											</td>
										</tr>
									{:else}
										<tr><td colspan="6" class="px-8 py-12 text-center text-on-surface-variant/50 italic">No ingredients found.</td></tr>
									{/each}
								{:else}
									{#each filteredProducts as prod, i}
										<tr class="transition-colors group {i % 2 === 0 ? '' : 'bg-surface-container-low/30'} hover:bg-surface-container-low/60 cursor-pointer {selectedItemId === prod.id ? 'bg-primary/5' : ''}" onclick={() => { selectedItemId = prod.id; showForm = false; }}>
											<td class="px-8 py-5">
												<div class="flex items-center gap-4">
													<div class="h-12 w-12 rounded-xl overflow-hidden bg-surface-container shadow-inner flex-shrink-0 transition-transform group-hover:scale-105">
														{#if prod.image}
															<img src={pb.files.getUrl(prod, prod.image)} alt="" class="h-full w-full object-cover" />
														{:else}
															<div class="h-full w-full flex items-center justify-center bg-primary/5 text-primary/30 font-black text-xs uppercase">{prod.name.substring(0, 2)}</div>
														{/if}
													</div>
													<div>
														<p class="font-bold text-on-surface">{prod.name}</p>
														<p class="text-[10px] text-on-surface-variant uppercase tracking-tighter font-bold">{prod.expand?.category?.name || 'Product'}</p>
													</div>
												</div>
											</td>
											<td class="px-6 py-5 text-sm font-medium text-on-surface-variant">{prod.expand?.category?.name || '—'}</td>
											<td class="px-6 py-5 font-serif font-black text-on-surface">₱{prod.price?.toFixed(2) ?? '0.00'}</td>
											<td class="px-6 py-5 text-center">
												<span class="px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-tertiary-container text-on-tertiary-container">Active</span>
											</td>
											<td class="px-8 py-5 text-right">
												<div class="flex justify-end gap-2">
													<button onclick={(e) => { e.stopPropagation(); startEditing(prod); }} class="p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors"><span class="material-symbols-outlined">edit</span></button>
													<button onclick={(e) => { e.stopPropagation(); handleDelete('products', prod.id); }} class="p-2 rounded-xl hover:bg-error/10 text-error transition-colors"><span class="material-symbols-outlined">delete</span></button>
												</div>
											</td>
										</tr>
									{:else}
										<tr><td colspan="5" class="px-8 py-12 text-center text-on-surface-variant/50 italic">No products found.</td></tr>
									{/each}
								{/if}
							</tbody>
						</table>
					</ArtisanalCard>
				</div>

				<!-- MOBILE: Card list (visible below lg) -->
				<div class="lg:hidden space-y-3">
					{#if activeTab === 'ingredients'}
						{#each filteredIngredients as ing}
							<button
								class="w-full bg-surface-container-low rounded-[1.5rem] p-4 flex gap-4 items-center text-left transition-all hover:shadow-sm active:scale-[0.98] {selectedItemId === ing.id ? 'ring-2 ring-primary/30' : ''}"
								onclick={() => { selectedItemId = ing.id; showForm = false; }}
							>
								<div class="w-16 h-16 rounded-2xl overflow-hidden bg-surface-container shrink-0">
									{#if ing.image}
										<img src={pb.files.getUrl(ing, ing.image)} alt="" class="w-full h-full object-cover" />
									{:else}
										<div class="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-lg uppercase">{ing.name.substring(0, 2)}</div>
									{/if}
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex justify-between items-start mb-1">
										<h4 class="font-bold text-on-surface truncate">{ing.name}</h4>
										<span class="text-[9px] font-black px-2 py-0.5 rounded-md ml-2 flex-shrink-0 {ing.current_stock <= ing.min_stock ? 'bg-error-container text-on-error-container' : 'bg-tertiary-container text-on-tertiary-container'}">
											{ing.current_stock <= ing.min_stock ? 'LOW' : 'OK'}
										</span>
									</div>
									<p class="text-xs text-on-surface-variant mb-2">{ing.current_stock} {ing.unit} in stock</p>
									<div class="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
										<div class="h-full rounded-full transition-all {ing.current_stock <= ing.min_stock ? 'bg-error' : 'bg-primary'}" style="width: {getStockProgress(ing)}%"></div>
									</div>
								</div>
							</button>
						{:else}
							<div class="py-12 text-center text-on-surface-variant/50 italic">No ingredients found.</div>
						{/each}
					{:else}
						{#each filteredProducts as prod}
							<button
								class="w-full bg-surface-container-low rounded-[1.5rem] p-4 flex gap-4 items-center text-left transition-all hover:shadow-sm active:scale-[0.98] {selectedItemId === prod.id ? 'ring-2 ring-primary/30' : ''}"
								onclick={() => { selectedItemId = prod.id; showForm = false; }}
							>
								<div class="w-16 h-16 rounded-2xl overflow-hidden bg-surface-container shrink-0">
									{#if prod.image}
										<img src={pb.files.getUrl(prod, prod.image)} alt="" class="w-full h-full object-cover" />
									{:else}
										<div class="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-lg uppercase">{prod.name.substring(0, 2)}</div>
									{/if}
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex justify-between items-start mb-1">
										<h4 class="font-bold text-on-surface truncate">{prod.name}</h4>
										<span class="text-[9px] font-black px-2 py-0.5 rounded-md bg-tertiary-container text-on-tertiary-container ml-2">ACTIVE</span>
									</div>
									<p class="text-xs text-on-surface-variant">{prod.expand?.category?.name || 'Product'}</p>
									<p class="text-sm font-serif font-black text-primary mt-1">₱{prod.price?.toFixed(2) ?? '0.00'}</p>
								</div>
							</button>
						{:else}
							<div class="py-12 text-center text-on-surface-variant/50 italic">No products found.</div>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- DETAIL / FORM PANEL (desktop right panel + mobile drawer) -->
	{#if showForm || selectedItemId}
		<aside class="
			fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end lg:items-stretch
			lg:static lg:inset-auto lg:z-auto lg:bg-transparent lg:backdrop-blur-none
			lg:flex lg:w-[440px] xl:w-[520px] lg:border-l lg:border-outline-variant/10
		">
			<div class="
				w-full max-h-[90dvh] lg:max-h-none lg:h-full
				flex flex-col overflow-hidden
				bg-surface rounded-t-[2rem] lg:rounded-none
				shadow-2xl lg:shadow-none
			">
				{#if showForm}
					<!-- FORM CONTENT -->
					<header class="p-8 border-b border-outline-variant/10 flex items-center justify-between flex-shrink-0">
						<div>
							<h3 class="text-2xl font-serif font-black tracking-tight">{isEditing ? 'Edit' : 'Add New'} {activeTab === 'ingredients' ? 'Supply' : 'Product'}</h3>
							<p class="text-[10px] text-on-surface-variant font-black uppercase tracking-widest mt-1">Inventory Management</p>
						</div>
						<button onclick={cancelForm} class="h-10 w-10 rounded-full hover:bg-surface-container-low flex items-center justify-center">
							<span class="material-symbols-outlined">close</span>
						</button>
					</header>

					<div class="flex-1 overflow-y-auto no-scrollbar p-8 space-y-6">
						{#if activeTab === 'ingredients'}
							<div class="space-y-2">
								<label for="ing-name" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Ingredient Name</label>
								<input id="ing-name" bind:value={ingForm.name} type="text" class="w-full h-14 rounded-2xl bg-surface-container-low border-none px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20" placeholder="e.g. Cultured Butter" />
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-2">
									<label for="ing-cat" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Category</label>
									<select id="ing-cat" bind:value={ingForm.category} class="w-full h-14 rounded-2xl bg-surface-container-low border-none px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20">
										{#each categories as cat}
											<option value={cat.id}>{cat.name}</option>
										{/each}
									</select>
								</div>
								<div class="space-y-2">
									<label for="ing-unit" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Unit</label>
									<input id="ing-unit" bind:value={ingForm.unit} type="text" class="w-full h-14 rounded-2xl bg-surface-container-low border-none px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20" placeholder="kg, L, pcs" />
								</div>
							</div>
							<div class="grid grid-cols-3 gap-3">
								<div class="space-y-2">
									<label for="ing-stock" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Current</label>
									<input id="ing-stock" bind:value={ingForm.current_stock} type="number" class="w-full h-14 rounded-2xl bg-surface-container-low border-none px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20" />
								</div>
								<div class="space-y-2">
									<label for="ing-min" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Min</label>
									<input id="ing-min" bind:value={ingForm.min_stock} type="number" class="w-full h-14 rounded-2xl bg-surface-container-low border-none px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20" />
								</div>
								<div class="space-y-2">
									<label for="ing-max" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Max</label>
									<input id="ing-max" bind:value={ingForm.max_stock} type="number" class="w-full h-14 rounded-2xl bg-surface-container-low border-none px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20" />
								</div>
							</div>
							<div class="space-y-2">
								<label for="ing-desc" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Description</label>
								<textarea id="ing-desc" bind:value={ingForm.description} class="w-full h-28 rounded-2xl bg-surface-container-low border-none p-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 resize-none" placeholder="Storage notes, quality specs..."></textarea>
							</div>
							<div class="space-y-2">
								<label for="ing-img" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Image</label>
								<div class="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-outline-variant/20 bg-surface-container-low/30">
									<span class="material-symbols-outlined text-on-surface-variant/40 text-3xl">camera_alt</span>
									<input id="ing-img" type="file" accept="image/*" onchange={(e) => ingForm.image = (e.currentTarget as HTMLInputElement).files?.[0] || null} class="flex-1 text-xs text-on-surface-variant font-bold file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
								</div>
							</div>
						{:else}
							<div class="space-y-2">
								<label for="prod-name" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Product Name</label>
								<input id="prod-name" bind:value={prodForm.name} type="text" class="w-full h-14 rounded-2xl bg-surface-container-low border-none px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20" placeholder="e.g. Heritage Sourdough" />
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-2">
									<label for="prod-cat" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Category</label>
									<select id="prod-cat" bind:value={prodForm.category} class="w-full h-14 rounded-2xl bg-surface-container-low border-none px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20">
										{#each productCategories as cat}
											<option value={cat.id}>{cat.name}</option>
										{/each}
									</select>
								</div>
								<div class="space-y-2">
									<label for="prod-price" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Price (₱)</label>
									<input id="prod-price" bind:value={prodForm.price} type="number" step="0.01" class="w-full h-14 rounded-2xl bg-surface-container-low border-none px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20" />
								</div>
							</div>
							<div class="space-y-2">
								<label for="prod-desc" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Description</label>
								<textarea id="prod-desc" bind:value={prodForm.description} class="w-full h-28 rounded-2xl bg-surface-container-low border-none p-6 text-sm font-medium focus:ring-2 focus:ring-primary/20 resize-none" placeholder="Product description..."></textarea>
							</div>
							<div class="space-y-2">
								<label for="prod-img" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Image</label>
								<div class="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-outline-variant/20 bg-surface-container-low/30">
									<span class="material-symbols-outlined text-on-surface-variant/40 text-3xl">camera_alt</span>
									<input id="prod-img" type="file" accept="image/*" onchange={(e) => prodForm.image = (e.currentTarget as HTMLInputElement).files?.[0] || null} class="flex-1 text-xs text-on-surface-variant font-bold file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
								</div>
							</div>
						{/if}
					</div>

					<footer class="p-8 border-t border-outline-variant/10 flex-shrink-0">
						<SignatureButton disabled={loading} onclick={activeTab === 'ingredients' ? handleSaveIngredient : handleSaveProduct} class="w-full h-14" size="lg">
							{loading ? 'Saving...' : (isEditing ? 'Update Item' : 'Create Item')}
						</SignatureButton>
					</footer>

				{:else if selectedItemId}
					<!-- DETAIL VIEW -->
					{@const item = activeTab === 'ingredients' ? selectedIngredient : selectedProduct}
					{#if item}
						<header class="p-8 border-b border-outline-variant/10 relative overflow-hidden flex-shrink-0">
							<div class="absolute -bottom-10 -right-10 opacity-5">
								<span class="material-symbols-outlined text-[12rem]">{activeTab === 'ingredients' ? 'grain' : 'bakery_dining'}</span>
							</div>
							<div class="relative z-10 flex items-start justify-between mb-6">
								<div class="h-28 w-28 rounded-[2rem] bg-white border-4 border-white overflow-hidden shadow-2xl">
									{#if item.image}
										<img alt={item.name} class="h-full w-full object-cover" src={pb.files.getUrl(item, item.image)} />
									{:else}
										<div class="w-full h-full flex items-center justify-center text-primary/20 font-serif font-black text-4xl uppercase">{item.name.substring(0, 2)}</div>
									{/if}
								</div>
								<div class="flex gap-2">
									<button onclick={() => startEditing(item)} class="h-11 w-11 rounded-2xl bg-white border border-outline-variant/10 flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white transition-all shadow-sm"><span class="material-symbols-outlined">edit</span></button>
									<button onclick={() => handleDelete(activeTab === 'ingredients' ? 'ingredients' : 'products', item.id)} class="h-11 w-11 rounded-2xl bg-white border border-outline-variant/10 flex items-center justify-center text-error hover:bg-error hover:text-white transition-all shadow-sm"><span class="material-symbols-outlined">delete</span></button>
									<button onclick={() => selectedItemId = null} class="h-11 w-11 rounded-2xl bg-white border border-outline-variant/10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-all shadow-sm lg:hidden"><span class="material-symbols-outlined">close</span></button>
								</div>
							</div>
							<div class="relative z-10">
								<h3 class="text-3xl font-serif font-black text-on-surface mb-2 tracking-tight">{item.name}</h3>
								<div class="flex items-center gap-3 flex-wrap">
									<span class="rounded-lg bg-tertiary-container text-on-tertiary-container px-3 py-1 text-[10px] font-black uppercase tracking-widest">
										{item.expand?.category?.name || (activeTab === 'ingredients' ? 'Supply' : 'Product')}
									</span>
									{#if activeTab === 'ingredients'}
										<span class="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">
											{item.current_stock <= item.min_stock ? '⚠ Critical Low' : '✓ Stock OK'}
										</span>
									{:else}
										<span class="text-sm font-serif font-black text-primary">₱{item.price?.toFixed(2)}</span>
									{/if}
								</div>
							</div>
						</header>

						<div class="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
							{#if activeTab === 'ingredients'}
								<section>
									<div class="flex items-end justify-between mb-3 px-1">
										<h4 class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Operational Depth</h4>
										<span class="text-xs font-black text-on-surface">{getStockProgress(item).toFixed(0)}% Capacity</span>
									</div>
									<div class="h-3 w-full overflow-hidden rounded-full bg-surface-container-low border border-outline-variant/10 p-0.5">
										<div
											class="h-full rounded-full transition-all duration-700 {item.current_stock <= item.min_stock ? 'bg-error' : 'bg-primary'}"
											style="width: {getStockProgress(item)}%"
										></div>
									</div>
									<div class="grid grid-cols-3 gap-3 mt-6">
										{#each [{ label: 'Available', val: `${item.current_stock} ${item.unit}` }, { label: 'Minimum', val: `${item.min_stock} ${item.unit}` }, { label: 'Maximum', val: `${item.max_stock} ${item.unit}` }] as stat}
											<div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10">
												<p class="text-[9px] font-black text-on-surface-variant uppercase mb-1">{stat.label}</p>
												<p class="font-serif font-black text-on-surface text-sm">{stat.val}</p>
											</div>
										{/each}
									</div>
								</section>
							{/if}

							{#if item.description}
								<section>
									<h4 class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 px-1">Notes</h4>
									<p class="text-sm font-medium text-on-surface leading-relaxed italic border-l-4 border-primary/20 pl-5 py-2 bg-primary/5 rounded-r-2xl">"{item.description}"</p>
								</section>
							{/if}

							<section>
								<div class="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10 flex items-center gap-4">
									<div class="h-11 w-11 rounded-xl bg-white border border-outline-variant/10 flex items-center justify-center text-primary shadow-sm">
										<span class="material-symbols-outlined">schedule</span>
									</div>
									<div>
										<h5 class="text-[11px] font-black text-on-surface uppercase tracking-tight">Last Updated</h5>
										<p class="text-xs text-on-surface-variant font-medium mt-0.5">{new Date(item.updated).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
									</div>
								</div>
							</section>
						</div>

						<footer class="p-8 border-t border-outline-variant/10 flex-shrink-0">
							{#if activeTab === 'ingredients'}
								<a href="/restock" class="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-black uppercase tracking-widest text-sm transition-all hover:scale-[1.02] shadow-xl shadow-primary/20 active:scale-95">
									<span class="material-symbols-outlined">local_shipping</span>
									Initiate Reorder
								</a>
							{:else}
								<button onclick={() => startEditing(item)} class="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-black uppercase tracking-widest text-sm transition-all hover:scale-[1.02] shadow-xl shadow-primary/20 active:scale-95">
									<span class="material-symbols-outlined">edit</span>
									Edit Product
								</button>
							{/if}
						</footer>
					{/if}
				{/if}
			</div>
		</aside>
	{/if}
</div>

<!-- Mobile FAB -->
<button
	onclick={startAdding}
	class="fixed bottom-8 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-2xl flex items-center justify-center transition-transform active:scale-95 z-40 lg:hidden"
>
	<span class="material-symbols-outlined">add</span>
</button>

<style>
	.no-scrollbar::-webkit-scrollbar { display: none; }
	.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
