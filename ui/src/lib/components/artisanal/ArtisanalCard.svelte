<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		level?: 'lowest' | 'low' | 'medium' | 'high';
		class?: string;
		clickable?: boolean;
		onclick?: (e: MouseEvent) => void;
	}

	let { children, level = 'medium', class: className = '', clickable = false, onclick }: Props = $props();

	const bgLevels = {
		lowest: 'bg-surface-container-lowest',
		low:    'bg-surface-container-low',
		medium: 'bg-surface-container',
		high:   'bg-surface-container-high'
	};

	// Stitch ambient shadow: rgba(47,47,44,0.06) — never pure black
	const shadowLevels = {
		lowest: 'shadow-[0px_4px_16px_rgba(47,47,44,0.04)]',
		low:    'shadow-[0px_8px_24px_rgba(47,47,44,0.05)]',
		medium: 'shadow-[0px_12px_32px_rgba(47,47,44,0.06)]',
		high:   'shadow-[0px_24px_48px_rgba(47,47,44,0.08)]'
	};

	let hasPadding = $derived(
		className.includes('p-') ||
		className.includes('pt-') ||
		className.includes('pb-') ||
		className.includes('px-') ||
		className.includes('py-')
	);
	let paddingClass = $derived(hasPadding ? '' : 'p-8');
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	{onclick}
	class="grain relative rounded-[2rem] transition-all duration-300 {bgLevels[level]} {shadowLevels[level]} {paddingClass} {className} {clickable ? 'cursor-pointer hover:shadow-[0px_16px_40px_rgba(47,47,44,0.10)] active:scale-[0.98]' : ''}"
>
	{@render children()}
</div>
