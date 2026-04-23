<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		onclick?: (e: MouseEvent) => void;
		disabled?: boolean;
		class?: string;
		variant?: 'primary' | 'outline' | 'ghost';
        size?: 'sm' | 'md' | 'lg';
	}

	let {
		children,
		onclick,
		disabled = false,
		class: className = '',
		variant = 'primary',
        size = 'md'
	}: Props = $props();

	const variants = {
		primary:
			'editorial-gradient text-on-primary shadow-[0px_8px_24px_rgba(140,65,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0px_12px_32px_rgba(140,65,0,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0px_4px_12px_rgba(140,65,0,0.2)]',
		outline:
			'border-2 border-primary text-primary bg-transparent hover:bg-primary/5 active:bg-primary/10',
		ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-container-high active:bg-surface-container-highest'
	};

    const sizes = {
        sm: 'px-6 py-2.5 text-[9px]',
        md: 'px-8 py-3.5 text-[10px]',
        lg: 'px-10 py-5 text-xs'
    };
</script>

<button
	{onclick}
	{disabled}
	class="flex items-center justify-center gap-3 rounded-full font-black uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0 {variants[
		variant
	]} {sizes[size]} {className}"
>
	{@render children()}
</button>
