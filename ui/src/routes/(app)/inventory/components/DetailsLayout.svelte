<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	interface Props {
		onClose: () => void;
		header?: Snippet;
		children: Snippet; // The main scrollable body
		footer?: Snippet;
	}

	let { onClose, header, children, footer }: Props = $props();

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onClose()} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<aside
	onclick={handleBackdropClick}
	class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4"
	transition:fade={{ duration: 150 }}
>
	<div
		class="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] bg-surface shadow-2xl sm:rounded-[2rem]"
		transition:scale={{ start: 0.97, duration: 200, opacity: 0 }}
	>
		{#if header}
			{@render header()}
		{/if}

		<div class="no-scrollbar flex-1 overflow-y-auto">
			{@render children()}
		</div>

		{#if footer}
			{@render footer()}
		{/if}
	</div>
</aside>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>