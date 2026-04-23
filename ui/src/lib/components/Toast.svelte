<script lang="ts">
	import { toastState } from '$lib/states/toast.svelte';
	import { fly } from 'svelte/transition';

	const icons: Record<string, string> = {
		success: 'check_circle',
		error: 'error',
		info: 'info'
	};

	const styles: Record<string, string> = {
		success: 'bg-surface-container-lowest border-tertiary/20 text-on-surface',
		error:   'bg-surface-container-lowest border-error/20 text-on-surface',
		info:    'bg-surface-container-lowest border-primary/15 text-on-surface'
	};

	const iconStyles: Record<string, string> = {
		success: 'text-tertiary',
		error:   'text-error',
		info:    'text-primary'
	};

	const barStyles: Record<string, string> = {
		success: 'bg-tertiary',
		error:   'bg-error',
		info:    'bg-primary'
	};
</script>

<div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none">
	{#each toastState.toasts as toast (toast.id)}
		<div
			transition:fly={{ y: 16, duration: 250 }}
			class="grain pointer-events-auto relative flex items-start gap-3.5 overflow-hidden rounded-2xl border px-4 py-3.5 shadow-[0_8px_24px_rgba(43,26,13,0.12)] backdrop-blur-xl {styles[toast.type]} min-w-[280px] max-w-[380px]"
		>
			<!-- Colored left accent -->
			<div class="absolute left-0 top-2 bottom-2 w-0.5 rounded-full {barStyles[toast.type]}"></div>

			<span
				class="material-symbols-outlined mt-0.5 flex-shrink-0 text-xl {iconStyles[toast.type]}"
				style="font-variation-settings: 'FILL' 1;"
			>
				{icons[toast.type]}
			</span>
			<p class="flex-1 text-sm font-bold leading-snug">{toast.message}</p>
			<button
				onclick={() => toastState.dismiss(toast.id)}
				class="flex-shrink-0 rounded-full p-0.5 text-on-surface-variant/40 transition-colors hover:bg-surface-container-high hover:text-on-surface"
				aria-label="Dismiss"
			>
				<span class="material-symbols-outlined text-base">close</span>
			</button>
		</div>
	{/each}
</div>
