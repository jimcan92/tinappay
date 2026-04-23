<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
	import SignatureButton from '$lib/components/artisanal/SignatureButton.svelte';
	import BakingLoader from '$lib/components/BakingLoader.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import PaginatedTable from '$lib/components/PaginatedTable.svelte';
	import Select from '$lib/components/Select.svelte';
	import { fileUrl } from '$lib/pocketbase';
	import { branchesState } from '$lib/states/branches.svelte';
	import { toastState } from '$lib/states/toast.svelte';
	import { usersState } from '$lib/states/users.svelte';
	import { onMount } from 'svelte';

	type DialogMode = 'edit' | null;

	let fetching = $state(true);
	let searchQuery = $state('');
	let selectedRole = $state<string | null>(null);
	let selectedBranch = $state<string | null>(null); // '' = all, 'none' = unassigned, id = specific branch
	let dialogMode = $state<DialogMode>(null);
	let saving = $state(false);
	let editingUserId = $state<string | null>(null);

	let form = $state({
		name: '',
		password: '',
		passwordConfirm: '',
		role: '' as string,
		branch: '' as string,
		avatar: null as File | null
	});
	let avatarPreview = $state<string | null>(null);

	let stats = $derived({
		total: usersState.allUsers.length,
		admins: usersState.allUsers.filter((u) => u.role === 'admin').length,
		cashiers: usersState.allUsers.filter((u) => u.role === 'cashier').length,
		bakers: usersState.allUsers.filter((u) => u.role === 'baker').length,
		staff: usersState.allUsers.filter((u) => u.role === 'staff').length,
		pending: usersState.allUsers.filter((u) => !u.role).length
	});
	let filteredUsers = $derived(
		usersState.allUsers.filter((u) => {
			if (selectedRole === 'pending') return !u.role;
			const matchesRole = selectedRole ? u.role === selectedRole : true;
			const matchesBranch =
				selectedBranch === 'none' ? !u.branch : selectedBranch ? u.branch === selectedBranch : true;
			const matchesSearch = (u.name || u.email || '')
				.toLowerCase()
				.includes(searchQuery.toLowerCase());
			return matchesRole && matchesBranch && matchesSearch;
		})
	);

	let branchOptions = $derived([
		{ value: '', label: 'No branch assigned' },
		...branchesState.items.map((b) => ({ value: b.id, label: b.name }))
	]);

	onMount(async () => {
		await Promise.all([usersState.init(), branchesState.load()]);
		fetching = false;
	});

	$effect(() => {
		if (page.url.searchParams.get('user')) {
			const userId = page.url.searchParams.get('user')!;
			const user = usersState.allUsers.find((u) => u.id === userId);
			if (user) openEdit(user);
		}
	});

	function openEdit(user: any) {
		editingUserId = user.id;
		form = {
			name: user.name || '',
			password: '',
			passwordConfirm: '',
			role: user.role || '',
			branch: user.branch || '',
			avatar: null
		};
		avatarPreview = null;
		dialogMode = 'edit';
	}

	function closeDialog() {
		dialogMode = null;
		editingUserId = null;
	}

	function handleAvatarChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) {
			form.avatar = file;
			avatarPreview = URL.createObjectURL(file);
		}
	}

	async function handleSave() {
		if (!editingUserId) return;
		saving = true;
		try {
			const data: Record<string, any> = {
				name: form.name,
				role: form.role || null,
				branch: form.branch || null,
				emailVisibility: true
			};
			if (form.password) {
				data.password = form.password;
				data.passwordConfirm = form.passwordConfirm;
			}
			if (form.avatar) data.avatar = form.avatar;
			await usersState.update(editingUserId, data);
			toastState.success('Profile updated.');
			closeDialog();
		} catch (err: any) {
			console.error('Save error:', err?.data ?? err);
			toastState.error('Failed to save.');
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		if (!editingUserId) return;
		saving = true;
		try {
			await usersState.delete(editingUserId);
			toastState.success('Staff member removed.');
			closeDialog();
		} catch {
			toastState.error('Failed to remove staff member.');
		} finally {
			saving = false;
		}
	}

	const roleColors: Record<string, string> = {
		admin: 'bg-primary/10 text-primary',
		cashier: 'bg-tertiary/10 text-tertiary',
		baker: 'bg-secondary/10 text-secondary',
		staff: 'bg-surface-container text-on-surface-variant'
	};

	let editingUser = $derived(usersState.allUsers.find((u) => u.id === editingUserId));

	const cards = $derived([
		{
			label: 'Total',
			value: null,
			count: stats.total,
			active: 'bg-primary/20 ring-2 ring-primary/30',
			inactive: 'bg-primary/10',
			text: 'text-primary'
		},
		{
			label: 'Pending',
			value: 'pending',
			count: stats.pending,
			active: 'bg-amber-500/20 ring-2 ring-amber-500/30',
			inactive: stats.pending > 0 ? 'bg-amber-500/10' : 'bg-surface-container-low',
			text: stats.pending > 0 ? 'text-amber-500' : 'text-on-surface'
		},
		{
			label: 'Admins',
			value: 'admin',
			count: stats.admins,
			active: 'bg-surface-container ring-2 ring-primary/30',
			inactive: 'bg-surface-container-low',
			text: 'text-on-surface'
		},
		{
			label: 'Cashiers',
			value: 'cashier',
			count: stats.cashiers,
			active: 'bg-surface-container ring-2 ring-primary/30',
			inactive: 'bg-surface-container-low',
			text: 'text-on-surface'
		},
		{
			label: 'Bakers',
			value: 'baker',
			count: stats.bakers,
			active: 'bg-surface-container ring-2 ring-primary/30',
			inactive: 'bg-surface-container-low',
			text: 'text-on-surface'
		},
		{
			label: 'Staff',
			value: 'staff',
			count: stats.staff,
			active: 'bg-surface-container ring-2 ring-primary/30',
			inactive: 'bg-surface-container-low',
			text: 'text-on-surface'
		}
	]);
</script>

<svelte:head><title>Staff | Management</title></svelte:head>

<div class="no-scrollbar h-full overflow-y-auto px-6 py-8 md:px-10">
	{#snippet statButton(card: any, extraClass: string = '')}
		<button
			onclick={() => (selectedRole = selectedRole === card.value ? null : card.value)}
			class="rounded-2xl p-4 text-left transition-all {selectedRole === card.value
				? card.active
				: card.inactive} hover:brightness-95 {extraClass}"
		>
			<p
				class="text-[9px] font-black tracking-widest uppercase {selectedRole === card.value
					? card.value === 'pending'
						? 'text-amber-500'
						: 'text-primary'
					: 'text-on-surface-variant'}"
			>
				{card.label}
			</p>
			<p class="mt-1 font-serif text-3xl font-black {card.text}">{card.count}</p>
		</button>
	{/snippet}

	<!-- Desktop View -->
	<div class="mb-6 hidden gap-3 lg:grid lg:grid-cols-6">
		{#each cards as card}
			{@render statButton(card)}
		{/each}
	</div>

	<!-- Mobile View -->
	<div class="mb-6 flex flex-col gap-3 lg:hidden">
		<!-- Top Row: Total and Pending -->
		<div class="grid grid-cols-2 gap-3">
			{@render statButton(cards[0])}
			{@render statButton(cards[1])}
		</div>
		<!-- Bottom Row: Roles -->
		<div class="no-scrollbar grid grid-cols-4 gap-2 overflow-x-auto pb-1">
			{#each cards.slice(2) as card}
				{@render statButton(card, 'min-w-[85px]')}
			{/each}
		</div>
	</div>

	<div class="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
		<div class="relative flex-1">
			<span
				class="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-on-surface-variant"
				>search</span
			>
			<input
				bind:value={searchQuery}
				type="text"
				placeholder="Search staff..."
				class="h-12 w-full rounded-full border-none bg-surface-container-low pr-4 pl-12 text-sm font-medium shadow-inner outline-none focus:ring-2 focus:ring-primary/20"
			/>
		</div>
		<div class="flex w-full gap-3 md:w-auto">
			<Select
				value={selectedBranch ?? ''}
				onchange={(v) => (selectedBranch = v || null)}
				options={[
					{ value: '', label: 'All Branches' },
					{ value: 'none', label: 'Unassigned' },
					...branchesState.items.map((b) => ({ value: b.id, label: b.name }))
				]}
				placeholder="All Branches"
				class="flex-1 md:w-44 md:flex-none"
			/>
			<a
				href="/management/staff/attendance"
				class="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-outline-variant/10 bg-surface-container-low px-5 text-sm font-bold text-on-surface-variant transition-all hover:bg-primary hover:text-on-primary md:flex-none"
			>
				<span class="material-symbols-outlined text-base" style="font-variation-settings:'FILL' 1"
					>badge</span
				>
				Attendance
			</a>
		</div>
	</div>

	{#if fetching}
		<div class="flex h-48 items-center justify-center"><BakingLoader /></div>
	{:else}
		<ArtisanalCard
			level="lowest"
			class="overflow-hidden border border-outline-variant/10 p-0 shadow-sm"
		>
			<PaginatedTable
				items={filteredUsers}
				pageSize={10}
				tableClass="w-full min-w-[700px] border-collapse text-left"
				emptyMessage="No users found"
			>
				{#snippet header()}
					<tr
						class="bg-surface-container-low text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase"
					>
						<th class="px-6 py-4">Staff Member</th>
						<th class="px-4 py-4">Email</th>
						<th class="px-4 py-4">Role</th>
						<th class="px-4 py-4">Branch</th>
						<th class="px-4 py-4"></th>
					</tr>
				{/snippet}
				{#snippet row(user)}
					<tr
						onclick={() => openEdit(user)}
						class="cursor-pointer transition-colors hover:bg-surface-container-low/50"
					>
						<td class="px-6 py-4">
							<div class="flex items-center gap-3">
								<div
									class="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-outline-variant/10 bg-surface-container"
								>
									{#if user.avatar}
										<img
											src={fileUrl(user, user.avatar)}
											alt=""
											class="h-full w-full object-cover"
										/>
									{:else}
										<div
											class="flex h-full w-full items-center justify-center bg-primary/10 text-[10px] font-black text-primary uppercase"
										>
											{user.name?.substring(0, 2) || 'US'}
										</div>
									{/if}
								</div>
								<p class="truncate text-sm font-bold text-on-surface">
									{user.name || 'Anonymous'}
								</p>
							</div>
						</td>
						<td class="px-4 py-4">
							<p class="text-sm font-medium text-on-surface-variant/60">{user.email || '—'}</p>
						</td>
						<td class="px-4 py-4">
							{#if user.role}
								<span
									class="rounded-lg px-3 py-1 text-[10px] font-black tracking-widest uppercase {roleColors[
										user.role
									] ?? roleColors.staff}">{user.role}</span
								>
							{:else}
								<span
									class="rounded-lg bg-amber-500/10 px-3 py-1 text-[10px] font-black tracking-widest text-amber-500 uppercase"
									>Pending</span
								>
							{/if}
						</td>
						<td class="px-4 py-4">
							<p class="text-sm font-medium text-on-surface-variant/60">
								{branchesState.items.find((b) => b.id === user.branch)?.name || '—'}
							</p>
						</td>
						<td class="px-4 py-4 text-right">
							<button
								onclick={(e) => {
									e.stopPropagation();
									goto(`/management/staff/attendance?user=${user.id}`);
								}}
								class="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/10 bg-surface-container-low px-3 py-1.5 text-[10px] font-black tracking-widest text-on-surface-variant uppercase transition-all hover:border-primary hover:bg-primary hover:text-on-primary"
							>
								<span
									class="material-symbols-outlined text-sm"
									style="font-variation-settings:'FILL' 1">badge</span
								>
								Shifts
							</button>
						</td>
					</tr>
				{/snippet}
			</PaginatedTable>
		</ArtisanalCard>
	{/if}
</div>

<!-- Edit Dialog -->
<Dialog open={dialogMode === 'edit'} title="Edit Staff" onClose={closeDialog} size="sm">
	<div class="space-y-4">
		<!-- Avatar picker -->
		<div class="flex justify-center">
			<label class="group relative cursor-pointer">
				<div
					class="h-20 w-20 overflow-hidden rounded-2xl border-2 border-primary/10 bg-surface-container shadow-inner transition-all group-hover:border-primary/30"
				>
					{#if avatarPreview}
						<img src={avatarPreview} alt="" class="h-full w-full object-cover" />
					{:else if editingUser?.avatar}
						<img
							src={fileUrl(editingUser, editingUser.avatar)}
							alt=""
							class="h-full w-full object-cover"
						/>
					{:else}
						<div class="flex h-full w-full items-center justify-center bg-primary/5">
							<span class="material-symbols-outlined text-3xl text-primary/30">person</span>
						</div>
					{/if}
				</div>
				<div
					class="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-primary shadow-md"
				>
					<span class="material-symbols-outlined text-sm">photo_camera</span>
				</div>
				<input type="file" accept="image/*" class="hidden" onchange={handleAvatarChange} />
			</label>
		</div>

		<div class="space-y-1.5">
			<label
				for="sf-name"
				class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
				>Full Name</label
			>
			<input
				id="sf-name"
				bind:value={form.name}
				type="text"
				placeholder="Full Name"
				class="h-12 w-full rounded-2xl border-none bg-surface-container-low px-5 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-primary/20"
			/>
		</div>

		<div class="space-y-1.5">
			<p class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">
				Role
			</p>
			<div class="flex flex-wrap gap-2">
				{#each ['admin', 'cashier', 'baker', 'staff'] as r}
					<button
						onclick={() => (form.role = form.role === r ? '' : r)}
						class="min-w-[70px] flex-1 rounded-xl px-2 py-2.5 text-xs font-black tracking-widest uppercase transition-all {form.role ===
						r
							? 'bg-primary text-on-primary shadow-md'
							: 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}"
					>
						{r}
					</button>
				{/each}
			</div>
		</div>

		<div class="space-y-1.5">
			<p class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">
				Branch
			</p>
			<Select bind:value={form.branch} options={branchOptions} placeholder="No branch assigned" />
		</div>
	</div>

	{#snippet footer()}
		<div class="flex gap-2">
			<button
				onclick={handleDelete}
				disabled={saving}
				class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-on-surface-variant transition-all hover:bg-error/10 hover:text-error disabled:opacity-40"
			>
				<span class="material-symbols-outlined text-base">delete</span>
			</button>
			<SignatureButton onclick={handleSave} disabled={saving} class="flex-1">
				<span class="material-symbols-outlined">{saving ? 'hourglass_empty' : 'save'}</span>
				{saving ? 'Saving…' : 'Save Changes'}
			</SignatureButton>
		</div>
	{/snippet}
</Dialog>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
