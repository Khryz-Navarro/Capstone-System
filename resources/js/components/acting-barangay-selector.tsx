import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { barangayApi, superApi } from '@/lib/api';

export function ActingBarangaySelector({ className }: { className?: string }) {
    const queryClient = useQueryClient();

    const { data: actingBarangay } = useQuery({
        queryKey: ['super', 'acting-barangay'],
        queryFn: superApi.actingBarangay.get,
    });

    const { data: barangays = [] } = useQuery({
        queryKey: ['barangays'],
        queryFn: barangayApi.list,
    });

    const mutation = useMutation({
        mutationFn: (barangayId: number | null) => superApi.actingBarangay.set(barangayId),
        onSuccess: (barangay) => {
            queryClient.setQueryData(['super', 'acting-barangay'], barangay);
            queryClient.setQueryData(['super', 'acting-resident'], null);
            queryClient.invalidateQueries();
            toast.success(barangay ? `Acting as ${barangay.name}` : 'Barangay context cleared');
        },
        onError: () => {
            toast.error('Could not update barangay context');
        },
    });

    return (
        <Select
            value={actingBarangay?.id ? String(actingBarangay.id) : 'none'}
            onValueChange={(value) => mutation.mutate(value === 'none' ? null : Number(value))}
            disabled={mutation.isPending}
        >
            <SelectTrigger className={className} size="sm">
                <Building2Icon className="size-4 shrink-0 opacity-70" />
                <SelectValue placeholder="Select barangay" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="none">No barangay selected</SelectItem>
                {barangays.map((barangay) => (
                    <SelectItem key={barangay.id} value={String(barangay.id)}>
                        {barangay.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
