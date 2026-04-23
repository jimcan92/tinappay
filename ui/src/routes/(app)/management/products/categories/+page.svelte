<script lang="ts">
	import { categoriesState } from '$lib/states/categories.svelte';
	import { onMount } from 'svelte';
	import CategoryManager from '../../../inventory/components/CategoryManager.svelte';

	onMount(() => categoriesState.init());
</script>

<svelte:head><title>Product Categories | Management</title></svelte:head>

<div class="no-scrollbar h-full overflow-y-auto px-6 py-8 md:px-10">
	<div class="max-w-xl">
		<CategoryManager filterType="product" />
	</div>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar { display: none; }
	.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
