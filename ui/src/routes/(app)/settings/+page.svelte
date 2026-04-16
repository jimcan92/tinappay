<script lang="ts">
	import { goto } from '$app/navigation';
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
	import SignatureButton from '$lib/components/artisanal/SignatureButton.svelte';
	import { pb } from '$lib/pocketbase';
	import { themeState } from '$lib/state/theme.svelte';
	import { mode, setMode } from 'mode-watcher';
	import { onMount } from 'svelte';

	let themeMode = $derived(mode.current);
	let updatingInfo = $state(false);
	let user = $state<any>(null);
	let bakery = $state<any>({
		name: 'TinAPPay Bakery',
		description: '',
		address: '',
		phone: '',
		email: '',
		receipt_footer: '',
		logo: null
	});
	let logoPreview = $state<string | null>(null);

	onMount(async () => {
		user = pb.authStore.model;
		try {
			const settings = await pb.collection('settings').getFullList();
			if (settings.length > 0) {
				bakery = { ...settings[0] };
			}
		} catch (error) {
			console.error('Failed to fetch bakery settings:', error);
		}
	});

	async function handleLogout() {
		pb.authStore.clear();
		goto('/login');
	}

    async function onSaveBakery() {
        updatingInfo = true;
		try {
			const formData = new FormData();
			formData.append('name', bakery.name);
			formData.append('description', bakery.description);
			formData.append('address', bakery.address);
			formData.append('phone', bakery.phone);
			formData.append('email', bakery.email);
			formData.append('receipt_footer', bakery.receipt_footer);
			if (bakery.logo instanceof File) {
				formData.append('logo', bakery.logo);
			}

			if (bakery.id) {
				await pb.collection('settings').update(bakery.id, formData);
			} else {
				const record = await pb.collection('settings').create(formData);
				bakery.id = record.id;
			}
			alert('Bakery profile updated successfully.');
		} catch (error) {
			console.error('Failed to save bakery settings:', error);
			alert('Save failed. Please ensure "settings" collection exists.');
		} finally {
			updatingInfo = false;
		}
    }

	function handleLogoChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			bakery.logo = target.files[0];
			logoPreview = URL.createObjectURL(target.files[0]);
		}
	}
</script>

