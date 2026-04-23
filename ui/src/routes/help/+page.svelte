<script lang="ts">
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
</script>

<svelte:head>
	<title>Help & Support | tinAPPay ERP</title>
</svelte:head>

<div class="min-h-screen px-6 py-20 font-sans text-on-surface">
	<div class="mx-auto max-w-4xl">
		<header class="mb-16 text-center">
			<div class="mb-6 flex justify-center">
				<img src="/tinAPPay_v.png" alt="tinAPPay" class="h-20 w-20 object-contain opacity-80" />
			</div>
			<h1 class="font-serif text-5xl font-black tracking-tight">Need a hand?</h1>
			<p class="mt-4 font-medium text-on-surface-variant">
				Frequently asked questions and support for tinAPPay users.
			</p>
		</header>

		<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
			<!-- Getting Started -->
			<div class="space-y-6">
				<h2 class="px-2 text-xs font-black tracking-[0.3em] text-primary uppercase">
					Getting Started
				</h2>

				<ArtisanalCard level="lowest" class="border border-outline-variant/10 p-6">
					<h3 class="mb-2 font-serif text-lg font-black">How do I log in?</h3>
					<p class="text-sm leading-relaxed text-on-surface-variant">
						Simply click "Continue with Google" on the login page and use your personal or work
						Google account.
					</p>
				</ArtisanalCard>

				<ArtisanalCard level="lowest" class="border border-outline-variant/10 p-6">
					<h3 class="mb-2 font-serif text-lg font-black">I'm on a "Pending" page?</h3>
					<p class="text-sm leading-relaxed text-on-surface-variant">
						This means your account is secure. An admin needs to confirm your role before you can
						see bakery data. Contact your manager to speed this up.
					</p>
				</ArtisanalCard>
			</div>

			<!-- Features -->
			<div class="space-y-6">
				<h2 class="px-2 text-xs font-black tracking-[0.3em] text-primary uppercase">
					ERP Features
				</h2>

				<ArtisanalCard level="lowest" class="border border-outline-variant/10 p-6">
					<h3 class="mb-2 font-serif text-lg font-black">Attendance Tracking</h3>
					<p class="text-sm leading-relaxed text-on-surface-variant">
						Attendance is automatic! Logging in clocks you in, and logging out clocks you out. If
						you forget to log out, the system auto-closes your shift at midnight.
					</p>
				</ArtisanalCard>

				<ArtisanalCard level="lowest" class="border border-outline-variant/10 p-6">
					<h3 class="mb-2 font-serif text-lg font-black">POS & Inventory</h3>
					<p class="text-sm leading-relaxed text-on-surface-variant">
						All sales from the POS terminal automatically deduct items from your branch inventory
						and record revenue in the Finance Treasury.
					</p>
				</ArtisanalCard>
			</div>
		</div>

		<!-- Support Contact -->
		<div class="mt-16">
			<ArtisanalCard
				level="high"
				class="border border-primary/10 bg-primary-container/30 p-10 text-center text-on-surface shadow-2xl"
			>
				<div class="mb-6 flex justify-center">
					<div
						class="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner"
					>
						<span class="material-symbols-outlined text-4xl">support_agent</span>
					</div>
				</div>
				<h2 class="mb-4 font-serif text-3xl font-black">Still stuck?</h2>
				<p
					class="mx-auto mb-8 max-w-md text-sm leading-relaxed font-medium text-on-surface-variant"
				>
					Our technical support team is ready to help you with any system errors or access issues.
				</p>
				<a
					href="mailto:jimcan051592@gmail.com"
					class="inline-flex items-center gap-3 rounded-full bg-primary px-10 py-4 text-xs font-black tracking-widest text-on-primary uppercase shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95"
				>
					Email Support Team
				</a>
			</ArtisanalCard>
		</div>

		<div class="mt-12 text-center">
			<a
				href="/login"
				class="text-xs font-black tracking-widest text-on-surface-variant uppercase transition-colors hover:text-primary"
			>
				Back to Login Screen
			</a>
		</div>
	</div>
</div>
