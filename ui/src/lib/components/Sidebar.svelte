<script lang="ts">
	import { page } from '$app/state';
	import { fileUrl, pb } from '$lib/pocketbase';
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	interface Props {
		isOpen?: boolean;
		onClose?: () => void;
		user?: any;
	}

	let { isOpen = false, onClose, user }: Props = $props();

	let bakeryName = $state('');
	let showAppInfo = $state(false);
	let showDev = $state(false);

	onMount(async () => {
		try {
			const info = await pb
				.collection('bakery_info')
				.getFirstListItem('', { requestKey: 'bakery-info' });
			bakeryName = info.name || '';
		} catch {
			// no bakery info set yet
		}
	});

	const navGroups = [
		{
			label: 'Operations',
			items: [
				{ label: 'Dashboard', href: '/', icon: 'dashboard' },
				{ label: 'POS', href: '/pos', icon: 'point_of_sale' }
			]
		},
		{
			label: 'Management',
			items: [
				{ label: 'Inventory', href: '/inventory', icon: 'inventory_2' },
				{ label: 'Procurement', href: '/restock', icon: 'local_shipping' },
				{ label: 'Finance', href: '/finance', icon: 'account_balance' },
				{ label: 'Analytics', href: '/reports', icon: 'query_stats' }
			]
		},
		{
			label: 'System',
			items: [{ label: 'Bakery Management', href: '/management', icon: 'admin_panel_settings' }]
		}
	];

	const bottomLinks = [
		{ label: 'Profile', href: '/profile', icon: 'person_outline' },
		{ label: 'Settings', href: '/settings', icon: 'settings' }
	];

	function isActive(href: string) {
		return page.url.pathname === href || (page.url.pathname.startsWith(href) && href !== '/');
	}
</script>

