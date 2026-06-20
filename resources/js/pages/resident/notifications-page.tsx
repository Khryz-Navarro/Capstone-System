import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellIcon, CheckCheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { PageLoader } from '@/components/page-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { notificationApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import { useResidentContext } from '@/hooks/use-resident-context';
import { ResidentSelectionAlert } from '@/components/resident-selection-alert';

export function NotificationsPage() {
    const { needsResident } = useResidentContext();
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: notificationApi.list,
        enabled: !needsResident,
    });

    const markAll = useMutation({
        mutationFn: notificationApi.markAllRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('All notifications marked as read.');
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
    });

    const markOne = useMutation({
        mutationFn: (id: string) => notificationApi.markRead(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const items = data?.data ?? [];

    return (
        <div>
            {needsResident && <ResidentSelectionAlert />}
            <PageHeader
                title="Notifications"
                description="Updates about your requests and residency verification."
                action={
                    items.some((n) => !n.read) && (
                        <Button variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
                            <CheckCheckIcon className="size-4" /> Mark all read
                        </Button>
                    )
                }
            />

            {isLoading ? (
                <PageLoader />
            ) : items.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                        <BellIcon className="text-muted-foreground size-8" />
                        <p className="text-muted-foreground text-sm">You have no notifications.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {items.map((n) => {
                        const title = (n.data.title as string) ?? 'Notification';
                        const message = (n.data.message as string) ?? '';
                        return (
                            <Card
                                key={n.id}
                                className={cn('cursor-pointer transition-colors', !n.read && 'border-primary/40 bg-primary/5')}
                                onClick={() => !n.read && markOne.mutate(n.id)}
                            >
                                <CardContent className="flex items-start justify-between gap-3 py-4">
                                    <div className="space-y-1">
                                        <p className="font-medium">{title}</p>
                                        {message && <p className="text-muted-foreground text-sm">{message}</p>}
                                        <p className="text-muted-foreground text-xs">
                                            {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                                        </p>
                                    </div>
                                    {!n.read && <span className="bg-primary mt-1 size-2 shrink-0 rounded-full" />}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
