<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	interface Props {
		children: Snippet;
		class?: string;
		variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
		size?: 'sm' | 'md' | 'lg' | 'xl';
		onclick?: () => void;
		disabled?: boolean;
        type?: 'button' | 'submit';
	}

	let { 
        children, 
        class: className, 
        variant = 'primary', 
        size = 'md', 
        onclick, 
        disabled = false,
        type = 'button'
    }: Props = $props();

	const variants = {
		primary: 'bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95',
		secondary: 'bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed-dim',
		outline: 'bg-transparent border border-outline-variant/30 text-on-surface hover:bg-surface-container-low',
		destructive: 'bg-error text-on-error shadow-lg shadow-error/20 hover:scale-[1.02] active:scale-95',
        ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
	};

	const sizes = {
		sm: 'px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl',
		md: 'px-6 py-3 text-sm font-bold rounded-full',
		lg: 'px-8 py-4 text-base font-black uppercase tracking-widest rounded-full',
		xl: 'px-10 py-5 text-lg font-black uppercase tracking-[0.2em] rounded-full'
	};
</script>

<button
	{onclick}
	{disabled}
    {type}
	class={cn(
		'inline-flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none',
		variants[variant],
		sizes[size],
		className
	)}
>
	{@render children()}
</button>
