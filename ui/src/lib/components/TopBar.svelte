<script lang="ts">
	import { goto } from '$app/navigation';
	import BranchDropdown from '$lib/components/BranchDropdown.svelte';
	import GlobalSearchBar from '$lib/components/GlobalSearchBar.svelte';
	import { fileUrl, pb } from '$lib/pocketbase';
	import { performLogout } from '$lib/states/attendance.svelte';
	import NotificationBell from '$lib/components/NotificationBell.svelte';
	import { branchesState } from '$lib/states/branches.svelte';
	import { settingsState } from '$lib/states/settings.svelte';
	import { onMount } from 'svelte';
	import { scale } from 'svelte/transition';

	interface Props {
		user: any;
		onMenuClick?: () => void;
	}

	let { user, onMenuClick }: Props = $props();

	let isDropdownOpen = $state(false);

	onMount(async () => {
		await settingsState.load();
		branchesState.load(settingsState.bakery.id);
	});

	async function handleLogout() {
		await performLogout();
		goto('/login');
	}

	async function updateBranch(branchId: string) {
		if (!user?.id) return;
		await branchesState.assignUserBranch(user.id, branchId);
		branchesState.selectedBranchId = branchId;
	}

	function handleOutsideClick(e: MouseEvent) {
		if (isDropdownOpen && !(e.target as HTMLElement).closest('.avatar-dropdown')) {
			isDropdownOpen = false;
		}
	}
</script>

<svelte:window onclick={handleOutsideClick} />

<header
	class="fixed top-0 right-0 left-0 z-30 flex h-16 items-center justify-between gap-4 bg-surface/80 px-6 shadow-[0px_12px_32px_rgba(47,47,44,0.06)] backdrop-blur-xl lg:left-80 lg:px-8"
>
	<div class="flex flex-1 items-center gap-4">
		<button
			onclick={onMenuClick}
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:bg-primary/20 active:scale-90 lg:hidden"
		>
			<span class="material-symbols-outlined">menu</span>
		</button>

		<GlobalSearchBar class="w-full max-w-md" />
	</div>

	<div class="flex items-center gap-2 md:gap-4">
		<div class="hidden md:block">
			<BranchDropdown
				selectedId={branchesState.selectedBranchId}
				side="bottom"
				variant="pill"
				onSelect={(id) => updateBranch(id)}
			/>
		</div>

		<div class="mx-1 h-8 w-[1px] bg-outline-variant/20 md:mx-2"></div>

		<a
			href="/pos"
			title="New Order"
			class="flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary to-primary/70 text-on-primary shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:shadow-primary/50 active:scale-95 sm:w-auto sm:px-4"
		>
			<span class="material-symbols-outlined text-[18px]">point_of_sale</span>
			<span class="hidden text-[10px] font-black tracking-[0.15em] uppercase sm:block"
				>New Order</span
			>
		</a>

		<NotificationBell />

		<!-- Avatar Dropdown -->
		<div class="avatar-dropdown relative">
			<button
				onclick={() => (isDropdownOpen = !isDropdownOpen)}
				class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/10 bg-primary/10 transition-all hover:ring-2 hover:ring-primary/30 active:scale-90 {isDropdownOpen
					? 'ring-2 ring-primary/30'
					: ''}"
			>
				{#if user?.avatar}
					<img
						class="h-full w-full object-cover"
						src={fileUrl(user, user.avatar)}
						alt={user.name}
					/>
				{:else}
					<span class="material-symbols-outlined text-sm text-primary">person</span>
				{/if}
			</button>

			{#if isDropdownOpen}
				<div
					transition:scale={{ duration: 200, start: 0.95, opacity: 0 }}
					class="absolute right-0 mt-3 w-64 origin-top-right rounded-[2rem] border border-outline-variant/10 bg-surface shadow-2xl"
				>
					<div
						class="overflow-hidden rounded-t-[2rem] border-b border-outline-variant/5 bg-surface-container-low p-6"
					>
						<p
							class="mb-3 text-[9px] font-black tracking-[0.2em] text-on-surface-variant uppercase"
						>
							tinAPPay ERP
						</p>
						<div class="flex items-center gap-4">
							<div
								class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-outline-variant/10 bg-white shadow-sm"
							>
								{#if user?.avatar}
									<img src={fileUrl(user, user.avatar)} alt="" class="h-full w-full object-cover" />
								{:else}
									<span class="material-symbols-outlined text-primary/30">person</span>
								{/if}
							</div>
							<div class="min-w-0">
								<p class="truncate font-serif font-black text-on-surface">
									{user?.name || 'Authorized Baker'}
								</p>
								<p class="truncate text-[10px] font-bold text-on-surface-variant/60">
									{user?.email}
								</p>
							</div>
						</div>
					</div>

					<div class="border-b border-outline-variant/5 bg-primary/5 p-4 md:hidden">
						<p class="mb-2 px-2 text-[8px] font-black tracking-widest text-primary uppercase">
							Active Station
						</p>
						<BranchDropdown
							selectedId={branchesState.selectedBranchId}
							side="bottom"
							variant="full"
							onSelect={(id) => updateBranch(id)}
						/>
					</div>

					<div class="p-2">
						<a
							href="/profile"
							onclick={() => (isDropdownOpen = false)}
							class="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-on-surface-variant transition-all hover:bg-surface-container-low hover:text-on-surface"
						>
							<span
								class="material-symbols-outlined text-lg transition-transform group-hover:scale-110"
								>person_outline</span
							>
							Staff Profile
						</a>
						<a
							href="/settings"
							onclick={() => (isDropdownOpen = false)}
							class="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-on-surface-variant transition-all hover:bg-surface-container-low hover:text-on-surface"
						>
							<span
								class="material-symbols-outlined text-lg transition-transform group-hover:scale-110"
								>settings</span
							>
							System Preferences
						</a>
					</div>

					<div class="overflow-hidden rounded-b-[2rem] bg-surface-container-low p-2">
						<button
							onclick={handleLogout}
							class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-error transition-all hover:bg-error/10"
						>
							<span class="material-symbols-outlined text-lg">logout</span>
							Sign Out
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</header>
