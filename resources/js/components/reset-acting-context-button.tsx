import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcwIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { superApi } from '@/lib/api';

export function ResetActingContextButton({ className }: { className?: string }) {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: superApi.actingContext.reset,
        onSuccess: () => {
            queryClient.setQueryData(['super', 'acting-barangay'], null);
            queryClient.setQueryData(['super', 'acting-resident'], null);
            queryClient.invalidateQueries();
            toast.success('Super admin context reset');
        },
        onError: () => {
            toast.error('Could not reset context');
        },
    });

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            className={className}
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
        >
            <RotateCcwIcon className="size-4" />
            Reset context
        </Button>
    );
}
