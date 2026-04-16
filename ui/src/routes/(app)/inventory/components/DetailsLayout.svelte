<script lang="ts">
	import type { Snippet } from 'svelte';

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

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<aside
	onclick={handleBackdropClick}
	class="fixed inset-0 z-50 flex items-end bg-black/30 backdrop-blur-sm lg:static lg:inset-auto lg:z-auto lg:flex lg:w-[440px] lg:items-stretch lg:border-l lg:border-outline-variant/10 lg:bg-transparent lg:backdrop-blur-none xl:w-[520px]"
>
	<div
		class="flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-[2rem] bg-surface shadow-2xl lg:h-full lg:max-h-none lg:rounded-none lg:shadow-none"
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
