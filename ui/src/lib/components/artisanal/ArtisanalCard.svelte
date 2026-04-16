<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	interface Props {
		children: Snippet;
		class?: string;
		level?: 'lowest' | 'low' | 'high' | 'highest' | 'base';
        clickable?: boolean;
        onclick?: () => void;
	}

	let { children, class: className, level = 'lowest', clickable = false, onclick }: Props = $props();

	const levelClasses = {
		lowest: 'bg-surface-container-lowest',
		low: 'bg-surface-container-low',
		base: 'bg-surface',
		high: 'bg-surface-container-high',
		highest: 'bg-surface-container-highest'
	};
</script>

{#if clickable}
    <button
        {onclick}
        class={cn(
            'rounded-[2rem] p-[var(--card-padding,1.5rem)] text-left transition-all duration-300 active:scale-[0.98]',
            levelClasses[level],
            className
        )}
    >
        {@render children()}
    </button>
{:else}
    <div
        class={cn(
            'rounded-[2rem] p-[var(--card-padding,1.5rem)]',
            levelClasses[level],
            className
        )}
    >
        {@render children()}
    </div>
{/if}
