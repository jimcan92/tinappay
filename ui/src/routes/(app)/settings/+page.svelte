<script lang="ts">
	import { goto } from '$app/navigation';
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
	import { pb, performLogout } from '$lib/pocketbase';
	import { branchesState } from '$lib/states/branches.svelte';
	import { settingsState } from '$lib/states/settings.svelte';
	import { ARTISANAL_THEMES, themeState } from '$lib/states/theme.svelte';
	import { toastState } from '$lib/states/toast.svelte';
	import { onMount } from 'svelte';

	let logoPreview = $state<string | null>(null);
	let newBranchName = $state('');
	let editingBranchId = $state<string | null>(null);
	let editingBranchName = $state('');
	let confirmDeleteBranchId = $state<string | null>(null);

	onMount(async () => {
		await Promise.all([settingsState.load(), branchesState.load()]);
	});

	async function handleLogout() {
		await performLogout();
		goto('/login');
	}

	async function onSaveBakery() {
		try {
			await settingsState.save();
			toastState.success('Bakery profile updated.');
		} catch {
			toastState.error('Failed to save bakery profile.');
		}
	}

	async function handleAddBranch() {
		if (!newBranchName.trim()) return;
		await branchesState.create(newBranchName.trim());
		newBranchName = '';
	}

	async function handleUpdateBranch(id: string) {
		if (!editingBranchName.trim()) return;
		await branchesState.update(id, editingBranchName.trim());
		editingBranchId = null;
		editingBranchName = '';
	}

	async function handleDeleteBranch(id: string) {
		if (confirmDeleteBranchId !== id) {
			confirmDeleteBranchId = id;
			return;
		}
		try {
			await branchesState.delete(id);
			toastState.success('Branch decommissioned.');
		} catch {
			toastState.error('Failed to delete branch.');
		} finally {
			confirmDeleteBranchId = null;
		}
	}

	function handleLogoChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			settingsState.bakery.logo = target.files[0];
			logoPreview = URL.createObjectURL(target.files[0]);
		}
	}
</script>

<svelte:head>
	<title>System Preferences | tinAPPay ERP</title>
</svelte:head>

<div class="mx-auto max-w-7xl animate-in px-6 py-10 duration-700 fade-in md:px-10">
	<header class="mb-12">
		<h1 class="mb-3 font-serif text-4xl font-black tracking-tight text-on-surface md:text-5xl">
			Preferences
		</h1>
		<p class="max-w-2xl text-lg leading-relaxed font-medium text-on-surface-variant">
			Customize your artisanal workspace and manage organizational units.
		</p>
	</header>

	<div class="mx-auto grid max-w-4xl grid-cols-1 items-start gap-10 lg:grid-cols-3">
		<!-- Right Side Section -->
		<!-- Appearance -->
		<ArtisanalCard level="high" class="border border-outline-variant/5 p-8 shadow-xl lg:col-span-2">
			<h3 class="mb-6 flex items-center gap-3 font-serif text-xl font-black text-on-surface">
				<span class="material-symbols-outlined text-primary">palette</span>
				Visuals
			</h3>

			<div class="space-y-6">
				<!-- Light/Dark Toggle -->
				<div class="space-y-3">
					<button
						onclick={() => themeState.setMode('light')}
						class="flex w-full items-center justify-between rounded-2xl border-2 p-4 transition-all {themeState.mode ===
						'light'
							? 'border-primary bg-white shadow-lg'
							: 'border-transparent bg-on-surface/5 hover:bg-on-surface/10'}"
					>
						<div class="flex items-center gap-4">
							<span class="material-symbols-outlined text-primary">light_mode</span>
							<div class="text-left">
								<p class="text-sm font-black tracking-widest uppercase">Day Shift</p>
								<p class="text-[9px] font-bold text-on-surface-variant">Optimal for day shifts</p>
							</div>
						</div>
						{#if themeState.mode === 'light'}
							<span
								class="material-symbols-outlined text-primary"
								style="font-variation-settings: 'FILL' 1;">check_circle</span
							>
						{/if}
					</button>

					<button
						onclick={() => themeState.setMode('dark')}
						class="flex w-full items-center justify-between rounded-2xl border-2 p-4 transition-all {themeState.mode ===
						'dark'
							? 'border-primary bg-on-surface/10 shadow-lg'
							: 'border-transparent bg-on-surface/5 hover:bg-on-surface/10'}"
					>
						<div class="flex items-center gap-4">
							<span class="material-symbols-outlined text-primary">dark_mode</span>
							<div class="text-left">
								<p class="text-sm font-black tracking-widest uppercase">Night Owl</p>
								<p class="text-[9px] font-bold text-on-surface-variant">
									Comfortable for early mornings
								</p>
							</div>
						</div>
						{#if themeState.mode === 'dark'}
							<span
								class="material-symbols-outlined text-primary"
								style="font-variation-settings: 'FILL' 1;">check_circle</span
							>
						{/if}
					</button>
				</div>

				<!-- Color Presets -->
				<div class="border-t border-outline-variant/10 pt-6">
					<p class="mb-4 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">
						Color Presets
					</p>
					<div class="grid grid-cols-4 gap-3">
						{#each Object.entries(ARTISANAL_THEMES) as [key, theme]}
							<button
								onclick={() => themeState.setTheme(key)}
								title={theme.name}
								class="aspect-square rounded-full border-4 transition-all hover:scale-110 {themeState.value ===
								key
									? 'border-white shadow-lg ring-2 ring-primary'
									: 'border-transparent shadow-sm'}"
								style="background-color: {theme.primary}"
							></button>
						{/each}
					</div>
				</div>
			</div>
		</ArtisanalCard>

		<!-- Security Vault -->
		<div
			class="group relative overflow-hidden rounded-[2.5rem] border-2 border-error/10 bg-error-container/5 p-8"
		>
			<div
				class="absolute -top-4 -right-4 rotate-12 opacity-5 transition-transform duration-700 group-hover:scale-110"
			>
				<span class="material-symbols-outlined text-[100px]">security</span>
			</div>
			<h3 class="relative z-10 mb-2 font-serif text-xl font-black text-error">Security Vault</h3>
			<p class="relative z-10 mb-8 text-xs leading-relaxed font-medium text-on-surface-variant">
				System session is secured via encrypted tokens. Update credentials carefully.
			</p>

			<div class="relative z-10 space-y-3">
				<button
					class="flex w-full items-center gap-3 rounded-xl border border-error/20 bg-white px-6 py-3 text-[10px] font-black tracking-widest text-error uppercase shadow-sm transition-all hover:bg-error hover:text-white active:scale-95"
				>
					<span class="material-symbols-outlined text-sm">lock_reset</span>
					Rotate Credentials
				</button>
				<button
					onclick={handleLogout}
					class="flex w-full items-center gap-3 rounded-xl bg-error px-6 py-3 text-[10px] font-black tracking-widest text-error text-white uppercase shadow-lg shadow-error/20 transition-all hover:scale-[1.02] active:scale-95"
				>
					<span class="material-symbols-outlined text-sm">logout</span>
					Sign Out System
				</button>
			</div>
		</div>
	</div>
</div>
