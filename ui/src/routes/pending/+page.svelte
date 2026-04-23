<script lang="ts">
	import { pb, performLogout } from '$lib/pocketbase';
	import { goto } from '$app/navigation';

	let { data } = $props();
	const user = $derived(data.user);

	async function logout() {
		await performLogout();
		goto('/login');
	}
</script>

<svelte:head>
	<title>Pending Approval | tinAPPay</title>
</svelte:head>

<div class="flex min-h-dvh flex-col items-center justify-center bg-surface px-6 py-12">

	<!-- Animated waiting illustration -->
	<div class="relative mb-8 flex h-48 w-48 items-center justify-center">
		<!-- Very subtle outer pulse -->
		<div class="absolute inset-0 rounded-full bg-primary/5 animate-ping" style="animation-duration: 5s;"></div>
		<!-- Very subtle inner pulse, offset timing -->
		<div class="absolute inset-8 rounded-full bg-primary/5 animate-ping" style="animation-duration: 5s; animation-delay: 2.5s;"></div>
		<!-- Big hourglass -->
		<span
			class="hourglass-icon material-symbols-outlined text-primary/60"
			style="font-size: 7rem; font-variation-settings:'FILL' 1; line-height: 1;"
		>
			hourglass_bottom
		</span>
	</div>

	<!-- Logo -->
	<img src="/logo.png" alt="tinAPPay" class="mb-4 h-20 w-auto object-contain opacity-80" />


	<!-- Heading -->
	<h1 class="mb-3 text-center font-serif text-3xl font-black tracking-tight text-on-surface">
		Waiting for Approval
	</h1>

	<!-- Subtext -->
	<p class="mb-8 max-w-xs text-center text-sm font-medium leading-relaxed text-on-surface-variant/70">
		Your account has been created. An admin needs to assign your role before you can access the system.
	</p>

	<!-- User card -->
	<div class="mb-8 flex w-full max-w-xs items-center gap-4 rounded-[1.5rem] border border-outline-variant/10 bg-surface-container-lowest px-5 py-4 shadow-sm">
		<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
			<span class="material-symbols-outlined text-base text-primary" style="font-variation-settings:'FILL' 1">
				person
			</span>
		</div>
		<div class="min-w-0">
			{#if user?.name}
				<p class="truncate font-bold text-on-surface">{user.name}</p>
			{/if}
			<p class="truncate text-xs font-medium text-on-surface-variant/60">{user?.email}</p>
		</div>
		<span class="shrink-0 rounded-lg bg-surface-container px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-on-surface-variant/50">
			Unassigned
		</span>
	</div>

	<!-- What to do -->
	<div class="mb-8 w-full max-w-xs rounded-[1.5rem] border border-outline-variant/10 bg-surface-container-lowest p-5">
		<p class="mb-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">What's next?</p>
		<div class="space-y-3">
			{#each [
				{ icon: 'admin_panel_settings', text: 'Contact your bakery admin' },
				{ icon: 'manage_accounts', text: 'Ask them to assign your role in Staff management' },
				{ icon: 'refresh', text: 'Refresh this page once assigned' }
			] as step}
				<div class="flex items-center gap-3">
					<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/5">
						<span class="material-symbols-outlined text-sm text-primary/60">{step.icon}</span>
					</div>
					<p class="text-xs font-medium text-on-surface-variant/70">{step.text}</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- Actions -->
	<div class="flex w-full max-w-xs flex-col gap-2">
		<button
			onclick={() => window.location.reload()}
			class="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary/10 text-sm font-black text-primary transition-all hover:bg-primary/20 active:scale-95"
		>
			<span class="material-symbols-outlined text-base">refresh</span>
			Check Again
		</button>
		<button
			onclick={logout}
			class="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-on-surface-variant/50 transition-all hover:text-on-surface-variant active:scale-95"
		>
			<span class="material-symbols-outlined text-base">logout</span>
			Sign Out
		</button>
	</div>

</div>

<style>
	.hourglass-icon {
		animation: hourglass-flip 2.6s linear infinite;
	}

	@keyframes hourglass-flip {
		/* pause at 0° */
		0%   { transform: rotate(0deg);   animation-timing-function: linear; }
		8%   { transform: rotate(0deg);   animation-timing-function: cubic-bezier(0.76, 0, 0.24, 1); }
		/* flip to 180° — fast burst in the middle, slow at ends */
		50%  { transform: rotate(180deg); animation-timing-function: linear; }
		/* pause at 180° */
		58%  { transform: rotate(180deg); animation-timing-function: cubic-bezier(0.76, 0, 0.24, 1); }
		/* flip back to 360° */
		100% { transform: rotate(360deg); }
	}
</style>
