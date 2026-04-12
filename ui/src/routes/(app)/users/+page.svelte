<script lang="ts">
	import { onMount } from 'svelte';
	import { pb } from '$lib/pocketbase';
	import SignatureButton from '$lib/components/artisanal/SignatureButton.svelte';
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
    import BakingLoader from '$lib/components/BakingLoader.svelte';

	let users = $state<any[]>([]);
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
		role: 'Cashier',
		avatar: null as File | null
	});

	let filteredUsers = $derived(
		users.filter((u) => {
			const matchesRole = selectedRole ? u.role === selectedRole : true;
			const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesRole && matchesSearch;
		})
	);

	let selectedUser = $derived(
		users.find(u => u.id === selectedUserId) || null
	);

    let stats = $derived({
        total: users.length,
        admins: users.filter(u => u.role === 'Admin').length,
        cashiers: users.filter(u => u.role === 'Cashier').length
    });

	async function fetchUsers() {
		try {
			const userList = await pb.collection('users').getFullList({ sort: '-created' });
			users = userList;
			if (users.length > 0 && !selectedUserId) {
				selectedUserId = users[0].id;
			}
		} catch (error) {
			console.error('Failed to fetch users:', error);
		} finally {
            fetching = false;
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
				role: selectedUser.role || 'Cashier',
				avatar: null
			};
		} else {
			form = {
				email: '',
				password: '',
				passwordConfirm: '',
				name: '',
				role: 'Cashier',
				avatar: null
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
			if (form.avatar) {
				formData.append('avatar', form.avatar);
			}

			if (isAdding) {
				const record = await pb.collection('users').create(formData);
				selectedUserId = record.id;
			} else if (isEditing && selectedUserId) {
				await pb.collection('users').update(selectedUserId, formData);
			}

			await fetchUsers();
			isAdding = false;
			isEditing = false;
		} catch (err) {
			console.error('User save failed:', err);
		} finally {
			loading = false;
		}
	}

	async function handleDelete() {
		if (!selectedUserId || !confirm('Permanently remove this team member?')) return;
		loading = true;
		try {
			await pb.collection('users').delete(selectedUserId);
			selectedUserId = null;
			await fetchUsers();
		} catch (err) {
			console.error('Delete failed:', err);
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex h-full w-full overflow-hidden bg-background">
	<!-- MAIN LIST -->
	<div class="flex flex-1 flex-col overflow-hidden border-r border-outline-variant/10">
		<header class="p-8 md:p-10">
            <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <h2 class="font-serif text-4xl font-black tracking-tight text-on-surface mb-2">Staff & Governance</h2>
                    <p class="text-on-surface-variant font-medium">Manage your kitchen brigade and storefront administrative permissions.</p>
                </div>
                <SignatureButton onclick={startAdding} size="md">
                    <span class="material-symbols-outlined">person_add</span>
                    Register Staff
                </SignatureButton>
            </div>

            <!-- Bento Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <div class="bg-primary-container/10 p-6 rounded-[2rem] flex items-center justify-between overflow-hidden relative group">
                    <div class="z-10">
                        <p class="text-primary font-black text-[10px] uppercase tracking-widest mb-1">Total Active Staff</p>
                        <h3 class="text-4xl font-serif font-black text-primary-dim">{stats.total}</h3>
                    </div>
                    <span class="material-symbols-outlined text-[80px] text-primary/5 absolute -right-4 -bottom-4 rotate-12 group-hover:rotate-0 transition-transform duration-700">groups</span>
                </div>
                <ArtisanalCard level="lowest" class="p-6 border border-outline-variant/10 flex flex-col justify-between">
                    <p class="text-on-surface-variant text-[10px] font-black uppercase tracking-widest">Administrators</p>
                    <h3 class="text-3xl font-serif font-bold text-on-surface">{stats.admins}</h3>
                </ArtisanalCard>
                <ArtisanalCard level="lowest" class="p-6 border border-outline-variant/10 flex flex-col justify-between">
                    <p class="text-on-surface-variant text-[10px] font-black uppercase tracking-widest">Front Counter</p>
                    <h3 class="text-3xl font-serif font-bold text-on-surface">{stats.cashiers}</h3>
                </ArtisanalCard>
            </div>

            <div class="flex flex-col md:flex-row gap-4 items-center">
                <div class="relative flex-1 group">
                    <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary">search</span>
                    <input
                        bind:value={searchQuery}
                        class="w-full rounded-full border-none bg-surface-container-low py-3.5 pl-12 pr-4 text-sm font-medium transition-all focus:ring-2 focus:ring-primary/20 shadow-sm"
                        placeholder="Search team members..."
                        type="text"
                    />
                </div>
                <div class="no-scrollbar flex gap-2 overflow-x-auto py-1">
                    <button
                        onclick={() => (selectedRole = null)}
                        class="rounded-xl px-5 py-2 text-xs font-black uppercase tracking-widest transition-all {selectedRole === null ? 'bg-primary text-white shadow-lg' : 'bg-muted text-muted-foreground'}"
                    >
                        All
                    </button>
                    <button
                        onclick={() => (selectedRole = 'Admin')}
                        class="rounded-xl px-5 py-2 text-xs font-black uppercase tracking-widest transition-all {selectedRole === 'Admin' ? 'bg-primary text-white shadow-lg' : 'bg-muted text-muted-foreground'}"
                    >
                        Admins
                    </button>
                    <button
                        onclick={() => (selectedRole = 'Cashier')}
                        class="rounded-xl px-5 py-2 text-xs font-black uppercase tracking-widest transition-all {selectedRole === 'Cashier' ? 'bg-primary text-white shadow-lg' : 'bg-muted text-muted-foreground'}"
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
                <ArtisanalCard level="lowest" class="p-0 overflow-hidden shadow-sm border border-outline-variant/10">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-surface-container-low text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em]">
                                <th class="px-8 py-5">Staff Member</th>
                                <th class="px-6 py-5">Designation</th>
                                <th class="px-6 py-5">Status</th>
                                <th class="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-outline-variant/5">
                            {#each filteredUsers as user}
                                <tr 
                                    class="hover:bg-surface-container-low/40 transition-colors group cursor-pointer {selectedUserId === user.id ? 'bg-primary/5' : ''}"
                                    onclick={() => { selectedUserId = user.id; isAdding = false; isEditing = false; }}
                                >
                                    <td class="px-8 py-5">
                                        <div class="flex items-center gap-4">
                                            <div class="h-11 w-11 rounded-full overflow-hidden bg-surface-container border-2 border-white shadow-sm flex-shrink-0 transition-transform group-hover:scale-105">
                                                {#if user.avatar}
                                                    <img src={pb.files.getUrl(user, user.avatar)} alt="" class="h-full w-full object-cover" />
                                                {:else}
                                                    <div class="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-black text-xs uppercase">{user.name?.substring(0, 2) || 'US'}</div>
                                                {/if}
                                            </div>
                                            <div>
                                                <p class="font-bold text-on-surface text-sm">{user.name || 'Anonymous'}</p>
                                                <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-5">
                                        <span class="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-md text-[10px] font-black uppercase tracking-widest">{user.role || 'Staff'}</span>
                                    </td>
                                    <td class="px-6 py-5">
                                        <div class="flex items-center gap-2">
                                            <span class="h-2 w-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(125,162,122,0.5)]"></span>
                                            <span class="text-[10px] font-black uppercase tracking-widest text-tertiary-dim">Active</span>
                                        </div>
                                    </td>
                                    <td class="px-8 py-5 text-right">
                                        <span class="material-symbols-outlined text-on-surface-variant/30 group-hover:text-primary transition-all">chevron_right</span>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </ArtisanalCard>
            {/if}
		</div>
	</div>

	<!-- DETAIL PANEL -->
	<aside class="z-20 flex w-full flex-col overflow-hidden bg-surface-container-lowest border-l border-outline-variant/10 lg:w-[450px] xl:w-[550px] {selectedUserId || isAdding ? 'flex' : 'hidden lg:flex'}">
		{#if isAdding || isEditing}
			<header class="p-10 border-b border-outline-variant/10 bg-surface-container-low/20 flex items-center justify-between">
				<div>
					<h3 class="text-2xl font-black text-foreground tracking-tight font-serif">{isAdding ? 'Register Member' : 'Refine Profile'}</h3>
					<p class="text-[10px] text-on-surface-variant font-black uppercase tracking-[0.2em] mt-1">Staff Authorization</p>
				</div>
				<button onclick={() => { isAdding = false; isEditing = false; }} class="h-10 w-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
					<span class="material-symbols-outlined">close</span>
				</button>
			</header>

			<div class="flex-1 overflow-y-auto no-scrollbar p-10 space-y-8">
				<div class="space-y-2">
					<label for="user-name" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Display Name</label>
					<input id="user-name" bind:value={form.name} type="text" class="w-full h-14 rounded-2xl bg-surface-container-low border-none px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20" placeholder="Full Name" />
				</div>

				<div class="space-y-2">
					<label for="user-email" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Email Address</label>
					<input id="user-email" bind:value={form.email} type="email" class="w-full h-14 rounded-2xl bg-surface-container-low border-none px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20" placeholder="staff@tinappay.ledger" />
				</div>

				<div class="space-y-2">
					<label for="user-role" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">System Role</label>
					<select id="user-role" bind:value={form.role} class="w-full h-14 rounded-2xl bg-surface-container-low border-none px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20">
						<option value="Admin">Administrator</option>
						<option value="Cashier">Cashier</option>
					</select>
				</div>

				{#if isAdding}
					<div class="grid grid-cols-2 gap-6">
						<div class="space-y-2">
							<label for="user-pass" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Access Token</label>
							<input id="user-pass" bind:value={form.password} type="password" class="w-full h-14 rounded-2xl bg-surface-container-low border-none px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20" placeholder="Password" />
						</div>
						<div class="space-y-2">
							<label for="user-confirm" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Confirm Access</label>
							<input id="user-confirm" bind:value={form.passwordConfirm} type="password" class="w-full h-14 rounded-2xl bg-surface-container-low border-none px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20" placeholder="Confirm" />
						</div>
					</div>
				{/if}

				<div class="space-y-4">
					<label for="user-avatar" class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Identity Portrait</label>
					<div class="flex items-center gap-6 p-6 rounded-2xl border-2 border-dashed border-outline-variant/20 bg-surface-container-low/30">
                        <div class="h-20 w-20 rounded-full bg-white flex items-center justify-center text-on-surface-variant/30 border border-outline-variant/10 shadow-sm">
                            <span class="material-symbols-outlined text-3xl">add_a_photo</span>
                        </div>
                        <input id="user-avatar" type="file" onchange={(e) => form.avatar = e.currentTarget.files?.[0] || null} class="flex-1 text-xs text-on-surface-variant font-bold file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all" />
                    </div>
				</div>
			</div>

			<footer class="p-10 border-t border-outline-variant/10 bg-surface-container-low/10">
				<SignatureButton disabled={loading} onclick={handleSave} class="w-full h-16" size="lg">
					{loading ? 'Synchronizing...' : (isAdding ? 'Initialize Record' : 'Apply Updates')}
				</SignatureButton>
			</footer>

		{:else if selectedUser}
			<header class="p-10 border-b border-outline-variant/10 bg-surface-container-low/20 relative overflow-hidden">
				<div class="absolute top-0 right-0 p-8 flex gap-3">
					<button onclick={startEditing} class="h-12 w-12 rounded-2xl bg-white border border-outline-variant/10 flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90"><span class="material-symbols-outlined text-xl">edit</span></button>
					<button onclick={handleDelete} class="h-12 w-12 rounded-2xl bg-white border border-outline-variant/10 flex items-center justify-center text-error hover:bg-error hover:text-white transition-all shadow-sm active:scale-90"><span class="material-symbols-outlined text-xl">delete</span></button>
				</div>

				<div class="mb-8">
					<div class="h-32 w-32 rounded-[2.5rem] bg-white border-4 border-white flex items-center justify-center overflow-hidden shadow-2xl relative z-10">
						{#if selectedUser.avatar}
							<img alt={selectedUser.name} class="h-full w-full object-cover" src={pb.files.getUrl(selectedUser, selectedUser.avatar)} />
						{:else}
							<div class="text-primary font-black text-4xl uppercase opacity-20">{selectedUser.name?.substring(0, 2) || 'US'}</div>
						{/if}
					</div>
				</div>

				<div class="relative z-10">
					<h3 class="text-3xl font-black text-on-surface mb-2 font-serif tracking-tight">{selectedUser.name || 'Unnamed Staff'}</h3>
					<div class="flex items-center gap-3">
						<span class="rounded-lg bg-primary text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
							{selectedUser.role || 'Staff'}
						</span>
						<span class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">• ID: #{selectedUser.id.substring(0, 8)}</span>
					</div>
				</div>
			</header>

			<div class="flex-1 overflow-y-auto no-scrollbar p-10 space-y-10">
				<section>
					<h4 class="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-6 px-1">Member Information</h4>
					<div class="grid grid-cols-1 gap-4">
						<ArtisanalCard level="low" class="p-5 border border-outline-variant/5 flex items-center gap-5 transition-all hover:border-primary/30 group">
							<div class="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
								<span class="material-symbols-outlined">mail</span>
							</div>
							<div class="flex-1">
								<p class="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Email Address</p>
								<p class="text-sm font-bold text-on-surface">{selectedUser.email}</p>
							</div>
						</ArtisanalCard>
						<ArtisanalCard level="low" class="p-5 border border-outline-variant/5 flex items-center gap-5 transition-all hover:border-primary/30 group">
							<div class="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
								<span class="material-symbols-outlined">event</span>
							</div>
							<div class="flex-1">
								<p class="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Registration Date</p>
								<p class="text-sm font-bold text-on-surface">{new Date(selectedUser.created).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
							</div>
						</ArtisanalCard>
					</div>
				</section>

				<section>
					<h4 class="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-6 px-1">Governance Access</h4>
					<div class="p-8 rounded-[2.5rem] border-2 border-outline-variant/10 bg-surface-container-low/30">
						<div class="flex items-start gap-5 mb-8 pb-8 border-b border-outline-variant/10">
							<div class="h-12 w-12 rounded-2xl bg-white border border-outline-variant/10 flex items-center justify-center text-primary shadow-sm">
								<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">security</span>
							</div>
							<div>
								<h5 class="text-xs font-black text-on-surface uppercase tracking-tight">System Privileges</h5>
								<p class="text-xs text-on-surface-variant font-medium mt-1 leading-relaxed">This member has {selectedUser.role === 'Admin' ? 'full administrative control over production and finance' : 'restricted access limited to storefront sales and terminal operations'}.</p>
							</div>
						</div>
						
						<div class="space-y-4">
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold text-on-surface">Terminal Auth</span>
								<div class="h-2 w-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(125,162,122,0.5)]"></div>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold text-on-surface">Inventory Management</span>
								<div class="h-2 w-2 rounded-full {selectedUser.role === 'Admin' ? 'bg-tertiary shadow-[0_0_8px_rgba(125,162,122,0.5)]' : 'bg-outline-variant/30'}"></div>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold text-on-surface">Financial Auditing</span>
								<div class="h-2 w-2 rounded-full {selectedUser.role === 'Admin' ? 'bg-tertiary shadow-[0_0_8px_rgba(125,162,122,0.5)]' : 'bg-outline-variant/30'}"></div>
							</div>
						</div>
					</div>
				</section>
			</div>

			<footer class="p-10 border-t border-outline-variant/10 bg-surface-container-low/10">
				<button class="w-full h-14 rounded-2xl border-2 border-primary text-primary font-black uppercase tracking-[0.2em] text-[10px] hover:bg-primary hover:text-white transition-all active:scale-95 shadow-sm">
					Rotate Security Credentials
				</button>
			</footer>
		{:else}
			<div class="flex h-full flex-col items-center justify-center text-center p-12 opacity-40">
				<div class="w-32 h-32 rounded-[3rem] bg-surface-container-low flex items-center justify-center mb-8 shadow-inner">
					<span class="material-symbols-outlined text-6xl text-on-surface-variant">person</span>
				</div>
				<h3 class="text-2xl font-black text-on-surface mb-2 font-serif uppercase tracking-tighter">Team Profile</h3>
				<p class="text-sm font-bold text-on-surface-variant uppercase tracking-widest max-w-xs text-center">Select a brigade member to review their system access and identity details.</p>
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
