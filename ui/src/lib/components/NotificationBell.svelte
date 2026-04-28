<script lang="ts">
	import { goto } from '$app/navigation';
	import { notificationsState } from '$lib/states/notifications.svelte';
	import { onMount } from 'svelte';
	import { scale } from 'svelte/transition';

	let isOpen = $state(false);

	onMount(() => {
		notificationsState.load();
	});

	function toggle() {
		isOpen = !isOpen;
	}

	function handleOutsideClick(e: MouseEvent) {
		if (isOpen && !(e.target as HTMLElement).closest('.notif-bell')) {
			isOpen = false;
		}
	}

	async function handleNotifClick(n: (typeof notificationsState.items)[0]) {
		if (!n.read) await notificationsState.markRead(n.id);
		isOpen = false;
		if (n.href) goto(n.href);
	}

	function relativeTime(dateStr: string): string {
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		return `${Math.floor(hrs / 24)}d ago`;
	}

	function isToday(dateStr: string): boolean {
		const d = new Date(dateStr);
		const now = new Date();
		return (
			d.getDate() === now.getDate() &&
			d.getMonth() === now.getMonth() &&
			d.getFullYear() === now.getFullYear()
		);
	}

	let showUnreadOnly = $state(false);

	let visibleItems = $derived(
		showUnreadOnly ? notificationsState.items.filter((n) => !n.read) : notificationsState.items
	);
	let todayItems = $derived(visibleItems.filter((n) => isToday(n.created)));
	let earlierItems = $derived(visibleItems.filter((n) => !isToday(n.created)));
</script>

<svelte:window onclick={handleOutsideClick} />

<div class="notif-bell relative">
	<button
		onclick={toggle}
		title="Notifications"
		class="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all hover:bg-surface-container-highest active:scale-90 {isOpen
			? 'bg-surface-container-highest'
			: ''}"
	>
		<span class="material-symbols-outlined text-[20px] text-on-surface-variant">notifications</span>
		{#if notificationsState.unreadCount > 0}
			<span
				class="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[9px] font-black text-on-error"
			>
				{notificationsState.unreadCount > 99 ? '99+' : notificationsState.unreadCount}
			</span>
		{/if}
	</button>

	{#if isOpen}
		<div
			transition:scale={{ duration: 200, start: 0.95, opacity: 0 }}
			class="absolute right-0 z-50 mt-3 w-80 origin-top-right overflow-hidden rounded-[2rem] border border-outline-variant/10 bg-surface shadow-2xl"
		>
			<!-- Header -->
			<div class="border-b border-outline-variant/5 px-5 py-4">
				<div class="flex items-center justify-between">
					<p class="text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase">
						Notifications
					</p>
					{#if notificationsState.unreadCount > 0}
						<button
							onclick={() => notificationsState.markAllRead()}
							class="text-[10px] font-black tracking-wide text-primary/70 uppercase transition-colors hover:text-primary"
						>
							Mark all read
						</button>
					{/if}
				</div>
				<!-- Toggle -->
				<div class="mt-3 flex gap-1 rounded-full bg-surface-container-highest p-1">
					<button
						onclick={() => (showUnreadOnly = false)}
						class="flex-1 rounded-full py-1 text-[10px] font-black tracking-wide uppercase transition-colors {!showUnreadOnly
							? 'bg-surface text-on-surface shadow-sm'
							: 'text-on-surface-variant hover:text-on-surface'}"
					>
						All
					</button>
					<button
						onclick={() => (showUnreadOnly = true)}
						class="flex-1 rounded-full py-1 text-[10px] font-black tracking-wide uppercase transition-colors {showUnreadOnly
							? 'bg-surface text-on-surface shadow-sm'
							: 'text-on-surface-variant hover:text-on-surface'}"
					>
						Unread {#if notificationsState.unreadCount > 0}<span class="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[8px] text-on-primary">{notificationsState.unreadCount}</span>{/if}
					</button>
				</div>
			</div>

			<!-- List -->
			<div class="max-h-[420px] overflow-y-auto">
				{#if visibleItems.length === 0}
					<div class="flex flex-col items-center justify-center gap-2 px-6 py-10">
						<span class="material-symbols-outlined text-4xl text-on-surface-variant/30"
							>notifications_off</span
						>
						<p class="text-sm font-bold text-on-surface-variant/50">
							{showUnreadOnly ? 'No unread notifications' : 'No notifications yet'}
						</p>
					</div>
				{:else}
					{#if todayItems.length > 0}
						<p
							class="sticky top-0 bg-surface-container-low px-5 py-2 text-[9px] font-black tracking-widest text-on-surface-variant/60 uppercase"
						>
							Today
						</p>
						{#each todayItems as n (n.id)}
							<button
								onclick={() => handleNotifClick(n)}
								class="flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-container-low {!n.read
									? 'bg-primary/5'
									: ''}"
							>
								<div
									class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-container-highest"
								>
									<span
										class="material-symbols-outlined text-[18px] {notificationsState.typeColor(n.type)}"
									>
										{notificationsState.typeIcon(n.type)}
									</span>
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-start justify-between gap-2">
										<p
											class="text-xs font-bold leading-snug text-on-surface {!n.read
												? 'font-extrabold'
												: ''}"
										>
											{n.title}
										</p>
										{#if !n.read}
											<span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"></span>
										{/if}
									</div>
									{#if n.body}
										<p class="mt-0.5 line-clamp-2 text-[11px] leading-snug text-on-surface-variant">
											{n.body}
										</p>
									{/if}
									<div class="mt-1 flex items-center gap-2">
										{#if n.branch_name}
											<span class="rounded-full bg-surface-container-highest px-2 py-0.5 text-[9px] font-black tracking-wide text-on-surface-variant uppercase">
												{n.branch_name}
											</span>
										{/if}
										<p class="text-[10px] font-bold text-on-surface-variant/50">
											{relativeTime(n.created)}
										</p>
									</div>
								</div>
							</button>
						{/each}
					{/if}

					{#if earlierItems.length > 0}
						<p
							class="sticky top-0 bg-surface-container-low px-5 py-2 text-[9px] font-black tracking-widest text-on-surface-variant/60 uppercase"
						>
							Earlier
						</p>
						{#each earlierItems as n (n.id)}
							<button
								onclick={() => handleNotifClick(n)}
								class="flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-container-low {!n.read
									? 'bg-primary/5'
									: ''}"
							>
								<div
									class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-container-highest"
								>
									<span
										class="material-symbols-outlined text-[18px] {notificationsState.typeColor(n.type)}"
									>
										{notificationsState.typeIcon(n.type)}
									</span>
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-start justify-between gap-2">
										<p
											class="text-xs font-bold leading-snug text-on-surface {!n.read
												? 'font-extrabold'
												: ''}"
										>
											{n.title}
										</p>
										{#if !n.read}
											<span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"></span>
										{/if}
									</div>
									{#if n.body}
										<p class="mt-0.5 line-clamp-2 text-[11px] leading-snug text-on-surface-variant">
											{n.body}
										</p>
									{/if}
									<div class="mt-1 flex items-center gap-2">
										{#if n.branch_name}
											<span class="rounded-full bg-surface-container-highest px-2 py-0.5 text-[9px] font-black tracking-wide text-on-surface-variant uppercase">
												{n.branch_name}
											</span>
										{/if}
										<p class="text-[10px] font-bold text-on-surface-variant/50">
											{relativeTime(n.created)}
										</p>
									</div>
								</div>
							</button>
						{/each}
					{/if}
				{/if}
			</div>
		</div>
	{/if}
</div>
