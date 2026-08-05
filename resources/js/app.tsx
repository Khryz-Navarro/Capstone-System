import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from '@/app-routes';
import { Toaster } from '@/components/ui/sonner';
import { ensureCsrf } from '@/lib/axios';
import { initializeNativeShell } from '@/lib/native-shell';
import { isNativeApp } from '@/lib/platform';
import { AuthProvider } from '@/providers/auth-provider';
import { ThemeProvider } from '@/providers/theme-provider';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            refetchOnWindowFocus: false,
            staleTime: 1000 * 30,
        },
    },
});

const container = document.getElementById('app');

const mobileRootPaths = new Set(['/', '/login', '/register', '/dashboard']);

function NativeShellHandler(): null {
    const navigate = useNavigate();
    const location = useLocation();
    const locationRef = React.useRef(location.pathname);

    locationRef.current = location.pathname;

    React.useEffect(() => {
        if (! isNativeApp()) {
            return;
        }

        void initializeNativeShell(() => {
            if (mobileRootPaths.has(locationRef.current)) {
                return false;
            }

            navigate(-1);

            return true;
        });
    }, [navigate]);

    return null;
}

async function bootstrap(): Promise<void> {
    await ensureCsrf();

    createRoot(container!).render(
        <React.StrictMode>
            <ThemeProvider>
                <QueryClientProvider client={queryClient}>
                    <BrowserRouter>
                        <AuthProvider>
                            <NativeShellHandler />
                            <App />
                            <Toaster position="top-right" richColors closeButton />
                        </AuthProvider>
                    </BrowserRouter>
                </QueryClientProvider>
            </ThemeProvider>
        </React.StrictMode>,
    );
}

if (container) {
    bootstrap();
}
