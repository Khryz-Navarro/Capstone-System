import { Link } from 'react-router-dom';
import { BrandLogo } from '@/components/brand-logo';
import { ModeToggle } from '@/components/mode-toggle';

export function AuthLayout({
    title,
    description,
    children,
    footer,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}) {
    return (
        <div className="bg-muted/30 relative flex min-h-screen flex-col items-center justify-center p-4">
            <div className="absolute top-4 right-4">
                <ModeToggle />
            </div>
            <div className="w-full max-w-md">
                <div className="mb-6 flex justify-center">
                    <Link to="/">
                        <BrandLogo />
                    </Link>
                </div>
                <div className="bg-card rounded-xl border p-6 shadow-sm sm:p-8">
                    <div className="mb-6 space-y-1.5 text-center">
                        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                        {description && <p className="text-muted-foreground text-sm">{description}</p>}
                    </div>
                    {children}
                </div>
                {footer && <div className="text-muted-foreground mt-6 text-center text-sm">{footer}</div>}
            </div>
        </div>
    );
}
