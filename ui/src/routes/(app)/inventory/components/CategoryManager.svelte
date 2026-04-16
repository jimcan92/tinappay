<script lang="ts">
	import type { CategoriesResponse } from '$lib/pocketbase-types';
	import { categoriesState } from '$lib/state/categories.svelte';

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

<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
	{#each [{ type: 'product', label: 'Product Categories', icon: 'bakery_dining', list: categoriesState.productCategories }, { type: 'supply', label: 'Supply Categories', icon: 'egg', list: categoriesState.supplyCategories }] as group}
		<div>
			<div class="mb-4 flex items-center gap-3">
				<span
					class="material-symbols-outlined text-primary"
					style="font-variation-settings: 'FILL' 1;">{group.icon}</span
				>
				<h3 class="font-serif text-lg font-black text-on-surface">{group.label}</h3>
				<span
					class="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-black text-on-surface-variant"
					>{group.list.length}</span
				>
			</div>

			<div class="mb-4 space-y-2">
				{#each group.list as cat}
					<div
						class="group flex items-center gap-3 rounded-2xl bg-surface-container-low px-5 py-3.5"
					>
						{#if catEditId === cat.id}
							<input
								bind:value={catEditName}
								class="flex-1 rounded-xl border-none bg-surface-container-lowest px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20"
								onkeydown={(e) => e.key === 'Enter' && handleRenameCategory(cat)}
							/>
							<button
								onclick={() => handleRenameCategory(cat)}
								disabled={catSaving}
								class="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-on-primary transition-all hover:scale-105"
								><span class="material-symbols-outlined text-sm">check</span></button
							>
							<button
								onclick={() => {
									catEditId = null;
									catEditName = '';
								}}
								class="flex h-8 w-8 items-center justify-center rounded-xl transition-all hover:bg-surface-container-high"
								><span class="material-symbols-outlined text-sm">close</span></button
							>
						{:else}
							<span class="flex-1 text-sm font-bold text-on-surface">{cat.name}</span>
							<div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
								<button
									onclick={() => {
										catEditId = cat.id;
										catEditName = cat.name;
									}}
									class="flex h-8 w-8 items-center justify-center rounded-xl text-primary transition-all hover:bg-primary/10"
									><span class="material-symbols-outlined text-sm">edit</span></button
								>
								<button
									onclick={() => categoriesState.delete(cat.id)}
									class="flex h-8 w-8 items-center justify-center rounded-xl text-error transition-all hover:bg-error/10"
									><span class="material-symbols-outlined text-sm">delete</span></button
								>
							</div>
						{/if}
					</div>
				{:else}
					<p class="py-4 text-center text-sm italic text-on-surface-variant/50">
						No {group.label.toLowerCase()} yet.
					</p>
				{/each}
			</div>

			<div class="flex items-center gap-3">
				{#if group.type === 'product'}
					<input
						bind:value={catNewName.product}
						class="flex-1 rounded-2xl border-2 border-dashed border-outline-variant/20 bg-surface-container-low px-5 py-3.5 text-sm font-medium placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20"
						placeholder="New product category name..."
						onkeydown={(e) => e.key === 'Enter' && handleAddCategory('product')}
					/>
				{:else}
					<input
						bind:value={catNewName.supply}
						class="flex-1 rounded-2xl border-2 border-dashed border-outline-variant/20 bg-surface-container-low px-5 py-3.5 text-sm font-medium placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20"
						placeholder="New supply category name..."
						onkeydown={(e) => e.key === 'Enter' && handleAddCategory('supply')}
					/>
				{/if}
				<button
					onclick={() => handleAddCategory(group.type as 'product' | 'supply')}
					disabled={catSaving ||
						!(group.type === 'product'
							? catNewName.product.trim()
							: catNewName.supply.trim())}
					class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
					><span class="material-symbols-outlined">add</span></button
				>
			</div>
		</div>
	{/each}
</div>
