<script lang="ts">
	import { page } from '$app/state';

	interface Props {
		title: string;
	}

	let { title }: Props = $props();

	// Crude breadcrumb logic based on URL
	let segments = $derived(page.url.pathname.split('/').filter(Boolean));
</script>

<div class="flex flex-col gap-1">
	<nav
		class="flex items-center gap-2 text-sm font-black tracking-widest text-on-surface-variant/40"
	>
		<a href="/inventory" class="transition-colors hover:text-primary">Manage Inventory</a>
		{#if segments.length > 1}
			{@const segment = segments[segments.length - 1]}
			<span class="material-symbols-outlined text-xs">chevron_right</span>
			<span class="text-on-surface-variant/60">{segment[0].toUpperCase() + segment.slice(1)}</span>
		{/if}
	</nav>
	<div class="flex items-center gap-4">
		{#if segments.length > 1}
			<a
				href="/inventory"
				class="flex h-10 w-10 items-center justify-center rounded-2xl border border-outline-variant/10 bg-surface text-on-surface-variant shadow-sm transition-all hover:bg-primary hover:text-on-primary active:scale-90"
			>
				<span class="material-symbols-outlined text-base">arrow_back</span>
			</a>
			<h2 class="font-serif text-3xl font-black tracking-tight text-on-surface md:text-4xl">
				{title}
			</h2>
		{/if}
	</div>
</div>
