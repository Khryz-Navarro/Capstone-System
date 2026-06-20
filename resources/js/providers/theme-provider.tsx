import * as React from 'react';

type Theme = 'dark' | 'light' | 'system';
type ResolvedTheme = 'dark' | 'light';

type ThemeProviderState = {
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = 'mtbdrs-theme';

const ThemeProviderContext = React.createContext<ThemeProviderState | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = React.useState<Theme>(() => (localStorage.getItem(STORAGE_KEY) as Theme) || 'system');
    const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>(() =>
        theme === 'system' ? getSystemTheme() : theme,
    );

    React.useEffect(() => {
        const root = window.document.documentElement;
        const applied = theme === 'system' ? getSystemTheme() : theme;

        root.classList.remove('light', 'dark');
        root.classList.add(applied);
        setResolvedTheme(applied);
    }, [theme]);

    React.useEffect(() => {
        if (theme !== 'system') return;

        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => {
            const applied = getSystemTheme();
            window.document.documentElement.classList.remove('light', 'dark');
            window.document.documentElement.classList.add(applied);
            setResolvedTheme(applied);
        };
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, [theme]);

    const setTheme = React.useCallback((next: Theme) => {
        localStorage.setItem(STORAGE_KEY, next);
        setThemeState(next);
    }, []);

    return (
        <ThemeProviderContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeProviderContext.Provider>
    );
}

export function useTheme() {
    const context = React.useContext(ThemeProviderContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
