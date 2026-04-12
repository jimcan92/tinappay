<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { pb } from '$lib/pocketbase';
	import Sidebar from '$lib/components/artisanal/Sidebar.svelte';
	import TopBar from '$lib/components/artisanal/TopBar.svelte';

	let { children, data } = $props();
    let isSidebarOpen = $state(false);

	onMount(() => {
		if (typeof document !== 'undefined') {
			pb.authStore.loadFromCookie(document.cookie);
		}

		if (!data.user) {
			goto('/login');
		}
	});
</script>

<div class="flex h-[100dvh] overflow-hidden bg-surface">
	<Sidebar isOpen={isSidebarOpen} onClose={() => isSidebarOpen = false} />

	<div class="flex-1 flex flex-col lg:ml-64 min-w-0">
		<TopBar user={data.user} onMenuClick={() => isSidebarOpen = true} />

		<main class="flex-1 overflow-y-auto pt-16">
			{@render children()}
		</main>
	</div>
</div>
