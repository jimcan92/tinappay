<script lang="ts">
	import { onMount } from 'svelte';
	import { pb } from '$lib/pocketbase';
	import { goto } from '$app/navigation';
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
	import SignatureButton from '$lib/components/artisanal/SignatureButton.svelte';
	import { themeState } from '$lib/state/theme.svelte';
	import { mode, resetMode, setMode } from 'mode-watcher';

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

<div class="px-6 py-10 md:px-12 max-w-6xl mx-auto">
	<!-- Editorial Header -->
	<header class="mb-12">
		<h1 class="text-4xl md:text-5xl font-black text-on-surface tracking-tight mb-3 font-serif">Bakery Governance</h1>
		<p class="text-on-surface-variant text-lg max-w-2xl leading-relaxed">Manage your storefront identity and system-wide configurations. These details appear on customer receipts and the digital storefront.</p>
	</header>

	<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
		<!-- Left: Profile & Systems -->
		<section class="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<ArtisanalCard level="lowest" class="p-8 shadow-md border border-outline-variant/10">
				<div class="flex flex-col md:flex-row items-center gap-8 mb-10">
					<div class="relative group">
						<div class="w-28 h-28 rounded-[2rem] overflow-hidden border-4 border-surface shadow-xl bg-surface-container flex items-center justify-center">
							{#if logoPreview}
								<img src={logoPreview} alt="Logo" class="h-full w-full object-cover" />
							{:else if bakery.logo && typeof bakery.logo === 'string'}
								<img src={pb.files.getUrl(bakery, bakery.logo)} alt="Logo" class="h-full w-full object-cover" />
							{:else}
								<span class="material-symbols-outlined text-4xl text-on-surface-variant/30">bakery_dining</span>
							{/if}
						</div>
						<label class="absolute bottom-0 right-0 bg-primary text-white p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform border-4 border-surface cursor-pointer">
							<span class="material-symbols-outlined text-sm">add_a_photo</span>
							<input type="file" class="hidden" accept="image/*" onchange={handleLogoChange} />
						</label>
					</div>
					<div class="text-center md:text-left flex-1">
						<div class="space-y-1 mb-4">
							<label for="bakery-name" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Establishment Name</label>
							<input id="bakery-name" bind:value={bakery.name} class="text-3xl font-black text-on-surface font-serif bg-transparent border-none p-0 focus:ring-0 w-full" placeholder="Enter Bakery Name" />
						</div>
						<div class="flex flex-wrap justify-center md:justify-start gap-2">
							<span class="bg-primary/10 text-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Active Storefront</span>
							<span class="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Production Ledger</span>
						</div>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="md:col-span-2 space-y-2">
						<label for="set-desc" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Bakery Description</label>
						<textarea id="set-desc" bind:value={bakery.description} class="w-full bg-surface-container-low border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 text-sm font-medium resize-none leading-relaxed" rows="2" placeholder="Tell your artisanal story..."></textarea>
					</div>
					<div class="space-y-2">
						<label for="set-address" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Physical Address</label>
						<input id="set-address" bind:value={bakery.address} class="w-full bg-surface-container-low border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 text-sm font-bold" type="text" placeholder="Street, City, Country"/>
					</div>
					<div class="space-y-2">
						<label for="set-phone" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Business Hotline</label>
						<input id="set-phone" bind:value={bakery.phone} class="w-full bg-surface-container-low border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 text-sm font-bold" type="tel" placeholder="+63 900 000 0000"/>
					</div>
					<div class="md:col-span-2 space-y-2">
						<label for="set-receipt" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Receipt Footer Note</label>
						<input id="set-receipt" bind:value={bakery.receipt_footer} class="w-full bg-surface-container-low border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 text-sm font-bold italic" type="text" placeholder="Ex: 'Thank you for supporting local bakers!'"/>
					</div>
				</div>

				<div class="mt-10 flex justify-end">
					<SignatureButton onclick={onSaveBakery} disabled={updatingInfo} size="md">
						{updatingInfo ? 'Synchronizing...' : 'Update Bakery Profile'}
					</SignatureButton>
				</div>
			</ArtisanalCard>

			<!-- System Preferences -->
			<div class="bg-surface-container-low rounded-[2rem] p-8 space-y-8">
				<h3 class="text-xl font-black text-on-surface font-serif flex items-center gap-3">
					<span class="material-symbols-outlined text-primary text-2xl" style="font-variation-settings: 'FILL' 1;">settings_applications</span>
					System Calibration
				</h3>
				<div class="space-y-4">
					<div class="flex items-center justify-between p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/5 shadow-sm">
						<div>
							<p class="font-black text-on-surface">Real-time Stock Sync</p>
							<p class="text-xs text-on-surface-variant font-medium mt-1">Update inventory levels across all terminals instantly.</p>
						</div>
						<button aria-label="Toggle Stock Sync" class="w-12 h-6 bg-primary rounded-full relative transition-all active:scale-95 shadow-inner">
							<div class="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md"></div>
						</button>
					</div>
					<div class="flex items-center justify-between p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/5 shadow-sm opacity-60">
						<div>
							<p class="font-black text-on-surface">Auto-Print Receipts</p>
							<p class="text-xs text-on-surface-variant font-medium mt-1">Automatically trigger POS printer after successful checkout.</p>
						</div>
						<button aria-label="Toggle Auto-print" class="w-12 h-6 bg-outline-variant/30 rounded-full relative transition-all active:scale-95">
							<div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
						</button>
					</div>
				</div>
			</div>
		</section>

		<!-- Right: Appearance -->
		<section class="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
			<!-- Theme Selector -->
			<ArtisanalCard level="high" class="p-8 border border-outline-variant/5">
				<h3 class="text-xl font-black text-on-surface font-serif mb-6 flex items-center gap-3">
					<span class="material-symbols-outlined text-primary text-2xl" style="font-variation-settings: 'FILL' 1;">palette</span>
					Visuals
				</h3>
				
				<div class="space-y-4">
					<button onclick={() => setMode('light')} class="w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all {themeMode === 'light' ? 'border-primary bg-surface-container-lowest shadow-lg shadow-primary/5' : 'border-transparent bg-on-surface/5 hover:bg-on-surface/10'}">
						<div class="h-10 w-10 rounded-xl bg-surface flex items-center justify-center border border-outline-variant/10 shadow-sm text-primary">
							<span class="material-symbols-outlined">light_mode</span>
						</div>
						<div class="text-left flex-1">
							<p class="font-black text-sm">Light Mode</p>
							<p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Day Shifts</p>
						</div>
						{#if themeMode === 'light'}
							<span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">check_circle</span>
						{/if}
					</button>

					<button onclick={() => setMode('dark')} class="w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all {themeMode === 'dark' ? 'border-primary bg-on-surface/10 shadow-lg shadow-primary/5' : 'border-transparent bg-on-surface/5 hover:bg-on-surface/10'}">
						<div class="h-10 w-10 rounded-xl bg-on-surface flex items-center justify-center shadow-sm text-surface">
							<span class="material-symbols-outlined">dark_mode</span>
						</div>
						<div class="text-left flex-1">
							<p class="font-black text-sm">Dark Mode</p>
							<p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Early Mornings</p>
						</div>
						{#if themeMode === 'dark'}
							<span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">check_circle</span>
						{/if}
					</button>
				</div>

				<div class="mt-10 pt-8 border-t border-outline-variant/10">
					<p class="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-6">Accent Color Palette</p>
					<div class="grid grid-cols-5 gap-3">
						{#each [
							{ id: 'theme-cinnamon', color: '#9b4000', label: 'Cinnamon' },
							{ id: 'theme-flour', color: '#dcdcdc', label: 'Flour' },
							{ id: 'theme-wheat', color: '#e69a2d', label: 'Wheat' },
							{ id: 'theme-cocoa', color: '#5d3923', label: 'Cocoa' },
							{ id: 'theme-matcha', color: '#7da27a', label: 'Matcha' }
						] as accent}
							<button 
                                onclick={() => themeState.setTheme(accent.id)}
                                aria-label="Set theme to {accent.label}"
                                class="aspect-square rounded-full border-4 border-surface shadow-md transition-all active:scale-90 {themeState.value === accent.id ? 'ring-2 ring-primary scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'}"
                                style="background-color: {accent.color}"
                            ></button>
						{/each}
					</div>
				</div>
			</ArtisanalCard>

			<!-- Readability -->
			<ArtisanalCard level="lowest" class="p-8 border border-outline-variant/10 shadow-sm">
				<h3 class="text-lg font-black text-on-surface font-serif mb-6">Readability</h3>
				<div class="space-y-8">
					<div>
						<label for="density-toggle" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-4 block">Interface Density</label>
						<div id="density-toggle" class="flex p-1.5 bg-surface-container rounded-2xl shadow-inner">
							<button class="flex-1 py-2.5 text-xs font-black uppercase tracking-widest bg-surface-container-lowest rounded-xl shadow-md text-primary">Editorial</button>
							<button class="flex-1 py-2.5 text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-on-surface">Compact</button>
						</div>
					</div>
					<div>
						<label for="font-size" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-4 block">Base Type Size</label>
						<input id="font-size" class="w-full accent-primary h-1.5 bg-surface-container rounded-full appearance-none cursor-pointer" max="20" min="12" type="range" value="16"/>
						<div class="flex justify-between text-[9px] font-black text-on-surface-variant uppercase tracking-widest mt-3">
							<span>Small</span>
							<span>Medium</span>
							<span>Large</span>
						</div>
					</div>
				</div>
			</ArtisanalCard>

			<!-- Danger Zone -->
			<div class="p-8 rounded-[2rem] border-2 border-error/10 bg-error-container/5 relative overflow-hidden group">
				<h3 class="text-error font-black text-lg font-serif mb-2">Security Vault</h3>
				<p class="text-xs text-on-surface-variant font-medium mb-6 leading-relaxed">Update your access credentials or manage system session security.</p>
				<button class="flex items-center gap-3 text-error font-black uppercase tracking-widest text-[10px] group-hover:gap-4 transition-all">
					<span class="material-symbols-outlined text-sm">lock_reset</span>
					Change Password
				</button>
                <button onclick={handleLogout} class="flex items-center gap-3 text-error font-black uppercase tracking-widest text-[10px] mt-4 group-hover:gap-4 transition-all">
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
