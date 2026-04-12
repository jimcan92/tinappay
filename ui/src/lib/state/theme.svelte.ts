import { browser } from '$app/environment';

class ThemeState {
	value = $state('theme-cinnamon');

	constructor() {
		if (browser) {
			const stored = localStorage.getItem('artisanal-theme');
			if (stored) {
				this.value = stored;
				this.applyTheme(stored);
			}
		}
	}

	setTheme(theme: string) {
		this.value = theme;
		if (browser) {
			localStorage.setItem('artisanal-theme', theme);
			this.applyTheme(theme);
		}
	}

	private applyTheme(theme: string) {
		if (!browser) return;
		const root = document.documentElement;
		// Remove existing theme classes
		const classes = Array.from(root.classList);
		classes.forEach((cls) => {
			if (cls.startsWith('theme-')) root.classList.remove(cls);
		});

		if (theme && theme !== 'theme-cinnamon') {
			root.classList.add(theme);
		}
	}
}

export const themeState = new ThemeState();
