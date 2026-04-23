<script lang="ts">
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
	import SignatureButton from '$lib/components/artisanal/SignatureButton.svelte';
	import { pb, fileUrl } from '$lib/pocketbase';
	import { cartState } from '$lib/states/cart.svelte';
	import { posState } from '$lib/states/pos.svelte';
	import { settingsState } from '$lib/states/settings.svelte';
	import { toastState } from '$lib/states/toast.svelte';
	import { onMount, tick } from 'svelte';

	import type { CartItem } from '$lib/states/cart.svelte';

	interface HeldOrder {
		id: string;
		items: CartItem[];
		total: number;
		time: Date;
	}

	const HELD_KEY = 'tinappay_held_orders';

	function saveHeld(orders: HeldOrder[]) {
		localStorage.setItem(
			HELD_KEY,
			JSON.stringify(orders.map((o) => ({ ...o, time: o.time.toISOString() })))
		);
	}

	function loadHeld(): HeldOrder[] {
		try {
			const raw = localStorage.getItem(HELD_KEY);
			if (!raw) return [];
			return JSON.parse(raw).map((o: any) => ({ ...o, time: new Date(o.time) }));
		} catch {
			return [];
		}
	}

	function heldQtyFor(productId: string): number {
		return heldOrders.reduce(
			(sum, o) => sum + (o.items.find((i) => i.productId === productId)?.quantity ?? 0),
			0
		);
	}

	type PayMethod = 'cash' | 'gcash' | 'maya' | 'card';

	const PAY_METHODS: { id: PayMethod; label: string; icon: string; implemented: boolean }[] = [
		{ id: 'cash', label: 'Cash', icon: 'payments', implemented: true },
		{ id: 'gcash', label: 'GCash', icon: 'account_balance_wallet', implemented: false },
		{ id: 'maya', label: 'Maya', icon: 'smartphone', implemented: false },
		{ id: 'card', label: 'Card', icon: 'credit_card', implemented: false }
	];

	let selectedCategoryId = $state<string | null>(null);
	let searchQuery = $state('');
	let showPayment = $state(false);
	let showSuccess = $state(false);
	let lastOrder = $state<any>(null);
	let showCartMobile = $state(false);
	let showHeldOrders = $state(false);
	let searchInputEl = $state<HTMLInputElement | null>(null);
	let heldOrders = $state<HeldOrder[]>([]);
	let editingQtyId = $state<string | null>(null);
	let editingQtyValue = $state('');
	let paymentMethod = $state<PayMethod>('cash');
	let cashTendered = $state('');
	let customerName = $state('');

	let cashTenderedNum = $derived(parseFloat(cashTendered) || 0);
	let changeAmount = $derived(cashTenderedNum - cartState.totalPrice);
	let canProceed = $derived(
		cartState.items.length > 0 &&
			!posState.loading &&
			(paymentMethod !== 'cash' || cashTenderedNum >= cartState.totalPrice)
	);

	let cashPresets = $derived(() => {
		const t = cartState.totalPrice;
		return [0, 20, 50, 100, 200, 500, 1000].filter((b) => b === 0 || b >= t);
	});

	let cartQtyMap = $derived(
		Object.fromEntries(cartState.items.map((i) => [i.productId, i.quantity]))
	);

	let heldQtyMap = $derived(
		heldOrders.reduce<Record<string, number>>((acc, o) => {
			for (const item of o.items) acc[item.productId] = (acc[item.productId] ?? 0) + item.quantity;
			return acc;
		}, {})
	);

	let filteredProducts = $derived(
		posState.products
			.filter((p) => {
				const matchesCategory = selectedCategoryId ? p.category === selectedCategoryId : true;
				const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
				return matchesCategory && matchesSearch;
			})
			.map((p) => ({
				...p,
				displayStock: p.branch_stock - (cartQtyMap[p.id] ?? 0) - (heldQtyMap[p.id] ?? 0)
			}))
	);

	onMount(() => {
		(async () => {
			await Promise.all([posState.load(), settingsState.load()]);
			heldOrders = loadHeld();
		})();

		function onKeyDown(e: KeyboardEvent) {
			if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
				const target = e.target as HTMLElement | null;
				if (!target?.closest('input, textarea, select, [contenteditable="true"]')) {
					e.preventDefault();
					searchInputEl?.focus();
				}
			}
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	});

	function addToCart(product: any) {
		const inCart = cartQtyMap[product.id] ?? 0;
		const available = product.branch_stock - (heldQtyMap[product.id] ?? 0);
		if (available <= 0) {
			toastState.error(`${product.name} is out of stock.`);
			return;
		}
		if (inCart >= available) {
			toastState.error(`Only ${available} available for ${product.name}.`);
			return;
		}
		cartState.addItem(product);
	}

	function incrementCartItem(
		productId: string,
		name: string,
		price: number,
		image?: string,
		description?: string
	) {
		const product = posState.products.find((p) => p.id === productId);
		addToCart(
			product ?? {
				id: productId,
				name,
				price,
				image,
				description,
				branch_stock: Infinity,
				barcode: undefined
			}
		);
	}

	function startEditQty(productId: string, currentQty: number) {
		editingQtyId = productId;
		editingQtyValue = String(currentQty);
	}

	function commitQty(productId: string, name: string) {
		const qty = parseInt(editingQtyValue, 10);
		if (isNaN(qty) || qty <= 0) {
			cartState.removeAllItem(productId);
		} else {
			const product = posState.products.find((p) => p.id === productId);
			const available = (product?.branch_stock ?? Infinity) - (heldQtyMap[productId] ?? 0);
			if (qty > available) {
				toastState.error(`Only ${available} available for ${name}.`);
				cartState.setQuantity(productId, available);
			} else {
				cartState.setQuantity(productId, qty);
			}
		}
		editingQtyId = null;
		editingQtyValue = '';
	}

	let showScanner = $state(false);
	const scannerSupported =
		typeof window !== 'undefined' &&
		'BarcodeDetector' in window &&
		!!navigator.mediaDevices?.getUserMedia;
	let videoEl = $state<HTMLVideoElement | null>(null);
	let scanStream: MediaStream | null = null;
	let scanRafId: number | null = null;

	function handleBarcodeFab() {
		if (scannerSupported) {
			openScanner();
		} else {
			searchInputEl?.focus();
			searchInputEl?.select();
		}
	}

	async function openScanner() {
		try {
			scanStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment' }
			});
		} catch {
			try {
				// fallback: any camera
				scanStream = await navigator.mediaDevices.getUserMedia({ video: true });
			} catch (err: any) {
				console.error('Camera error:', err?.name, err?.message);
				toastState.error(`Camera error: ${err?.name ?? 'Unknown'}. Use search instead.`);
				searchInputEl?.focus();
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
		async function tick() {
			if (!showScanner || !videoEl) return;
			try {
				const codes = await detector.detect(videoEl);
				if (codes.length > 0) {
					onBarcodeDetected(codes[0].rawValue);
					return;
				}
			} catch {}
			scanRafId = requestAnimationFrame(tick);
		}
		scanRafId = requestAnimationFrame(tick);
	}

	function closeScanner() {
		if (scanRafId !== null) {
			cancelAnimationFrame(scanRafId);
			scanRafId = null;
		}
		scanStream?.getTracks().forEach((t) => t.stop());
		scanStream = null;
		showScanner = false;
	}

	function onBarcodeDetected(code: string) {
		closeScanner();
		const match = posState.products.find((p) => p.barcode === code);
		if (match) {
			addToCart(match);
			toastState.success(`Added: ${match.name}`);
		} else {
			searchQuery = code;
			toastState.info(`Barcode scanned — no product matched.`);
		}
	}

	function handleHold() {
		if (cartState.items.length === 0) return;
		const held: HeldOrder = {
			id: Date.now().toString(),
			items: [...cartState.items],
			total: cartState.totalPrice,
			time: new Date()
		};
		heldOrders = [...heldOrders, held];
		saveHeld(heldOrders);
		cartState.clear();
		toastState.success('Order held. Cart cleared.');
	}

	function restoreHeld(order: HeldOrder) {
		if (cartState.items.length > 0) {
			toastState.error('Clear the current cart first before restoring a held order.');
			return;
		}
		// Stock is already reserved — restore directly to cart without re-checking
		for (const item of order.items) {
			cartState.addItem({
				id: item.productId,
				name: item.name,
				price: item.price,
				image: item.image,
				description: item.description
			});
			if (item.quantity > 1) cartState.setQuantity(item.productId, item.quantity);
		}
		heldOrders = heldOrders.filter((h) => h.id !== order.id);
		saveHeld(heldOrders);
		showHeldOrders = false;
		toastState.success('Held order restored.');
	}

	function discardHeld(id: string) {
		heldOrders = heldOrders.filter((h) => h.id !== id);
		saveHeld(heldOrders);
		if (heldOrders.length === 0) showHeldOrders = false;
	}

	function handlePayClick() {
		if (cartState.items.length === 0) return;
		showPayment = true;
		showCartMobile = false;
	}

	async function handleCheckout() {
		if (cartState.items.length === 0) return;
		// Capture before checkout clears the cart
		const capturedItems = cartState.items.map((i) => ({ ...i }));
		const capturedTotal = cartState.totalPrice;
		try {
			const order = await cartState.checkout();
			if (order) {
				lastOrder = {
					id: order.id,
					total: capturedTotal,
					items: capturedItems,
					date: new Date(),
					customerName: customerName.trim() || 'Walk-in Customer',
					paymentMethod,
					cashTendered: paymentMethod === 'cash' ? cashTenderedNum : undefined,
					change: paymentMethod === 'cash' ? Math.max(0, changeAmount) : undefined
				};
				showPayment = false;
				showSuccess = true;
				setTimeout(() => {
					showSuccess = false;
				}, 8000);
				customerName = '';
				paymentMethod = 'cash';
				cashTendered = '';
			}
			await posState.load();
		} catch {
			toastState.error('Checkout failed. Please try again.');
		}
	}

	async function printReceipt() {
		if (!lastOrder) return;
		const { jsPDF } = await import('jspdf');

		const bakery = settingsState.bakery;
		const branch = posState.currentBranch?.name || '';
		const cashier = pb.authStore.record?.name || 'Staff';

		const pageW = 80;
		const margin = 5;
		const contentW = pageW - margin * 2;

		// First pass: measure total height
		// Second pass: render into correctly-sized doc
		function render(doc: InstanceType<typeof jsPDF>) {
			let y = margin + 4;

			function text(str: string, size: number, align: 'left' | 'center' | 'right', bold = false) {
				doc.setFontSize(size);
				doc.setFont('courier', bold ? 'bold' : 'normal');
				const x = align === 'center' ? pageW / 2 : align === 'right' ? pageW - margin : margin;
				const lines = doc.splitTextToSize(str, contentW);
				doc.text(lines, x, y, { align });
				y += lines.length * size * 0.38;
			}

			function gap(mm = 1) {
				y += mm;
			}

			function rule() {
				gap(2);
				doc.setLineDashPattern([0.8, 0.8], 0);
				doc.setLineWidth(0.15);
				doc.line(margin, y, pageW - margin, y);
				gap(5);
			}

			function row(left: string, right: string, size = 8, bold = false) {
				doc.setFontSize(size);
				doc.setFont('courier', bold ? 'bold' : 'normal');
				doc.text(left, margin, y);
				doc.text(right, pageW - margin, y, { align: 'right' });
				y += size * 0.38;
			}

			// Header
			text(bakery.name || 'Bakery', 11, 'center', true);
			if (branch) {
				gap(0.5);
				text(branch, 8, 'center');
			}
			if (bakery.address) {
				gap(0.5);
				text(bakery.address, 7, 'center');
			}
			if (bakery.phone) {
				gap(0.5);
				text(bakery.phone, 7, 'center');
			}
			gap(1.5);
			text(lastOrder.date?.toLocaleString(), 7, 'center');
			gap(0.5);
			text(`Order #${lastOrder.id.substring(0, 8).toUpperCase()}`, 7, 'center');

			rule();

			row('Customer', lastOrder.customerName);
			gap(0.5);
			row('Cashier', cashier);
			gap(0.5);
			row('Payment', lastOrder.paymentMethod.toUpperCase());

			rule();

			for (const item of lastOrder.items as CartItem[]) {
				const label = `x${item.quantity}  ${item.name}`;
				const price = `P${(item.price * item.quantity).toFixed(2)}`;
				const nameLines = doc.splitTextToSize(label, contentW - 16);
				doc.setFontSize(8);
				doc.setFont('courier', 'normal');
				doc.text(nameLines, margin, y);
				doc.text(price, pageW - margin, y, { align: 'right' });
				y += nameLines.length * 3.2;
			}

			rule();

			row('TOTAL', `P${lastOrder.total.toFixed(2)}`, 11, true);
			if (lastOrder.cashTendered !== undefined) {
				gap(1);
				row('Cash', `P${lastOrder.cashTendered.toFixed(2)}`);
				gap(0.5);
				row('Change', `P${lastOrder.change.toFixed(2)}`);
			}

			rule();

			text(bakery.receipt_footer || 'Thank you! Come back soon.', 7, 'center');
			gap(4);

			return y;
		}

		// Measure height
		const measure = new jsPDF({ unit: 'mm', format: [pageW, 400] });
		const contentHeight = render(measure);

		// Render into correctly-sized doc (add 10mm buffer — jsPDF clips at exact boundary)
		const doc = new jsPDF({ unit: 'mm', format: [pageW, contentHeight + 10] });
		render(doc);

		doc.autoPrint();
		const blob = doc.output('blob');
		const url = URL.createObjectURL(blob);
		const win = window.open(url, '_blank');
		if (!win) {
			toastState.error('Allow popups to print the receipt.');
		} else {
			setTimeout(() => URL.revokeObjectURL(url), 10000);
		}
	}
</script>

<svelte:head>
	<title>Sales Terminal | tinAPPay ERP</title>
</svelte:head>

<div class="flex h-full w-full flex-col overflow-hidden bg-background lg:flex-row">
	<!-- Left: Catalog -->
	<section class="@container flex flex-1 flex-col overflow-hidden p-6 md:p-8">
		<header class="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
			<div>
				<h2 class="font-serif text-3xl font-black tracking-tight text-on-surface">
					Daily Selection
				</h2>
				<p class="text-sm font-medium text-on-surface-variant">
					{posState.currentBranch ? posState.currentBranch.name : 'Main Station'} · {pb.authStore
						.record?.name || 'Staff'}
				</p>
			</div>
			<div class="flex w-full items-center gap-2 md:w-auto">
				<div class="group relative flex-1 md:w-80">
					<span
						class="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary"
						>search</span
					>
					<input
						bind:value={searchQuery}
						bind:this={searchInputEl}
						class="w-full rounded-full border-none bg-surface-container-low py-3.5 pr-4 pl-12 text-sm font-medium shadow-inner transition-all focus:ring-2 focus:ring-primary/20"
						placeholder="Search or press /"
						type="text"
					/>
					{#if searchQuery}
						<button
							onclick={() => (searchQuery = '')}
							class="absolute top-1/2 right-4 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
						>
							<span class="material-symbols-outlined text-sm">close</span>
						</button>
					{/if}
				</div>
				{#if scannerSupported}
					<button
						onclick={handleBarcodeFab}
						class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-all hover:bg-primary hover:text-on-primary active:scale-90"
						title="Scan barcode"
					>
						<span class="material-symbols-outlined">barcode_scanner</span>
					</button>
				{/if}
			</div>
		</header>

		<!-- Categories -->
		<div class="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
			<button
				onclick={() => (selectedCategoryId = null)}
				class="flex shrink-0 items-center gap-2 rounded-full px-5 py-2 text-sm font-bold whitespace-nowrap transition-all {selectedCategoryId ===
				null
					? 'bg-primary text-on-primary shadow-lg'
					: 'bg-surface-container-highest/30 text-on-surface hover:bg-surface-container-highest'}"
			>
				<span class="material-symbols-outlined text-[18px]">grid_view</span>
				All
			</button>
			{#each posState.categories as cat}
				<button
					onclick={() => (selectedCategoryId = cat.id)}
					class="flex shrink-0 items-center gap-2 rounded-full px-5 py-2 text-sm font-bold whitespace-nowrap transition-all {selectedCategoryId ===
					cat.id
						? 'bg-primary text-on-primary shadow-lg'
						: 'bg-surface-container-highest/30 text-on-surface hover:bg-surface-container-highest'}"
				>
					<span class="material-symbols-outlined text-[18px]">bakery_dining</span>
					{cat.name}
				</button>
			{/each}
		</div>

		<!-- Product Grid -->
		<div class="no-scrollbar flex-1 overflow-y-auto">
			{#if posState.loading}
				<!-- Skeleton -->
				<div class="grid gap-4 @xs:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
					{#each Array(8) as _}
						<div class="animate-pulse rounded-3xl bg-surface-container-lowest p-4">
							<div class="mb-4 h-40 w-full rounded-2xl bg-surface-container"></div>
							<div class="mb-2 h-4 w-3/4 rounded-lg bg-surface-container"></div>
							<div class="h-3 w-1/2 rounded-lg bg-surface-container"></div>
						</div>
					{/each}
				</div>
			{:else if filteredProducts.length === 0}
				<!-- Empty State -->
				<div class="flex h-full flex-col items-center justify-center text-center opacity-40">
					<span class="material-symbols-outlined mb-4 text-6xl">search_off</span>
					<p class="font-serif text-xl font-black text-on-surface">No items found</p>
					<p class="mt-1 text-sm font-medium text-on-surface-variant">
						{searchQuery ? `No results for "${searchQuery}"` : 'No products in this category'}
					</p>
					{#if searchQuery}
						<button
							onclick={() => (searchQuery = '')}
							class="mt-4 rounded-full bg-primary/10 px-5 py-2 text-sm font-bold text-primary transition-all hover:bg-primary/20"
						>
							Clear search
						</button>
					{/if}
				</div>
			{:else}
				<div class="grid gap-4 pr-1 @xs:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
					{#each filteredProducts as product (product.id)}
						<button
							onclick={() => addToCart(product)}
							disabled={product.displayStock <= 0}
							class="group flex h-max flex-col rounded-3xl border border-transparent bg-surface-container-lowest p-4 text-left transition-all hover:border-primary/10 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
						>
							<div
								class="relative mb-4 h-40 w-full overflow-hidden rounded-2xl bg-surface-container shadow-inner"
							>
								{#if product.image || (product.images && product.images[0])}
									<img
										src={fileUrl(product, product.image || product.images[0])}
										alt={product.name}
										class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
									/>
								{:else}
									<div
										class="flex h-full w-full items-center justify-center bg-primary/5 font-serif text-4xl font-black text-primary/30 uppercase"
									>
										{product.name.substring(0, 2)}
									</div>
								{/if}
								{#if product.displayStock <= 0}
									<div
										class="absolute inset-0 flex items-center justify-center rounded-2xl bg-on-surface/40 backdrop-blur-sm"
									>
										<span class="text-xs font-black tracking-widest text-white uppercase"
											>{product.branch_stock === 0 ? 'Depleted' : 'In Cart'}</span
										>
									</div>
								{:else if product.displayStock <= 5}
									<div
										class="absolute top-2 right-2 animate-pulse rounded-lg bg-error px-2 py-1 text-[9px] font-black tracking-widest text-white uppercase shadow-lg"
									>
										Low Stock
									</div>
								{/if}
							</div>
							<div class="mb-1 flex items-start justify-between gap-2">
								<h4
									class="line-clamp-1 font-serif text-base leading-tight font-black text-on-surface"
								>
									{product.name}
								</h4>
								<span class="shrink-0 font-serif font-black text-primary"
									>₱{product.price.toFixed(2)}</span
								>
							</div>
							<p class="line-clamp-2 text-[11px] font-medium text-on-surface-variant">
								{product.description || 'Fresh baked artisanal batch.'}
							</p>
							<div class="mt-auto flex items-center justify-between pt-3">
								<span
									class="rounded px-2 py-0.5 text-[9px] font-black tracking-widest uppercase {product.displayStock >
									5
										? 'bg-tertiary-container text-on-tertiary-container'
										: product.displayStock > 0
											? 'bg-error-container text-on-error-container'
											: 'bg-surface-container text-on-surface-variant'}"
								>
									{product.displayStock > 0 ? `${product.displayStock} left` : 'Depleted'}
								</span>
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container/10 text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary"
								>
									<span class="material-symbols-outlined text-[20px]">add</span>
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</section>

	<!-- Right: Cart -->
	<aside
		class="hidden w-full flex-col border-l border-outline-variant/10 bg-surface-container-low shadow-[-12px_0px_32px_rgba(47,47,44,0.04)] lg:flex lg:w-[380px]"
	>
		<div class="bg-surface-container-highest/10 p-6">
			<div class="mb-5 flex items-center justify-between">
				<h3 class="font-serif text-2xl font-black tracking-tight uppercase">Current Order</h3>
				<div class="flex items-center gap-2">
					<!-- Held Orders Badge -->
					{#if heldOrders.length > 0}
						<button
							onclick={() => (showHeldOrders = !showHeldOrders)}
							class="relative flex h-9 items-center gap-1.5 rounded-full bg-primary/10 px-3 text-[10px] font-black tracking-widest text-primary uppercase transition-all hover:bg-primary/20"
						>
							<span class="material-symbols-outlined text-sm">pause_circle</span>
							Held ({heldOrders.length})
						</button>
					{/if}
					<button
						onclick={() => cartState.clear()}
						class="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container active:scale-90"
					>
						<span class="material-symbols-outlined text-sm">delete</span>
					</button>
				</div>
			</div>

			<!-- Held Orders Panel -->
			{#if showHeldOrders && heldOrders.length > 0}
				<div
					class="mb-4 space-y-2 rounded-2xl border border-primary/10 bg-surface-container-lowest p-3"
				>
					{#each heldOrders as held}
						<div class="flex items-center justify-between rounded-xl bg-surface-container p-3">
							<div>
								<p class="text-xs font-black text-on-surface">
									{held.items.length} items · ₱{held.total.toFixed(2)}
								</p>
								<p class="text-[9px] font-bold text-on-surface-variant">
									{held.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</p>
							</div>
							<div class="flex gap-1">
								<button
									onclick={() => restoreHeld(held)}
									class="rounded-lg bg-primary px-3 py-1.5 text-[9px] font-black tracking-widest text-white uppercase hover:opacity-90"
									>Restore</button
								>
								<button
									onclick={() => discardHeld(held.id)}
									class="flex h-7 w-7 items-center justify-center rounded-lg bg-error/10 text-error transition-colors hover:bg-error hover:text-white"
								>
									<span class="material-symbols-outlined text-sm">close</span>
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Cart Items -->
		<div class="no-scrollbar flex-1 space-y-4 overflow-y-auto px-6 py-4">
			{#each cartState.items as item}
				<div class="group flex items-center gap-3">
					<div
						class="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-container shadow-inner"
					>
						{#if item.image}
							<img src={item.image} alt={item.name} class="h-full w-full object-cover" />
						{:else}
							<div
								class="flex h-full w-full items-center justify-center bg-primary/5 text-sm font-black text-primary/30 uppercase"
							>
								{item.name.substring(0, 2)}
							</div>
						{/if}
					</div>
					<div class="min-w-0 flex-1">
						<div class="mb-1.5 flex items-start justify-between gap-2">
							<span class="truncate text-sm leading-tight font-black text-on-surface"
								>{item.name}</span
							>
							<span class="shrink-0 font-serif font-black text-on-surface"
								>₱{(item.price * item.quantity).toFixed(2)}</span
							>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-[10px] font-bold text-on-surface-variant"
								>₱{item.price.toFixed(2)} each</span
							>
							<div
								class="flex items-center gap-0.5 rounded-full bg-surface-container px-1 py-0.5 shadow-inner"
							>
								<button
									onclick={() => cartState.removeItem(item.productId)}
									class="flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:text-primary"
									><span class="material-symbols-outlined text-sm">remove</span></button
								>
								{#if editingQtyId === item.productId}
									<!-- svelte-ignore a11y_autofocus -->
									<input
										type="number"
										min="0"
										class="w-8 border-none bg-transparent text-center text-xs font-black text-on-surface focus:ring-0 focus:outline-none"
										bind:value={editingQtyValue}
										onblur={() => commitQty(item.productId, item.name)}
										onkeydown={(e) => {
											if (e.key === 'Enter') commitQty(item.productId, item.name);
											if (e.key === 'Escape') {
												editingQtyId = null;
											}
										}}
										autofocus
									/>
								{:else}
									<button
										onclick={() => startEditQty(item.productId, item.quantity)}
										class="w-6 text-center text-xs font-black text-on-surface hover:text-primary"
										title="Tap to set quantity">{item.quantity}</button
									>
								{/if}
								<button
									onclick={() =>
										incrementCartItem(
											item.productId,
											item.name,
											item.price,
											item.image,
											item.description
										)}
									class="flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:text-primary"
									><span class="material-symbols-outlined text-sm">add</span></button
								>
								<div class="mx-0.5 h-4 w-px bg-outline-variant/20"></div>
								<button
									onclick={() => cartState.removeAllItem(item.productId)}
									class="flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant/50 transition-colors hover:bg-error-container hover:text-on-error-container"
									><span class="material-symbols-outlined text-sm">close</span></button
								>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<div class="flex h-full flex-col items-center justify-center py-12 text-center opacity-30">
					<span class="material-symbols-outlined mb-3 text-5xl">shopping_basket</span>
					<p class="text-[10px] font-black uppercase tracking-[0.2em]">Ready for a new batch</p>
				</div>
			{/each}
		</div>

		<!-- Footer -->
		<div
			class="rounded-t-[2.5rem] border-t border-outline-variant/10 bg-surface-container-lowest p-6 shadow-[0px_-16px_40px_rgba(47,47,44,0.05)]"
		>
			<div class="mb-6 space-y-2.5 px-1">
				<div
					class="flex items-center justify-between text-xs font-bold tracking-widest text-on-surface-variant uppercase"
				>
					<span>Subtotal</span>
					<span class="font-serif font-black text-on-surface"
						>₱{cartState.totalPrice.toFixed(2)}</span
					>
				</div>
				<div
					class="flex items-center justify-between text-xs font-bold tracking-widest text-on-surface-variant uppercase"
				>
					<span>Tax (0%)</span>
					<span class="font-serif font-black text-on-surface">₱0.00</span>
				</div>
				<div class="my-3 h-px bg-surface-container"></div>
				<div class="flex items-center justify-between">
					<span class="font-serif text-xl font-black tracking-tight uppercase">Total Due</span>
					<span class="font-serif text-3xl font-black tracking-tighter text-primary"
						>₱{cartState.totalPrice.toFixed(2)}</span
					>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<button
					onclick={handleHold}
					disabled={cartState.items.length === 0}
					class="flex items-center justify-center gap-2 rounded-2xl bg-surface-container-high py-3.5 text-[10px] font-black tracking-widest text-on-surface uppercase shadow-sm transition-all hover:bg-surface-container-highest active:scale-95 disabled:opacity-40"
				>
					<span class="material-symbols-outlined text-lg">pause_circle</span>
					Hold
				</button>
				<button
					disabled={cartState.items.length === 0 || posState.loading}
					onclick={handlePayClick}
					class="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-serif text-lg font-black tracking-widest text-on-primary uppercase shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale"
				>
					<span class="material-symbols-outlined">payments</span>
					Pay
				</button>
			</div>
		</div>
	</aside>

	<!-- Mobile Cart FAB — only visible when cart has items -->
	{#if !showCartMobile && !showSuccess && (cartState.totalQuantity > 0 || heldOrders.length > 0)}
		<button
			onclick={() => (showCartMobile = true)}
			class="fixed right-6 bottom-8 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-on-primary shadow-2xl transition-all active:scale-90 lg:hidden"
		>
			<span class="material-symbols-outlined text-2xl"
				>{cartState.totalQuantity > 0 ? 'shopping_cart' : 'pause_circle'}</span
			>
			<div
				class="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface text-[10px] font-black text-white {cartState.totalQuantity >
				0
					? 'bg-error'
					: 'bg-primary'}"
			>
				{cartState.totalQuantity > 0 ? cartState.totalQuantity : heldOrders.length}
			</div>
		</button>
	{/if}

	<!-- Mobile Cart Sheet -->
	{#if showCartMobile}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-50 animate-in bg-on-surface/40 backdrop-blur-sm fade-in lg:hidden"
			onclick={() => (showCartMobile = false)}
		>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="absolute bottom-0 w-full animate-in rounded-t-[2.5rem] bg-surface p-6 shadow-2xl slide-in-from-bottom"
				onclick={(e) => e.stopPropagation()}
			>
				<div class="flex w-full justify-center pb-4">
					<div class="h-1.5 w-12 rounded-full bg-surface-container-high"></div>
				</div>
				<div class="mb-4 flex items-center justify-between">
					<h3 class="font-serif text-xl font-black tracking-tight uppercase">
						Basket <span class="ml-1 text-primary">({cartState.totalQuantity})</span>
					</h3>
					<div class="flex items-center gap-2">
						{#if heldOrders.length > 0}
							<button
								onclick={() => (showHeldOrders = !showHeldOrders)}
								class="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-black tracking-widest text-primary uppercase transition-all hover:bg-primary/20"
							>
								<span class="material-symbols-outlined text-sm">pause_circle</span>
								{heldOrders.length}
							</button>
						{/if}
						<button
							onclick={handleHold}
							disabled={cartState.items.length === 0}
							class="rounded-full bg-surface-container-low px-3 py-1.5 text-[10px] font-black tracking-widest text-on-surface-variant uppercase hover:bg-surface-container disabled:opacity-40"
							>Hold</button
						>
						<button
							onclick={() => {
								cartState.clear();
								showCartMobile = false;
							}}
							disabled={cartState.items.length === 0}
							class="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container disabled:opacity-40"
						>
							<span class="material-symbols-outlined text-sm">delete</span>
						</button>
						<button
							onclick={() => (showCartMobile = false)}
							class="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-low"
						>
							<span class="material-symbols-outlined text-sm">close</span>
						</button>
					</div>
				</div>

				{#if showHeldOrders && heldOrders.length > 0}
					<div
						class="mb-4 space-y-2 rounded-2xl border border-primary/10 bg-surface-container-lowest p-3"
					>
						{#each heldOrders as held}
							<div class="flex items-center justify-between rounded-xl bg-surface-container p-3">
								<div>
									<p class="text-xs font-black text-on-surface">
										{held.items.length} items · ₱{held.total.toFixed(2)}
									</p>
									<p class="text-[9px] font-bold text-on-surface-variant">
										{held.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
									</p>
								</div>
								<div class="flex gap-1">
									<button
										onclick={() => restoreHeld(held)}
										class="rounded-lg bg-primary px-3 py-1.5 text-[9px] font-black tracking-widest text-white uppercase hover:opacity-90"
										>Restore</button
									>
									<button
										onclick={() => discardHeld(held.id)}
										class="flex h-7 w-7 items-center justify-center rounded-lg bg-error/10 text-error transition-colors hover:bg-error hover:text-white"
									>
										<span class="material-symbols-outlined text-sm">close</span>
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<div class="no-scrollbar mb-6 max-h-[40vh] space-y-4 overflow-y-auto px-1">
					{#each cartState.items as item}
						<div class="flex items-center justify-between gap-4">
							<div class="flex min-w-0 items-center gap-3">
								<div
									class="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface-container shadow-inner"
								>
									{#if item.image}
										<img src={item.image} alt="" class="h-full w-full object-cover" />
									{:else}
										<div
											class="flex h-full w-full items-center justify-center text-xs font-black text-on-surface-variant/30 uppercase"
										>
											{item.name.substring(0, 2)}
										</div>
									{/if}
								</div>
								<div class="min-w-0">
									<p class="truncate text-sm leading-tight font-black text-on-surface">
										{item.name}
									</p>
									<p class="text-[10px] font-bold text-on-surface-variant">
										₱{(item.price * item.quantity).toFixed(2)}
									</p>
								</div>
							</div>
							<div
								class="flex shrink-0 items-center gap-1 rounded-full bg-surface-container-low px-2 py-1"
							>
								<button
									onclick={() => cartState.removeItem(item.productId)}
									class="flex h-6 w-6 items-center justify-center leading-none font-black text-primary"
								>
									<span class="material-symbols-outlined text-base">remove</span>
								</button>
								{#if editingQtyId === item.productId}
									<!-- svelte-ignore a11y_autofocus -->
									<input
										type="number"
										min="0"
										class="w-10 border-none bg-transparent text-center text-xs font-black text-on-surface focus:ring-0 focus:outline-none"
										bind:value={editingQtyValue}
										onblur={() => commitQty(item.productId, item.name)}
										onkeydown={(e) => {
											if (e.key === 'Enter') commitQty(item.productId, item.name);
											if (e.key === 'Escape') {
												editingQtyId = null;
											}
										}}
										autofocus
									/>
								{:else}
									<button
										onclick={() => startEditQty(item.productId, item.quantity)}
										class="w-6 text-center text-xs font-black text-on-surface"
										title="Tap to set quantity">{item.quantity}</button
									>
								{/if}
								<button
									onclick={() =>
										incrementCartItem(item.productId, item.name, item.price, item.image)}
									class="flex h-6 w-6 items-center justify-center leading-none font-black text-primary"
								>
									<span class="material-symbols-outlined text-base">add</span>
								</button>
								<button
									onclick={() => cartState.removeAllItem(item.productId)}
									class="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-error/50 transition-colors hover:bg-error/10 hover:text-error"
								>
									<span class="material-symbols-outlined text-sm">close</span>
								</button>
							</div>
						</div>
					{/each}
				</div>

				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-sm font-black tracking-widest text-on-surface-variant uppercase"
							>Total</span
						>
						<span class="font-serif text-3xl font-black tracking-tighter text-primary"
							>₱{cartState.totalPrice.toFixed(2)}</span
						>
					</div>
					<SignatureButton
						onclick={handlePayClick}
						disabled={cartState.items.length === 0 || posState.loading}
						class="h-16 w-full"
						size="lg"
					>
						Pay
					</SignatureButton>
				</div>
			</div>
		</div>
	{/if}

	<!-- Payment Modal -->
	{#if showPayment}
		<div
			class="fixed inset-0 z-[100] flex items-end justify-center bg-on-surface/40 backdrop-blur-sm sm:items-center"
		>
			<div
				class="w-full max-w-md animate-in overflow-hidden rounded-t-[2.5rem] bg-surface shadow-2xl slide-in-from-bottom sm:rounded-[2.5rem] sm:slide-in-from-bottom-0 sm:zoom-in-95"
			>
				<!-- Header -->
				<div class="flex items-center justify-between border-b border-outline-variant/10 px-6 py-5">
					<div>
						<h2 class="font-serif text-2xl font-black tracking-tight">Payment</h2>
						<p class="text-xs font-bold text-on-surface-variant">
							₱{cartState.totalPrice.toFixed(2)} due
						</p>
					</div>
					<button
						onclick={() => (showPayment = false)}
						class="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
					>
						<span class="material-symbols-outlined text-xl">close</span>
					</button>
				</div>

				<div class="no-scrollbar max-h-[80vh] overflow-y-auto">
					<div class="space-y-5 p-6">
						<!-- Customer name -->
						<div>
							<p
								class="mb-1.5 block text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
							>
								Customer Name
							</p>
							<input
								bind:value={customerName}
								type="text"
								placeholder="Walk-in Customer"
								class="w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm font-bold text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20"
							/>
						</div>

						<!-- Payment method -->
						<div>
							<p
								class="mb-1.5 block text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
							>
								Payment Method
							</p>
							<div class="grid grid-cols-4 gap-2">
								{#each PAY_METHODS as method}
									<button
										onclick={() => {
											if (method.implemented) paymentMethod = method.id;
										}}
										class="relative flex flex-col items-center gap-1.5 rounded-2xl border-2 py-3 text-center transition-all {paymentMethod ===
										method.id
											? 'border-primary bg-primary/5 text-primary'
											: 'border-transparent bg-surface-container-low text-on-surface-variant hover:bg-surface-container'} {!method.implemented
											? 'cursor-not-allowed opacity-50'
											: ''}"
									>
										<span class="material-symbols-outlined text-2xl">{method.icon}</span>
										<span class="text-[10px] font-black tracking-wide">{method.label}</span>
										{#if !method.implemented}
											<div
												class="absolute -top-1.5 -right-1.5 rounded-full bg-surface-container-highest px-1.5 py-0.5 text-[8px] font-black text-on-surface-variant"
											>
												Soon
											</div>
										{/if}
									</button>
								{/each}
							</div>
						</div>

						<!-- Cash section -->
						{#if paymentMethod === 'cash'}
							<div class="space-y-3">
								<div>
									<p
										class="mb-1.5 block text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
									>
										Cash Tendered
									</p>
									<div class="relative">
										<span
											class="absolute top-1/2 left-4 -translate-y-1/2 font-black text-on-surface-variant"
											>₱</span
										>
										<input
											bind:value={cashTendered}
											type="number"
											min={cartState.totalPrice}
											step="0.01"
											placeholder="0.00"
											class="w-full rounded-2xl border-2 border-transparent bg-surface-container-low py-3 pr-4 pl-8 text-right font-serif text-xl font-black text-on-surface focus:border-primary focus:ring-0 {cashTenderedNum >
												0 && cashTenderedNum < cartState.totalPrice
												? 'border-error/50 bg-error/5'
												: ''}"
										/>
									</div>
								</div>

								<!-- Quick presets -->
								<div class="flex flex-wrap gap-2">
									<button
										onclick={() => (cashTendered = cartState.totalPrice.toFixed(2))}
										class="rounded-full bg-surface-container px-3 py-1.5 text-[10px] font-black text-on-surface-variant transition-all hover:bg-primary hover:text-on-primary"
										>Exact</button
									>
									{#each cashPresets() as preset}
										{#if preset > 0}
											<button
												onclick={() => (cashTendered = String(preset))}
												class="rounded-full bg-surface-container px-3 py-1.5 text-[10px] font-black text-on-surface-variant transition-all hover:bg-primary hover:text-on-primary"
												>₱{preset}</button
											>
										{/if}
									{/each}
								</div>

								<!-- Change -->
								{#if cashTenderedNum >= cartState.totalPrice}
									<div
										class="flex items-center justify-between rounded-2xl bg-tertiary-container/40 px-5 py-4"
									>
										<span
											class="text-sm font-black tracking-widest text-on-surface-variant uppercase"
											>Change</span
										>
										<span class="font-serif text-2xl font-black text-tertiary"
											>₱{Math.max(0, changeAmount).toFixed(2)}</span
										>
									</div>
								{:else if cashTenderedNum > 0}
									<div class="flex items-center justify-between rounded-2xl bg-error/10 px-5 py-4">
										<span class="text-sm font-black tracking-widest text-error uppercase"
											>Short by</span
										>
										<span class="font-serif text-2xl font-black text-error"
											>₱{Math.abs(changeAmount).toFixed(2)}</span
										>
									</div>
								{/if}
							</div>
						{:else}
							<div class="rounded-2xl bg-surface-container-low px-5 py-6 text-center">
								<span class="material-symbols-outlined mb-2 text-3xl text-on-surface-variant/40"
									>construction</span
								>
								<p class="text-xs font-black tracking-widest text-on-surface-variant uppercase">
									Coming Soon
								</p>
								<p class="mt-1 text-[11px] text-on-surface-variant/60">
									This payment method is not yet integrated.
								</p>
							</div>
						{/if}

						<!-- Order summary -->
						<div>
							<p
								class="mb-1.5 block text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
							>
								Order Summary
							</p>
							<div class="space-y-2 rounded-2xl bg-surface-container-low p-4">
								{#each cartState.items as item}
									<div class="flex items-center justify-between">
										<span class="text-sm font-bold text-on-surface"
											>{item.name}
											<span class="text-on-surface-variant">×{item.quantity}</span></span
										>
										<span class="font-serif font-black text-on-surface"
											>₱{(item.price * item.quantity).toFixed(2)}</span
										>
									</div>
								{/each}
								<div
									class="mt-2 flex items-center justify-between border-t border-outline-variant/10 pt-2"
								>
									<span class="text-xs font-black tracking-widest text-on-surface uppercase"
										>Total</span
									>
									<span class="font-serif text-lg font-black text-primary"
										>₱{cartState.totalPrice.toFixed(2)}</span
									>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Confirm -->
				<div class="border-t border-outline-variant/10 p-6">
					<button
						onclick={handleCheckout}
						disabled={!canProceed}
						class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-serif text-lg font-black tracking-widest text-on-primary uppercase shadow-xl shadow-primary/30 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-40 disabled:grayscale"
					>
						<span class="material-symbols-outlined">check_circle</span>
						{posState.loading ? 'Processing...' : 'Confirm Payment'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Success Modal -->
	{#if showSuccess}
		<div
			class="fixed inset-0 z-[100] flex animate-in items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm duration-300 fade-in"
		>
			<ArtisanalCard
				class="no-print w-full max-w-md animate-in overflow-hidden border border-outline-variant/10 p-0 shadow-2xl duration-300 zoom-in-95"
			>
				<div class="relative overflow-hidden bg-primary p-10 text-center">
					<div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
					<div class="relative z-10">
						<div
							class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] border-4 border-white/20 bg-white/20 shadow-xl"
						>
							<span
								class="material-symbols-outlined text-4xl text-white"
								style="font-variation-settings: 'wght' 700;">check_circle</span
							>
						</div>
						<h3
							class="font-serif text-3xl leading-tight font-black tracking-tighter text-white uppercase"
						>
							Batch Finalized
						</h3>
						<p class="mt-2 text-xs font-bold tracking-[0.3em] text-white/80 uppercase">
							Order #{(lastOrder?.id || '').substring(0, 8)}
						</p>
					</div>
				</div>

				<div
					class="bg-white bg-[radial-gradient(#dfddd8_1px,transparent_1px)] [background-size:20px_20px] p-8"
				>
					<!-- Customer + method -->
					<div class="mb-5 flex items-center justify-between gap-3">
						<div>
							<p class="text-[9px] font-black tracking-widest text-on-surface-variant uppercase">
								Customer
							</p>
							<p class="font-serif font-black text-on-surface">{lastOrder?.customerName}</p>
						</div>
						<div class="text-right">
							<p class="text-[9px] font-black tracking-widest text-on-surface-variant uppercase">
								Payment
							</p>
							<p class="font-black text-on-surface uppercase">{lastOrder?.paymentMethod}</p>
						</div>
					</div>
					<div class="no-scrollbar mb-5 max-h-[25vh] space-y-2.5 overflow-y-auto">
						{#each lastOrder?.items || [] as item}
							<div class="flex items-center justify-between">
								<span class="text-sm font-black text-on-surface"
									>{item.name}
									<span class="font-medium text-on-surface-variant">×{item.quantity}</span></span
								>
								<span class="font-serif font-black text-on-surface"
									>₱{(item.price * item.quantity).toFixed(2)}</span
								>
							</div>
						{/each}
					</div>
					<div class="space-y-2 border-t-2 border-dashed border-surface-container pt-4">
						<div class="flex items-center justify-between">
							<span class="text-lg font-black tracking-tight text-on-surface-variant uppercase"
								>Total</span
							>
							<span class="font-serif text-3xl font-black tracking-tighter text-primary"
								>₱{lastOrder?.total.toFixed(2)}</span
							>
						</div>
						{#if lastOrder?.cashTendered !== undefined}
							<div
								class="flex items-center justify-between text-sm font-bold text-on-surface-variant"
							>
								<span>Cash Tendered</span>
								<span class="font-serif font-black text-on-surface"
									>₱{lastOrder.cashTendered.toFixed(2)}</span
								>
							</div>
							<div class="flex items-center justify-between text-sm font-bold">
								<span class="text-on-surface-variant">Change</span>
								<span class="font-serif font-black text-tertiary"
									>₱{lastOrder.change.toFixed(2)}</span
								>
							</div>
						{/if}
					</div>
				</div>

				<footer class="flex flex-col gap-3 bg-surface-container-low p-6">
					<SignatureButton
						size="lg"
						onclick={() => {
							showSuccess = false;
							lastOrder = null;
						}}
						class="h-14 w-full"
					>
						Next Batch
					</SignatureButton>
					<button
						onclick={printReceipt}
						class="flex items-center justify-center gap-2 py-2 text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase transition-colors hover:text-primary"
					>
						<span class="material-symbols-outlined text-sm">print</span>
						Print Receipt
					</button>
				</footer>
			</ArtisanalCard>
		</div>
	{/if}

	<!-- Barcode Scanner Overlay -->
	{#if showScanner}
		<div class="fixed inset-0 z-[200] flex flex-col bg-black">
			<!-- svelte-ignore a11y_media_has_caption -->
			<video
				bind:this={videoEl}
				class="absolute inset-0 h-full w-full object-cover"
				playsinline
				autoplay
				muted
			></video>

			<!-- Viewfinder overlay -->
			<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
				<!-- Darken everything outside the scan zone -->
				<div class="absolute inset-0 bg-black/40"></div>

				<!-- Scan zone cutout -->
				<div class="relative z-10 h-64 w-64">
					<div
						class="absolute inset-0 rounded-2xl border-2 border-white/20 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
					></div>
					<!-- Corners -->
					<div
						class="absolute top-0 left-0 h-10 w-10 rounded-tl-2xl border-t-4 border-l-4 border-primary"
					></div>
					<div
						class="absolute top-0 right-0 h-10 w-10 rounded-tr-2xl border-t-4 border-r-4 border-primary"
					></div>
					<div
						class="absolute bottom-0 left-0 h-10 w-10 rounded-bl-2xl border-b-4 border-l-4 border-primary"
					></div>
					<div
						class="absolute right-0 bottom-0 h-10 w-10 rounded-br-2xl border-r-4 border-b-4 border-primary"
					></div>
					<!-- Scan line -->
					<div
						class="scan-line absolute right-2 left-2 h-0.5 rounded-full bg-primary shadow-[0_0_8px_2px_rgba(var(--color-primary),0.6)]"
					></div>
				</div>
				<p
					class="relative z-10 mt-6 text-[10px] font-black tracking-[0.25em] text-white/60 uppercase"
				>
					Point camera at barcode
				</p>
			</div>

			<!-- Close -->
			<button
				onclick={closeScanner}
				class="absolute top-8 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-90"
			>
				<span class="material-symbols-outlined">close</span>
			</button>
		</div>
	{/if}
</div>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.scan-line {
		animation: scan 2s ease-in-out infinite;
	}
	@keyframes scan {
		0% {
			top: 8px;
			opacity: 1;
		}
		50% {
			top: calc(100% - 8px);
			opacity: 1;
		}
		100% {
			top: 8px;
			opacity: 1;
		}
	}
</style>
