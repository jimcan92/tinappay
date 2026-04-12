<script lang="ts">
	import { pb } from '$lib/pocketbase';

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
	class="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between bg-surface/80 px-6 shadow-[0px_12px_32px_rgba(47,47,44,0.06)] backdrop-blur-xl lg:left-64 md:px-8"
>
	<div class="flex items-center gap-4 flex-1">
		<button
			onclick={onMenuClick}
			class="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant hover:text-primary lg:hidden transition-all active:scale-95"
		>
			<span class="material-symbols-outlined">menu</span>
		</button>

		<div
			class="group hidden sm:flex w-full max-w-[200px] items-center gap-4 rounded-full bg-surface-container-low px-4 py-2 transition-all focus-within:ring-1 ring-primary/20 md:max-w-md"
		>
			<span class="material-symbols-outlined text-on-surface-variant">search</span>
			<input
				class="w-full border-none bg-transparent font-body text-sm focus:ring-0 placeholder:text-on-surface-variant/50"
				placeholder="Find history..."
				type="text"
			/>
		</div>
	</div>

	<div class="flex items-center gap-2 md:gap-4">
		<button
			class="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-container-highest text-on-surface-variant"
		>
			<span class="material-symbols-outlined">notifications</span>
		</button>
		
		<div class="mx-1 h-8 w-[1px] bg-outline-variant/20 md:mx-2"></div>
		
		<div class="relative">
			<button 
				onclick={toggleDropdown}
				class="flex items-center gap-3 rounded-full pl-2 pr-2 py-1.5 transition-all hover:bg-surface-container-highest active:scale-95 md:pr-4 {dropdownOpen ? 'bg-surface-container-highest' : ''}"
			>
				<div class="h-8 w-8 rounded-full border border-primary/10 bg-primary/10 overflow-hidden flex items-center justify-center shadow-inner">
					{#if user?.avatar}
						<img
							class="h-full w-full object-cover"
							src={pb.files.getUrl(user, user.avatar)}
							alt={user.name}
						/>
					{:else}
						<span class="material-symbols-outlined text-primary text-sm">person</span>
					{/if}
				</div>
				<div class="hidden lg:block text-left">
					<p class="text-xs font-bold leading-none text-on-surface">{user?.name || 'Baker'}</p>
					<p class="text-[10px] text-on-surface-variant uppercase tracking-tighter mt-0.5">{user?.role || 'Staff'}</p>
				</div>
				<span class="material-symbols-outlined text-sm text-on-surface-variant transition-transform {dropdownOpen ? 'rotate-180' : ''}">expand_more</span>
			</button>

			{#if dropdownOpen}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div 
					onclick={closeDropdown}
					class="fixed inset-0 z-40 bg-transparent"
				></div>
				
				<div class="absolute right-0 top-full mt-3 z-50 w-64 overflow-hidden rounded-[1.5rem] bg-surface-container-lowest/95 border border-outline-variant/10 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 origin-top-right">
					<div class="p-5 border-b border-outline-variant/5">
						<p class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Identity</p>
						<p class="font-serif font-black text-on-surface text-lg truncate">{user?.name || 'Baker Rossi'}</p>
						<p class="text-[10px] text-on-surface-variant/70 font-bold tracking-tighter truncate">{user?.email}</p>
					</div>
					
					<div class="p-2">
						<a 
							href="/profile" 
							onclick={closeDropdown}
							class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-all group"
						>
							<span class="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">person</span>
							<span class="text-xs font-bold uppercase tracking-widest">My Profile</span>
						</a>
						<a 
							href="/settings" 
							onclick={closeDropdown}
							class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-all group"
						>
							<span class="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">garage</span>
							<span class="text-xs font-bold uppercase tracking-widest">Bakery Settings</span>
						</a>
					</div>
					
					<div class="p-2 border-t border-outline-variant/5 bg-on-surface-variant/5">
						<button 
							onclick={handleLogout}
							class="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-error/10 text-on-surface-variant hover:text-error transition-all group"
						>
							<span class="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">logout</span>
							<span class="text-xs font-bold uppercase tracking-widest">Sign Out System</span>
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</header>
