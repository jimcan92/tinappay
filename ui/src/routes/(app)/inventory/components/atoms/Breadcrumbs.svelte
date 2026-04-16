<script lang="ts">
	import { page } from "$app/state";

	interface Props {
		title: string;
	}

	let { title }: Props = $props();

	// Crude breadcrumb logic based on URL
	let segments = $derived(page.url.pathname.split('/').filter(Boolean));
</script>

<div class="flex flex-col gap-1">
	<nav class="flex items-center gap-2 text-[10px] font-black tracking-widest text-on-surface-variant/40 uppercase">
		<a href="/inventory" class="hover:text-primary transition-colors">Inventory</a>
		{#if segments.length > 1}
			<span class="material-symbols-outlined text-xs">chevron_right</span>
			<span class="text-on-surface-variant/70">{segments[segments.length - 1]}</span>
		{/if}
	</nav>
	<div class="flex items-center gap-4">
		{#if segments.length > 1}
			<a 
				href="/inventory"
				class="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/10 bg-white text-on-surface-variant hover:bg-primary hover:text-white transition-all shadow-sm"
			>
				<span class="material-symbols-outlined">arrow_back</span>
			</a>
		{/if}
		<h2 class="font-serif text-3xl font-black tracking-tight text-on-surface md:text-4xl">
			{title}
		</h2>
	</div>
</div>
