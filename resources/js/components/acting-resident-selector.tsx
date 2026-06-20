import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { superApi } from '@/lib/api';

export function ActingResidentSelector({ className, disabled }: { className?: string; disabled?: boolean }) {
    const queryClient = useQueryClient();

    const { data: actingResident } = useQuery({
        queryKey: ['super', 'acting-resident'],
        queryFn: superApi.actingResident.get,
    });

    const { data: options = [], isLoading } = useQuery({
        queryKey: ['super', 'acting-resident', 'options'],
        queryFn: superApi.actingResident.options,
        enabled: !disabled,
    });

    const mutation = useMutation({
        mutationFn: (residentId: number | null) => superApi.actingResident.set(residentId),
        onSuccess: (resident) => {
            queryClient.setQueryData(['super', 'acting-resident'], resident);
            queryClient.invalidateQueries();
            toast.success(
                resident
                    ? `Controlling ${resident.resident_profile?.full_name ?? resident.name}'s account`
                    : 'Resident context cleared',
            );
        },
        onError: () => {
            toast.error('Could not update resident context');
        },
    });

    return (
        <Select
            value={actingResident?.id ? String(actingResident.id) : 'none'}
            onValueChange={(value) => mutation.mutate(value === 'none' ? null : Number(value))}
            disabled={disabled || mutation.isPending || isLoading}
        >
            <SelectTrigger className={className} size="sm">
                <UserIcon className="size-4 shrink-0 opacity-70" />
                <SelectValue placeholder={disabled ? 'Select barangay first' : 'Select resident'} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="none">No resident selected</SelectItem>
                {options.map((resident) => (
                    <SelectItem key={resident.id} value={String(resident.id)}>
                        {resident.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
