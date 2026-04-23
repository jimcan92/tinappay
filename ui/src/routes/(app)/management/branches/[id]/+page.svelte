<script lang="ts">
	import BranchMap from '$lib/components/BranchMap.svelte';
	import Select from '$lib/components/Select.svelte';
	import SignatureButton from '$lib/components/artisanal/SignatureButton.svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { branchesState } from '$lib/states/branches.svelte';
	import { toastState } from '$lib/states/toast.svelte';
	import { usersState } from '$lib/states/users.svelte';
	import { onMount } from 'svelte';

	const id = $derived(page.params.id);
	const isNew = $derived(id === 'new');
	const branch = $derived(branchesState.items.find((b) => b.id === id));

	let editing = $state(false);
	let saving = $state(false);

	let form = $state({
		name: '', location: '', phone: '', email: '', manager: '',
		lat: null as number | null, lng: null as number | null
	});

	const isEditMode = $derived(isNew || editing);

	onMount(async () => {
		await Promise.all([branchesState.load(), usersState.init()]);
		if (!isNew && branch) initForm(branch);
	});

	function initForm(b: any) {
		form = {
			name: b.name || '', location: b.location || '',
			phone: b.phone || '', email: b.email || '',
			manager: b.manager || '',
			lat: b.lat || null, lng: b.lng || null
		};
	}

	function startEdit() { if (branch) initForm(branch); editing = true; }

	function cancelEdit() {
		if (isNew) goto('/management/branches');
		else { if (branch) initForm(branch); editing = false; }
	}

	async function handleSave() {
		if (!form.name.trim()) return;
		saving = true;
		try {
			if (isNew) {
				await branchesState.create(form.name.trim(), form.location, form.phone, form.email, form.manager, form.lat ?? undefined, form.lng ?? undefined);
				const created = branchesState.items.find((b) => b.name === form.name.trim());
				toastState.success('Branch created.');
				goto(created ? `/management/branches/${created.id}` : '/management/branches');
			} else {
				await branchesState.update(id!, form.name.trim(), form.location, form.phone, form.email, form.manager, form.lat ?? undefined, form.lng ?? undefined);
				toastState.success('Branch updated.');
				editing = false;
			}
		} catch {
			toastState.error('Failed to save branch.');
		} finally {
			saving = false;
		}
	}

	const displayName     = $derived(isEditMode ? form.name     : branch?.name || '');
	const displayLocation = $derived(isEditMode ? form.location : branch?.location || '');
	const displayLat      = $derived(isEditMode ? form.lat      : branch?.lat || null);
	const displayLng      = $derived(isEditMode ? form.lng      : branch?.lng || null);
</script>

<svelte:head>
	<title>{isNew ? 'New Branch' : (branch?.name ?? 'Branch')} | Management</title>
</svelte:head>