<div class="px-6 md:px-12 py-10 max-w-5xl mx-auto">
	<!-- Editorial Header -->
	<header class="mb-12">
		<h1 class="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-2">Preferences</h1>
		<p class="text-on-surface-variant text-lg max-w-2xl leading-relaxed">Customize your Artisanal Ledger workspace. These settings are applied globally to your profile and device.</p>
	</header>

	<!-- Asymmetric Bento Grid for Settings -->
	<div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
		
		<!-- Left: Profile Section (Asymmetric Left) -->
		<section class="md:col-span-8 space-y-8">
			<!-- Profile Card -->
			<div class="bg-surface-container-lowest rounded-xl p-8 shadow-[0px_12px_32px_rgba(47,47,44,0.06)]">
				<div class="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
					<div class="relative group mx-auto sm:mx-0">
						<div class="w-24 h-24 rounded-full overflow-hidden border-4 border-surface-container flex items-center justify-center bg-surface-container shadow-inner">
							{#if logoPreview}
								<img src={logoPreview} alt="Logo" class="h-full w-full object-cover" />
							{:else if bakery.logo && typeof bakery.logo === 'string'}
								<img src={pb.files.getUrl(bakery, bakery.logo)} alt="Logo" class="h-full w-full object-cover" />
							{:else}
								<span class="material-symbols-outlined text-4xl text-on-surface-variant/30">bakery_dining</span>
							{/if}
						</div>
						<label class="absolute bottom-0 right-0 bg-primary text-on-primary p-2 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer">
							<span class="material-symbols-outlined text-sm">edit</span>
							<input type="file" class="hidden" accept="image/*" onchange={handleLogoChange} />
						</label>
					</div>
					<div class="text-center sm:text-left">
						<h2 class="text-2xl font-bold">{bakery.name || 'Bakery Name'}</h2>
						<p class="text-on-surface-variant">Storefront Profile</p>
						<div class="flex justify-center sm:justify-start gap-2 mt-2">
							<span class="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider">Active</span>
						</div>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="md:col-span-2 space-y-1">
						<label for="bakery-name" class="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Establishment Name</label>
						<input id="bakery-name" bind:value={bakery.name} class="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 text-on-surface" type="text" placeholder="Enter Bakery Name"/>
					</div>
					<div class="md:col-span-2 space-y-1">
						<label for="bakery-desc" class="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Business Description</label>
						<textarea id="bakery-desc" bind:value={bakery.description} class="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 text-on-surface resize-none" rows="3" placeholder="Tell your artisanal story..."></textarea>
					</div>
					<div class="space-y-1">
						<label for="bakery-email" class="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Email Address</label>
						<input id="bakery-email" bind:value={bakery.email} class="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 text-on-surface" type="email" placeholder="hello@bakery.com"/>
					</div>
					<div class="space-y-1">
						<label for="bakery-phone" class="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Phone Number</label>
						<input id="bakery-phone" bind:value={bakery.phone} class="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 text-on-surface" type="tel" placeholder="+63 900 000 0000"/>
					</div>
					<div class="md:col-span-2 space-y-1">
						<label for="bakery-addr" class="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Physical Address</label>
						<input id="bakery-addr" bind:value={bakery.address} class="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 text-on-surface" type="text" placeholder="Street, City, Country"/>
					</div>
					<div class="md:col-span-2 space-y-1">
						<label for="bakery-footer" class="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Receipt Footer Note</label>
						<input id="bakery-footer" bind:value={bakery.receipt_footer} class="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 text-on-surface italic" type="text" placeholder="Ex: 'Thank you for supporting local bakers!'"/>
					</div>
				</div>

				<div class="mt-8 flex justify-end">
					<button onclick={onSaveBakery} disabled={updatingInfo} class="bg-primary text-on-primary px-8 py-3 rounded-full font-bold shadow-md hover:opacity-90 transition-opacity disabled:opacity-50">
						{updatingInfo ? 'Synchronizing...' : 'Save Profile'}
					</button>
				</div>
			</div>

			<!-- System Preferences -->
			<div class="bg-surface-container-low rounded-xl p-8 space-y-6">
				<h3 class="text-xl font-bold flex items-center gap-2">
					<span class="material-symbols-outlined text-primary">settings_applications</span>
					System Preferences
				</h3>
				<div class="space-y-4">
					<div class="flex items-center justify-between p-4 bg-surface-container-lowest rounded-lg">
						<div>
							<p class="font-bold">Real-time Stock Sync</p>
							<p class="text-sm text-on-surface-variant">Update inventory levels across all terminals instantly.</p>
						</div>
						<div class="relative inline-flex items-center cursor-pointer">
							<div class="w-12 h-6 bg-primary rounded-full"></div>
							<div class="absolute right-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
						</div>
					</div>
					<div class="flex items-center justify-between p-4 bg-surface-container-lowest rounded-lg opacity-60">
						<div>
							<p class="font-bold">Auto-Print Receipts</p>
							<p class="text-sm text-on-surface-variant">Automatically trigger POS printer after successful checkout.</p>
						</div>
						<div class="relative inline-flex items-center cursor-pointer">
							<div class="w-12 h-6 bg-outline-variant rounded-full"></div>
							<div class="absolute left-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Appearance Section (Asymmetric Right) -->
		<section class="md:col-span-4 space-y-8">
			<!-- Theme Selector -->
			<div class="bg-surface-container-high rounded-xl p-6">
				<h3 class="text-lg font-bold mb-4 flex items-center gap-2">
					<span class="material-symbols-outlined text-primary">palette</span>
					Appearance
				</h3>
				<p class="text-sm text-on-surface-variant mb-6 leading-relaxed">Choose a visual style that best suits your work environment.</p>
				
				<div class="space-y-3">
					<button onclick={() => setMode('light')} class="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all {themeMode === 'light' ? 'border-primary bg-surface-container-lowest' : 'border-transparent bg-inverse-surface/5 hover:border-outline-variant/30'}">
						<div class="w-10 h-10 rounded-lg bg-surface flex items-center justify-center shadow-sm">
							<span class="material-symbols-outlined text-primary">light_mode</span>
						</div>
						<div class="text-left flex-1">
							<p class="font-bold leading-tight">Light Mode</p>
							<p class="text-xs text-on-surface-variant">Optimal for day shifts</p>
						</div>
						{#if themeMode === 'light'}
							<span class="material-symbols-outlined ml-auto text-primary" style="font-variation-settings: 'FILL' 1;">check_circle</span>
						{/if}
					</button>

					<button onclick={() => setMode('dark')} class="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all {themeMode === 'dark' ? 'border-primary bg-surface-container-lowest' : 'border-transparent bg-inverse-surface/5 hover:border-outline-variant/30'}">
						<div class="w-10 h-10 rounded-lg bg-on-surface flex items-center justify-center shadow-sm">
							<span class="material-symbols-outlined text-surface">dark_mode</span>
						</div>
						<div class="text-left flex-1">
							<p class="font-bold leading-tight">Dark Mode</p>
							<p class="text-xs text-on-surface-variant">Comfortable for early mornings</p>
						</div>
						{#if themeMode === 'dark'}
							<span class="material-symbols-outlined ml-auto text-primary" style="font-variation-settings: 'FILL' 1;">check_circle</span>
						{/if}
					</button>
				</div>

				<div class="mt-8">
					<p class="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Color Presets</p>
					<div class="grid grid-cols-5 gap-3">
						{#each [
							{ id: 'theme-cinnamon', color: '#a64500', label: 'Cinnamon' },
							{ id: 'theme-flour', color: '#c2bba8', label: 'Flour' },
							{ id: 'theme-wheat', color: '#d4881e', label: 'Wheat' },
							{ id: 'theme-cocoa', color: '#4a2915', label: 'Cocoa' },
							{ id: 'theme-matcha', color: '#668c62', label: 'Matcha' }
						] as accent}
							<button 
								onclick={() => themeState.setTheme(accent.id)}
								aria-label="Set theme to {accent.label}"
								class="aspect-square rounded-full border-2 border-surface shadow-md transition-transform hover:scale-105 {themeState.value === accent.id ? 'ring-2 ring-primary scale-105 border-white dark:border-black' : ''}"
								style="background-color: {accent.color}"
							></button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Typography & Density -->
			<div class="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_12px_32px_rgba(47,47,44,0.06)] border border-outline-variant/10">
				<h3 class="text-lg font-bold mb-4">Readability</h3>
				<div class="space-y-6">
					<div>
						<label for="density-ctrl" class="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Interface Density</label>
						<div id="density-ctrl" class="flex p-1 bg-surface-container rounded-lg">
							<button 
								onclick={() => themeState.setDensity('editorial')}
								class="flex-1 py-2 text-sm transition-all {themeState.density === 'editorial' ? 'font-bold bg-surface-container-lowest rounded-md shadow-sm text-primary' : 'font-medium text-on-surface-variant hover:text-on-surface'}">
								Editorial
							</button>
							<button 
								onclick={() => themeState.setDensity('compact')}
								class="flex-1 py-2 text-sm transition-all {themeState.density === 'compact' ? 'font-bold bg-surface-container-lowest rounded-md shadow-sm text-primary' : 'font-medium text-on-surface-variant hover:text-on-surface'}">
								Compact
							</button>
						</div>
					</div>
					<div>
						<label for="font-ctrl" class="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Base Font Size</label>
						<input 
							id="font-ctrl" 
							class="w-full accent-primary" 
							max="20" 
							min="12" 
							type="range" 
							bind:value={themeState.fontSize}
							oninput={(e) => themeState.setFontSize(parseInt(e.currentTarget.value))}
						/>
						<div class="flex justify-between text-[10px] text-on-surface-variant mt-1 px-1">
							<span>Small</span>
							<span>Medium</span>
							<span>Large</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Danger Zone -->
			<div class="p-6 border-2 border-error/10 rounded-xl bg-error-container/5 relative group">
				<h3 class="text-error font-bold mb-2">Security</h3>
				<p class="text-xs text-on-surface-variant mb-4">Manage your account security and data privacy settings.</p>
				<button class="text-error text-sm font-bold flex items-center gap-2 hover:underline">
					<span class="material-symbols-outlined text-sm">lock_reset</span>
					Change Password
				</button>
				<button onclick={handleLogout} class="text-error text-sm font-bold flex items-center gap-2 mt-4 hover:underline">
					<span class="material-symbols-outlined text-sm">logout</span>
					Sign Out System
				</button>
			</div>
		</section>
	</div>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
