<script lang="ts">
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
	import SignatureButton from '$lib/components/artisanal/SignatureButton.svelte';
	import BakingLoader from '$lib/components/BakingLoader.svelte';
	import PaginatedTable from '$lib/components/PaginatedTable.svelte';
	import { fileUrl } from '$lib/pocketbase';
	import { toastState } from '$lib/states/toast.svelte';
	import { usersState } from '$lib/states/users.svelte';
	import { onMount } from 'svelte';

	let loading = $state(false);
	let fetching = $state(true);
	let searchQuery = $state('');
	let selectedRole = $state<string | null>(null);
	let selectedUserId = $state<string | null>(null);

	// CRUD States
	let isEditing = $state(false);
	let isAdding = $state(false);

	// Form State
	let form = $state({
		email: '',
		password: '',
		passwordConfirm: '',
		name: '',
		role: 'staff' as 'admin' | 'cashier' | 'staff' | 'baker',
		avatar: null as File | null,
		active: true
	});

	let filteredUsers = $derived(
		usersState.allUsers.filter((u) => {
			const matchesRole = selectedRole ? u.role === selectedRole : true;
			const matchesSearch =
				u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				u.email?.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesRole && matchesSearch;
		})
	);

	let selectedUser = $derived(usersState.allUsers.find((u) => u.id === selectedUserId) || null);

	let stats = $derived({
		total: usersState.allUsers.length,
		admins: usersState.allUsers.filter((u) => u.role === 'admin').length,
		cashiers: usersState.allUsers.filter((u) => u.role === 'cashier').length,
		bakers: usersState.allUsers.filter((u) => u.role === 'baker').length
	});

	async function fetchUsers() {
		await usersState.init();
		fetching = false;
		if (usersState.allUsers.length > 0 && !selectedUserId) {
			selectedUserId = usersState.allUsers[0].id;
		}
	}

	onMount(fetchUsers);

	function resetForm() {
		if (selectedUser && isEditing) {
			form = {
				email: selectedUser.email,
				password: '',
				passwordConfirm: '',
				name: selectedUser.name || '',
				role: (selectedUser.role as any) || 'staff',
				avatar: null,
				active: selectedUser.active ?? true
			};
		} else {
			form = {
				email: '',
				password: '',
				passwordConfirm: '',
				name: '',
				role: 'staff',
				avatar: null,
				active: true
			};
		}
	}

	function startAdding() {
		isAdding = true;
		isEditing = false;
		resetForm();
	}

	function startEditing() {
		if (!selectedUser) return;
		isEditing = true;
		isAdding = false;
		resetForm();
	}

	async function handleSave() {
		loading = true;
		try {
			const formData = new FormData();
			formData.append('email', form.email);
			if (form.password) {
				formData.append('password', form.password);
				formData.append('passwordConfirm', form.passwordConfirm);
			}
			formData.append('name', form.name);
			formData.append('role', form.role);
			formData.append('active', form.active.toString());
			if (form.avatar) {
				formData.append('avatar', form.avatar);
			}

			if (isAdding) {
				const record = await usersState.create(formData);
				selectedUserId = record.id;
				toastState.success('Staff member registered.');
			} else if (isEditing && selectedUserId) {
				await usersState.update(selectedUserId, formData);
				toastState.success('Profile updated.');
			}

			await fetchUsers();
			isAdding = false;
			isEditing = false;
		} catch (err) {
			console.error('User save failed:', err);
			toastState.error('Failed to save staff member.');
		} finally {
			loading = false;
		}
	}

	async function toggleActive() {
		if (!selectedUserId || !selectedUser) return;
		loading = true;
		try {
			await usersState.update(selectedUserId, { active: !selectedUser.active });
			toastState.success(`Member ${selectedUser.active ? 'deactivated' : 'activated'}.`);
			await fetchUsers();
		} catch (err) {
			toastState.error('Failed to update status.');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Staff & Governance | tinAPPay ERP</title>
</svelte:head>

<div class="flex h-full w-full overflow-hidden bg-surface">
	<!-- MAIN LIST -->
	<div class="flex flex-1 flex-col overflow-hidden border-r border-outline-variant/10">
		<header class="p-8 md:p-10">
			<div class="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
				<div>
					<h2 class="mb-2 font-serif text-4xl font-black tracking-tight text-on-surface">
						Staff & Governance
					</h2>
					<p class="font-medium text-on-surface-variant">
						Manage your kitchen brigade and storefront administrative permissions.
					</p>
				</div>
				<SignatureButton onclick={startAdding} size="md">
					<span class="material-symbols-outlined">person_add</span>
					Register Staff
				</SignatureButton>
			</div>

			<!-- Bento Stats -->
			<div class="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
				<div
					class="group relative flex items-center justify-between overflow-hidden rounded-[2rem] bg-primary-container/10 p-6"
				>
					<div class="z-10">
						<p class="mb-1 text-[10px] font-black tracking-widest text-primary uppercase">
							Total Active Staff
						</p>
						<h3 class="font-serif text-4xl font-black text-primary-dim">{stats.total}</h3>
					</div>
					<span
						class="material-symbols-outlined absolute -right-4 -bottom-4 rotate-12 text-[80px] text-primary/5 transition-transform duration-700 group-hover:rotate-0"
						>groups</span
					>
				</div>
				<ArtisanalCard
					level="lowest"
					class="flex flex-col justify-between border border-outline-variant/10 p-6"
				>
					<p class="text-[10px] font-black tracking-widest text-on-surface-variant uppercase">
						Administrators
					</p>
					<h3 class="font-serif text-3xl font-bold text-on-surface">{stats.admins}</h3>
				</ArtisanalCard>
				<ArtisanalCard
					level="lowest"
					class="flex flex-col justify-between border border-outline-variant/10 p-6"
				>
					<p class="text-[10px] font-black tracking-widest text-on-surface-variant uppercase">
						Front Counter
					</p>
					<h3 class="font-serif text-3xl font-bold text-on-surface">{stats.cashiers}</h3>
				</ArtisanalCard>
			</div>

			<div class="flex flex-col items-center gap-4 md:flex-row">
				<div class="group relative flex-1">
					<span
						class="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary"
						>search</span
					>
					<input
						bind:value={searchQuery}
						class="w-full rounded-full border-none bg-surface-container-low py-3.5 pr-4 pl-12 text-sm font-medium shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
						placeholder="Search team members..."
						type="text"
					/>
				</div>
				<div class="no-scrollbar flex gap-2 overflow-x-auto py-1">
					<button
						onclick={() => (selectedRole = null)}
						class="rounded-xl px-5 py-2 text-xs font-black tracking-widest uppercase transition-all {selectedRole ===
						null
							? 'bg-primary text-white shadow-lg'
							: 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}"
					>
						All
					</button>
					<button
						onclick={() => (selectedRole = 'admin')}
						class="rounded-xl px-5 py-2 text-xs font-black tracking-widest uppercase transition-all {selectedRole ===
						'admin'
							? 'bg-primary text-white shadow-lg'
							: 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}"
					>
						Admins
					</button>
					<button
						onclick={() => (selectedRole = 'cashier')}
						class="rounded-xl px-5 py-2 text-xs font-black tracking-widest uppercase transition-all {selectedRole ===
						'cashier'
							? 'bg-primary text-white shadow-lg'
							: 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}"
					>
						Cashiers
					</button>
				</div>
			</div>
		</header>

		<div class="no-scrollbar flex-1 overflow-y-auto px-8 pb-10">
			{#if fetching}
				<div class="flex h-64 items-center justify-center">
					<BakingLoader />
				</div>
			{:else}
				<ArtisanalCard
					level="lowest"
					class="overflow-hidden border border-outline-variant/10 p-0 shadow-sm"
				>
					<PaginatedTable
						items={filteredUsers}
						pageSize={10}
						tableClass="w-full text-left border-collapse"
						emptyMessage="No staff members found."
					>
						{#snippet header()}
							<tr
								class="bg-surface-container-low text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase"
							>
								<th class="px-8 py-5">Staff Member</th>
								<th class="px-6 py-5">Designation</th>
								<th class="px-6 py-5 text-center">Status</th>
								<th class="px-8 py-5 text-right">Actions</th>
							</tr>
						{/snippet}
						{#snippet row(user)}
							<tr
								class="group cursor-pointer transition-colors hover:bg-surface-container-low/40 {selectedUserId ===
								user.id
									? 'bg-primary/5'
									: ''}"
								onclick={() => {
									selectedUserId = user.id;
									isAdding = false;
									isEditing = false;
								}}
							>
								<td class="px-8 py-5">
									<div class="flex items-center gap-4">
										<div
											class="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full border-2 border-white bg-surface-container shadow-sm transition-transform group-hover:scale-105"
										>
											{#if user.avatar}
												<img
													src={fileUrl(user, user.avatar)}
													alt=""
													class="h-full w-full object-cover"
												/>
											{:else}
												<div
													class="flex h-full w-full items-center justify-center bg-primary/10 text-xs font-black text-primary uppercase"
												>
													{user.name?.substring(0, 2) || 'US'}
												</div>
											{/if}
										</div>
										<div>
											<p class="text-sm font-bold text-on-surface">{user.name || 'Anonymous'}</p>
											<p
												class="text-[10px] font-bold tracking-tighter text-on-surface-variant uppercase"
											>
												{user.email}
											</p>
										</div>
									</div>
								</td>
								<td class="px-6 py-5">
									<span
										class="rounded-md bg-secondary-container px-3 py-1 text-[10px] font-black tracking-widest text-on-secondary-container uppercase"
										>{user.role || 'staff'}</span
									>
								</td>
								<td class="px-6 py-5">
									<div class="flex items-center justify-center gap-2">
										<span
											class="h-2 w-2 rounded-full {user.active !== false
												? 'bg-tertiary shadow-[0_0_8px_rgba(125,162,122,0.5)]'
												: 'bg-on-surface-variant/30'}"
										></span>
										<span
											class="text-[10px] font-black tracking-widest uppercase {user.active !== false
												? 'text-tertiary-dim'
												: 'text-on-surface-variant/50'}"
										>
											{user.active !== false ? 'Active' : 'Deactivated'}
										</span>
									</div>
								</td>
								<td class="px-8 py-5 text-right">
									<span
										class="material-symbols-outlined text-on-surface-variant/30 transition-all group-hover:text-primary"
										>chevron_right</span
									>
								</td>
							</tr>
						{/snippet}
					</PaginatedTable>
				</ArtisanalCard>
			{/if}
		</div>
	</div>

	<!-- DETAIL PANEL -->
	<aside
		class="z-20 flex w-full flex-col overflow-hidden border-l border-outline-variant/10 bg-surface-container-low/30 lg:w-[450px] xl:w-[550px] {selectedUserId ||
		isAdding
			? 'flex'
			: 'hidden lg:flex'}"
	>
		{#if isAdding || isEditing}
			<header
				class="flex items-center justify-between border-b border-outline-variant/10 bg-surface-container-low/20 p-10"
			>
				<div>
					<h3 class="font-serif text-2xl font-black tracking-tight text-on-surface">
						{isAdding ? 'Register Member' : 'Refine Profile'}
					</h3>
					<p class="mt-1 text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase">
						Staff Authorization
					</p>
				</div>
				<button
					onclick={() => {
						isAdding = false;
						isEditing = false;
					}}
					class="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-container-high"
				>
					<span class="material-symbols-outlined">close</span>
				</button>
			</header>

			<div class="no-scrollbar flex-1 space-y-8 overflow-y-auto p-10">
				<div class="space-y-2">
					<label
						for="user-name"
						class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
						>Display Name</label
					>
					<input
						id="user-name"
						bind:value={form.name}
						type="text"
						class="h-14 w-full rounded-2xl border-none bg-surface-container-low px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20"
						placeholder="Full Name"
					/>
				</div>

				<div class="space-y-2">
					<label
						for="user-email"
						class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
						>Email Address</label
					>
					<input
						id="user-email"
						bind:value={form.email}
						type="email"
						class="h-14 w-full rounded-2xl border-none bg-surface-container-low px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20"
						placeholder="staff@tinappay.ledger"
					/>
				</div>

				<div class="space-y-2">
					<label
						for="user-role"
						class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
						>System Role</label
					>
					<select
						id="user-role"
						bind:value={form.role}
						class="h-14 w-full rounded-2xl border-none bg-surface-container-low px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20"
					>
						<option value="admin">Administrator</option>
						<option value="cashier">Cashier / POS</option>
						<option value="baker">Baker</option>
						<option value="staff">General Staff</option>
					</select>
				</div>

				<div
					class="flex items-center justify-between rounded-2xl border border-outline-variant/10 bg-surface-container-low/50 p-6"
				>
					<div>
						<p class="text-[10px] font-black tracking-widest text-on-surface uppercase">
							Account Status
						</p>
						<p class="text-[10px] font-medium text-on-surface-variant/70">
							Allow this member to access the system.
						</p>
					</div>
					<button
						type="button"
						aria-label="Toggle Active"
						onclick={() => (form.active = !form.active)}
						class="relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none {form.active
							? 'bg-primary'
							: 'bg-outline-variant/30'}"
					>
						<span
							class="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {form.active
								? 'translate-x-5'
								: 'translate-x-0'}"
						></span>
					</button>
				</div>

				{#if isAdding}
					<div class="grid grid-cols-2 gap-6">
						<div class="space-y-2">
							<label
								for="user-pass"
								class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
								>Access Token</label
							>
							<input
								id="user-pass"
								bind:value={form.password}
								type="password"
								class="h-14 w-full rounded-2xl border-none bg-surface-container-low px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20"
								placeholder="Password"
							/>
						</div>
						<div class="space-y-2">
							<label
								for="user-confirm"
								class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
								>Confirm Access</label
							>
							<input
								id="user-confirm"
								bind:value={form.passwordConfirm}
								type="password"
								class="h-14 w-full rounded-2xl border-none bg-surface-container-low px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20"
								placeholder="Confirm"
							/>
						</div>
					</div>
				{/if}

				<div class="space-y-4">
					<label
						for="user-avatar"
						class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
						>Identity Portrait</label
					>
					<div
						class="flex items-center gap-6 rounded-2xl border-2 border-dashed border-outline-variant/20 bg-surface-container-low/30 p-6"
					>
						<div
							class="flex h-20 w-20 items-center justify-center rounded-full border border-outline-variant/10 bg-white text-on-surface-variant/30 shadow-sm"
						>
							<span class="material-symbols-outlined text-3xl">add_a_photo</span>
						</div>
						<input
							id="user-avatar"
							type="file"
							onchange={(e) => (form.avatar = e.currentTarget.files?.[0] || null)}
							class="flex-1 text-xs font-bold text-on-surface-variant transition-all file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-[10px] file:font-black file:text-primary hover:file:bg-primary/20"
						/>
					</div>
				</div>
			</div>

			<footer class="border-t border-outline-variant/10 bg-surface-container-low/10 p-10">
				<SignatureButton disabled={loading} onclick={handleSave} class="h-16 w-full" size="lg">
					{loading ? 'Synchronizing...' : isAdding ? 'Initialize Record' : 'Apply Updates'}
				</SignatureButton>
			</footer>
		{:else if selectedUser}
			<header
				class="relative overflow-hidden border-b border-outline-variant/10 bg-surface-container-low/20 p-10"
			>
				<div class="absolute top-0 right-0 flex gap-3 p-8">
					<button
						onclick={startEditing}
						class="flex h-12 w-12 items-center justify-center rounded-2xl border border-outline-variant/10 bg-white text-on-surface-variant shadow-sm transition-all hover:bg-primary hover:text-white active:scale-90"
						><span class="material-symbols-outlined text-xl">edit</span></button
					>
					<button
						onclick={toggleActive}
						disabled={loading}
						class="flex h-12 items-center gap-2 rounded-2xl border px-4 text-[9px] font-black tracking-widest uppercase shadow-sm transition-all active:scale-90 disabled:opacity-50
							{selectedUser.active !== false
							? 'border-outline-variant/10 bg-white text-error hover:border-error hover:bg-error hover:text-white'
							: 'border-outline-variant/10 bg-white text-tertiary hover:border-tertiary hover:bg-tertiary hover:text-white'}"
					>
						<span class="material-symbols-outlined text-sm"
							>{selectedUser.active !== false ? 'block' : 'check_circle'}</span
						>
						{selectedUser.active !== false ? 'Deactivate' : 'Activate'}
					</button>
				</div>

				<div class="mb-8">
					<div
						class="relative z-10 flex h-32 w-32 items-center justify-center overflow-hidden rounded-[2.5rem] border-4 border-white bg-white shadow-2xl"
					>
						{#if selectedUser.avatar}
							<img
								alt={selectedUser.name}
								class="h-full w-full object-cover"
								src={fileUrl(selectedUser, selectedUser.avatar)}
							/>
						{:else}
							<div class="text-4xl font-black text-primary uppercase opacity-20">
								{selectedUser.name?.substring(0, 2) || 'US'}
							</div>
						{/if}
					</div>
				</div>

				<div class="relative z-10">
					<h3 class="mb-2 font-serif text-3xl font-black tracking-tight text-on-surface">
						{selectedUser.name || 'Unnamed Staff'}
					</h3>
					<div class="flex items-center gap-3">
						<span
							class="rounded-lg bg-primary px-3 py-1 text-[10px] font-black tracking-widest text-white uppercase"
						>
							{selectedUser.role || 'staff'}
						</span>
						<span
							class="rounded-lg {selectedUser.active !== false
								? 'bg-tertiary/10 text-tertiary'
								: 'bg-error/10 text-error'} px-3 py-1 text-[10px] font-black tracking-widest uppercase"
						>
							{selectedUser.active !== false ? 'Active' : 'Deactivated'}
						</span>
						<span
							class="text-[10px] font-black tracking-widest text-on-surface-variant uppercase opacity-60"
							>• ID: #{selectedUser.id.substring(0, 8)}</span
						>
					</div>
				</div>
			</header>

			<div class="no-scrollbar flex-1 space-y-10 overflow-y-auto p-10">
				<section>
					<h4
						class="mb-6 px-1 text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase"
					>
						Member Information
					</h4>
					<div class="grid grid-cols-1 gap-4">
						<ArtisanalCard
							level="low"
							class="group flex items-center gap-5 border border-outline-variant/5 p-5 transition-all hover:border-primary/30"
						>
							<div
								class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-inner transition-all group-hover:bg-primary group-hover:text-white"
							>
								<span class="material-symbols-outlined">mail</span>
							</div>
							<div class="flex-1">
								<p
									class="mb-0.5 text-[9px] font-black tracking-widest text-on-surface-variant uppercase"
								>
									Email Address
								</p>
								<p class="text-sm font-bold text-on-surface">{selectedUser.email}</p>
							</div>
						</ArtisanalCard>
						<ArtisanalCard
							level="low"
							class="group flex items-center gap-5 border border-outline-variant/5 p-5 transition-all hover:border-primary/30"
						>
							<div
								class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-inner transition-all group-hover:bg-primary group-hover:text-white"
							>
								<span class="material-symbols-outlined">event</span>
							</div>
							<div class="flex-1">
								<p
									class="mb-0.5 text-[9px] font-black tracking-widest text-on-surface-variant uppercase"
								>
									Registration Date
								</p>
								<p class="text-sm font-bold text-on-surface">
									{new Date(selectedUser.created).toLocaleDateString('en-US', {
										day: 'numeric',
										month: 'long',
										year: 'numeric'
									})}
								</p>
							</div>
						</ArtisanalCard>
					</div>
				</section>

				<section>
					<h4
						class="mb-6 px-1 text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase"
					>
						Governance Access
					</h4>
					<div
						class="rounded-[2.5rem] border-2 border-outline-variant/10 bg-surface-container-low/30 p-8"
					>
						<div class="mb-8 flex items-start gap-5 border-b border-outline-variant/10 pb-8">
							<div
								class="flex h-12 w-12 items-center justify-center rounded-2xl border border-outline-variant/10 bg-white text-primary shadow-sm"
							>
								<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;"
									>security</span
								>
							</div>
							<div>
								<h5 class="text-xs font-black tracking-tight text-on-surface uppercase">
									System Privileges
								</h5>
								<p class="mt-1 text-xs leading-relaxed font-medium text-on-surface-variant">
									This member has {selectedUser.role === 'admin'
										? 'full administrative control over production and finance'
										: 'restricted access limited to storefront sales and terminal operations'}.
								</p>
							</div>
						</div>

						<div class="space-y-4">
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold text-on-surface">Terminal Auth</span>
								<div
									class="h-2 w-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(125,162,122,0.5)]"
								></div>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold text-on-surface">Inventory Management</span>
								<div
									class="h-2 w-2 rounded-full {selectedUser.role === 'admin'
										? 'bg-tertiary shadow-[0_0_8px_rgba(125,162,122,0.5)]'
										: 'bg-outline-variant/30'}"
								></div>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold text-on-surface">Financial Auditing</span>
								<div
									class="h-2 w-2 rounded-full {selectedUser.role === 'admin'
										? 'bg-tertiary shadow-[0_0_8px_rgba(125,162,122,0.5)]'
										: 'bg-outline-variant/30'}"
								></div>
							</div>
						</div>
					</div>
				</section>
			</div>

			<footer class="border-t border-outline-variant/10 bg-surface-container-low/10 p-10">
				<button
					class="h-14 w-full rounded-2xl border-2 border-primary text-[10px] font-black tracking-[0.2em] text-primary uppercase shadow-sm transition-all hover:bg-primary hover:text-white active:scale-95"
				>
					Rotate Security Credentials
				</button>
			</footer>
		{:else}
			<div class="flex h-full flex-col items-center justify-center p-12 text-center opacity-40">
				<div
					class="mb-8 flex h-32 w-32 items-center justify-center rounded-[3rem] bg-surface-container-low shadow-inner"
				>
					<span class="material-symbols-outlined text-6xl text-on-surface-variant">person</span>
				</div>
				<h3 class="mb-2 font-serif text-2xl font-black tracking-tighter text-on-surface uppercase">
					Team Profile
				</h3>
				<p
					class="max-w-xs text-center text-sm font-bold tracking-widest text-on-surface-variant uppercase"
				>
					Select a brigade member to review their system access and identity details.
				</p>
			</div>
		{/if}
	</aside>
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
