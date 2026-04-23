<script lang="ts">
	import { categoriesState } from '$lib/states/categories.svelte';
	import { inventoryState } from '$lib/states/inventory.svelte';
    import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';

	// ── Types ───────────────────────────────────────────────────────────────
	type ActivityItem = {
		id: string;
		type: 'stock' | 'meta';
		action: string;
		label: string;
		group: 'Product' | 'Supply' | 'Category' | 'Item';
		quantity?: number;
		timestamp: string;
		user?: string;
		href?: string;
	};

	// ── Config ──────────────────────────────────────────────────────────────
	const ACTIVITY_META: Record<string, { label: string; icon: string; color: string; bg: string }> =
		{
			sale: { label: 'Sale', icon: 'point_of_sale', color: 'text-primary', bg: 'bg-primary/10' },
			restock: { label: 'Restock', icon: 'local_shipping', color: 'text-tertiary', bg: 'bg-tertiary/10' },
			waste: { label: 'Waste', icon: 'delete_sweep', color: 'text-error', bg: 'bg-error/10' },
			adjustment: { label: 'Correction', icon: 'tune', color: 'text-secondary', bg: 'bg-secondary/10' },
			create: { label: 'Added', icon: 'add_circle', color: 'text-tertiary', bg: 'bg-tertiary/10' },
			update: { label: 'Updated', icon: 'edit', color: 'text-secondary', bg: 'bg-secondary/10' },
			delete: { label: 'Removed', icon: 'delete', color: 'text-error', bg: 'bg-error/10' }
		};

	const PAGE_SIZE = 10;
	let currentPage = $state(1);

	// ── Helpers ──────────────────────────────────────────────────────────────
	function formatRelativeTime(dateStr: string): string {
		const diff = Date.now() - new Date(dateStr).getTime();
		const sec = Math.floor(diff / 1000);
		const min = Math.floor(sec / 60);
		const hr = Math.floor(min / 60);
		const day = Math.floor(hr / 24);

		if (sec < 60) return 'just now';
		if (min < 60) return `${min}m ago`;
		if (hr < 24) return `${hr}h ago`;
		if (day < 7) return `${day}d ago`;
		return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	// ── Derived Unified Feed ─────────────────────────────────────────────────
	let unifiedActivities = $derived.by(() => {
		const items: ActivityItem[] = [];

		inventoryState.logs.items.forEach((l) => {
			items.push({
				id: l.id,
				type: 'stock',
				action: l.reason,
				label: l.expand?.product?.name ?? l.expand?.supply?.name ?? 'Inventory Item',
				group: l.expand?.product ? 'Product' : l.expand?.supply ? 'Supply' : 'Item',
				quantity: l.quantity,
				timestamp: l.created,
				user: l.expand?.user?.name,
				href: l.product
					? `/inventory/products?id=${l.product}`
					: l.supply
						? `/inventory/supplies?id=${l.supply}`
						: undefined
			});
		});

		inventoryState.products.recentEvents.forEach((e) => {
			items.push({
				id: e.id,
				type: 'meta',
				action: e.action,
				label: e.record.name,
				group: 'Product',
				timestamp: e.timestamp,
				user: e.record.expand?.user?.name,
				href: `/inventory/products?id=${e.record.id}`
			});
		});

		inventoryState.supplies.recentEvents.forEach((e) => {
			items.push({
				id: e.id,
				type: 'meta',
				action: e.action,
				label: e.record.name,
				group: 'Supply',
				timestamp: e.timestamp,
				user: e.record.expand?.user?.name,
				href: `/inventory/supplies?id=${e.record.id}`
			});
		});

		categoriesState.recentEvents.forEach((e) => {
			items.push({
				id: e.id,
				type: 'meta',
				action: e.action,
				label: e.record.name,
				group: 'Category',
				timestamp: e.timestamp
			});
		});

		return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
	});

	let totalPages = $derived(Math.max(1, Math.ceil(unifiedActivities.length / PAGE_SIZE)));
	let pageActivities = $derived(
		unifiedActivities.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
	);

	// Reset to page 1 when data changes
	$effect(() => {
		unifiedActivities;
		currentPage = 1;
	});

	let loading = $derived(!inventoryState.logs.isInitialized);
</script>

<ArtisanalCard level="lowest" class="border border-outline-variant/10 p-0 overflow-hidden flex flex-col">
	<!-- Header -->
	<div class="flex flex-shrink-0 items-center justify-between border-b border-outline-variant/5 px-8 py-6 bg-surface-container-low/30">
		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
				<span class="material-symbols-outlined text-lg text-primary">history</span>
			</div>
			<div>
				<h2 class="text-[10px] font-black tracking-widest text-on-surface uppercase">
					Inventory Timeline
				</h2>
				<p class="text-on-surface-variant text-[11px] font-medium mt-0.5">
					Real-time feed of all stock movements & changes
				</p>
			</div>
		</div>
		<div class="flex items-center gap-3">
			<span class="bg-tertiary flex h-2 w-2 animate-pulse rounded-full shadow-[0_0_8px_rgba(125,162,122,0.6)]"></span>
			<span class="text-on-surface-variant/40 text-[9px] font-black tracking-widest uppercase">Monitoring Live</span>
		</div>
	</div>

	<!-- Content — fixed height so pagination never changes card size -->
	<div class="min-h-[680px] flex flex-col justify-between">
		{#if loading && unifiedActivities.length === 0}
			<ul class="divide-outline-variant/5 divide-y">
				{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as _}
					<li class="flex animate-pulse items-center gap-4 px-8 py-5">
						<div class="bg-on-surface/5 h-10 w-10 shrink-0 rounded-2xl"></div>
						<div class="flex-1 space-y-2">
							<div class="bg-on-surface/5 h-3 w-1/3 rounded-full"></div>
							<div class="bg-on-surface/4 h-2.5 w-1/2 rounded-full"></div>
						</div>
						<div class="bg-on-surface/4 h-2.5 w-12 rounded-full"></div>
					</li>
				{/each}
			</ul>
		{:else if unifiedActivities.length === 0}
			<div class="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
				<div class="bg-on-surface/5 flex h-20 w-20 items-center justify-center rounded-[2rem] shadow-inner">
					<span class="material-symbols-outlined text-on-surface-variant/20 text-4xl">history_toggle_off</span>
				</div>
				<div>
					<p class="text-on-surface-variant/60 text-sm font-black uppercase tracking-widest">Register Clear</p>
					<p class="text-on-surface-variant/40 max-w-xs mx-auto text-xs font-medium mt-2 leading-relaxed">
						All system actions and stock movements will be logged here in real-time once active.
					</p>
				</div>
			</div>
		{:else}
			<ul class="divide-outline-variant/5 divide-y">
				{#each pageActivities as item}
					{@const meta = ACTIVITY_META[item.action] ?? ACTIVITY_META['adjustment']}
					<li class="group flex items-center gap-6 px-8 py-5 transition-colors hover:bg-surface-container-low/40">
						<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl {meta.bg} border border-outline-variant/5 shadow-sm transition-all group-hover:scale-110">
							<span class="material-symbols-outlined text-xl {meta.color}">{meta.icon}</span>
						</div>

						<div class="min-w-0 flex-1">
							<div class="mb-1 flex flex-wrap items-center gap-2">
								<span class="text-[9px] font-black tracking-widest uppercase {meta.color}">{meta.label}</span>
								<span class="text-on-surface-variant/20 text-[10px]">·</span>
								<span class="text-on-surface-variant/60 text-[9px] font-black tracking-wider uppercase">{item.group}</span>
								{#if item.user}
									<span class="text-on-surface-variant/20 text-[10px]">·</span>
									<span class="text-on-surface-variant/50 text-[10px] font-bold italic">by {item.user}</span>
								{/if}
							</div>
							<div class="flex items-center gap-3">
								{#if item.href}
									<a href={item.href} class="truncate text-sm font-black text-on-surface decoration-primary/20 transition-colors hover:text-primary hover:underline underline-offset-4">
										{item.label}
									</a>
								{:else}
									<span class="truncate text-sm font-black text-on-surface">{item.label}</span>
								{/if}
								{#if item.quantity !== undefined && item.quantity !== 0}
									<span class="text-[10px] font-black tabular-nums {item.quantity > 0 ? 'text-tertiary' : 'text-error'} rounded-md border border-outline-variant/10 bg-surface px-2 py-0.5 shadow-sm">
										{item.quantity > 0 ? '+' : ''}{item.quantity}
									</span>
								{/if}
							</div>
						</div>

						<div class="text-on-surface-variant/40 shrink-0 rounded-xl bg-surface-container px-3 py-1.5 text-[10px] font-black tabular-nums border border-outline-variant/5">
							{formatRelativeTime(item.timestamp)}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<!-- Pagination footer -->
	{#if totalPages > 1}
		<div class="flex flex-shrink-0 items-center justify-between border-t border-outline-variant/5 px-8 py-4">
			<button
				onclick={() => (currentPage = Math.max(1, currentPage - 1))}
				disabled={currentPage === 1}
				class="flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant/10 bg-surface-container-low text-on-surface-variant transition-all hover:bg-surface-container hover:text-on-surface disabled:opacity-30 disabled:cursor-not-allowed"
			>
				<span class="material-symbols-outlined text-sm">chevron_left</span>
			</button>

			<p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">
				Page <span class="text-on-surface">{currentPage}</span> of {totalPages}
				<span class="ml-2 text-on-surface-variant/30">· {unifiedActivities.length} entries</span>
			</p>

			<button
				onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
				disabled={currentPage === totalPages}
				class="flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant/10 bg-surface-container-low text-on-surface-variant transition-all hover:bg-surface-container hover:text-on-surface disabled:opacity-30 disabled:cursor-not-allowed"
			>
				<span class="material-symbols-outlined text-sm">chevron_right</span>
			</button>
		</div>
	{/if}
</ArtisanalCard>

<style>
	:global(mark) {
		background: transparent;
		color: var(--color-primary);
		font-weight: 700;
	}
</style>
