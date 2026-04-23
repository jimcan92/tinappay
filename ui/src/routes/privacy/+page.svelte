<script lang="ts">
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
</script>

<svelte:head>
	<title>Privacy Policy | tinAPPay ERP</title>
</svelte:head>

<div class="min-h-screen px-6 py-20 font-sans">
	<div class="mx-auto max-w-3xl">
		<header class="mb-12 text-center">
			<div class="mb-6 flex justify-center">
				<img src="/tinAPPay_v.png" alt="tinAPPay" class="h-16 w-16 object-contain opacity-80" />
			</div>
			<h1 class="font-serif text-4xl font-black tracking-tight text-on-surface">Privacy Policy</h1>
			<p class="mt-4 text-xs font-black tracking-[0.3em] text-on-surface-variant/50 uppercase">
				Last Updated: April 2026
			</p>
		</header>

		<ArtisanalCard
			level="lowest"
			class="space-y-8 border border-outline-variant/10 p-10 leading-relaxed text-on-surface/80 shadow-xl backdrop-blur-xl"
		>
			<section class="space-y-4">
				<h2 class="font-serif text-2xl font-black text-on-surface">1. Introduction</h2>
				<p>
					Welcome to <strong>tinAPPay ERP</strong>. We value your privacy and are committed to
					protecting the data of our bakery partners and their staff. This policy outlines how we
					handle information within the system.
				</p>
			</section>

			<section class="space-y-4">
				<h2 class="font-serif text-2xl font-black text-on-surface">2. Data Collection</h2>
				<p>We collect information necessary for bakery operations, including:</p>
				<ul class="list-disc space-y-2 pl-6">
					<li>
						<strong>Identity Data:</strong> Name, email address, and avatar via Google Authentication.
					</li>
					<li>
						<strong>Operational Data:</strong> Sales records, inventory logs, and procurement requests.
					</li>
					<li>
						<strong>Attendance Data:</strong> Clock-in and clock-out timestamps for labor management.
					</li>
					<li>
						<strong>Financial Data:</strong> Revenue and expense records entered by authorized personnel.
					</li>
				</ul>
			</section>

			<section class="space-y-4">
				<h2 class="font-serif text-2xl font-black text-on-surface">3. How Data is Used</h2>
				<p>Data collected in tinAPPay is used strictly for:</p>
				<ul class="list-disc space-y-2 pl-6">
					<li>Managing bakery inventory and sales transactions.</li>
					<li>Generating financial reports and analytics for business owners.</li>
					<li>Monitoring staff attendance and performance.</li>
					<li>Ensuring secure access to the ERP system.</li>
				</ul>
			</section>

			<section class="space-y-4">
				<h2 class="font-serif text-2xl font-black text-on-surface">4. Data Security</h2>
				<p>
					tinAPPay utilizes secure cloud infrastructure via PocketBase. We implement role-based
					access control (RBAC) to ensure that only authorized staff can view or modify sensitive
					business data.
				</p>
			</section>

			<section class="space-y-4">
				<h2 class="font-serif text-2xl font-black text-on-surface">5. Third-Party Services</h2>
				<p>
					We use Google OAuth for authentication. By using this service, you also agree to Google's
					Privacy Policy. We do not sell your data to any third-party marketing agencies.
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
