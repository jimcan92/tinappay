<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';

	let { children } = $props();

	const labels: Record<string, string> = {
		inventory: 'Inventory',
		products: 'Products',
		supplies: 'Supplies'
	};
</script>

<div class="flex h-full w-full flex-col overflow-hidden bg-surface">
	<header class="flex-shrink-0 border-b border-outline-variant/10 px-6 pb-0 pt-6 md:px-10 lg:pt-8">
		<PageHeader
			{labels}
			rootSubtitle="Real-time oversight of products, raw supplies, and stock movements."
		/>
	</header>

	<div class="flex-1 overflow-hidden">
		{@render children()}
	</div>
</div>