<div class="no-scrollbar h-full overflow-y-auto px-6 py-8 md:px-10">
	<div class="mx-auto max-w-2xl space-y-5">

		<!-- Map -->
		<div class="overflow-hidden rounded-[2rem] border border-outline-variant/10 shadow-sm" style="height: 360px;">
			{#if browser}
				{#if isEditMode}
					<BranchMap
						pickMode
						pickedLat={form.lat}
						pickedLng={form.lng}
						onPick={(lat, lng) => { form.lat = lat; form.lng = lng; }}
					/>
				{:else if displayLat && displayLng}
					<BranchMap
						branches={[{ id: id!, name: displayName, lat: displayLat, lng: displayLng, location: displayLocation }]}
					/>
				{:else}
					<div class="flex h-full flex-col items-center justify-center gap-3 bg-surface-container-low/30 text-center">
						<span class="material-symbols-outlined text-4xl text-on-surface-variant/20">map</span>
						<p class="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/30">No location pinned</p>
						<button onclick={startEdit} class="text-xs font-bold text-primary/60 transition-colors hover:text-primary">
							Set location →
						</button>
					</div>
				{/if}
			{/if}
		</div>

		<!-- Details card -->
		<div class="rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest shadow-sm">

			<!-- Header: name + location + edit toggle -->
			<div class="flex items-start gap-4 border-b border-outline-variant/10 px-6 py-5">
				<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
					<span class="material-symbols-outlined text-base text-primary" style="font-variation-settings:'FILL' 1">storefront</span>
				</div>
				<div class="min-w-0 flex-1 space-y-1.5">
					{#if isEditMode}
						<input
							id="br-name"
							bind:value={form.name}
							placeholder="Branch name *"
							class="h-11 w-full rounded-2xl border-none bg-surface-container-low px-4 font-serif text-xl font-black tracking-tight text-on-surface shadow-inner outline-none focus:ring-2 focus:ring-primary/20"
						/>
						<input
							id="br-loc"
							bind:value={form.location}
							placeholder="Location / Address"
							class="h-10 w-full rounded-2xl border-none bg-surface-container-low px-4 text-sm font-medium text-on-surface-variant shadow-inner outline-none focus:ring-2 focus:ring-primary/20"
						/>
					{:else}
						<h2 class="font-serif text-2xl font-black tracking-tight text-on-surface">{displayName}</h2>
						{#if displayLocation}
							<p class="text-sm font-medium text-on-surface-variant/60">{displayLocation}</p>
						{/if}
					{/if}
				</div>
				{#if !isEditMode}
					<button
						onclick={startEdit}
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-outline-variant/10 text-on-surface-variant transition-all hover:bg-primary hover:text-on-primary hover:border-primary"
					>
						<span class="material-symbols-outlined text-base">edit</span>
					</button>
				{/if}
			</div>

			<!-- Field grid -->
			<div class="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
				<!-- Phone -->
				<div class="flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3">
					<span class="material-symbols-outlined text-base text-on-surface-variant/40">call</span>
					<div class="min-w-0 flex-1">
						<p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Phone</p>
						{#if isEditMode}
							<input bind:value={form.phone} placeholder="Phone number" class="mt-0.5 w-full border-none bg-transparent p-0 text-sm font-bold text-on-surface outline-none placeholder:text-on-surface-variant/30" />
						{:else}
							<p class="mt-0.5 text-sm font-bold text-on-surface">{branch?.phone || '—'}</p>
						{/if}
					</div>
				</div>

				<!-- Email -->
				<div class="flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3">
					<span class="material-symbols-outlined text-base text-on-surface-variant/40">mail</span>
					<div class="min-w-0 flex-1">
						<p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Email</p>
						{#if isEditMode}
							<input bind:value={form.email} type="email" placeholder="branch@email.com" class="mt-0.5 w-full border-none bg-transparent p-0 text-sm font-bold text-on-surface outline-none placeholder:text-on-surface-variant/30" />
						{:else}
							<p class="mt-0.5 text-sm font-bold text-on-surface">{branch?.email || '—'}</p>
						{/if}
					</div>
				</div>

				<!-- Manager -->
				<div class="flex items-start gap-3 rounded-2xl bg-surface-container-low px-4 py-3 sm:col-span-2">
					<span class="material-symbols-outlined mt-3 text-base text-on-surface-variant/40">manage_accounts</span>
					<div class="min-w-0 flex-1">
						<p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Manager</p>
						{#if isEditMode}
							<Select
								bind:value={form.manager}
								class="mt-1.5"
								placeholder="No manager assigned"
								options={[
									{ value: '', label: 'No manager assigned' },
									...usersState.allUsers.map((u) => ({ value: u.id, label: u.name || u.email }))
								]}
							/>
						{:else}
							<p class="mt-0.5 text-sm font-bold text-on-surface">
								{branch?.expand?.manager?.name || branch?.expand?.manager?.email || '—'}
							</p>
						{/if}
					</div>
				</div>

				<!-- Coordinates -->
				{#if form.lat && form.lng || (branch?.lat && branch?.lng)}
					<div class="flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3 sm:col-span-2">
						<span class="material-symbols-outlined text-base text-on-surface-variant/40">my_location</span>
						<div class="min-w-0 flex-1">
							<p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Coordinates</p>
							<p class="mt-0.5 text-sm font-bold text-on-surface">
								{(isEditMode ? form.lat : branch?.lat)?.toFixed(5)}, {(isEditMode ? form.lng : branch?.lng)?.toFixed(5)}
							</p>
						</div>
						{#if isEditMode}
							<button onclick={() => { form.lat = null; form.lng = null; }} class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 transition-colors hover:text-error">
								Clear
							</button>
						{/if}
					</div>
				{:else if isEditMode}
					<p class="text-center text-[10px] font-medium text-on-surface-variant/40 sm:col-span-2">Click the map above to pin the branch location</p>
				{/if}
			</div>

			<!-- Actions (edit mode only) -->
			{#if isEditMode}
				<div class="flex gap-3 border-t border-outline-variant/10 px-6 py-5">
					<SignatureButton onclick={handleSave} disabled={saving || !form.name.trim()} class="flex-1">
						<span class="material-symbols-outlined">{saving ? 'hourglass_empty' : 'save'}</span>
						{saving ? 'Saving…' : isNew ? 'Create Branch' : 'Save Changes'}
					</SignatureButton>
					<button onclick={cancelEdit} class="rounded-2xl border border-outline-variant/10 bg-surface-container-low px-6 text-sm font-bold text-on-surface-variant transition-all hover:bg-surface-container">
						Cancel
					</button>
				</div>
			{/if}
		</div>

	</div>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar { display: none; }
	.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
