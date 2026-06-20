import { Loader2Icon } from 'lucide-react';

export function PageLoader({ label = 'Loading...' }: { label?: string }) {
    return (
        <div className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2Icon className="size-7 animate-spin" />
            <span className="text-sm">{label}</span>
        </div>
    );
}

export function FullScreenLoader() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <Loader2Icon className="text-primary size-8 animate-spin" />
        </div>
    );
}
