<script lang="ts">
	import { page } from '$app/stores';
	import { pb } from '$lib/pocketbase';
	import { fly, fade } from 'svelte/transition';

    interface Props {
        isOpen?: boolean;
        onClose?: () => void;
    }

    let { isOpen = false, onClose }: Props = $props();

	const navItems = [
		{ label: 'Dashboard', href: '/', icon: 'dashboard' },
		{ label: 'POS', href: '/pos', icon: 'point_of_sale' },
		{ label: 'Inventory', href: '/inventory', icon: 'inventory_2' },
		{ label: 'Procurement', href: '/restock', icon: 'local_shipping' },
		{ label: 'Analytics', href: '/reports', icon: 'query_stats' },
		{ label: 'Users', href: '/users', icon: 'group' },
		{ label: 'Settings', href: '/settings', icon: 'settings' }
	];
</script>

<!-- Mobile Overlay (Backdrop) -->
{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
        transition:fade={{ duration: 200 }}
        onclick={onClose}
        class="fixed inset-0 z-40 bg-on-surface/40 backdrop-blur-sm lg:hidden"
    ></div>
{/if}

<!-- Sidebar -->
<aside 
    class="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-surface-container-low px-4 py-8 shadow-2xl transition-transform duration-300 lg:shadow-none lg:translate-x-0 {isOpen ? 'translate-x-0' : '-translate-x-full'}"
>
	<div class="mb-10 px-4 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary">
				<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">bakery_dining</span>
			</div>
			<div>
				<h1 class="text-lg font-bold leading-tight tracking-tight text-primary font-serif">TinAPPay</h1>
				<p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70">Artisanal Ledger</p>
			</div>
		</div>
        <!-- Mobile Close Button -->
        <button onclick={onClose} class="lg:hidden text-on-surface-variant hover:text-on-surface">
            <span class="material-symbols-outlined">close</span>
        </button>
	</div>

	<nav class="flex-1 space-y-1 overflow-y-auto no-scrollbar">
		{#each navItems as item}
			{@const isActive = $page.url.pathname === item.href || ($page.url.pathname.startsWith(item.href) && item.href !== '/')}
			<a
				href={item.href}
                onclick={onClose}
				class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all {isActive
					? 'bg-primary-container/10 text-primary border-l-4 border-primary shadow-sm'
					: 'text-on-surface/70 hover:bg-surface-container-highest'}"
			>
				<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' {isActive ? 1 : 0};">
					{item.icon}
				</span>
				<span class="font-bold text-sm">{item.label}</span>
			</a>
		{/each}
	</nav>

	<div class="mt-6 border-t border-outline-variant/10 pt-6">
		<a
            href="/pos"
            onclick={onClose}
			class="flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary to-primary-container py-4 font-black uppercase tracking-widest text-[10px] text-on-primary shadow-lg transition-all active:scale-95"
		>
			<span class="material-symbols-outlined text-sm">add</span>
			New Batch
		</a>
	</div>
</aside>
