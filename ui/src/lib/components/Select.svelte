<script lang="ts">
	import { fly } from 'svelte/transition';

	interface Option {
		value: string;
		label: string;
		action?: boolean;
	}

	interface Props {
		value?: string;
		options: Option[];
		placeholder?: string;
		class?: string;
		onchange?: (value: string) => void;
	}

	let {
		value = $bindable(''),
		options,
		placeholder = 'Select…',
		class: className = '',
		onchange
	}: Props = $props();

	let open = $state(false);
	let triggerEl: HTMLButtonElement;
	let dropdownStyle = $state('');

	const selected = $derived(options.find((o) => o.value === value));
	const regularOptions = $derived(options.filter((o) => !o.action));
	const actionOptions = $derived(options.filter((o) => o.action));

	function pick(val: string) {
		value = val;
		onchange?.(val);
		open = false;
	}

	function toggleOpen() {
		if (!open) {
			const rect = triggerEl.getBoundingClientRect();
			const spaceBelow = window.innerHeight - rect.bottom;
			const spaceAbove = rect.top;
			const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
			const maxH = Math.max((openUp ? spaceAbove : spaceBelow) - 16, 120);
			dropdownStyle = openUp
				? `position:fixed;bottom:${window.innerHeight - rect.top + 6}px;left:${rect.left}px;width:${rect.width}px;max-height:${maxH}px;`
				: `position:fixed;top:${rect.bottom + 6}px;left:${rect.left}px;width:${rect.width}px;max-height:${maxH}px;`;
		}
		open = !open;
	}

	function onOutsideClick(e: MouseEvent) {
		if (!triggerEl?.contains(e.target as Node)) open = false;
	}
</script>

<svelte:window onclick={onOutsideClick} />

<div data-select class="relative min-w-0 {className}">
	<button
		bind:this={triggerEl}
		type="button"
		onclick={toggleOpen}
		onkeydown={(e) => e.key === 'Escape' && (open = false)}
		class="flex h-12 w-full items-center justify-between rounded-full bg-surface-container-low px-5 text-sm font-bold text-on-surface shadow-inner transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 {open ? 'ring-2 ring-primary/20' : ''}"
	>
		<span class={selected ? 'text-on-surface' : 'text-on-surface-variant/40'}>
			{selected?.label ?? placeholder}
		</span>
		<span class="material-symbols-outlined text-base text-on-surface-variant/40 transition-transform duration-200 {open ? 'rotate-180' : ''}">
			expand_more
		</span>
	</button>

	{#if open}
		<div
			transition:fly={{ y: -6, duration: 150, opacity: 0 }}
			style={dropdownStyle}
			class="z-[200] flex flex-col overflow-hidden rounded-[2rem] border border-outline-variant/10 bg-surface shadow-xl"
		>
			<div class="no-scrollbar overflow-y-auto p-2 pb-3">
				{#each regularOptions as opt}
					<button
						type="button"
						onclick={() => pick(opt.value)}
						class="flex w-full items-center gap-2 rounded-full px-4 py-2.5 text-left text-sm font-bold transition-colors
							{value === opt.value
								? 'bg-primary text-on-primary'
								: 'text-on-surface hover:bg-surface-container-low'}"
					>
						{#if value === opt.value}
							<span class="material-symbols-outlined text-base">check</span>
						{:else}
							<span class="w-5"></span>
						{/if}
						{opt.label}
					</button>
				{/each}
			</div>

			{#if actionOptions.length > 0}
				<div class="border-t border-outline-variant/10 bg-surface-container-low/40 p-2">
					{#each actionOptions as opt}
						<button
							type="button"
							onclick={() => pick(opt.value)}
							class="flex w-full items-center gap-2 rounded-full px-4 py-2.5 text-left text-sm font-bold text-primary transition-colors hover:bg-primary/10"
						>
							<span class="material-symbols-outlined text-base">add</span>
							{opt.label}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.no-scrollbar::-webkit-scrollbar { display: none; }
	.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
