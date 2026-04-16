<script lang="ts">
	import { pb } from '$lib/pocketbase';
	import { goto } from '$app/navigation';

	// ── Types ────────────────────────────────────────────────────────────────
	type SearchResultItem = {
		id: string;
		label: string;
		sublabel?: string;
		icon: string;
		href: string;
	};

	type SearchSection = {
		key: string;
		label: string;
		icon: string;
		items: SearchResultItem[];
	};

	// ── Props ─────────────────────────────────────────────────────────────────
	interface Props {
		class?: string;
	}
	let { class: className = '' }: Props = $props();

	// ── History ───────────────────────────────────────────────────────────────
	const HISTORY_KEY = 'tinappay_search_history';
	const MAX_HISTORY = 8;

	function loadHistory(): string[] {
		if (typeof localStorage === 'undefined') return [];
		try {
			return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
		} catch {
			return [];
		}
	}

	function saveHistory(h: string[]) {
		if (typeof localStorage !== 'undefined')
			localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
	}

	function addToHistory(q: string) {
		const t = q.trim();
		if (!t) return;
		const next = [t, ...history.filter((h) => h.toLowerCase() !== t.toLowerCase())].slice(
			0,
			MAX_HISTORY
		);
		history = next;
		saveHistory(next);
	}

	function removeFromHistory(entry: string) {
		history = history.filter((h) => h !== entry);
		saveHistory(history);
	}

	function clearHistory() {
		history = [];
		saveHistory([]);
	}

	// ── State ─────────────────────────────────────────────────────────────────
	let query = $state('');
	let focused = $state(false);
	let loading = $state(false);
	let sections = $state<SearchSection[]>([]);
	let history = $state<string[]>([]);
	let activeIndex = $state(-1); // flat index across all result items + history
	let inputEl = $state<HTMLInputElement | null>(null);

	// ── Derived ───────────────────────────────────────────────────────────────
	let hasQuery = $derived(query.trim().length > 0);
	let filteredHistory = $derived(
		hasQuery
			? history.filter((h) => h.toLowerCase().includes(query.trim().toLowerCase()))
			: history
	);
	let allResultItems = $derived(sections.flatMap((s) => s.items));
	let totalNavItems = $derived(allResultItems.length + filteredHistory.length);
	let showDropdown = $derived(focused && (hasQuery || history.length > 0));
	let hasResults = $derived(sections.some((s) => s.items.length > 0));

	// ── Search ────────────────────────────────────────────────────────────────
	let debounceTimer: ReturnType<typeof setTimeout>;

	function onQueryInput() {
		activeIndex = -1;
		clearTimeout(debounceTimer);
		if (!query.trim()) {
			sections = [];
			loading = false;
			return;
		}
		loading = true;
		debounceTimer = setTimeout(() => fetchResults(query.trim()), 300);
	}

	async function fetchResults(q: string) {
		try {
			const nameFilter = `name ~ "${q}"`;

			const [products, supplies, categories, suppliers, users] = await Promise.allSettled([
				pb.collection('products').getList(1, 5, { filter: nameFilter, sort: 'name', requestKey: `gs-products-${q}` }),
				pb.collection('supplies').getList(1, 5, { filter: nameFilter, sort: 'name', requestKey: `gs-supplies-${q}` }),
				pb.collection('categories').getList(1, 5, { filter: nameFilter, sort: 'name', requestKey: `gs-categories-${q}` }),
				pb.collection('suppliers').getList(1, 5, { filter: `name ~ "${q}" || contact_person ~ "${q}"`, sort: 'name', requestKey: `gs-suppliers-${q}` }),
				pb.collection('users').getList(1, 5, { filter: `name ~ "${q}" || email ~ "${q}"`, sort: 'name', requestKey: `gs-users-${q}` }),
			]);

			const built: SearchSection[] = [];

			const addSection = (
				key: string,
				label: string,
				icon: string,
				result: PromiseSettledResult<any>,
				mapper: (r: any) => SearchResultItem
			) => {
				if (result.status === 'fulfilled' && result.value.items.length > 0) {
					built.push({ key, label, icon, items: result.value.items.map(mapper) });
				}
			};

			addSection('products', 'Products', 'storefront', products, (r) => ({
				id: r.id,
				label: r.name,
				sublabel: r.description || undefined,
				icon: 'storefront',
				href: `/inventory/products?id=${r.id}`,
			}));

			addSection('supplies', 'Supplies', 'inventory_2', supplies, (r) => ({
				id: r.id,
				label: r.name,
				sublabel: r.description || undefined,
				icon: 'inventory_2',
				href: `/inventory/supplies?id=${r.id}`,
			}));

			addSection('categories', 'Categories', 'category', categories, (r) => ({
				id: r.id,
				label: r.name,
				sublabel: r.type ? (r.type === 'product' ? 'Product category' : 'Supply category') : undefined,
				icon: 'category',
				href: `/inventory/categories?id=${r.id}`,
			}));

			addSection('suppliers', 'Suppliers', 'local_shipping', suppliers, (r) => ({
				id: r.id,
				label: r.name,
				sublabel: r.contact_person || r.phone || undefined,
				icon: 'local_shipping',
				href: `/restock?supplier=${r.id}`,
			}));

			addSection('users', 'Users', 'group', users, (r) => ({
				id: r.id,
				label: r.name || r.email,
				sublabel: r.email,
				icon: 'person',
				href: `/users?id=${r.id}`,
			}));

			sections = built;
		} catch (err) {
			console.error('Global search error:', err);
		} finally {
			loading = false;
		}
	}

	// ── Navigation ────────────────────────────────────────────────────────────
	function onFocus() {
		history = loadHistory();
		focused = true;
		activeIndex = -1;
	}

	function onBlur() {
		setTimeout(() => {
			focused = false;
			activeIndex = -1;
		}, 150);
	}

	function onKeydown(e: KeyboardEvent) {
		if (!showDropdown) return;

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIndex = Math.min(activeIndex + 1, totalNavItems - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = Math.max(activeIndex - 1, -1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (activeIndex >= 0 && activeIndex < allResultItems.length) {
				navigateTo(allResultItems[activeIndex]);
			} else if (activeIndex >= allResultItems.length) {
				const histIdx = activeIndex - allResultItems.length;
				selectHistory(filteredHistory[histIdx]);
			} else {
				submitSearch(query);
			}
		} else if (e.key === 'Escape') {
			focused = false;
			inputEl?.blur();
		}
	}

	function navigateTo(item: SearchResultItem) {
		addToHistory(query.trim() || item.label);
		focused = false;
		inputEl?.blur();
		goto(item.href);
	}

	function selectHistory(entry: string) {
		query = entry;
		addToHistory(entry);
		focused = false;
		inputEl?.blur();
		goto(`/inventory?search=${encodeURIComponent(entry)}`);
	}

	function submitSearch(q: string) {
		const t = q.trim();
		if (!t) return;
		addToHistory(t);
		focused = false;
		inputEl?.blur();
		goto(`/inventory?search=${encodeURIComponent(t)}`);
	}

	function clearQuery() {
		query = '';
		sections = [];
		loading = false;
		activeIndex = -1;
		inputEl?.focus();
	}

	// ── Highlight helper ──────────────────────────────────────────────────────
	function highlight(text: string, q: string): string {
		if (!q.trim()) return text;
		const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
	}
</script>

<div class="search-bar-root relative {className}">
	<!-- Input pill -->
	<div
		class="flex items-center gap-3 rounded-full px-4 py-2 transition-all duration-200
			{focused
			? 'bg-surface-container ring-1 ring-primary/30'
			: 'bg-surface-container-low hover:bg-surface-container'}"
	>
		{#if loading}
			<span
				class="material-symbols-outlined text-base animate-spin text-primary"
				style="animation-duration: 0.8s;"
			>
				progress_activity
			</span>
		{:else}
			<span
				class="material-symbols-outlined text-base transition-colors {focused
					? 'text-primary'
					: 'text-on-surface-variant'}"
			>
				search
			</span>
		{/if}

		<input
			bind:this={inputEl}
			bind:value={query}
			oninput={onQueryInput}
			onfocus={onFocus}
			onblur={onBlur}
			onkeydown={onKeydown}
			class="font-body w-full border-none bg-transparent text-sm placeholder:text-on-surface-variant/50 focus:ring-0 focus:outline-none"
			placeholder="Search everything..."
			type="text"
			autocomplete="off"
			aria-label="Global search"
			aria-expanded={showDropdown}
			aria-controls="search-results-listbox"
			role="combobox"
		/>

		{#if query}
			<button
				onclick={clearQuery}
				class="shrink-0 text-on-surface-variant/50 transition-colors hover:text-on-surface"
				aria-label="Clear search"
			>
				<span class="material-symbols-outlined text-base">close</span>
			</button>
		{/if}
	</div>

	<!-- Dropdown -->
	{#if showDropdown}
		<div
			id="search-results-listbox"
			class="search-dropdown absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest/97 shadow-2xl backdrop-blur-xl"
			role="listbox"
		>
			<!-- Live results -->
			{#if hasQuery}
				{#if loading && sections.length === 0}
					<!-- Skeleton -->
					<div class="px-4 pt-4 pb-2 space-y-3">
						{#each [1, 2, 3] as _}
							<div class="flex items-center gap-3">
								<div class="h-7 w-7 rounded-full bg-on-surface/6 animate-pulse"></div>
								<div class="flex-1 space-y-1.5">
									<div class="h-3 w-2/3 rounded-full bg-on-surface/6 animate-pulse"></div>
									<div class="h-2.5 w-1/3 rounded-full bg-on-surface/5 animate-pulse"></div>
								</div>
							</div>
						{/each}
					</div>
				{:else if !loading && !hasResults}
					<!-- Empty state -->
					<div class="flex flex-col items-center gap-2 py-10 px-4 text-center">
						<span class="material-symbols-outlined text-4xl text-on-surface-variant/30">
							search_off
						</span>
						<p class="text-sm font-semibold text-on-surface-variant/60">No results found</p>
						<p class="text-xs text-on-surface-variant/40">
							No matches for "<span class="font-bold">{query}</span>"
						</p>
					</div>
				{:else}
					<!-- Grouped sections -->
					{#each sections as section, si}
						{@const sectionOffset = sections.slice(0, si).reduce((acc, s) => acc + s.items.length, 0)}
						<div class="border-b border-outline-variant/5 last:border-0">
							<!-- Section header -->
							<div class="flex items-center gap-2 px-4 pt-3 pb-1">
								<span class="material-symbols-outlined text-sm text-on-surface-variant/50">
									{section.icon}
								</span>
								<span class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">
									{section.label}
								</span>
								<span class="ml-auto text-[10px] font-bold text-on-surface-variant/40">
									{section.items.length} result{section.items.length !== 1 ? 's' : ''}
								</span>
							</div>

							<!-- Items -->
							{#each section.items as item, ii}
								{@const flatIdx = sectionOffset + ii}
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<div
									onclick={() => navigateTo(item)}
									role="option"
									tabindex="0"
									aria-selected={activeIndex === flatIdx}
									class="group flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-all
										{activeIndex === flatIdx
										? 'bg-primary/8 text-primary'
										: 'text-on-surface hover:bg-surface-container-high'}"
								>
									<div
										class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
											{activeIndex === flatIdx
											? 'bg-primary/10 text-primary'
											: 'bg-on-surface/5 text-on-surface-variant group-hover:bg-primary/8 group-hover:text-primary'}"
									>
										<span class="material-symbols-outlined text-sm">{item.icon}</span>
									</div>

									<div class="min-w-0 flex-1">
										<p
											class="truncate text-sm font-semibold leading-none"
										>
											<!-- eslint-disable-next-line svelte/no-at-html-tags -->
											{@html highlight(item.label, query)}
										</p>
										{#if item.sublabel}
											<p class="mt-0.5 truncate text-[11px] text-on-surface-variant/60">
												{item.sublabel}
											</p>
										{/if}
									</div>

									<span
										class="material-symbols-outlined shrink-0 text-sm text-on-surface-variant/30 opacity-0 transition-all group-hover:opacity-100 {activeIndex === flatIdx ? 'opacity-100 text-primary' : ''}"
									>
										arrow_forward
									</span>
								</div>
							{/each}
						</div>
					{/each}
				{/if}
			{/if}

			<!-- Search history -->
			{#if filteredHistory.length > 0}
				<div class="border-t border-outline-variant/5 {hasQuery && hasResults ? '' : 'border-t-0'}">
					<div class="flex items-center justify-between px-4 pt-3 pb-1">
						<span class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">
							{hasQuery ? 'Matching History' : 'Recent Searches'}
						</span>
						{#if !hasQuery}
							<button
								onclick={clearHistory}
								class="text-[10px] font-bold uppercase tracking-wider text-primary/60 transition-colors hover:text-primary"
							>
								Clear all
							</button>
						{/if}
					</div>

					{#each filteredHistory as entry, hi}
						{@const flatIdx = allResultItems.length + hi}
						<div
							class="group flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-all
								{activeIndex === flatIdx
								? 'bg-primary/8 text-primary'
								: 'text-on-surface hover:bg-surface-container-high'}"
						>
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div onclick={() => selectHistory(entry)} class="flex flex-1 items-center gap-3 min-w-0">
								<span class="material-symbols-outlined text-sm text-on-surface-variant/50 shrink-0">
									history
								</span>
								<span class="flex-1 truncate text-sm font-medium">{entry}</span>
							</div>

							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<span
								onclick={(e) => { e.stopPropagation(); removeFromHistory(entry); }}
								class="material-symbols-outlined shrink-0 text-sm text-on-surface-variant/30 opacity-0 transition-all group-hover:opacity-100 hover:!text-error cursor-pointer"
								aria-label="Remove from history"
							>
								close
							</span>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Footer hint -->
			{#if showDropdown && (hasResults || filteredHistory.length > 0)}
				<div class="border-t border-outline-variant/5 px-4 py-2 flex items-center gap-3">
					<span class="text-[10px] text-on-surface-variant/40">
						<kbd class="rounded bg-surface-container px-1 py-0.5 font-mono text-[9px]">↑↓</kbd> navigate
					</span>
					<span class="text-[10px] text-on-surface-variant/40">
						<kbd class="rounded bg-surface-container px-1 py-0.5 font-mono text-[9px]">Enter</kbd> select
					</span>
					<span class="text-[10px] text-on-surface-variant/40">
						<kbd class="rounded bg-surface-container px-1 py-0.5 font-mono text-[9px]">Esc</kbd> close
					</span>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	:global(mark) {
		background: transparent;
		color: var(--color-primary);
		font-weight: 700;
	}
</style>
