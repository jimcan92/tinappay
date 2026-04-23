<script lang="ts">
	import { categoriesState } from '$lib/states/categories.svelte';
	import Select from '$lib/components/Select.svelte';

	interface Props {
		activeTab: 'products' | 'supplies' | 'categories';
		searchQuery: string;
		selectedCategoryId: string | null;
	}

	let { activeTab, searchQuery = $bindable(), selectedCategoryId = $bindable() }: Props = $props();

	let categoryOptions = $derived([
		{ value: '', label: 'All Categories' },
		...(activeTab === 'products' ? categoriesState.productCategories : categoriesState.supplyCategories).map((c) => ({ value: c.id, label: c.name }))
	]);
</script>

{#if activeTab !== 'categories'}
	<div class="flex flex-col gap-3 md:flex-row md:items-center">
		<div class="relative flex-1">
			<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
			<input bind:value={searchQuery} type="text" placeholder="Search {activeTab === 'products' ? 'products' : 'supplies'}..." class="h-12 w-full rounded-full border-none bg-surface-container-low pl-12 pr-4 text-sm font-medium shadow-inner outline-none focus:ring-2 focus:ring-primary/20" />
		</div>
		<div class="flex w-full items-center gap-3 md:w-auto">
			<Select
				value={selectedCategoryId || ''}
				onchange={(v) => { selectedCategoryId = v === '' ? null : v; }}
				options={categoryOptions}
				placeholder="All Categories"
				class="flex-1 md:w-48 md:flex-none"
			/>
		</div>
	</div>
{/if}
