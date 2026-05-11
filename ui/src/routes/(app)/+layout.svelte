<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import { pb } from '$lib/pocketbase';
	import { appLayout, type UserRole } from '$lib/states/app-layout.svelte';
	import { onMount } from 'svelte';
	import { scale } from 'svelte/transition';

	let { children, data } = $props();
	let isSidebarOpen = $state(false);
	let isFabOpen = $state(false);

	onMount(() => {
		if (typeof document !== 'undefined') {
			pb.authStore.loadFromCookie(document.cookie);
		}
	});
</script>

<div class="flex">
	<!-- Sidebar Component -->
	<Sidebar isOpen={isSidebarOpen} onClose={() => (isSidebarOpen = false)} user={data.user} />

	<div
		class="flex h-screen flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(254,136,72,0.08),transparent_18rem)] lg:ml-80"
	>
		<!-- TopBar Component -->
		<TopBar user={data.user} onMenuClick={() => (isSidebarOpen = true)} />

		<!-- Main Content Area -->
		<main class="no-scrollbar flex-1 overflow-y-auto pt-16">
			{@render children?.()}
		</main>
	</div>
</div>

<Toast />

<!-- Demo Mode FAB (Admin Only) -->
{#if data.user?.role === 'admin' && appLayout.isDemoModeActive}
	<div class="fixed right-6 bottom-6 z-[100]">
		{#if isFabOpen}
			<!-- Dropdown Menu -->
			<div
				transition:scale={{ duration: 150, start: 0.9, opacity: 0 }}
				class="absolute right-0 bottom-16 mb-2 w-48 overflow-hidden rounded-3xl border border-primary/20 bg-surface shadow-2xl shadow-primary/20"
			>
				<div class="border-b border-primary/10 bg-primary/10 px-4 py-3">
					<p class="text-[10px] font-black tracking-widest text-primary uppercase">Switch Role</p>
				</div>
				<div class="p-1.5">
					{#each ['admin', 'staff', 'cashier', 'baker'] as role}
						<button
							onclick={() => {
								appLayout.setSimulatedRole(role as UserRole);
								isFabOpen = false;
							}}
							class="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-xs font-bold transition-all
                            {appLayout.simulatedRole === role ||
							(!appLayout.simulatedRole && role === 'admin')
								? 'bg-primary text-white'
								: 'text-on-surface-variant hover:bg-primary/10 hover:text-primary'}"
						>
							<span class="capitalize">{role}</span>
							{#if appLayout.simulatedRole === role || (!appLayout.simulatedRole && role === 'admin')}
								<span class="material-symbols-outlined text-sm">check</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>
			<!-- Overlay to close -->
			<button
				onclick={() => (isFabOpen = false)}
				class="fixed inset-0 z-[-1] cursor-default bg-transparent"
				aria-label="Close Role Switcher"
			></button>
		{/if}

		<!-- The Button -->
		<button
			onclick={() => (isFabOpen = !isFabOpen)}
			class="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-primary/30 transition-all hover:scale-110 active:scale-95"
		>
			<span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">
				{isFabOpen ? 'close' : 'manage_accounts'}
			</span>
			{#if appLayout.simulatedRole && appLayout.simulatedRole !== 'admin'}
				<span
					class="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-error text-[8px] font-black text-white ring-2 ring-white"
					>!</span
				>
			{/if}
		</button>
	</div>
{/if}

<style>
	:global(.no-scrollbar::-webkit-scrollbar) {
		display: none;
	}
	:global(.no-scrollbar) {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
