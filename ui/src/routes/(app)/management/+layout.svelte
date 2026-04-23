<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { branchesState } from '$lib/states/branches.svelte';

	let { children } = $props();

	const labels: Record<string, string> = {
		management: 'Bakery Management',
		bakery: 'Bakery Info',
		branches: 'Branches',
		staff: 'Staff',
		attendance: 'Attendance',
		products: 'Products',
		supplies: 'Supplies',
		categories: 'Categories',
		new: 'New Branch'
	};
</script>

<div class="flex h-full w-full flex-col overflow-hidden bg-surface">
	<header class="flex-shrink-0 border-b border-outline-variant/10 px-6 pt-6 pb-0 md:px-10 lg:pt-8">
		<PageHeader
			{labels}
			resolveSegment={(seg) => branchesState.items.find((b) => b.id === seg)?.name}
			rootSubtitle="Bakery profile, catalog, branch network, and staff."
		/>
	</header>

	<div class="h-full flex-1 overflow-hidden">
		{@render children()}
	</div>
</div>
