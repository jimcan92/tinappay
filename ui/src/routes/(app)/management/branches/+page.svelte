<script lang="ts">
	import { branchesState } from '$lib/states/branches.svelte';
	import { toastState } from '$lib/states/toast.svelte';
	import { onMount } from 'svelte';

	let confirmDeleteId = $state<string | null>(null);

	onMount(() => branchesState.load());

	async function handleDelete(id: string) {
		if (confirmDeleteId !== id) { confirmDeleteId = id; return; }
		try {
			await branchesState.delete(id);
			confirmDeleteId = null;
			toastState.success('Branch removed.');
		} catch {
			toastState.error('Failed to delete branch.');
		}
	}
</script>

<svelte:head><title>Branches | Management</title></svelte:head>

<div class="no-scrollbar h-full overflow-y-auto px-6 py-8 md:px-10">
	<div class="mx-auto max-w-2xl">

		<div class="mb-6 flex items-center justify-between">
			<p class="text-sm font-bold text-on-surface-variant">
				{branchesState.items.length} {branchesState.items.length === 1 ? 'branch' : 'branches'}
			</p>
			<a href="/management/branches/new" class="editorial-gradient flex items-center gap-2 rounded-full px-6 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-on-primary shadow-[0px_8px_24px_rgba(140,65,0,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0px_12px_32px_rgba(140,65,0,0.35)] active:translate-y-0">
				<span class="material-symbols-outlined text-sm">add</span>
				Add Branch
			</a>
		</div>

		<div class="space-y-3">
			{#each branchesState.items as branch}
				<div class="group flex items-center gap-4 rounded-[1.75rem] border border-outline-variant/10 bg-surface-container-lowest px-5 py-4 shadow-sm transition-all hover:border-primary/10 hover:shadow-md">
					<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
						<span class="material-symbols-outlined text-base text-primary" style="font-variation-settings:'FILL' 1">storefront</span>
					</div>
					<a href="/management/branches/{branch.id}" class="min-w-0 flex-1">
						<p class="font-bold text-on-surface">{branch.name}</p>
						{#if branch.location}
							<p class="mt-0.5 truncate text-xs font-medium text-on-surface-variant/60">{branch.location}</p>
						{/if}
						<div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
							{#if branch.expand?.manager}
								<p class="text-[10px] font-medium text-on-surface-variant/40">{branch.expand.manager.name || branch.expand.manager.email}</p>
							{/if}
							{#if branch.phone}
								<p class="text-[10px] font-medium text-on-surface-variant/40">{branch.phone}</p>
							{/if}
							{#if branch.lat && branch.lng}
								<span class="text-[10px] font-black text-primary/50">📍 Mapped</span>
							{/if}
						</div>
					</a>
					<div class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
						{#if confirmDeleteId === branch.id}
							<button onclick={() => handleDelete(branch.id)} class="rounded-xl bg-error px-3 py-1.5 text-xs font-black text-on-error transition-all hover:brightness-110">Confirm</button>
							<button onclick={() => (confirmDeleteId = null)} class="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container">
								<span class="material-symbols-outlined text-base">close</span>
							</button>
						{:else}
							<a href="/management/branches/{branch.id}" class="flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface">
								<span class="material-symbols-outlined text-base">edit</span>
							</a>
							<button onclick={() => handleDelete(branch.id)} class="flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-error/10 hover:text-error">
								<span class="material-symbols-outlined text-base">delete</span>
							</button>
						{/if}
					</div>
				</div>
			{/each}

			{#if branchesState.items.length === 0}
				<div class="flex flex-col items-center justify-center gap-3 py-20 text-center opacity-40">
					<span class="material-symbols-outlined text-5xl">location_off</span>
					<p class="font-serif text-lg font-black text-on-surface">No branches yet</p>
					<p class="text-sm text-on-surface-variant">Add your first branch to get started.</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar { display: none; }
	.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
