<script lang="ts">
	import { pb } from '$lib/pocketbase';

	let loading = $state(false);
	let error = $state('');

	async function autoClockIn() {
		const user = pb.authStore.record;
		if (!user?.id || !user?.role || !user?.branch) return;
		try {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const todayStr = today.toISOString().replace('T', ' ').split('.')[0];
			const existing = await pb
				.collection('attendance')
				.getFirstListItem(`user = '${user.id}' && clock_in >= '${todayStr}' && clock_out = ''`)
				.catch(() => null);
			if (!existing) {
				const now = new Date().toISOString().replace('T', ' ').split('.')[0];
				await pb.collection('attendance').create({
					user: user.id,
					clock_in: now,
					...(user.branch && { branch: user.branch })
				});
			}
		} catch {
			/* attendance is secondary to login */
		}
	}

	async function loginWithGoogle() {
		loading = true;
		error = '';
		try {
			await pb.collection('users').authWithOAuth2({ provider: 'google' });
			document.cookie = pb.authStore.exportToCookie({ httpOnly: false, path: '/' });
			await autoClockIn();
			window.location.href = '/';
		} catch (err: any) {
			loading = false;
			error = err?.message?.includes('popup') ? '' : 'Google login failed. Please try again.';
		}
	}
</script>

<svelte:head>
	<title>Sign In | tinAPPay ERP</title>
</svelte:head>

<div class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
	<!-- Decorative Bakery Icons -->
	<div class="pointer-events-none absolute top-12 left-12 hidden opacity-[0.03] lg:block">
		<span
			class="material-symbols-outlined -rotate-12 text-[12rem] text-primary"
			style="font-variation-settings: 'FILL' 1;">bakery_dining</span
		>
	</div>
	<div class="pointer-events-none absolute right-12 bottom-12 hidden opacity-[0.03] lg:block">
		<span
			class="material-symbols-outlined rotate-12 text-[14rem] text-primary"
			style="font-variation-settings: 'FILL' 1;">breakfast_dining</span
		>
	</div>

	<!-- Main Login Card -->
	<div class="flex min-h-0 flex-1 flex-col items-center justify-center">
		<div class="relative z-10 w-full max-w-[440px]">
			<div
				class="grain relative flex flex-col items-center overflow-hidden rounded-[3rem] border border-outline-variant/10 bg-gradient-to-br from-primary/50 to-primary/10 p-10 shadow-[0_32px_80px_rgba(43,26,13,0.12)] backdrop-blur-3xl md:p-12"
			>
				<!-- Branding Header -->
				<img
					src="/tinAPPay_v.png"
					alt="tinAPPay"
					class="relative h-48 object-contain transition-transform group-hover:scale-105"
				/>
				<!-- Instructions -->
				<div class="mb-8 space-y-4 text-center">
					<div class="rounded-2xl border border-primary/10 bg-primary/5 p-4">
						<p
							class="text-[10px] leading-relaxed font-bold tracking-wider text-on-surface/60 uppercase"
						>
							Login with your Google account then wait for the admin to confirm.
						</p>
					</div>
					<p class="text-[9px] font-medium text-on-surface-variant/70 italic">
						Once confirmed, this will be the basis for your attendance. Logging in will auto
						clock-in, and logging out will auto clock-out.
					</p>
				</div>
				<!-- Error Feedback -->
				{#if error}
					<div
						class="mb-8 animate-in rounded-2xl border border-error/10 bg-error-container/10 p-4 text-center fade-in slide-in-from-top-2"
					>
						<p class="text-[10px] font-black tracking-widest text-error uppercase">{error}</p>
					</div>
				{/if}
				<!-- Auth Actions -->
				<button
					onclick={loginWithGoogle}
					disabled={loading}
					class="group relative w-full overflow-hidden rounded-full bg-white p-[1px] shadow-lg transition-all hover:shadow-primary/25 active:scale-95 disabled:opacity-50"
				>
					<div class="absolute inset-0 bg-gray-200 transition-colors group-hover:bg-gray-300"></div>
					<div
						class="relative flex items-center justify-center gap-4 rounded-full bg-white px-8 py-4.5 text-sm font-black text-gray-700 transition-colors group-hover:bg-gray-50"
					>
						{#if loading}
							<span
								class="material-symbols-outlined animate-spin text-xl text-[#4285F4]"
								style="animation-duration:0.8s">progress_activity</span
							>
							<span class="text-gray-500">Verifying...</span>
						{:else}
							<svg width="20" height="20" viewBox="0 0 18 18">
								<path
									d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
									fill="#4285F4"
								/>
								<path
									d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
									fill="#34A853"
								/>
								<path
									d="M3.964 10.705c-.181-.54-.285-1.114-.285-1.705s.104-1.165.285-1.705V4.963H.957C.347 6.178 0 7.548 0 9c0 1.452.347 2.822.957 4.037l3.007-2.332z"
									fill="#FBBC05"
								/>
								<path
									d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.582C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.963L3.964 7.295C4.672 5.168 6.656 3.58 9 3.58z"
									fill="#EA4335"
								/>
							</svg>
							Continue with Google
						{/if}
					</div>
				</button>
				<!-- Support Section -->
				<div class="mt-4 space-y-4 text-center">
					<p class="text-[9px] font-black tracking-[0.2em] text-on-surface-variant/40 uppercase">
						Need assistance?
					</p>
					<a
						class="inline-flex items-center gap-2 rounded-2xl border border-outline-variant/5 bg-surface-container/50 px-6 py-3 text-[10px] font-black tracking-widest text-primary uppercase transition-all hover:bg-primary/5 active:scale-95"
						href="mailto:jimcan051592@gmail.com"
					>
						<span class="material-symbols-outlined text-sm">support_agent</span>
						Contact Support
					</a>
				</div>
			</div>
			<p
				class="mt-8 text-center text-[9px] font-black tracking-[0.5em] text-on-surface-variant/20 uppercase"
			>
				Modernizing the way you bake
			</p>
		</div>
	</div>
	<!-- Simple Footer -->
	<footer
		class="mt-auto flex w-full flex-col items-center justify-between bg-surface px-12 py-8 opacity-60 md:flex-row"
	>
		<p class="mb-4 text-[9px] font-black tracking-[0.2em] uppercase md:mb-0">
			© {new Date().getFullYear()} tinAPPay ERP. All rights reserved.
		</p>
		<div class="flex gap-8">
			<a
				class="text-[9px] font-black tracking-[0.2em] uppercase transition-all hover:text-primary"
				href="/privacy">Privacy</a
			>
			<a
				class="text-[9px] font-black tracking-[0.2em] uppercase transition-all hover:text-primary"
				href="/terms">Terms</a
			>
			<a
				class="text-[9px] font-black tracking-[0.2em] uppercase transition-all hover:text-primary"
				href="/help">Help</a
			>
		</div>
	</footer>
</div>

<style>
	.grain::after {
		content: '';
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		background-image: url('https://grainy-gradients.vercel.app/noise.svg');
		filter: contrast(150%) brightness(1000%);
		mix-blend-mode: overlay;
		opacity: 0.04;
		pointer-events: none;
	}
</style>
