import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { activeBarangayApi } from '@/lib/api';

export function ActiveBarangaySelector({ className }: { className?: string }) {
    const queryClient = useQueryClient();

    const { data: activeBarangay } = useQuery({
        queryKey: ['active-barangay'],
        queryFn: activeBarangayApi.get,
    });

    const { data: options = [] } = useQuery({
        queryKey: ['active-barangay', 'options'],
        queryFn: activeBarangayApi.options,
    });

    const mutation = useMutation({
        mutationFn: (barangayId: number | null) => activeBarangayApi.set(barangayId),
        onSuccess: (barangay) => {
            queryClient.setQueryData(['active-barangay'], barangay);
            queryClient.invalidateQueries();
            toast.success(barangay ? `Working in ${barangay.name}` : 'Barangay context cleared');
        },
        onError: () => {
            toast.error('Could not update active barangay');
        },
    });

    if (options.length <= 1) {
        return null;
    }

    return (
        <Select
            value={activeBarangay?.id ? String(activeBarangay.id) : 'none'}
            onValueChange={(value) => mutation.mutate(value === 'none' ? null : Number(value))}
            disabled={mutation.isPending}
        >
            <SelectTrigger className={className} size="sm">
                <Building2Icon className="size-4 shrink-0 opacity-70" />
                <SelectValue placeholder="Select barangay" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="none">Select barangay</SelectItem>
                {options.map((barangay) => (
                    <SelectItem key={barangay.id} value={String(barangay.id)}>
                        {barangay.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
