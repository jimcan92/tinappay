<script lang="ts">
	import { goto } from '$app/navigation';
	import { pb, fileUrl } from '$lib/pocketbase';
	import { branchesState } from '$lib/states/branches.svelte';
	import { inventoryState } from '$lib/states/inventory.svelte';
	import { settingsState } from '$lib/states/settings.svelte';
	import { usersState } from '$lib/states/users.svelte';
	import { onMount } from 'svelte';

	let loading = $state(true);

	onMount(async () => {
		await settingsState.load();
		await Promise.all([
			branchesState.load(settingsState.bakery.id),
			usersState.init(),
			inventoryState.init()
		]);
		loading = false;
	});

	let staffByRole = $derived({
		admin: usersState.allUsers.filter((u) => u.role === 'admin').length,
		cashier: usersState.allUsers.filter((u) => u.role === 'cashier').length,
		baker: usersState.allUsers.filter((u) => u.role === 'baker').length,
		staff: usersState.allUsers.filter((u) => u.role === 'staff').length
	});
</script>

<svelte:head>
	<title>Management | tinAPPay ERP</title>
</svelte:head>

<div class="no-scrollbar h-full overflow-y-auto px-6 py-8 md:px-10">
	<div class="mx-auto max-w-5xl space-y-4">
		<!-- Bakery Info banner -->
		<a
			href="/management/bakery"
			class="group relative flex items-center gap-6 overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-to-br from-primary to-primary/70 p-6 shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] hover:shadow-primary/30 active:scale-[0.99]"
		>
			<div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
			<div
				class="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/20 bg-white/10 shadow-inner"
			>
				{#if settingsState.bakery.logo && typeof settingsState.bakery.logo === 'string'}
					<img
						src={fileUrl(settingsState.bakery, settingsState.bakery.logo)}
						alt="Logo"
						class="h-full w-full object-cover"
					/>
				{:else}
					<span
						class="material-symbols-outlined text-3xl text-on-primary/60"
						style="font-variation-settings:'FILL' 1">storefront</span
					>
				{/if}
			</div>
			<div class="relative z-10 min-w-0 flex-1">
				<p class="text-[10px] font-black tracking-[0.2em] text-on-primary/60 uppercase">
					Bakery Profile
				</p>
				<h2 class="mt-0.5 truncate font-serif text-2xl font-black tracking-tight text-on-primary">
					{settingsState.bakery.name || 'Unnamed Bakery'}
				</h2>
				{#if settingsState.bakery.description}
					<p class="mt-1 truncate text-sm font-medium text-on-primary/70">
						{settingsState.bakery.description}
					</p>
				{/if}
			</div>
			<span
				class="material-symbols-outlined relative z-10 text-on-primary/40 transition-transform group-hover:translate-x-1"
				>chevron_right</span
			>
		</a>

		<!-- Branches + Staff row -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<!-- Branches -->
			<a
				href="/management/branches"
				class="group rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md active:scale-[0.98]"
			>
				<div class="mb-5 flex items-center justify-between">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-on-primary"
					>
						<span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1"
							>location_on</span
						>
					</div>
					<span
						class="material-symbols-outlined text-on-surface-variant/20 transition-all group-hover:translate-x-1 group-hover:text-primary"
						>chevron_right</span
					>
				</div>
				<p class="font-serif text-4xl font-black tracking-tighter text-on-surface">
					{branchesState.items.length}
				</p>
				<p class="mt-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">
					Branches
				</p>
				{#if branchesState.items.length > 0}
					<p class="mt-3 truncate text-xs font-medium text-on-surface-variant/50">
						{branchesState.items.map((b) => b.name).join(', ')}
					</p>
				{:else}
					<p class="mt-3 text-xs font-medium text-on-surface-variant/40">No branches yet</p>
				{/if}
			</a>

			<!-- Staff -->
			<a
				href="/management/staff"
				class="group rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md active:scale-[0.98]"
			>
				<div class="mb-5 flex items-center justify-between">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-on-primary"
					>
						<span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1"
							>group</span
						>
					</div>
					<span
						class="material-symbols-outlined text-on-surface-variant/20 transition-all group-hover:translate-x-1 group-hover:text-primary"
						>chevron_right</span
					>
				</div>
				<p class="font-serif text-4xl font-black tracking-tighter text-on-surface">
					{usersState.allUsers.length}
				</p>
				<p class="mt-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">
					Staff Members
				</p>
				<div class="mt-3 flex gap-3">
					{#each [['admin', staffByRole.admin], ['cashier', staffByRole.cashier], ['baker', staffByRole.baker], ['staff', staffByRole.staff]] as [role, count]}						<span
							class="rounded-lg bg-surface-container px-2.5 py-1 text-[9px] font-black tracking-widest text-on-surface-variant uppercase"
						>
							{count}
							{role}
						</span>
					{/each}
				</div>
			</a>

		</div>

		<!-- Products + Supplies row -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<!-- Products -->
			<div
				role="link"
				tabindex="0"
				onclick={() => goto('/management/products')}
				onkeydown={(e) => e.key === 'Enter' && goto('/management/products')}
				class="group cursor-pointer rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md active:scale-[0.98]"
			>
				<div class="mb-5 flex items-center justify-between">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-on-primary"
					>
						<span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1"
							>bakery_dining</span
						>
					</div>
					<a
						href="/management/products/categories"
						onclick={(e) => e.stopPropagation()}
						class="rounded-xl bg-surface-container px-3 py-1.5 text-[9px] font-black tracking-widest text-on-surface-variant uppercase transition-all hover:bg-primary hover:text-on-primary"
					>
						Categories
					</a>
				</div>
				<p class="font-serif text-4xl font-black tracking-tighter text-on-surface">
					{inventoryState.products.items.length}
				</p>
				<p class="mt-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">
					Products
				</p>
				<p class="mt-3 text-xs font-medium text-on-surface-variant/50">Manage product catalog →</p>
			</div>

			<!-- Supplies -->
			<div
				role="link"
				tabindex="0"
				onclick={() => goto('/management/supplies')}
				onkeydown={(e) => e.key === 'Enter' && goto('/management/supplies')}
				class="group cursor-pointer rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md active:scale-[0.98]"
			>
				<div class="mb-5 flex items-center justify-between">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-on-primary"
					>
						<span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1"
							>inventory_2</span
						>
					</div>
					<a
						href="/management/supplies/categories"
						onclick={(e) => e.stopPropagation()}
						class="rounded-xl bg-surface-container px-3 py-1.5 text-[9px] font-black tracking-widest text-on-surface-variant uppercase transition-all hover:bg-primary hover:text-on-primary"
					>
						Categories
					</a>
				</div>
				<p class="font-serif text-4xl font-black tracking-tighter text-on-surface">
					{inventoryState.supplies.items.length}
				</p>
				<p class="mt-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">
					Supplies
				</p>
				<p class="mt-3 text-xs font-medium text-on-surface-variant/50">Manage raw materials →</p>
			</div>
		</div>
	</div>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
