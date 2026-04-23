<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import { pb } from '$lib/pocketbase';
	import { onMount } from 'svelte';

	let { children, data } = $props();
	let isSidebarOpen = $state(false);

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

<style>
	:global(.no-scrollbar::-webkit-scrollbar) {
		display: none;
	}
	:global(.no-scrollbar) {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
