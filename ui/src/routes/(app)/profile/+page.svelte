<script lang="ts">
	import { onMount } from 'svelte';
	import { pb } from '$lib/pocketbase';
	import SignatureButton from '$lib/components/artisanal/SignatureButton.svelte';
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
	import BakingLoader from '$lib/components/BakingLoader.svelte';

	let user = $state<any>(null);
	let loading = $state(false);
	let fetching = $state(true);

	// Form State
	let form = $state({
		name: '',
		password: '',
		passwordConfirm: '',
		avatar: null as File | null
	});
	let avatarPreview = $state<string | null>(null);

	onMount(async () => {
		user = pb.authStore.model;
		if (user) {
			form.name = user.name || '';
		}
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
			if (form.avatar) {
				formData.append('avatar', form.avatar);
			}

			const record = await pb.collection('users').update(user.id, formData);
			// Refresh local user state
			user = record;
			alert('Profile updated successfully.');
			// Clear password fields
			form.password = '';
			form.passwordConfirm = '';
		} catch (err) {
			console.error('Profile update failed:', err);
			alert('Failed to update profile.');
		} finally {
			loading = false;
		}
	}
</script>

<div class="px-6 py-10 md:px-12 max-w-4xl mx-auto">
	<header class="mb-12">
		<h1 class="text-4xl md:text-5xl font-black text-on-surface tracking-tight mb-3 font-serif">Staff Profile</h1>
		<p class="text-on-surface-variant text-lg leading-relaxed">Manage your personal system identity and access credentials.</p>
	</header>

	{#if fetching}
		<div class="flex h-64 items-center justify-center">
			<BakingLoader />
		</div>
	{:else if user}
		<div class="grid grid-cols-1 md:grid-cols-12 gap-10">
			<!-- Personal Info -->
			<div class="md:col-span-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
				<ArtisanalCard level="lowest" class="p-8 shadow-md border border-outline-variant/10">
					<div class="space-y-8">
						<div class="space-y-2">
							<label for="prof-name" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Display Name</label>
							<input id="prof-name" bind:value={form.name} class="w-full bg-surface-container-low border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 text-sm font-bold" type="text" placeholder="Your Full Name" />
						</div>

						<div class="space-y-2 opacity-60">
							<label for="prof-email" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Email Identity (Read-only)</label>
							<input id="prof-email" class="w-full bg-surface-container-low border-none rounded-xl px-5 py-4 text-sm font-bold cursor-not-allowed" type="email" value={user.email} disabled />
						</div>

						<div class="pt-6 border-t border-outline-variant/10">
							<h3 class="text-sm font-black text-on-surface uppercase tracking-widest mb-6">Security Update</h3>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div class="space-y-2">
									<label for="prof-pass" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">New Password</label>
									<input id="prof-pass" bind:value={form.password} class="w-full bg-surface-container-low border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 text-sm font-bold" type="password" placeholder="••••••••" />
								</div>
								<div class="space-y-2">
									<label for="prof-conf" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Confirm New Password</label>
									<input id="prof-conf" bind:value={form.passwordConfirm} class="w-full bg-surface-container-low border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 text-sm font-bold" type="password" placeholder="••••••••" />
								</div>
							</div>
							<p class="mt-4 text-[10px] text-on-surface-variant italic">Leave blank if you don't wish to change your password.</p>
						</div>

						<div class="pt-8 flex justify-end">
							<SignatureButton onclick={handleSave} disabled={loading} size="md">
								{loading ? 'Synchronizing...' : 'Apply Changes'}
							</SignatureButton>
						</div>
					</div>
				</ArtisanalCard>
			</div>

			<!-- Quick Profile Side -->
			<div class="md:col-span-4 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
				<ArtisanalCard level="high" class="p-8 border border-outline-variant/10 text-center">
					<div class="relative mx-auto w-32 h-32 mb-6">
						<div class="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-surface shadow-2xl bg-surface-container flex items-center justify-center mx-auto">
							{#if avatarPreview}
								<img src={avatarPreview} alt="Preview" class="h-full w-full object-cover" />
							{:else if user.avatar}
								<img src={pb.files.getUrl(user, user.avatar)} alt="Avatar" class="h-full w-full object-cover" />
							{:else}
								<div class="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-black text-3xl uppercase">
									{user.name?.substring(0, 2) || 'US'}
								</div>
							{/if}
						</div>
						<label class="absolute bottom-0 right-0 bg-primary text-white p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform border-4 border-surface cursor-pointer">
							<span class="material-symbols-outlined text-sm">edit</span>
							<input type="file" class="hidden" accept="image/*" onchange={handleFileChange} />
						</label>
					</div>
					
					<h2 class="text-2xl font-black text-on-surface font-serif">{user.name || 'Staff Member'}</h2>
					<p class="text-on-surface-variant font-medium text-[10px] uppercase tracking-[0.2em] mt-2 bg-surface-container-high py-1 px-3 rounded-full inline-block">
						{user.role || 'Staff'} Access
					</p>

					<div class="mt-8 pt-8 border-t border-outline-variant/10 text-left space-y-4">
						<div class="flex items-center gap-3 text-on-surface-variant">
							<span class="material-symbols-outlined text-sm">cake</span>
							<span class="text-[10px] font-black uppercase tracking-widest">Joined {new Date(user.created).toLocaleDateString()}</span>
						</div>
						<div class="flex items-center gap-3 text-on-surface-variant">
							<span class="material-symbols-outlined text-sm">verified_user</span>
							<span class="text-[10px] font-black uppercase tracking-widest">Identity Verified</span>
						</div>
					</div>
				</ArtisanalCard>
			</div>
		</div>
	{:else}
		<p class="text-center text-on-surface-variant py-10">Please log in to view your profile.</p>
	{/if}
</div>
