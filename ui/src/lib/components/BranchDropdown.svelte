<script lang="ts">
	import { branchesState } from '$lib/states/branches.svelte';
	import { scale } from 'svelte/transition';

	interface Props {
		selectedId: string;
		side?: 'bottom' | 'left' | 'right';
		variant?: 'pill' | 'full';
		onSelect: (id: string) => void;
	}

	let { selectedId, side = 'bottom', variant = 'pill', onSelect }: Props = $props();

	let isOpen = $state(false);

	let selectedLabel = $derived(
		branchesState.items.find((b) => b.id === selectedId)?.name ?? 'Select Branch'
	);

	let dropdownClass = $derived(
		side === 'bottom'
			? 'top-full left-0 mt-2 origin-top-left'
			: side === 'left'
				? 'top-0 right-full mr-2 origin-right'
				: 'top-0 left-full ml-2 origin-left'
	);

	function select(id: string) {
		isOpen = false;
		onSelect(id);
	}

	function handleOutsideClick(e: MouseEvent) {
		if (isOpen && !(e.target as HTMLElement).closest('.branch-dd')) {
			isOpen = false;
		}
	}
</script>

<svelte:window onclick={handleOutsideClick} />

<div class="branch-dd relative {variant === 'full' ? 'w-full' : ''}">
	<!-- Trigger -->
	{#if variant === 'pill'}
		<button
			onclick={() => (isOpen = !isOpen)}
			class="flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 transition-all hover:bg-surface-container {isOpen
				? 'bg-surface-container'
				: ''}"
		>
			<span class="material-symbols-outlined text-sm text-primary">location_on</span>
			<span class="text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase"
				>{selectedLabel}</span
			>
			<span
				class="material-symbols-outlined text-sm text-on-surface-variant transition-transform duration-200 {isOpen
					? 'rotate-180'
					: ''}">expand_more</span
			>
		</button>
	{:else}
		<button
			onclick={() => (isOpen = !isOpen)}
			class="flex w-full items-center justify-between rounded-xl bg-surface px-4 py-2.5 transition-colors hover:bg-surface-container-low"
		>
			<div class="flex items-center gap-3">
				<span class="material-symbols-outlined text-base text-primary">location_on</span>
				<span class="text-xs font-bold text-on-surface">{selectedLabel}</span>
			</div>
			<span
				class="material-symbols-outlined text-sm text-on-surface-variant transition-transform duration-200 {isOpen
					? 'rotate-180'
					: ''}">expand_more</span
			>
		</button>
	{/if}

	<!-- Dropdown -->
	{#if isOpen}
		<div
			transition:scale={{ duration: 150, start: 0.95, opacity: 0 }}
			class="absolute z-50 max-h-64 min-w-[180px] overflow-y-auto rounded-2xl border border-outline-variant/10 bg-surface shadow-2xl {dropdownClass}"
		>
			{#each branchesState.items as branch}
				<button
					onclick={() => select(branch.id)}
					class="flex w-full items-center gap-3 border-b border-outline-variant/10 last:border-0 px-4 py-3 text-left transition-colors hover:bg-surface-container-low {selectedId === branch.id ? 'text-primary' : 'text-on-surface-variant'}"
				>
					<span
						class="material-symbols-outlined text-base shrink-0"
						style="font-variation-settings:'FILL' {selectedId === branch.id ? 1 : 0}"
						>{branch.is_main ? 'home_work' : 'storefront'}</span
					>
					<div class="min-w-0">
						<div class="flex items-center gap-2">
							<p class="text-xs font-bold truncate">{branch.name}</p>
							{#if branch.is_main}
								<span class="bg-primary/10 text-primary text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Main</span>
							{/if}
						</div>
						{#if branch.location}
							<p class="text-[10px] font-medium text-on-surface-variant/60 truncate">{branch.location}</p>
						{/if}
					</div>
				</button>
			{/each}
			{#if branchesState.items.length === 0}
				<div class="px-4 py-8 text-center">
					<p class="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">No Branches Found</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
