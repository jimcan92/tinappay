<script lang="ts">
	import { page } from "$app/state";
	import Breadcrumbs from "./components/atoms/Breadcrumbs.svelte";

	let { children } = $props();

	// Map URL paths to titles
	const titles: Record<string, string> = {
		'/inventory': 'Inventory Control',
		'/inventory/products': 'Products Catalog',
		'/inventory/supplies': 'Raw Supplies',
		'/inventory/categories': 'Category Manager'
	};

	let currentTitle = $derived(titles[page.url.pathname] || 'Inventory');
</script>

<div class="flex h-full w-full flex-col overflow-hidden bg-surface">
	<header class="flex-shrink-0 p-6 md:p-8 lg:px-10 lg:pt-10 lg:pb-6">
		<Breadcrumbs title={currentTitle} />
	</header>

	<div class="flex-1 overflow-hidden">
		{@render children()}
	</div>
</div>
