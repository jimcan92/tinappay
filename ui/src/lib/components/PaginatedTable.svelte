<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Props {
		items: any[];
		pageSize?: number;
		tableClass?: string;
		header: Snippet;
		row: Snippet<[any]>;
		empty?: Snippet;
		emptyMessage?: string;
	}

	let { 
		items = [], 
		pageSize = 10, 
		tableClass = 'w-full text-left border-collapse', 
		header, 
		row, 
		empty,
		emptyMessage = 'No items found.'
	}: Props = $props();

	let currentPage = $state(1);
	let totalPages = $derived(Math.max(1, Math.ceil(items.length / pageSize)));
	let pagedItems = $derived(items.slice((currentPage - 1) * pageSize, currentPage * pageSize));

	$effect(() => {
		// Keep page in bounds when filters/search change
		if (currentPage > totalPages) currentPage = totalPages;
		if (currentPage < 1) currentPage = 1;
	});

	let rangeStart = $derived(items.length === 0 ? 0 : (currentPage - 1) * pageSize + 1);
	let rangeEnd = $derived(Math.min(currentPage * pageSize, items.length));
</script>

<div class="overflow-x-auto no-scrollbar w-full">
	<table class={tableClass}>
		<thead>
			{@render header()}
		</thead>
		<tbody class="divide-y divide-outline-variant/5">
			{#each pagedItems as item}
				{@render row(item)}
			{:else}
				{#if empty}
					{@render empty()}
				{:else}
					<tr>
						<td colspan="12" class="px-6 py-12 text-center text-sm font-medium text-on-surface-variant/40">{emptyMessage}</td>
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
</div>

<!-- Footer / Pagination -->
{#if items.length > 0}
<div class="mt-6 mb-6 flex flex-col sm:flex-row items-center justify-between px-6 gap-4 sm:gap-0">
	<p class="text-sm font-medium text-on-surface-variant">
		Showing <span class="font-bold text-on-surface">{rangeStart}-{rangeEnd}</span> of
		<span class="font-bold text-on-surface">{items.length}</span> items
	</p>
	<div class="flex gap-2">
		<button
			disabled={currentPage === 1}
			onclick={() => (currentPage = Math.max(1, currentPage - 1))}
			class="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/10 bg-surface-container-lowest text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40"
		>
			<span class="material-symbols-outlined">chevron_left</span>
		</button>

		{#each Array.from({ length: Math.min(3, totalPages) }) as _, i}
			{@const pageNum =
				totalPages <= 3
					? i + 1
					: Math.min(Math.max(1, currentPage - 1) + i, totalPages)}
			<button
				onclick={() => (currentPage = pageNum)}
				class="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/10 font-bold transition-colors {pageNum ===
				currentPage
					? 'bg-primary text-on-primary border-primary'
					: 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'}"
			>
				{pageNum}
			</button>
		{/each}

		<button
			disabled={currentPage === totalPages}
			onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
			class="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/10 bg-surface-container-lowest text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40"
		>
			<span class="material-symbols-outlined">chevron_right</span>
		</button>
	</div>
</div>
{/if}

<style>
	table {
		border-spacing: 0;
	}
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>