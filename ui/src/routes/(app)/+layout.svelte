<script lang="ts">
	import Sidebar from '$lib/components/artisanal/Sidebar.svelte';
	import TopBar from '$lib/components/artisanal/TopBar.svelte';
	import { pb } from '$lib/pocketbase';
	import { onMount } from 'svelte';

	let { children, data } = $props();
	let isSidebarOpen = $state(false);

	onMount(() => {
		if (typeof document !== 'undefined') {
			pb.authStore.loadFromCookie(document.cookie);
		}
		// categoriesState.init();

		// return () => {
		// 	categoriesState.unsubscribe();
		// };
	});
</script>

<div class="flex h-[100dvh] overflow-hidden bg-surface">
	<Sidebar isOpen={isSidebarOpen} onClose={() => (isSidebarOpen = false)} />

	<div class="flex min-w-0 flex-1 flex-col lg:ml-64">
		<TopBar user={data.user} onMenuClick={() => (isSidebarOpen = true)} />

		<main class="flex-1 overflow-y-auto no-scrollbar pt-16">
			{@render children()}
		</main>
	</div>
</div>

<style>
	:global(.no-scrollbar::-webkit-scrollbar) {
		display: none;
	}
	:global(.no-scrollbar) {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
