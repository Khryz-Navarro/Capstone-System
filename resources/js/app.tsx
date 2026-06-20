import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from '@/app-routes';
import { Toaster } from '@/components/ui/sonner';
import { ensureCsrf } from '@/lib/axios';
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

async function bootstrap(): Promise<void> {
    await ensureCsrf();

    createRoot(container!).render(
        <React.StrictMode>
            <ThemeProvider>
                <QueryClientProvider client={queryClient}>
                    <BrowserRouter>
                        <AuthProvider>
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
