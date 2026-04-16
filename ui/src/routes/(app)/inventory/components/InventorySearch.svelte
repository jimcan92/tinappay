<script lang="ts">
	import { categoriesState } from '$lib/state/categories.svelte';

	interface Props {
		activeTab: 'products' | 'supplies' | 'categories';
		searchQuery: string;
		selectedCategoryId: string | null;
	}

	let { activeTab, searchQuery = $bindable(), selectedCategoryId = $bindable() }: Props = $props();
</script>

{#if activeTab !== 'categories'}
	<div class="flex flex-col gap-3 sm:flex-row">
		<div class="group relative flex-1">
			<span
				class="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary"
			>
				search
			</span>
			<input
				bind:value={searchQuery}
				class="w-full rounded-full border-none bg-surface-container-low py-3.5 pr-4 pl-12 text-sm font-medium transition-all focus:ring-2 focus:ring-primary/20"
				placeholder="Search {activeTab === 'products' ? 'products' : 'supplies'}..."
				type="text"
			/>
		</div>
		<div class="no-scrollbar flex gap-2 overflow-x-auto py-1">
			<button
				onclick={() => (selectedCategoryId = null)}
				class="rounded-xl px-4 py-2.5 text-xs font-black tracking-widest whitespace-nowrap uppercase transition-all {selectedCategoryId ===
				null
					? 'bg-primary text-on-primary shadow-lg'
					: 'bg-surface-container-low text-on-surface-variant'}">All</button
			>
			{#each activeTab === 'products' ? categoriesState.productCategories : categoriesState.supplyCategories as cat}
				<button
					onclick={() => (selectedCategoryId = cat.id)}
					class="rounded-xl px-4 py-2.5 text-xs font-black tracking-widest whitespace-nowrap uppercase transition-all {selectedCategoryId ===
					cat.id
						? 'bg-primary text-on-primary shadow-lg'
						: 'bg-surface-container-low text-on-surface-variant'}">{cat.name}</button
				>
			{/each}
		</div>
	</div>
{/if}

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
