<script lang="ts">
	import type { CategoriesResponse } from '$lib/pocketbase-types';
	import { categoriesState } from '$lib/states/categories.svelte';
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';

	interface Props { filterType?: 'product' | 'supply' }
	let { filterType }: Props = $props();

	let catNewName = $state({ product: '', supply: '' });
	let catEditId = $state<string | null>(null);
	let catEditName = $state('');
	let catSaving = $state(false);

	async function handleAddCategory(type: 'product' | 'supply') {
		const name = type === 'product' ? catNewName.product.trim() : catNewName.supply.trim();
		if (!name) return;
		catSaving = true;
		try {
			await categoriesState.create({ name, type });
			if (type === 'product') catNewName.product = '';
			else catNewName.supply = '';
		} catch (e) {
			console.error(e);
		} finally {
			catSaving = false;
		}
	}

	async function handleRenameCategory(cat: CategoriesResponse) {
		if (!catEditName.trim()) return;
		catSaving = true;
		try {
			await categoriesState.update(cat.id, { name: catEditName.trim(), type: cat.type });
			catEditId = null;
			catEditName = '';
		} catch (e) {
			console.error(e);
		} finally {
			catSaving = false;
		}
	}
</script>

<div class="grid grid-cols-1 gap-10 {filterType ? '' : 'md:grid-cols-2'}">
	{#each [{ type: 'product', label: 'Product Groups', icon: 'bakery_dining', list: categoriesState.productCategories }, { type: 'supply', label: 'Material Groups', icon: 'grain', list: categoriesState.supplyCategories }].filter(g => !filterType || g.type === filterType) as group}
		<div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div class="mb-6 flex items-center justify-between px-2">
				<div class="flex items-center gap-3">
                    <div class="h-10 w-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner border border-primary/5">
                        <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">{group.icon}</span>
                    </div>
					<h3 class="font-serif text-xl font-black text-on-surface tracking-tight">{group.label}</h3>
				</div>
				<span class="rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-black text-on-surface-variant uppercase tracking-widest border border-outline-variant/10 shadow-sm"
					>{group.list.length} Items</span
				>
			</div>

			<div class="mb-6 space-y-2">
				{#each group.list as cat}
					<div class="group flex items-center gap-4 rounded-2xl bg-surface-container-low px-5 py-3.5 transition-all hover:bg-surface-container-high border border-outline-variant/5">
						{#if catEditId === cat.id}
							<input
								bind:value={catEditName}
								class="flex-1 rounded-xl border-none bg-surface-container-lowest px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20 shadow-inner"
								onkeydown={(e) => e.key === 'Enter' && handleRenameCategory(cat)}
							/>
							<div class="flex gap-1">
                                <button
                                    onclick={() => handleRenameCategory(cat)}
                                    disabled={catSaving}
                                    class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-primary transition-all hover:scale-105 active:scale-95 shadow-md shadow-primary/20"
                                ><span class="material-symbols-outlined text-sm">check</span></button>
                                <button
                                    onclick={() => {
                                        catEditId = null;
                                        catEditName = '';
                                    }}
                                    class="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-lowest text-on-surface-variant transition-all hover:bg-surface-container-high shadow-sm"
                                ><span class="material-symbols-outlined text-sm">close</span></button>
                            </div>
						{:else}
							<span class="flex-1 text-sm font-bold text-on-surface uppercase tracking-widest opacity-80">{cat.name}</span>
							<div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
								<button
									onclick={() => {
										catEditId = cat.id;
										catEditName = cat.name;
									}}
									class="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-lowest text-primary transition-all hover:bg-primary hover:text-on-primary shadow-sm"
									><span class="material-symbols-outlined text-sm">edit</span></button
								>
								<button
									onclick={() => categoriesState.delete(cat.id)}
									class="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-lowest text-error transition-all hover:bg-error hover:text-on-error shadow-sm"
									><span class="material-symbols-outlined text-sm">delete</span></button
								>
							</div>
						{/if}
					</div>
				{:else}
					<div class="py-12 text-center rounded-[2rem] border-2 border-dashed border-outline-variant/10 bg-surface-container-low/30 opacity-40">
						<p class="text-[10px] font-black uppercase tracking-[0.3em]">The group register is empty</p>
					</div>
				{/each}
			</div>

			<div class="flex items-center gap-3 bg-surface-container-lowest p-2 rounded-[1.5rem] border border-outline-variant/10 shadow-sm focus-within:ring-2 ring-primary/10 transition-all">
				{#if group.type === 'product'}
					<input
						bind:value={catNewName.product}
						class="flex-1 bg-transparent border-none px-4 py-2 text-sm font-bold placeholder:text-on-surface-variant/30 focus:ring-0"
						placeholder="Enter new group label..."
						onkeydown={(e) => {
							if (e.key === 'Enter') handleAddCategory('product');
						}}
					/>
				{:else}
					<input
						bind:value={catNewName.supply}
						class="flex-1 bg-transparent border-none px-4 py-2 text-sm font-bold placeholder:text-on-surface-variant/30 focus:ring-0"
						placeholder="Enter new group label..."
						onkeydown={(e) => {
							if (e.key === 'Enter') handleAddCategory('supply');
						}}
					/>
				{/if}
				<button
					onclick={() => handleAddCategory(group.type as 'product' | 'supply')}
					disabled={catSaving ||
						!(group.type === 'product' ? catNewName.product.trim() : catNewName.supply.trim())}
					class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.05] active:scale-95 disabled:opacity-40 disabled:grayscale disabled:hover:scale-100"
					><span class="material-symbols-outlined font-black">add</span></button
				>
			</div>
		</div>
	{/each}
</div>
