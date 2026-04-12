<script lang="ts">
	import { MailIcon, LockIcon, EyeIcon } from '$lib/components/icons';
	import { enhance } from '$app/forms';
    import SignatureButton from '$lib/components/artisanal/SignatureButton.svelte';

	let { form } = $props();
	let showPassword = $state(false);
	let loading = $state(false);
</script>

<div class="relative min-h-screen flex flex-col bg-surface text-on-surface overflow-hidden">
    <!-- Background Texture -->
    <div class="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <img class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBiFAN5SIHdeh2LkduRKqYaFDb1KMz57J-0z9gWs_VUOForx4ROjSH8zL4xzXsPcXcRJKcE_bG3Qcby9VToBcsZUjNjZzQy0A2KSRnPo3VQ2tvdOZx5wlwl8207Mhqa1T52SfTt4DCufApKHnH9GV7ekVhYojHUi3OBOrQnv7Bhstov7su5H0vlknQNKoPydjX6TnI2rw68MLDAsEEh5YvQ9UsqflQw9GpuHkJmxn8KJ4U1KfwTrYlvvxoZZxbhN7DGG3uQj7fFf0U" alt="" />
    </div>

    <!-- Decorative Icon -->
    <div class="absolute top-0 right-0 p-12 hidden lg:block opacity-20 pointer-events-none">
        <span class="material-symbols-outlined text-[12rem] text-primary rotate-12" style="font-variation-settings: 'FILL' 1;">bakery_dining</span>
    </div>

    <main class="flex-grow flex items-center justify-center p-6 z-10">
        <div class="w-full max-w-[440px]">
            <div class="bg-surface-container-lowest/90 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] shadow-[0px_12px_32px_rgba(47,47,44,0.06)] border border-surface-container-high">
                <header class="mb-10 text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary-container mb-6 shadow-inner">
                        <span class="material-symbols-outlined text-primary text-3xl" style="font-variation-settings: 'FILL' 1;">restaurant_menu</span>
                    </div>
                    <h1 class="text-3xl font-black tracking-tighter text-on-surface leading-tight font-serif">TinAPPay ERP</h1>
                    <p class="text-on-surface-variant font-medium text-sm mt-2">Manage your craft with precision.</p>
                </header>

                {#if form?.message}
                    <div class="mb-6 w-full rounded-2xl bg-error-container/10 p-4 text-sm text-error font-bold border border-error/10 animate-in fade-in">
                        {form.message}
                    </div>
                {/if}

                <form 
                    method="POST" 
                    action="?/login" 
                    use:enhance={() => {
                        loading = true;
                        return async ({ update }) => {
                            loading = false;
                            update();
                        };
                    }}
                    class="space-y-6"
                >
                    <div class="space-y-2">
                        <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ml-1" for="email">Email Address</label>
                        <div class="relative group">
                            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary">mail</span>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                required
                                placeholder="baker@artisanal.ledger"
                                class="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-2xl text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div class="space-y-2">
                        <div class="flex justify-between items-center px-1">
                            <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant" for="password">Password</label>
                            <a class="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-dim transition-colors" href="#">Forgot?</a>
                        </div>
                        <div class="relative group">
                            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary">lock</span>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                id="password"
                                required
                                placeholder="••••••••"
                                class="w-full pl-12 pr-12 py-4 bg-surface-container-low border-none rounded-2xl text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            />
                            <button
                                type="button"
                                onclick={() => showPassword = !showPassword}
                                class="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                            >
                                <span class="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                            </button>
                        </div>
                    </div>

                    <SignatureButton 
                        type="submit" 
                        disabled={loading} 
                        class="w-full h-14" 
                        size="lg"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </SignatureButton>
                </form>

                <div class="my-8 flex items-center gap-4 px-2">
                    <div class="h-px flex-1 bg-surface-container-high"></div>
                    <span class="text-[9px] font-black text-on-surface-variant/50 uppercase tracking-[0.3em]">Collaborate</span>
                    <div class="h-px flex-1 bg-surface-container-high"></div>
                </div>

                <form method="POST" action="?/google" class="w-full">
                    <button
                        type="submit"
                        class="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-surface-container-high bg-white font-bold text-on-surface shadow-sm transition-all hover:bg-surface-container-low active:scale-[0.98]"
                    >
                        <svg width="20" height="20" viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                            <path fill="#1976D2" d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                        </svg>
                        Google Sign In
                    </button>
                </form>

                <div class="mt-10 text-center">
                    <p class="text-[13px] text-on-surface-variant font-medium">
                        Need assistance? 
                        <a class="font-black text-on-surface hover:text-primary transition-colors underline decoration-outline-variant underline-offset-4" href="#">Contact Support</a>
                    </p>
                </div>
            </div>
            <div class="mt-8 text-center">
                <p class="font-serif text-[0.6rem] uppercase tracking-[0.3em] text-on-surface-variant/40 font-black">Boutique ERP for Master Bakers</p>
            </div>
        </div>
    </main>

    <footer class="bg-surface-container-low flex flex-col md:flex-row justify-between items-center px-10 py-6 w-full border-t border-outline-variant/10">
        <div class="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant/60 mb-4 md:mb-0">
            © 2024 The Artisanal Ledger. Crafted for Excellence.
        </div>
        <div class="flex gap-8">
            <a class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 hover:text-primary transition-all" href="#">Privacy</a>
            <a class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 hover:text-primary transition-all" href="#">Terms</a>
            <a class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 hover:text-primary transition-all" href="#">Support</a>
        </div>
    </footer>
</div>
