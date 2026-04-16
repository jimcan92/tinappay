<script lang="ts">
	import CategoryManager from '../components/CategoryManager.svelte';
	import { categoriesState } from '$lib/state/categories.svelte';
	import { onMount } from 'svelte';

	onMount(async () => {
		await categoriesState.init();
	});
</script>

<svelte:head>
	<title>Categories | TinAPPay</title>
</svelte:head>

<div class="no-scrollbar h-full overflow-y-auto px-6 pb-10 md:px-8 lg:px-10">
	<div class="max-w-4xl mx-auto lg:mx-0">
		<CategoryManager />
	</div>
</div>
