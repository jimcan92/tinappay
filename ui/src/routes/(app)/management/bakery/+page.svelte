<script lang="ts">
	import BranchMap from '$lib/components/BranchMap.svelte';
	import SignatureButton from '$lib/components/artisanal/SignatureButton.svelte';
	import { browser } from '$app/environment';
	import { pb, fileUrl } from '$lib/pocketbase';
	import { branchesState } from '$lib/states/branches.svelte';
	import { settingsState } from '$lib/states/settings.svelte';
	import { toastState } from '$lib/states/toast.svelte';
	import { onMount } from 'svelte';

	let logoPreview = $state<string | null>(null);

	onMount(() => Promise.all([settingsState.load(), branchesState.load()]));

	async function onSaveBakery() {
		try {
			await settingsState.save();
			toastState.success('Bakery profile updated.');
		} catch {
			toastState.error('Failed to save bakery profile.');
		}
	}

	function handleLogoChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files?.[0]) {
			settingsState.bakery.logo = target.files[0];
			logoPreview = URL.createObjectURL(target.files[0]);
		}
	}

	const mappedBranches = $derived(
		branchesState.items
			.filter((b) => b.lat && b.lng)
			.map((b) => ({ id: b.id, name: b.name, lat: b.lat, lng: b.lng, location: b.location }))
	);
</script>

<svelte:head><title>Bakery Info | Management</title></svelte:head>

<div class="no-scrollbar h-full overflow-y-auto px-6 py-8 md:px-10">
	<div class="mx-auto max-w-6xl lg:grid lg:grid-cols-3 lg:items-start lg:gap-6">

		<!-- Left: Bakery info form -->
		<div class="mb-6 overflow-hidden rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest shadow-sm lg:col-span-1 lg:mb-0">
			<div class="flex flex-col items-center gap-4 border-b border-outline-variant/10 p-8">
				<div class="relative">
					<div class="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-2 border-primary/10 bg-surface shadow-lg">
						{#if logoPreview}
							<img src={logoPreview} alt="Logo" class="h-full w-full object-cover" />
						{:else if settingsState.bakery.logo && typeof settingsState.bakery.logo === 'string'}
							<img src={fileUrl(settingsState.bakery, settingsState.bakery.logo as string)} alt="Logo" class="h-full w-full object-cover" />
						{:else}
							<span class="material-symbols-outlined text-4xl text-primary/30">storefront</span>
						{/if}
					</div>
					<label class="absolute -right-2 -bottom-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-all hover:scale-110">
						<span class="material-symbols-outlined text-sm">edit</span>
						<input type="file" accept="image/*" class="hidden" onchange={handleLogoChange} />
					</label>
				</div>
				<p class="text-xs font-bold text-on-surface-variant">Bakery Logo</p>
			</div>
			<div class="space-y-5 p-8">
				<div class="space-y-1.5">
					<label for="bk-name" class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">Bakery Name</label>
					<input id="bk-name" bind:value={settingsState.bakery.name} type="text" class="h-12 w-full rounded-2xl border-none bg-surface-container-low px-5 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Lenie's Choice Bakery" />
				</div>
				<div class="space-y-1.5">
					<label for="bk-desc" class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">Description</label>
					<textarea id="bk-desc" bind:value={settingsState.bakery.description} rows="4" class="w-full resize-none rounded-2xl border-none bg-surface-container-low px-5 py-4 text-sm font-medium shadow-inner outline-none focus:ring-2 focus:ring-primary/20" placeholder="Short tagline or description"></textarea>
				</div>
				<div class="space-y-1.5">
					<label for="bk-footer" class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">Receipt Footer</label>
					<input id="bk-footer" bind:value={settingsState.bakery.receipt_footer} type="text" class="h-12 w-full rounded-2xl border-none bg-surface-container-low px-5 text-sm font-medium shadow-inner outline-none focus:ring-2 focus:ring-primary/20" placeholder="Thank you! Come back soon." />
				</div>
				<SignatureButton onclick={onSaveBakery} class="w-full">
					<span class="material-symbols-outlined">save</span>
					Save Profile
				</SignatureButton>
			</div>
		</div>

		<!-- Right: Branch network map -->
		<div class="flex flex-col gap-4 lg:col-span-2">
			<div class="flex items-center justify-between px-1">
				<div>
					<p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Branch Network</p>
					<p class="mt-0.5 text-xs font-medium text-on-surface-variant/50">
						{mappedBranches.length} of {branchesState.items.length} branches mapped
					</p>
				</div>
				<a href="/management/branches" class="text-[10px] font-black uppercase tracking-widest text-primary/70 hover:text-primary transition-colors">
					Manage →
				</a>
			</div>

			<div class="h-[680px] min-h-[520px] overflow-hidden rounded-[2rem] border border-outline-variant/10 shadow-sm">
				{#if browser && mappedBranches.length > 0}
					<BranchMap branches={mappedBranches} />
				{:else if browser}
					<div class="flex h-full flex-col items-center justify-center gap-3 bg-surface-container-low/30 text-center px-8">
						<span class="material-symbols-outlined text-5xl text-on-surface-variant/15">travel_explore</span>
						<p class="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/30">No branches mapped yet</p>
						<a href="/management/branches" class="text-xs font-bold text-primary/50 hover:text-primary transition-colors">
							Add branch coordinates →
						</a>
					</div>
				{/if}
			</div>

		</div>

	</div>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar { display: none; }
	.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
