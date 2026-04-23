<script lang="ts">
	import favicon from '$lib/assets/favicon.png';
	import { onMount } from 'svelte';
	// Initialize theme state to apply data-theme on boot
	import { themeState } from '$lib/states/theme.svelte';
	import './layout.css';

	let { children } = $props();

	onMount(() => {
		themeState.init();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div class="min-h-screen bg-surface font-sans text-on-surface">
	<div class="pointer-events-none fixed inset-0 z-0">
		<div
			class="inset-inline-0 absolute h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]"
		></div>
		<div
			class="inset-block-0 absolute h-[500px] w-[500px] rounded-full bg-secondary/8 blur-[100px]"
		></div>
		<div
			class="absolute inset-0 opacity-[0.15]"
			style="background-image: radial-gradient(circle, #D7B58E 1px, transparent 1px); background-size: 40px 40px;"
		></div>
	</div>
	{@render children()}
</div>
