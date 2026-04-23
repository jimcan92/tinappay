<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { pb, fileUrl } from '$lib/pocketbase';
	import { page } from '$app/state';
	import { attendanceState, formatDuration, formatTime } from '$lib/states/attendance.svelte';
	import { usersState } from '$lib/states/users.svelte';
	import { toastState } from '$lib/states/toast.svelte';
	import Select from '$lib/components/Select.svelte';
	import BakingLoader from '$lib/components/BakingLoader.svelte';
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';

	let loading = $state(true);
	let actionLoading = $state(false);
	let filterUserId = $state(''); // '' = all staff

	// All history records fetched once (expand user + branch)
	let allRecords = $state<any[]>([]);

	let currentUser = $derived(page.data?.user || pb.authStore.record);
	let currentUserId = $derived(currentUser?.id as string | undefined);
	let myActiveRecord = $derived(
		currentUserId ? attendanceState.getTodayRecordForUser(currentUserId) : undefined
	);
	let iAmClockedIn = $derived(currentUserId ? attendanceState.isClockedIn(currentUserId) : false);

	let todayStats = $derived({
		present: new Set(attendanceState.todayRecords.map((r) => r.user)).size,
		activeNow: attendanceState.todayRecords.filter((r) => !r.clock_out).length,
		completed: attendanceState.todayRecords.filter((r) => !!r.clock_out).length
	});

	let filteredRecords = $derived(
		filterUserId ? allRecords.filter((r) => r.user === filterUserId) : allRecords
	);

	let staffOptions = $derived([
		{ value: '', label: 'All Staff' },
		...usersState.allUsers.map((u) => ({ value: u.id, label: u.name || u.email || u.id }))
	]);

	onMount(async () => {
		try {
			const preselect = page.url.searchParams.get('user');
			const [records] = await Promise.all([
				pb.collection('attendance').getFullList({
					expand: 'user,branch',
					sort: '-clock_in'
				}),
				attendanceState.fetchToday(),
				usersState.init()
			]);
			allRecords = records;
			if (preselect) filterUserId = preselect;
		} catch (e) {
			console.error('Attendance fetch error:', e);
		} finally {
			loading = false;
		}

		pb.collection('attendance').subscribe('*', async (e) => {
			try {
				if (e.action === 'create') {
					const newRecord = await pb.collection('attendance').getOne(e.record.id, { expand: 'user,branch' });
					allRecords = [newRecord, ...allRecords];
				} else if (e.action === 'update') {
					const updatedRecord = await pb.collection('attendance').getOne(e.record.id, { expand: 'user,branch' });
					allRecords = allRecords.map(r => r.id === e.record.id ? updatedRecord : r);
				} else if (e.action === 'delete') {
					allRecords = allRecords.filter(r => r.id !== e.record.id);
				}
			} catch (err) {
				console.error('Attendance sync error:', err);
			}
		});
	});

	onDestroy(() => {
		pb.collection('attendance').unsubscribe('*');
	});

	async function handleAdminClockOut(recordId: string) {
		actionLoading = true;
		try {
			await attendanceState.clockOut(recordId);
			// Update the local record so UI refreshes immediately
			allRecords = allRecords.map((r) =>
				r.id === recordId
					? { ...r, clock_out: new Date().toISOString().replace('T', ' ').split('.')[0] }
					: r
			);
			toastState.success('Shift closed.');
		} catch (e) {
			toastState.error('Failed to close shift.');
		} finally {
			actionLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Attendance | tinAPPay ERP</title>
</svelte:head>

<div class="no-scrollbar h-full overflow-y-auto bg-surface">
	<div class="mx-auto max-w-5xl px-6 py-8 md:px-10">

		<!-- Stats + My Shift -->
		<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<!-- Present Today -->
			<div class="relative overflow-hidden rounded-[2rem] bg-primary-container/10 p-6">
				<p class="text-[9px] font-black uppercase tracking-widest text-primary">Present Today</p>
				<p class="mt-1 font-serif text-4xl font-black text-primary">{todayStats.present}</p>
				<span class="material-symbols-outlined absolute -right-2 -bottom-2 text-[60px] text-primary/5">groups</span>
			</div>

			<ArtisanalCard level="lowest" class="p-6 border border-outline-variant/10">
				<p class="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">Active Now</p>
				<p class="mt-1 font-serif text-4xl font-bold text-on-surface">{todayStats.activeNow}</p>
			</ArtisanalCard>

			<ArtisanalCard level="lowest" class="p-6 border border-outline-variant/10">
				<p class="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">Shifts Done</p>
				<p class="mt-1 font-serif text-4xl font-bold text-on-surface">{todayStats.completed}</p>
			</ArtisanalCard>

			<!-- My Shift -->
			{#if currentUserId}
				<ArtisanalCard level="lowest" class="p-6 border border-outline-variant/10">
					<p class="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">My Shift</p>
					{#if iAmClockedIn && myActiveRecord}
						<p class="mt-1 text-sm font-bold text-on-surface">
							Since {formatTime(myActiveRecord.clock_in)}
						</p>
						<p class="text-xs font-bold text-primary">{formatDuration(myActiveRecord.clock_in)}</p>
					{:else if attendanceState.hasClockedInToday(currentUserId)}
						<p class="mt-1 text-sm font-bold text-on-surface-variant">Shift complete</p>
					{:else}
						<p class="mt-1 text-sm font-bold text-on-surface-variant/50">No shift today</p>
					{/if}
				</ArtisanalCard>
			{/if}
		</div>

		<!-- Filter -->
		<div class="mb-6">
			<Select
				bind:value={filterUserId}
				options={staffOptions}
				placeholder="All Staff"
				class="w-64"
			/>
		</div>

		<!-- Records -->
		{#if loading}
			<div class="flex h-48 items-center justify-center">
				<BakingLoader />
			</div>
		{:else if filteredRecords.length === 0}
			<div class="flex flex-col items-center justify-center py-24 text-center opacity-40">
				<span class="material-symbols-outlined mb-4 text-6xl text-on-surface-variant">history</span>
				<p class="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
					{filterUserId ? 'No shifts recorded for this staff member.' : 'No attendance records yet.'}
				</p>
			</div>
		{:else}
			<ArtisanalCard level="lowest" class="overflow-hidden border border-outline-variant/10 p-0 shadow-sm">
				<!-- Header -->
				<div class="grid grid-cols-12 gap-2 bg-surface-container-low px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
					<div class="col-span-3">Staff</div>
					<div class="col-span-2">Date</div>
					<div class="col-span-2 text-center">Clock In</div>
					<div class="col-span-2 text-center">Clock Out</div>
					<div class="col-span-2 text-center">Duration</div>
					<div class="col-span-1"></div>
				</div>

				<div class="divide-y divide-outline-variant/5">
					{#each filteredRecords as record}
						{@const user = record.expand?.user}
						{@const branch = record.expand?.branch}
						{@const isActive = !record.clock_out}
						{@const isToday = new Date(record.clock_in).toDateString() === new Date().toDateString()}

						<div class="grid grid-cols-12 items-center gap-2 px-6 py-4 transition-colors hover:bg-surface-container-low/40 {isActive ? 'bg-primary/[0.03]' : ''}">
							<!-- Staff -->
							<div class="col-span-3 flex items-center gap-3">
								<div class="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface-container border border-outline-variant/10">
									{#if user?.avatar}
										<img src={fileUrl(user, user.avatar)} alt="" class="h-full w-full object-cover" />
									{:else}
										<div class="flex h-full w-full items-center justify-center bg-primary/10 text-[10px] font-black uppercase text-primary">
											{user?.name?.substring(0, 2) || '??'}
										</div>
									{/if}
								</div>
								<div class="min-w-0">
									<p class="truncate text-sm font-bold text-on-surface">{user?.name || '—'}</p>
									{#if branch}
										<p class="truncate text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-tighter">{branch.name}</p>
									{/if}
								</div>
							</div>

							<!-- Date -->
							<div class="col-span-2">
								<p class="text-xs font-bold text-on-surface">
									{new Date(record.clock_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
								</p>
								{#if isToday}
									<span class="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary">Today</span>
								{:else}
									<p class="text-[10px] text-on-surface-variant/40">{new Date(record.clock_in).getFullYear()}</p>
								{/if}
							</div>

							<!-- Clock In -->
							<div class="col-span-2 text-center">
								<span class="inline-flex items-center gap-1 text-xs font-bold text-on-surface">
									<span class="material-symbols-outlined text-sm text-primary/50">login</span>
									{formatTime(record.clock_in)}
								</span>
							</div>

							<!-- Clock Out -->
							<div class="col-span-2 text-center">
								{#if record.clock_out}
									<span class="inline-flex items-center gap-1 text-xs font-bold text-on-surface">
										<span class="material-symbols-outlined text-sm text-error/50">logout</span>
										{formatTime(record.clock_out)}
									</span>
								{:else}
									<span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
										<span class="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
										Active
									</span>
								{/if}
							</div>

							<!-- Duration -->
							<div class="col-span-2 text-center">
								{#if record.clock_out}
									<p class="font-serif text-sm font-black text-on-surface">{formatDuration(record.clock_in, record.clock_out)}</p>
								{:else}
									<p class="font-serif text-sm font-black text-primary">{formatDuration(record.clock_in)}</p>
								{/if}
							</div>

							<!-- Action -->
							<div class="col-span-1 flex justify-end">
								{#if isActive}
									<button
										onclick={() => handleAdminClockOut(record.id)}
										disabled={actionLoading}
										title="Close shift"
										class="flex h-8 w-8 items-center justify-center rounded-xl text-error transition-all hover:bg-error hover:text-on-error disabled:opacity-40"
									>
										<span class="material-symbols-outlined text-base">stop_circle</span>
									</button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</ArtisanalCard>

			<p class="mt-4 px-1 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">
				{filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
				{filterUserId ? '· filtered by staff' : '· all staff'}
			</p>
		{/if}
	</div>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar { display: none; }
	.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
