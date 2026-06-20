import { BuildingIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BrandLogo({ className, showText = true }: { className?: string; showText?: boolean }) {
    return (
        <div className={cn('flex items-center gap-2', className)}>
            <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
                <BuildingIcon className="size-5" />
            </div>
            {showText && (
                <div className="flex flex-col leading-none">
                    <span className="text-base font-bold tracking-tight">MT-BDRS</span>
                    <span className="text-muted-foreground text-[11px]">Barangay Documents</span>
                </div>
            )}
        </div>
    );
}
