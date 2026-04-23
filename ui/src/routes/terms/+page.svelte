<script lang="ts">
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
</script>

<svelte:head>
	<title>Terms of Service | tinAPPay ERP</title>
</svelte:head>

<div class="min-h-screen px-6 py-20 font-sans">
	<div class="mx-auto max-w-3xl">
		<header class="mb-12 text-center">
			<div class="mb-6 flex justify-center">
				<img src="/tinAPPay_v.png" alt="tinAPPay" class="h-16 w-16 object-contain opacity-80" />
			</div>
			<h1 class="font-serif text-4xl font-black tracking-tight text-on-surface">
				Terms of Service
			</h1>
			<p class="mt-4 text-xs font-black tracking-[0.3em] text-on-surface-variant/50 uppercase">
				Last Updated: April 2026
			</p>
		</header>

		<ArtisanalCard
			level="lowest"
			class="space-y-8 border border-outline-variant/10 p-10 leading-relaxed text-on-surface/80 shadow-xl backdrop-blur-xl"
		>
			<section class="space-y-4">
				<h2 class="font-serif text-2xl font-black text-on-surface">1. Acceptance of Terms</h2>
				<p>
					By accessing or using <strong>tinAPPay ERP</strong>, you agree to comply with and be bound
					by these terms. This system is designed for internal bakery management and authorized use
					only.
				</p>
			</section>

			<section class="space-y-4">
				<h2 class="font-serif text-2xl font-black text-on-surface">2. User Responsibilities</h2>
				<p>All users (staff and administrators) agree to:</p>
				<ul class="list-disc space-y-2 pl-6">
					<li>Maintain the confidentiality of their Google account access.</li>
					<li>Provide accurate operational data (sales, inventory, and attendance).</li>
					<li>
						Refrain from any unauthorized attempt to access data from other branches or
						organizations.
					</li>
					<li>Avoid any activity that may disrupt the system's performance.</li>
				</ul>
			</section>

			<section class="space-y-4">
				<h2 class="font-serif text-2xl font-black text-on-surface">
					3. Access & Role Confirmation
				</h2>
				<p>
					Access to tinAPPay is gated. Upon initial sign-in, your account will be placed in a <strong
						>pending state</strong
					>. Full access to ERP features is only granted once an administrator confirms your
					identity and assigns a role.
				</p>
			</section>

			<section class="space-y-4">
				<h2 class="font-serif text-2xl font-black text-on-surface">4. Intellectual Property</h2>
				<p>
					The tinAPPay software, including its design, logos, and code, is the property of its
					developers. Users are granted a limited right to use the system for their bakery's
					business purposes.
				</p>
			</section>

			<section class="space-y-4">
				<h2 class="font-serif text-2xl font-black text-on-surface">5. Limitation of Liability</h2>
				<p>
					tinAPPay is provided "as is". While we strive for 100% uptime and data accuracy, we are
					not liable for any business losses resulting from system downtime or data entry errors
					made by users.
				</p>
			</section>

			<div class="border-t border-outline-variant/10 pt-8">
				<a
					href="/login"
					class="inline-flex items-center gap-2 text-sm font-black tracking-widest text-primary uppercase hover:underline"
				>
					<span class="material-symbols-outlined text-sm">arrow_back</span>
					Back to Login
				</a>
			</div>
		</ArtisanalCard>
	</div>
</div>
