export const themes = {
    dark: {
        '--bg-color': '#0D1B2A',
        '--card-color': '#1B263B',
        '--text-color': '#FFFFFF',
        '--text-dim': 'rgba(255, 255, 255, 0.4)',
        '--border-color': 'rgba(255, 255, 255, 0.05)'
    },
    midnight: {
        '--bg-color': '#050505',
        '--card-color': '#111111',
        '--text-color': '#FFFFFF',
        '--text-dim': 'rgba(255, 255, 255, 0.4)',
        '--border-color': 'rgba(255, 255, 255, 0.08)'
    },
    light: {
        '--bg-color': '#F8FAFC',
        '--card-color': '#FFFFFF',
        '--text-color': '#0F172A',
        '--text-dim': 'rgba(15, 23, 42, 0.5)',
        '--border-color': 'rgba(15, 23, 42, 0.1)'
    }
};

export const accents = {
    emerald: { '--primary-color': '#00C853', '--secondary-color': '#00E676' },
    ocean: { '--primary-color': '#3B82F6', '--secondary-color': '#60A5FA' },
    solar: { '--primary-color': '#F59E0B', '--secondary-color': '#FBBF24' },
    rose: { '--primary-color': '#F43F5E', '--secondary-color': '#FB7185' },
    purple: { '--primary-color': '#8B5CF6', '--secondary-color': '#A78BFA' }
};

export const applyTheme = (themeName, accentName) => {
    const theme = themes[themeName] || themes.dark;
    const accent = accents[accentName] || accents.emerald;

    const root = document.documentElement;

    // Apply theme colors
    Object.entries(theme).forEach(([property, value]) => {
        root.style.setProperty(property, value);
    });

    // Apply accent colors
    Object.entries(accent).forEach(([property, value]) => {
        root.style.setProperty(property, value);
    });

    // Store in localStorage
    localStorage.setItem('admin_appearance', JSON.stringify({ theme: themeName, accent: accentName }));
};

export const getStoredAppearance = () => {
    const stored = localStorage.getItem('admin_appearance');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return { theme: 'dark', accent: 'emerald' };
        }
    }
    return { theme: 'dark', accent: 'emerald' };
};
