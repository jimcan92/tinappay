<script lang="ts">
	import { inventoryState } from '$lib/state/inventory.svelte';
	import { categoriesState } from '$lib/state/categories.svelte';

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
	const ACTIVITY_META: Record<
		string,
		{ label: string; icon: string; color: string; bg: string }
	> = {
		// Stock actions
		sale: { label: 'Sale', icon: 'point_of_sale', color: 'text-primary', bg: 'bg-primary/10' },
		restock: { label: 'Restock', icon: 'local_shipping', color: 'text-tertiary', bg: 'bg-tertiary/10' },
		waste: { label: 'Waste', icon: 'delete_sweep', color: 'text-error', bg: 'bg-error/10' },
		adjustment: { label: 'Correction', icon: 'tune', color: 'text-secondary', bg: 'bg-secondary/10' },
		// Meta actions
		create: { label: 'Added', icon: 'add_circle', color: 'text-tertiary', bg: 'bg-tertiary/10' },
		update: { label: 'Updated', icon: 'edit', color: 'text-secondary', bg: 'bg-secondary/10' },
		delete: { label: 'Removed', icon: 'delete', color: 'text-error', bg: 'bg-error/10' }
	};

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
		return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
	}

	// ── Derived Unified Feed ─────────────────────────────────────────────────
	let unifiedActivities = $derived.by(() => {
		const items: ActivityItem[] = [];

		// 1. Add persistent stock logs (Restock, Waste, Sales, Adjustments)
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
				href: l.product ? `/inventory/products?id=${l.product}` : l.supply ? `/inventory/supplies?id=${l.supply}` : undefined
			});
		});

		// 2. Add live meta-events (Products)
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

		// 3. Add live meta-events (Supplies)
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

		// 4. Add live meta-events (Categories)
		categoriesState.recentEvents.forEach((e) => {
			items.push({
				id: e.id,
				type: 'meta',
				action: e.action,
				label: e.record.name,
				group: 'Category',
				timestamp: e.timestamp,
				href: `/inventory/categories?id=${e.record.id}`
			});
		});

		// Sort by timestamp descending
		return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 30);
	});

	let loading = $derived(!inventoryState.logs.isInitialized);
</script>

<div class="overflow-hidden rounded-[2.5rem] border border-outline-variant/10 bg-surface-container-low shadow-sm">
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-outline-variant/8 px-8 py-6">
		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
				<span class="material-symbols-outlined text-lg text-primary">history</span>
			</div>
			<div>
				<h2 class="text-sm font-black uppercase tracking-widest text-on-surface">
					Inventory Timeline
				</h2>
				<p class="text-[11px] font-medium text-on-surface-variant/60">
					Real-time feed of all stock movements & changes
				</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<span class="flex h-1.5 w-1.5 animate-pulse rounded-full bg-tertiary"></span>
			<span class="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">Monitoring Live</span>
		</div>
	</div>

	<!-- Content -->
	{#if loading && unifiedActivities.length === 0}
		<ul class="divide-y divide-outline-variant/5">
			{#each [1, 2, 3, 4, 5] as _}
				<li class="flex animate-pulse items-center gap-4 px-8 py-4">
					<div class="h-10 w-10 shrink-0 rounded-2xl bg-on-surface/5"></div>
					<div class="flex-1 space-y-2">
						<div class="h-3 w-1/3 rounded-full bg-on-surface/5"></div>
						<div class="h-2.5 w-1/2 rounded-full bg-on-surface/4"></div>
					</div>
					<div class="h-2.5 w-12 rounded-full bg-on-surface/4"></div>
				</li>
			{/each}
		</ul>
	{:else if unifiedActivities.length === 0}
		<div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
			<div class="flex h-16 w-16 items-center justify-center rounded-3xl bg-on-surface/5">
				<span class="material-symbols-outlined text-3xl text-on-surface-variant/40">history_toggle_off</span>
			</div>
			<p class="text-sm font-bold text-on-surface-variant/50">No recent activity detected.</p>
			<p class="max-w-xs text-xs text-on-surface-variant/35 italic leading-relaxed px-10">
				All system actions and stock movements will be logged here in real-time.
			</p>
		</div>
	{:else}
		<ul class="divide-y divide-outline-variant/5">
			{#each unifiedActivities as item}
				{@const meta = ACTIVITY_META[item.action] ?? ACTIVITY_META['adjustment']}
				<li class="group flex items-center gap-4 px-8 py-4 transition-colors hover:bg-surface-container">
					<!-- Icon based on action -->
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl {meta.bg} transition-all group-hover:scale-110 shadow-sm border border-outline-variant/5">
						<span class="material-symbols-outlined text-lg {meta.color}">
							{meta.icon}
						</span>
					</div>

					<!-- Info -->
					<div class="min-w-0 flex-1">
						<div class="flex flex-wrap items-center gap-2 mb-0.5">
							<span class="text-[10px] font-black uppercase tracking-widest {meta.color}">
								{meta.label}
							</span>
							<span class="text-[10px] text-on-surface-variant/20">·</span>
							<span class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/40">
								{item.group}
							</span>
                            {#if item.user}
                                <span class="text-[10px] text-on-surface-variant/20">·</span>
                                <span class="text-[10px] font-medium text-on-surface-variant/60 italic">
                                    by {item.user}
                                </span>
                            {/if}
						</div>

						<div class="flex items-center gap-2">
							{#if item.href}
								<a href={item.href} class="truncate text-sm font-bold text-on-surface hover:text-primary transition-colors decoration-primary/20 hover:underline">
									{item.label}
								</a>
							{:else}
								<span class="truncate text-sm font-bold text-on-surface">{item.label}</span>
							{/if}
							
							{#if item.quantity !== undefined && item.quantity !== 0}
								<span class="text-xs font-black tabular-nums {item.quantity > 0 ? 'text-tertiary' : 'text-error'} bg-surface px-1.5 py-0.5 rounded-md border border-outline-variant/5 shadow-sm">
									{item.quantity > 0 ? '+' : ''}{item.quantity}
								</span>
							{/if}
						</div>
					</div>

					<!-- Time -->
					<div class="shrink-0 text-[10px] font-black tabular-nums text-on-surface-variant/40 bg-surface-container-high px-2 py-1 rounded-lg">
						{formatRelativeTime(item.timestamp)}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	:global(mark) {
		background: transparent;
		color: var(--color-primary);
		font-weight: 700;
	}
</style>
