import { browser } from '$app/environment';

export type ArtisanalTheme = {
    name: string;
    primary: string;
    onPrimary: string;
    primaryContainer: string;
    primaryDim: string;
};

export const ARTISANAL_THEMES: Record<string, ArtisanalTheme> = {
    hearth: {
        name: 'Classic Hearth',
        primary: '#8C4100',  // Bread-crust amber
        onPrimary: '#FFFFFF',
        primaryContainer: '#F28830',  // Golden caramel
        primaryDim: '#A85318'
    },
    sourdough: {
        name: 'Sourdough',
        primary: '#7B5E2A',  // Warm wheat-gold
        onPrimary: '#FFFFFF',
        primaryContainer: '#D4A855',  // Honey glaze
        primaryDim: '#9A7640'
    },
    espresso: {
        name: 'Dark Roast',
        primary: '#3E2010',  // Rich espresso
        onPrimary: '#FFFFFF',
        primaryContainer: '#8C5830',  // Warm coffee
        primaryDim: '#5E3820'
    },
    rye: {
        name: 'Rye & Herb',
        primary: '#3A6040',  // Dark herb green
        onPrimary: '#FFFFFF',
        primaryContainer: '#72A878',  // Sage
        primaryDim: '#4A7050'
    }
};

class ThemeState {
    value = $state('hearth');
    mode = $state<'light' | 'dark'>('light');
    density = $state<'editorial' | 'compact'>('editorial');
    fontSize = $state(16);

    init() {
        if (browser) {
            const storedTheme = localStorage.getItem('artisanal-theme');
            if (storedTheme && ARTISANAL_THEMES[storedTheme]) this.value = storedTheme;

            const storedMode = localStorage.getItem('theme-mode');
            if (storedMode === 'dark' || storedMode === 'light') this.mode = storedMode;

            const storedDensity = localStorage.getItem('artisanal-density');
            if (storedDensity === 'compact' || storedDensity === 'editorial') this.density = storedDensity;

            const storedFontSize = localStorage.getItem('artisanal-font-size');
            if (storedFontSize) this.fontSize = parseInt(storedFontSize);

            this.applyAll();
        }
    }

    setTheme(theme: string) {
        if (!ARTISANAL_THEMES[theme]) return;
        this.value = theme;
        if (browser) { localStorage.setItem('artisanal-theme', theme); this.applyAll(); }
    }

    setMode(mode: 'light' | 'dark') {
        this.mode = mode;
        if (browser) { localStorage.setItem('theme-mode', mode); this.applyAll(); }
    }

    setDensity(density: 'editorial' | 'compact') {
        this.density = density;
        if (browser) { localStorage.setItem('artisanal-density', density); this.applyAll(); }
    }

    setFontSize(size: number) {
        this.fontSize = size;
        if (browser) { localStorage.setItem('artisanal-font-size', size.toString()); this.applyAll(); }
    }

    private applyAll() {
        if (!browser) return;
        const root = document.documentElement;
        const theme = ARTISANAL_THEMES[this.value];

        // Primary colors (switchable per theme)
        root.style.setProperty('--color-primary', theme.primary);
        root.style.setProperty('--color-primary-container', theme.primaryContainer);
        root.style.setProperty('--color-on-primary', theme.onPrimary);
        root.style.setProperty('--color-primary-dim', theme.primaryDim);

        // Dark / light mode via CSS class
        if (this.mode === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.remove('dark');
            root.classList.add('light');
        }

        // Base font size
        root.style.setProperty('--base-font-size', `${this.fontSize}px`);
    }
}

export const themeState = new ThemeState();
