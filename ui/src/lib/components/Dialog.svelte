<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	interface Props {
		open: boolean;
		title: string;
		onClose: () => void;
		children: Snippet;
		footer?: Snippet;
		size?: 'sm' | 'md' | 'lg';
	}

	let { open, title, onClose, children, footer, size = 'md' }: Props = $props();

	const maxW = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-2xl' };
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onClose()} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
		transition:fade={{ duration: 150 }}
	>
		<!-- Backdrop -->
		<button
			class="absolute inset-0 bg-black/40 backdrop-blur-sm"
			onclick={onClose}
			tabindex="-1"
			aria-label="Close"
		></button>

		<!-- Card -->
		<div
			class="relative z-10 flex w-full {maxW[size]} max-h-[92dvh] flex-col rounded-t-[2rem] bg-surface shadow-2xl sm:max-h-[88dvh] sm:rounded-[2rem]"
			transition:scale={{ start: 0.97, duration: 200, opacity: 0 }}
		>
			<header class="flex shrink-0 items-center justify-between border-b border-outline-variant/10 px-6 py-5">
				<h2 class="font-serif text-xl font-black tracking-tight text-on-surface">{title}</h2>
				<button
					onclick={onClose}
					class="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container"
				>
					<span class="material-symbols-outlined text-xl">close</span>
				</button>
			</header>

			<div class="no-scrollbar flex-1 overflow-y-auto p-6">
				{@render children()}
			</div>

			{#if footer}
				<footer class="shrink-0 border-t border-outline-variant/10 px-6 py-5">
					{@render footer()}
				</footer>
			{/if}
		</div>
	</div>
{/if}

<style>
	.no-scrollbar::-webkit-scrollbar { display: none; }
	.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
