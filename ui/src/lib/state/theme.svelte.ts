import { browser } from '$app/environment';

class ThemeState {
	value = $state('theme-cinnamon');
	density = $state<'editorial' | 'compact'>('editorial');
	fontSize = $state(16);

	constructor() {
		if (browser) {
			console.log('[ThemeState] Initializing from localStorage...');
			const storedTheme = localStorage.getItem('artisanal-theme');
			if (storedTheme) this.value = storedTheme;

			const storedDensity = localStorage.getItem('artisanal-density');
			if (storedDensity === 'compact' || storedDensity === 'editorial') {
				this.density = storedDensity;
			}

			const storedFontSize = localStorage.getItem('artisanal-font-size');
			if (storedFontSize) this.fontSize = parseInt(storedFontSize);

			console.log('[ThemeState] Initial State:', { theme: this.value, density: this.density, fontSize: this.fontSize });
			this.applyAll();
		}
	}

	setTheme(theme: string) {
		this.value = theme;
		if (browser) {
			localStorage.setItem('artisanal-theme', theme);
			this.applyAll();
		}
	}

	setDensity(density: 'editorial' | 'compact') {
		this.density = density;
		if (browser) {
			localStorage.setItem('artisanal-density', density);
			this.applyAll();
		}
	}

	setFontSize(size: number) {
		this.fontSize = size;
		if (browser) {
			localStorage.setItem('artisanal-font-size', size.toString());
			this.applyAll();
		}
	}

	private applyAll() {
		if (!browser) return;
		const root = document.documentElement;
		console.log('[ThemeState] Applying settings to DOM...', { theme: this.value, density: this.density, fontSize: this.fontSize });

		// 1. Apply Accent Theme Class
		const classes = Array.from(root.classList);
		classes.forEach((cls) => {
			if (cls.startsWith('theme-')) root.classList.remove(cls);
		});
		if (this.value && this.value !== 'theme-cinnamon') {
			root.classList.add(this.value);
		}

		// 2. Apply Density Class
		root.classList.remove('density-editorial', 'density-compact');
		root.classList.add(`density-${this.density}`);

		// 3. Apply Font Size Variable
		root.style.setProperty('--base-font-size', `${this.fontSize}px`);
	}
}

export const themeState = new ThemeState();
