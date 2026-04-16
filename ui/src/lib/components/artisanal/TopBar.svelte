<script lang="ts">
	import { pb } from '$lib/pocketbase';
	import GlobalSearchBar from '$lib/components/artisanal/GlobalSearchBar.svelte';

	interface Props {
		user: any;
		onMenuClick?: () => void;
	}

	let { user, onMenuClick }: Props = $props();
	let dropdownOpen = $state(false);

	function toggleDropdown() {
		dropdownOpen = !dropdownOpen;
	}

	function closeDropdown() {
		dropdownOpen = false;
	}

	async function handleLogout() {
		pb.authStore.clear();
		window.location.href = '/login';
	}
</script>

<!-- TopAppBar -->
<header
	class="fixed top-0 right-0 left-0 z-30 flex h-16 items-center justify-between bg-surface/80 px-6 shadow-[0px_12px_32px_rgba(47,47,44,0.06)] backdrop-blur-xl md:px-8 lg:left-64"
>
	<div class="flex flex-1 items-center gap-4 min-w-0">
		<!-- Mobile menu button -->
		<button
			onclick={onMenuClick}
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant transition-all hover:text-primary active:scale-95 lg:hidden"
		>
			<span class="material-symbols-outlined">menu</span>
		</button>

		<!-- Global Search -->
		<GlobalSearchBar class="hidden sm:flex flex-1 max-w-[200px] md:max-w-md" />
	</div>

	<div class="flex items-center gap-2 md:gap-4">
		<button
			class="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-highest"
		>
			<span class="material-symbols-outlined">notifications</span>
		</button>

		<div class="mx-1 h-8 w-[1px] bg-outline-variant/20 md:mx-2"></div>

		<!-- User dropdown -->
		<div class="relative">
			<button
				onclick={toggleDropdown}
				class="flex items-center gap-3 rounded-full py-1.5 pr-2 pl-2 transition-all hover:bg-surface-container-highest active:scale-95 md:pr-4 {dropdownOpen
					? 'bg-surface-container-highest'
					: ''}"
			>
				<div
					class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-primary/10 bg-primary/10 shadow-inner"
				>
					{#if user?.avatar}
						<img
							class="h-full w-full object-cover"
							src={pb.files.getURL(user, user.avatar)}
							alt={user.name}
						/>
					{:else}
						<span class="material-symbols-outlined text-sm text-primary">person</span>
					{/if}
				</div>
				<div class="hidden text-left lg:block">
					<p class="text-xs leading-none font-bold text-on-surface">{user?.name || 'Baker'}</p>
					<p class="mt-0.5 text-[10px] tracking-tighter text-on-surface-variant uppercase">
						{user?.role || 'Staff'}
					</p>
				</div>
				<span
					class="material-symbols-outlined text-sm text-on-surface-variant transition-transform {dropdownOpen
						? 'rotate-180'
						: ''}">expand_more</span
				>
			</button>

			{#if dropdownOpen}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div onclick={closeDropdown} class="fixed inset-0 z-40 bg-transparent"></div>

				<div
					class="absolute top-full right-0 z-50 mt-3 w-64 origin-top-right animate-in overflow-hidden rounded-[1.5rem] border border-outline-variant/10 bg-surface-container-lowest/95 shadow-2xl backdrop-blur-xl duration-200 zoom-in-95 fade-in"
				>
					<div class="border-b border-outline-variant/5 p-5">
						<p class="mb-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">
							Identity
						</p>
						<p class="truncate font-serif text-lg font-black text-on-surface">
							{user?.name || 'Baker Rossi'}
						</p>
						<p class="truncate text-[10px] font-bold tracking-tighter text-on-surface-variant/70">
							{user?.email}
						</p>
					</div>

					<div class="p-2">
						<a
							href="/profile"
							onclick={closeDropdown}
							class="group flex items-center gap-3 rounded-xl px-4 py-3 text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-primary"
						>
							<span class="material-symbols-outlined text-xl transition-transform group-hover:scale-110"
								>person</span
							>
							<span class="text-xs font-bold tracking-widest uppercase">My Profile</span>
						</a>
						<a
							href="/settings"
							onclick={closeDropdown}
							class="group flex items-center gap-3 rounded-xl px-4 py-3 text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-primary"
						>
							<span class="material-symbols-outlined text-xl transition-transform group-hover:scale-110"
								>garage</span
							>
							<span class="text-xs font-bold tracking-widest uppercase">Bakery Settings</span>
						</a>
					</div>

					<div class="border-t border-outline-variant/5 bg-on-surface-variant/5 p-2">
						<button
							onclick={handleLogout}
							class="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-on-surface-variant transition-all hover:bg-error/10 hover:text-error"
						>
							<span class="material-symbols-outlined text-xl transition-transform group-hover:scale-110"
								>logout</span
							>
							<span class="text-xs font-bold tracking-widest uppercase">Sign Out System</span>
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</header>
