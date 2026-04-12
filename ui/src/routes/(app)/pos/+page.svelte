<script lang="ts">
	import { onMount } from 'svelte';
	import { pb } from '$lib/pocketbase';
	import { cartState } from '$lib/state/cart.svelte';
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
	import SignatureButton from '$lib/components/artisanal/SignatureButton.svelte';

	let categories = $state<any[]>([]);
	let products = $state<any[]>([]);
	let selectedCategoryId = $state<string | null>(null);
	let searchQuery = $state('');
	let loading = $state(false);

	let showSuccess = $state(false);
	let lastOrder = $state<any>(null);
	let showCartMobile = $state(false);

	let filteredProducts = $derived(
		products.filter((p) => {
			const matchesCategory = selectedCategoryId ? p.category === selectedCategoryId : true;
			const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesCategory && matchesSearch;
		})
	);

	async function fetchData() {
		try {
			const [catList, prodList] = await Promise.all([
				pb.collection('categories').getFullList({ filter: 'type="product"' }),
				pb.collection('products').getFullList({ expand: 'category', sort: 'name' })
			]);
			categories = catList;
			products = prodList;
		} catch (error) {
			console.error('POS fetch error:', error);
		}
	}

	onMount(fetchData);

	async function handleCheckout() {
		if (cartState.items.length === 0) return;
		loading = true;
		try {
			const order = await cartState.checkout();
			if (order) {
				lastOrder = {
					id: order.id,
					total: order.total,
					items: [...cartState.items],
					date: new Date()
				};
				showSuccess = true;
			}
			await fetchData();
		} catch (error) {
			alert('Checkout failed.');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Point of Sale | TinAPPay ERP</title>
</svelte:head>

<div class="flex h-full w-full overflow-hidden bg-surface">
	<!-- Left Section: Catalog -->
	<section class="flex flex-1 flex-col overflow-hidden p-6 md:p-8 lg:p-10">
		<header class="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
			<div>
				<h2 class="font-serif text-3xl font-black tracking-tight text-on-surface">Daily Selection</h2>
				<p class="text-sm font-medium text-on-surface-variant">Station: Front Counter • Cashier: {pb.authStore.model?.name || 'Staff'}</p>
			</div>
			<div class="relative w-full md:w-80 group">
				<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary">search</span>
				<input
					bind:value={searchQuery}
					class="w-full rounded-full border-none bg-surface-container-low py-3.5 pl-12 pr-4 text-sm font-medium transition-all focus:ring-2 focus:ring-primary/20"
					placeholder="Search menu items..."
					type="text"
				/>
			</div>
		</header>

		<!-- Categories -->
		<div class="no-scrollbar mb-10 flex gap-3 overflow-x-auto pb-2">
			<button
				onclick={() => (selectedCategoryId = null)}
				class="flex items-center gap-2 whitespace-nowrap rounded-full px-6 py-2.5 text-sm font-bold transition-all {selectedCategoryId === null ? 'bg-primary text-on-primary shadow-lg' : 'bg-surface-container-highest/30 text-on-surface hover:bg-surface-container-highest'}"
			>
				<span class="material-symbols-outlined text-[20px]">grid_view</span>
				All
			</button>
			{#each categories as cat}
				<button
					onclick={() => (selectedCategoryId = cat.id)}
					class="flex items-center gap-2 whitespace-nowrap rounded-full px-6 py-2.5 text-sm font-bold transition-all {selectedCategoryId === cat.id ? 'bg-primary text-on-primary shadow-lg' : 'bg-surface-container-highest/30 text-on-surface hover:bg-surface-container-highest'}"
				>
					<span class="material-symbols-outlined text-[20px]">bakery_dining</span>
					{cat.name}
				</button>
			{/each}
		</div>

		<!-- Grid -->
		<div class="no-scrollbar flex-1 overflow-y-auto pr-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each filteredProducts as product}
				<button
					onclick={() => cartState.addItem(product)}
					class="group flex flex-col rounded-3xl bg-surface-container-lowest p-4 text-left transition-all hover:shadow-xl hover:border-primary-container/20 active:scale-95 border border-transparent"
				>
					<div class="mb-4 h-40 w-full overflow-hidden rounded-2xl bg-surface-container shadow-inner">
						{#if product.image}
							<img src={pb.files.getUrl(product, product.image)} alt={product.name} class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
						{:else}
							<div class="flex h-full w-full items-center justify-center bg-primary/5 text-primary/30 font-serif font-black text-4xl uppercase">{product.name.substring(0, 2)}</div>
						{/if}
					</div>
					<div class="flex items-start justify-between mb-1">
						<h4 class="font-serif font-black text-lg text-on-surface leading-tight line-clamp-1">{product.name}</h4>
						<span class="font-serif font-black text-primary">${product.price.toFixed(2)}</span>
					</div>
					<p class="text-[11px] font-medium text-on-surface-variant line-clamp-2">{product.description || 'Fresh baked artisanal batch.'}</p>
					
					<div class="mt-auto pt-4 flex items-center justify-between">
						<span class="rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-widest {product.stock > 5 ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-error-container text-on-error-container animate-pulse'}">
							{product.stock > 0 ? (product.stock <= 5 ? 'Low Stock' : 'In Stock') : 'Out of Stock'}
						</span>
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container/10 text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
							<span class="material-symbols-outlined text-[20px]">add</span>
						</div>
					</div>
				</button>
			{/each}
		</div>
	</section>

	<!-- Right Section: Order (always visible on lg, hidden on mobile unless toggled) -->
	<aside class="hidden lg:flex w-full flex-col bg-surface-container-low shadow-[-12px_0px_32px_rgba(47,47,44,0.04)] lg:w-[400px]">
		<div class="bg-surface-container-highest/10 p-8">
			<div class="mb-8 flex items-center justify-between">
				<h3 class="font-serif text-2xl font-black tracking-tight uppercase">Current Order</h3>
				<button onclick={() => cartState.clear()} class="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors">
					<span class="material-symbols-outlined">delete</span>
				</button>
			</div>
			<button class="flex w-full items-center justify-between rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-4 transition-all hover:bg-white group">
				<div class="flex items-center gap-3">
					<span class="material-symbols-outlined text-primary">person_add</span>
					<span class="text-sm font-black uppercase tracking-widest text-on-surface-variant group-hover:text-on-surface">Add Customer</span>
				</div>
				<span class="material-symbols-outlined text-outline-variant">chevron_right</span>
			</button>
		</div>

		<div class="no-scrollbar flex-1 space-y-6 overflow-y-auto px-8 py-6">
			{#each cartState.items as item}
				<div class="flex items-center gap-4 group">
					<div class="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-surface-container shadow-inner">
						{#if item.image}
							<img src={item.image} alt={item.name} class="h-full w-full object-cover" />
						{:else}
							<div class="flex h-full w-full items-center justify-center bg-primary/5 text-primary/30 font-black">{item.name.substring(0, 2)}</div>
						{/if}
					</div>
					<div class="flex-1">
						<div class="flex justify-between items-start mb-1">
							<span class="text-sm font-black text-on-surface leading-tight">{item.name}</span>
							<span class="font-serif font-black text-on-surface">${(item.price * item.quantity).toFixed(2)}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">x{item.quantity} @ ${item.price.toFixed(2)}</span>
							<div class="flex items-center gap-3 rounded-full bg-surface-container px-2 py-1 shadow-inner">
								<button onclick={() => cartState.removeItem(item.productId)} class="flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant hover:text-primary transition-colors"><span class="material-symbols-outlined text-sm">remove</span></button>
								<span class="w-4 text-center text-xs font-black">{item.quantity}</span>
								<button onclick={() => cartState.addItem({ id: item.productId, name: item.name, price: item.price })} class="flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant hover:text-primary transition-colors"><span class="material-symbols-outlined text-sm">add</span></button>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<div class="flex h-full flex-col items-center justify-center text-center opacity-30">
					<span class="material-symbols-outlined text-6xl mb-4">shopping_basket</span>
					<p class="text-xs font-black uppercase tracking-[0.2em]">Ready for a new batch</p>
				</div>
			{/each}
		</div>

		<!-- Footer -->
		<div class="rounded-t-[2.5rem] bg-surface-container-lowest p-8 shadow-[0px_-16px_40px_rgba(47,47,44,0.05)]">
			<div class="mb-8 space-y-3 px-2">
				<div class="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-on-surface-variant">
					<span>Subtotal</span>
					<span class="font-serif font-black text-on-surface">${cartState.totalPrice.toFixed(2)}</span>
				</div>
				<div class="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-on-surface-variant">
					<span>Tax (0%)</span>
					<span class="font-serif font-black text-on-surface">$0.00</span>
				</div>
				<div class="my-4 h-px bg-surface-container"></div>
				<div class="flex items-center justify-between">
					<span class="font-serif text-2xl font-black uppercase tracking-tight">Total</span>
					<span class="font-serif text-4xl font-black text-primary tracking-tighter">${cartState.totalPrice.toFixed(2)}</span>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<button class="flex items-center justify-center gap-2 rounded-2xl bg-surface-container-high py-4 text-sm font-black uppercase tracking-widest text-on-surface hover:bg-surface-container-highest transition-all active:scale-95 shadow-sm">
					<span class="material-symbols-outlined text-lg">save</span>
					Hold
				</button>
				<button 
					disabled={cartState.items.length === 0 || loading}
					onclick={handleCheckout}
					class="flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-serif text-lg font-black uppercase tracking-widest text-on-primary shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale"
				>
					<span class="material-symbols-outlined">payments</span>
					Pay
				</button>
			</div>
		</div>
	</aside>

    <!-- Success Modal -->
    {#if showSuccess}
        <div class="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <ArtisanalCard class="max-w-md w-full p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div class="bg-primary p-10 text-center relative overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <div class="relative z-10">
                        <div class="h-20 w-20 rounded-[2rem] bg-white/20 border-4 border-white/20 flex items-center justify-center mx-auto mb-6 shadow-xl">
                            <span class="material-symbols-outlined text-white text-4xl" style="font-variation-settings: 'wght' 700;">check_circle</span>
                        </div>
                        <h3 class="text-3xl font-black text-white uppercase tracking-tighter leading-tight font-serif">Batch Finalized</h3>
                        <p class="text-xs font-bold text-white/80 uppercase tracking-[0.3em] mt-2">Order #{(lastOrder?.id || '').substring(0, 8)}</p>
                    </div>
                </div>
                
                <div class="p-8 bg-[radial-gradient(#dfddd8_1px,transparent_1px)] [background-size:20px_20px] bg-white">
                    <div class="space-y-4 mb-8">
                        {#each lastOrder?.items || [] as item}
                            <div class="flex justify-between items-center">
                                <span class="text-sm font-black text-on-surface">{item.name} <span class="text-on-surface-variant font-medium ml-1">x{item.quantity}</span></span>
                                <span class="font-serif font-black">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        {/each}
                    </div>
                    <div class="border-t-2 border-dashed border-surface-container pt-6 flex justify-between items-center">
                        <span class="text-lg font-black uppercase tracking-tight">Total Paid</span>
                        <span class="text-3xl font-serif font-black text-primary tracking-tighter">${lastOrder?.total.toFixed(2)}</span>
                    </div>
                </div>

                <footer class="p-8 bg-surface-container-low flex flex-col gap-3">
                    <SignatureButton size="lg" onclick={() => { showSuccess = false; lastOrder = null; }} class="w-full">
                        Next Batch
                    </SignatureButton>
                    <button class="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant hover:text-primary transition-colors">Print Receipt</button>
                </footer>
            </ArtisanalCard>
        </div>
    {/if}
</div>

<!-- Mobile Cart FAB (only on small screens) -->
{#if !showCartMobile}
	<button
		onclick={() => showCartMobile = true}
		class="fixed bottom-8 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-2xl transition-all active:scale-95 lg:hidden"
	>
		<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">shopping_cart</span>
		{#if cartState.items.length > 0}
			<span class="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-error text-on-error text-[10px] font-black">{cartState.items.length}</span>
		{/if}
	</button>
{/if}

<!-- Mobile Cart Bottom Sheet -->
{#if showCartMobile}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div onclick={() => showCartMobile = false} class="fixed inset-0 z-40 bg-on-surface/30 backdrop-blur-sm lg:hidden"></div>
	<div class="fixed bottom-0 left-0 right-0 z-50 flex max-h-[85dvh] flex-col rounded-t-[2rem] bg-surface-container-low shadow-2xl lg:hidden">
		<div class="flex items-center justify-between px-8 py-5 border-b border-outline-variant/10">
			<h3 class="font-serif text-xl font-black tracking-tight uppercase">Current Order</h3>
			<div class="flex items-center gap-3">
				<button onclick={() => cartState.clear()} class="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors">
					<span class="material-symbols-outlined text-lg">delete</span>
				</button>
				<button onclick={() => showCartMobile = false} class="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-container-high transition-colors">
					<span class="material-symbols-outlined">keyboard_arrow_down</span>
				</button>
			</div>
		</div>
		<div class="no-scrollbar flex-1 overflow-y-auto space-y-4 px-8 py-5">
			{#each cartState.items as item}
				<div class="flex items-center gap-4">
					<div class="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-surface-container">
						{#if item.image}
							<img src={item.image} alt={item.name} class="h-full w-full object-cover" />
						{:else}
							<div class="flex h-full w-full items-center justify-center bg-primary/5 text-primary/30 font-black">{item.name.substring(0, 2)}</div>
						{/if}
					</div>
					<div class="flex-1">
						<div class="flex justify-between items-start mb-1">
							<span class="text-sm font-black text-on-surface">{item.name}</span>
							<span class="font-serif font-black">${(item.price * item.quantity).toFixed(2)}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-[10px] font-bold text-on-surface-variant">x{item.quantity} @ ${item.price.toFixed(2)}</span>
							<div class="flex items-center gap-2 rounded-full bg-surface-container px-2 py-1">
								<button onclick={() => cartState.removeItem(item.productId)} class="flex h-6 w-6 items-center justify-center text-on-surface-variant hover:text-primary"><span class="material-symbols-outlined text-sm">remove</span></button>
								<span class="w-4 text-center text-xs font-black">{item.quantity}</span>
								<button onclick={() => cartState.addItem({ id: item.productId, name: item.name, price: item.price })} class="flex h-6 w-6 items-center justify-center text-on-surface-variant hover:text-primary"><span class="material-symbols-outlined text-sm">add</span></button>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<div class="py-10 text-center opacity-40">
					<span class="material-symbols-outlined text-5xl block mb-3">shopping_basket</span>
					<p class="text-xs font-black uppercase tracking-widest">Cart is empty</p>
				</div>
			{/each}
		</div>
		<div class="rounded-t-[2rem] bg-surface-container-lowest p-6 shadow-[0px_-16px_40px_rgba(47,47,44,0.05)]">
			<div class="flex justify-between items-center mb-4">
				<span class="font-serif text-xl font-black uppercase">Total</span>
				<span class="font-serif text-3xl font-black text-primary">${cartState.totalPrice.toFixed(2)}</span>
			</div>
			<button
				disabled={cartState.items.length === 0 || loading}
				onclick={handleCheckout}
				class="w-full flex items-center justify-center gap-3 rounded-2xl bg-primary py-4 font-serif text-lg font-black uppercase tracking-widest text-on-primary shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
			>
				<span class="material-symbols-outlined">payments</span>
				Pay Now
			</button>
		</div>
	</div>
{/if}

<style>
	.no-scrollbar::-webkit-scrollbar { display: none; }
	.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>