<!-- Mobile Overlay -->
{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		transition:fade={{ duration: 200 }}
		onclick={onClose}
		class="fixed inset-0 z-40 bg-on-surface/30 backdrop-blur-sm lg:hidden"
	></div>
{/if}

<!-- Sidebar — Stitch: bg-surface-container-low (#f3f0ec) -->
<aside
	class="fixed top-0 left-0 z-50 flex h-screen w-80 flex-col gap-4 bg-surface-container-low transition-transform duration-300 lg:translate-x-0 {isOpen
		? 'translate-x-0'
		: '-translate-x-full'}"
>
	<!-- Header: logo + bakery + user — edge-to-edge, subtle amber tint -->
	<div
		class="relative overflow-hidden border-b border-primary/10 bg-gradient-to-b from-primary/[0.2] to-primary/[0.02] pb-4"
	>
		<!-- Ambient glow -->
		<div
			class="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl"
		></div>

		<!-- Logo -->
		<div class="px-5 pt-4 pb-3">
			<a href="/" onclick={onClose} class="group block">
				<img
					src="/logo.png"
					alt="tinAPPay Bakery ERP"
					class="w-full object-contain transition-opacity duration-200 group-hover:opacity-75"
				/>
			</a>
		</div>

		<!-- Bakery + User -->
		<div class="flex flex-col gap-2 px-5">
			{#if bakeryName}
				<div class="flex items-center gap-1.5">
					<span
						class="material-symbols-outlined text-[14px] text-primary/50"
						style="font-variation-settings: 'FILL' 1;">storefront</span
					>
					<p
						class="truncate text-[10px] font-black tracking-widest text-on-surface-variant/60 uppercase"
					>
						{bakeryName}
					</p>
				</div>
			{/if}
			<div class="flex items-center gap-2.5">
				<div
					class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/15 bg-primary/10"
				>
					{#if user?.avatar}
						<img src={fileUrl(user, user.avatar)} alt="" class="h-full w-full object-cover" />
					{:else}
						<span class="material-symbols-outlined text-sm text-primary">person</span>
					{/if}
				</div>
				<div class="min-w-0">
					<p class="truncate text-sm leading-tight font-bold text-on-surface">
						{user?.name || 'Staff'}
					</p>
					<p
						class="text-[10px] leading-tight font-black tracking-widest text-on-surface-variant/50 uppercase"
					>
						{user?.role || 'staff'}
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Navigation -->
	<nav class="no-scrollbar flex-1 space-y-4 overflow-y-auto px-3 py-2">
		{#each navGroups as group}
			<div>
				<p
					class="mb-1 px-4 text-[9px] font-bold tracking-[0.2em] text-on-surface-variant/50 uppercase"
				>
					{group.label}
				</p>
				<div class="space-y-0.5">
					{#each group.items as item}
						{@const active = isActive(item.href)}
						<a
							href={item.href}
							onclick={onClose}
							class="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150
								{active
								? 'border-l-4 border-primary bg-primary-container/10 text-primary'
								: 'text-on-surface/70 hover:bg-surface-container-highest/60 hover:text-on-surface'}"
						>
							<span
								class="material-symbols-outlined text-xl"
								style="font-variation-settings: 'FILL' {active ? 1 : 0};">{item.icon}</span
							>
							<span class="font-semibold">{item.label}</span>
						</a>
					{/each}
				</div>
			</div>
		{/each}
	</nav>

	<!-- Bottom Panel -->
	<div class="shrink-0 border-t border-primary/10 px-3 pt-3 pb-4">
		<div class="space-y-0.5">
			{#each bottomLinks as item}
				{@const active = isActive(item.href)}
				<a
					href={item.href}
					onclick={onClose}
					class="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150
						{active
						? 'border-l-4 border-primary bg-primary-container/10 text-primary'
						: 'text-on-surface/70 hover:bg-surface-container-highest/60 hover:text-on-surface'}"
				>
					<span
						class="material-symbols-outlined text-xl"
						style="font-variation-settings: 'FILL' {active ? 1 : 0};">{item.icon}</span
					>
					<span class="font-semibold">{item.label}</span>
				</a>
			{/each}
			<button
				onclick={() => (showAppInfo = true)}
				class="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-on-surface/70 transition-all hover:bg-surface-container-highest/60 hover:text-on-surface"
			>
				<span class="material-symbols-outlined text-xl">info</span>
				<span class="text-sm font-semibold">About tinAPPay</span>
			</button>
		</div>

		<!-- App Info Button -->
	</div>
</aside>

<!-- App Info Modal -->
{#if showAppInfo}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/30 p-6 backdrop-blur-sm"
		onclick={() => {
			showAppInfo = false;
			showDev = false;
		}}
	>
		<div
			class="w-full max-w-sm rounded-[2rem] bg-surface shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header with gradient -->
			<div
				class="relative flex flex-col items-center overflow-hidden rounded-t-[2rem] bg-gradient-to-b from-primary/20 to-primary/5 px-8 pt-6 pb-5"
			>
				<div
					class="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl"
				></div>
				<div
					class="pointer-events-none absolute -bottom-4 -left-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl"
				></div>
				<img src="/logo.png" alt="tinAPPay" class="w-60 object-contain" />
			</div>

			<!-- Details -->
			<div class="divide-y divide-outline-variant/10 px-6 py-2">
				<div class="flex items-center justify-between py-3">
					<span class="text-xs font-bold text-on-surface-variant">Version</span>
					<span class="rounded-full bg-primary/10 px-3 py-0.5 text-[10px] font-black text-primary"
						>v1.0.0</span
					>
				</div>

				<!-- Developer — dropdown -->
				<div class="relative py-3">
					<button
						onclick={() => (showDev = !showDev)}
						class="flex w-full items-center justify-between transition-colors hover:text-primary"
					>
						<span class="text-xs font-bold text-on-surface-variant">Developer</span>
						<div class="flex items-center gap-2">
							<span class="text-xs font-black text-on-surface">jimcan92</span>
						</div>
					</button>
					{#if showDev}
						<div
							transition:scale={{ duration: 150, start: 0.95, opacity: 0 }}
							class="absolute top-full right-0 z-10 mt-1 w-full origin-top overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface shadow-xl"
						>
							<a
								href="mailto:jimcan051592@gmail.com"
								class="flex items-center gap-3 px-4 py-2.5 text-xs text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
							>
								<span class="material-symbols-outlined text-base">mail</span>
								jimcan051592@gmail.com
							</a>
							<a
								href="https://jimcan.online"
								target="_blank"
								rel="noopener noreferrer"
								class="flex items-center gap-3 border-t border-outline-variant/10 px-4 py-2.5 text-xs text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
							>
								<span class="material-symbols-outlined text-base">language</span>
								jimcan.online
							</a>
							<div class="flex items-center gap-1 border-t border-outline-variant/10 px-3 py-2">
								<a
									href="https://github.com/jimcan92"
									target="_blank"
									rel="noopener noreferrer"
									title="GitHub"
									class="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
								>
									<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"
										><path
											d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"
										/></svg
									>
								</a>
								<a
									href="https://www.facebook.com/jimcan009/"
									target="_blank"
									rel="noopener noreferrer"
									title="Facebook"
									class="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-[#1877F2]"
								>
									<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"
										><path
											d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
										/></svg
									>
								</a>
								<a
									href="https://www.youtube.com/@jimcan49"
									target="_blank"
									rel="noopener noreferrer"
									title="YouTube"
									class="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-[#FF0000]"
								>
									<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"
										><path
											d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
										/></svg
									>
								</a>
							</div>
						</div>
					{/if}
				</div>

				<div class="flex items-center justify-between py-3">
					<span class="text-xs font-bold text-on-surface-variant">Platform</span>
					<span class="text-xs font-semibold text-on-surface-variant/70"
						>SvelteKit · PocketBase</span
					>
				</div>
				<div class="flex items-center justify-between py-3">
					<span class="text-xs font-bold text-on-surface-variant">Released</span>
					<span class="text-xs font-semibold text-on-surface-variant/70">2026</span>
				</div>
			</div>

			<!-- Footer -->
			<div class="px-6 pt-2 pb-6 text-center">
				<p class="text-[10px] font-medium text-on-surface-variant/40">
					© 2026 jimcan92. Built with ☕ & flour.
				</p>
				<button
					onclick={() => (showAppInfo = false)}
					class="mt-4 w-full rounded-xl bg-surface-container-low py-2.5 text-sm font-bold text-on-surface-variant transition-all hover:bg-surface-container-highest"
				>
					Close
				</button>
			</div>
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
