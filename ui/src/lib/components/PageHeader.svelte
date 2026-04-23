<script lang="ts">
	import { page } from '$app/state';

	interface Props {
		labels?: Record<string, string>;
		resolveSegment?: (seg: string) => string | undefined;
		/** Subtitle shown only on the root page of the section. */
		rootSubtitle?: string;
	}

	let { labels = {}, resolveSegment, rootSubtitle }: Props = $props();

	const crumbs = $derived.by(() => {
		const parts = page.url.pathname.split('/').filter(Boolean);
		return parts.map((seg, i) => ({
			label: labels[seg] ?? resolveSegment?.(seg) ?? (seg[0].toUpperCase() + seg.slice(1)),
			href: '/' + parts.slice(0, i + 1).join('/')
		}));
	});

	const isRoot = $derived(crumbs.length <= 1);
</script>

<nav class="mb-4 flex h-4 items-center gap-1.5 text-[10px] font-black leading-none tracking-widest text-on-surface-variant/50 uppercase">
	{#each crumbs as crumb, i}
		{#if i < crumbs.length - 1}
			<a href={crumb.href} class="leading-none transition-colors hover:text-primary">{crumb.label}</a>
			<span class="material-symbols-outlined text-xs leading-none opacity-40">chevron_right</span>
		{:else}
			<span class="leading-none text-on-surface-variant">{crumb.label}</span>
		{/if}
	{/each}
</nav>

<div class="mb-5 flex h-10 items-center gap-4">
	{#if !isRoot}
		<a
			href={crumbs[crumbs.length - 2]?.href ?? '/'}
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-outline-variant/10 bg-surface text-on-surface-variant shadow-sm transition-all hover:bg-primary hover:text-on-primary active:scale-90"
		>
			<span class="material-symbols-outlined text-base">arrow_back</span>
		</a>
	{/if}
	<h1 class="font-serif text-3xl font-black leading-none tracking-tight text-on-surface md:text-4xl">
		{crumbs[crumbs.length - 1]?.label ?? ''}
	</h1>
</div>

{#if isRoot && rootSubtitle}
	<p class="mb-5 -mt-3 text-sm font-medium text-on-surface-variant">{rootSubtitle}</p>
{/if}
