<script lang="ts">
	import BakingLoader from '$lib/components/BakingLoader.svelte';
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
	import SignatureButton from '$lib/components/artisanal/SignatureButton.svelte';
	import { fileUrl, pb } from '$lib/pocketbase';
	import { toastState } from '$lib/states/toast.svelte';
	import { usersState } from '$lib/states/users.svelte';
	import { onMount } from 'svelte';

	let user = $state<any>(null);
	let loading = $state(false);
	let fetching = $state(true);

	let form = $state({
		name: '',
		password: '',
		passwordConfirm: '',
		avatar: null as File | null
	});
	let avatarPreview = $state<string | null>(null);

	onMount(() => {
		user = pb.authStore.record;
		if (user) form.name = user.name || '';
		fetching = false;
	});

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			form.avatar = target.files[0];
			avatarPreview = URL.createObjectURL(target.files[0]);
		}
	}

	async function handleSave() {
		if (!user) return;
		loading = true;
		try {
			const formData = new FormData();
			formData.append('name', form.name);
			if (form.password) {
				formData.append('password', form.password);
				formData.append('passwordConfirm', form.passwordConfirm);
			}
			if (form.avatar) formData.append('avatar', form.avatar);

			user = await usersState.updateSelf(user.id, formData);
			toastState.success('Profile updated successfully.');
			form.password = '';
			form.passwordConfirm = '';
		} catch {
			toastState.error('Failed to update profile.');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Staff Identity | tinAPPay ERP</title>
</svelte:head>

<div class="mx-auto max-w-6xl animate-in px-6 py-10 duration-700 fade-in md:px-10">
	<header class="mb-12">
		<h1 class="mb-3 font-serif text-4xl font-black tracking-tight text-on-surface md:text-5xl">
			Your Personal Identity
		</h1>
		<p class="max-w-2xl text-lg leading-relaxed font-medium text-on-surface-variant">
			Manage your personal system profile and bakery terminal credentials.
		</p>
	</header>

	{#if fetching}
		<div class="flex h-64 items-center justify-center">
			<BakingLoader />
		</div>
	{:else if user}
		<div class="grid grid-cols-1 items-start gap-10 md:grid-cols-12">
			<!-- Quick Profile Side -->
			<div class="space-y-10 md:col-span-4">
				<ArtisanalCard
					level="high"
					class="flex flex-col items-center border border-outline-variant/10 p-8 text-center shadow-xl"
				>
					<div class="group relative mb-6">
						<div
							class="h-32 w-32 overflow-hidden rounded-[2.5rem] border-4 border-white bg-white shadow-2xl transition-transform duration-700 hover:scale-105"
						>
							{#if avatarPreview}
								<img src={avatarPreview} alt="Preview" class="h-full w-full object-cover" />
							{:else if user.avatar}
								<img
									src={fileUrl(user, user.avatar)}
									alt="Avatar"
									class="h-full w-full object-cover"
								/>
							{:else}
								<div
									class="flex h-full w-full items-center justify-center bg-primary/10 font-serif text-4xl font-black text-primary uppercase"
								>
									{user.name?.substring(0, 2) || 'US'}
								</div>
							{/if}
						</div>
						<label
							class="absolute -right-2 -bottom-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-4 border-surface bg-primary text-white shadow-lg transition-transform hover:scale-110"
						>
							<span class="material-symbols-outlined text-sm">camera_alt</span>
							<input type="file" class="hidden" accept="image/*" onchange={handleFileChange} />
						</label>
					</div>

					<h2 class="font-serif text-2xl font-black tracking-tight text-on-surface">
						{user.name || 'Staff Member'}
					</h2>
					<span
						class="mt-2 rounded-lg border border-primary/10 bg-primary px-3 py-1 text-[9px] font-black tracking-widest text-on-primary uppercase"
					>
						{user.role || 'Baker'}
					</span>

					<div class="mt-10 w-full space-y-4 border-t border-outline-variant/10 pt-8 text-left">
						<div class="flex items-center gap-4 text-on-surface-variant">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/5 bg-surface-container-low"
							>
								<span class="material-symbols-outlined text-sm">event</span>
							</div>
							<div>
								<p class="text-[9px] font-black tracking-widest uppercase">Enrolled since</p>
								<p class="text-xs font-bold text-on-surface">
									{new Date(user.created).toLocaleDateString('en-US', {
										month: 'long',
										year: 'numeric'
									})}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-4 text-on-surface-variant">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/5 bg-surface-container-low"
							>
								<span class="material-symbols-outlined text-sm text-tertiary">verified_user</span>
							</div>
							<div>
								<p class="text-[9px] font-black tracking-widest text-tertiary uppercase">
									Security Status
								</p>
								<p class="text-xs font-bold text-tertiary-dim">Authorized & Verified</p>
							</div>
						</div>
					</div>
				</ArtisanalCard>
			</div>
			<!-- Personal Info -->
			<div class="space-y-10 md:col-span-8">
				<ArtisanalCard
					level="lowest"
					class="relative overflow-hidden border border-outline-variant/10 p-8 shadow-sm md:p-10"
				>
					<div class="absolute -top-8 -right-8 opacity-5">
						<span class="material-symbols-outlined text-[150px]">person_outline</span>
					</div>

					<div class="relative z-10 space-y-8">
						<div class="space-y-3">
							<label
								for="prof-name"
								class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
								>Display Name</label
							>
							<input
								id="prof-name"
								bind:value={form.name}
								class="h-14 w-full rounded-2xl border-none bg-surface-container-low px-6 text-sm font-bold transition-all outline-none focus:ring-4 focus:ring-primary/10"
								type="text"
								placeholder="Your Full Name"
							/>
						</div>

						<div class="space-y-3">
							<label
								for="prof-email"
								class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
								>Email Identity (Read-only)</label
							>
							<input
								id="prof-email"
								class="h-14 w-full cursor-not-allowed rounded-2xl border-none bg-surface-container-low px-6 text-sm font-bold opacity-40 outline-none"
								type="email"
								value={user.email}
								disabled
							/>
						</div>

						<div class="border-t border-outline-variant/10 pt-8">
							<h3 class="mb-6 px-1 text-xs font-black tracking-[0.2em] text-on-surface uppercase">
								Security Update
							</h3>
							<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
								<div class="space-y-3">
									<label
										for="prof-pass"
										class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
										>New Access Token</label
									>
									<input
										id="prof-pass"
										bind:value={form.password}
										class="h-14 w-full rounded-2xl border-none bg-surface-container-low px-6 text-sm font-bold transition-all outline-none focus:ring-4 focus:ring-primary/10"
										type="password"
										placeholder="••••••••"
									/>
								</div>
								<div class="space-y-3">
									<label
										for="prof-conf"
										class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
										>Confirm Access</label
									>
									<input
										id="prof-conf"
										bind:value={form.passwordConfirm}
										class="h-14 w-full rounded-2xl border-none bg-surface-container-low px-6 text-sm font-bold transition-all outline-none focus:ring-4 focus:ring-primary/10"
										type="password"
										placeholder="••••••••"
									/>
								</div>
							</div>
							<p class="mt-4 px-1 text-[10px] font-medium text-on-surface-variant italic">
								Leave fields blank to maintain current credentials.
							</p>
						</div>

						<div class="flex justify-end pt-6">
							<SignatureButton
								onclick={handleSave}
								disabled={loading}
								class="h-16 w-full px-12 sm:w-auto"
								size="lg"
							>
								{loading ? 'Synchronizing...' : 'Update Identity'}
							</SignatureButton>
						</div>
					</div>
				</ArtisanalCard>
			</div>

			<div
				class="col-span-1 rounded-[2.5rem] border-2 border-dashed border-outline-variant/20 bg-surface-container-low/30 p-8 text-center md:col-span-12"
			>
				<p
					class="text-[10px] leading-relaxed font-bold tracking-widest text-on-surface-variant uppercase"
				>
					System session is secured via encrypted tokens. Sign out of all devices if credentials are
					compromised.
				</p>
			</div>
		</div>
	{:else}
		<div class="py-20 text-center">
			<BakingLoader />
			<p class="mt-6 text-sm font-medium text-on-surface-variant">
				Redirecting to terminal login...
			</p>
		</div>
	{/if}
</div>
