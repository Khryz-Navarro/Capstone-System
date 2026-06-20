import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2Icon, PencilIcon, Trash2Icon, UserPlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { PageLoader } from '@/components/page-loader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { barangayApi, superApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import type { SuperStaffPayload, User } from '@/types';

const emptyForm: SuperStaffPayload = {
    first_name: '',
    last_name: '',
    position: '',
    mobile_number: '',
    email: '',
    username: '',
    role: 'barangay_staff',
    is_active: true,
    password: '',
    password_confirmation: '',
    barangay_ids: [],
};

export function SuperStaffListPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = React.useState(1);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<User | null>(null);
    const [form, setForm] = React.useState<SuperStaffPayload>(emptyForm);

    const { data: barangays = [] } = useQuery({
        queryKey: ['barangays'],
        queryFn: barangayApi.list,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['super', 'staff', page],
        queryFn: () => superApi.staff.list({ page }),
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['super', 'staff'] });
    };

    const save = useMutation({
        mutationFn: () => (editing ? superApi.staff.update(editing.id, form) : superApi.staff.create(form)),
        onSuccess: () => {
            invalidate();
            toast.success(editing ? 'Staff updated.' : 'Staff account created.');
            setDialogOpen(false);
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to save staff account.')),
    });

    const remove = useMutation({
        mutationFn: (id: number) => superApi.staff.remove(id),
        onSuccess: () => {
            invalidate();
            toast.success('Staff account removed.');
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to remove staff account.')),
    });

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setDialogOpen(true);
    };

    const openEdit = (user: User) => {
        setEditing(user);
        setForm({
            first_name: user.staff_profile?.first_name ?? '',
            last_name: user.staff_profile?.last_name ?? '',
            position: user.staff_profile?.position ?? '',
            mobile_number: user.staff_profile?.mobile_number ?? '',
            email: user.email,
            username: user.username ?? '',
            role: (user.role === 'barangay_admin' ? 'barangay_admin' : 'barangay_staff') as SuperStaffPayload['role'],
            is_active: user.staff_profile?.is_active ?? true,
            password: '',
            password_confirmation: '',
            barangay_ids: user.assigned_barangays?.map((barangay) => barangay.id) ?? (user.barangay_id ? [user.barangay_id] : []),
        });
        setDialogOpen(true);
    };

    const set = (key: keyof SuperStaffPayload, value: string | boolean | number[]) =>
        setForm((current) => ({ ...current, [key]: value }));

    const toggleBarangay = (barangayId: number, checked: boolean) => {
        setForm((current) => ({
            ...current,
            barangay_ids: checked
                ? [...new Set([...current.barangay_ids, barangayId])]
                : current.barangay_ids.filter((id) => id !== barangayId),
        }));
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (form.barangay_ids.length === 0) {
            toast.error('Select at least one barangay assignment.');
            return;
        }
        save.mutate();
    };

    return (
        <div>
            <PageHeader
                title="Platform Staff"
                description="Create staff accounts and assign them to one or more barangays."
                action={
                    <Button onClick={openCreate}>
                        <UserPlusIcon className="size-4" /> Add Staff
                    </Button>
                }
            />

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <PageLoader />
                    ) : !data || data.data.length === 0 ? (
                        <p className="text-muted-foreground py-12 text-center text-sm">No staff accounts yet.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Assigned barangays</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.data.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.staff_profile?.full_name ?? user.name}</TableCell>
                                        <TableCell className="text-muted-foreground max-w-xs text-sm">
                                            {(user.assigned_barangays ?? []).map((barangay) => barangay.name).join(', ') || '—'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'barangay_admin' ? 'default' : 'secondary'}>
                                                {user.role_label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.staff_profile?.is_active ? 'success' : 'outline'}>
                                                {user.staff_profile?.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                                                    <PencilIcon className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={remove.isPending}
                                                    onClick={() => {
                                                        if (confirm(`Remove ${user.name}?`)) {
                                                            remove.mutate(user.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2Icon className="text-destructive size-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {data && data.meta.last_page > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                        Previous
                    </Button>
                    <span className="text-muted-foreground text-sm">
                        Page {data.meta.current_page} of {data.meta.last_page}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= data.meta.last_page}
                        onClick={() => setPage((current) => current + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit staff account' : 'New staff account'}</DialogTitle>
                        <DialogDescription>
                            Only super admins can assign staff to multiple barangays.
                        </DialogDescription>
                    </DialogHeader>

                    <form id="super-staff-form" className="space-y-4" onSubmit={handleSubmit}>
                        <Field label="Barangay assignments">
                            <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
                                {barangays.map((barangay) => (
                                    <label key={barangay.id} className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            className="size-4 rounded border"
                                            checked={form.barangay_ids.includes(barangay.id)}
                                            onChange={(event) => toggleBarangay(barangay.id, event.target.checked)}
                                        />
                                        <span>{barangay.name}</span>
                                    </label>
                                ))}
                            </div>
                        </Field>

                        <div className="grid grid-cols-2 gap-3">
                            <Field label="First name">
                                <Input value={form.first_name} onChange={(event) => set('first_name', event.target.value)} required />
                            </Field>
                            <Field label="Last name">
                                <Input value={form.last_name} onChange={(event) => set('last_name', event.target.value)} required />
                            </Field>
                        </div>
                        <Field label="Position">
                            <Input value={form.position} onChange={(event) => set('position', event.target.value)} required />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Email">
                                <Input type="email" value={form.email} onChange={(event) => set('email', event.target.value)} required />
                            </Field>
                            <Field label="Mobile number">
                                <Input value={form.mobile_number} onChange={(event) => set('mobile_number', event.target.value)} />
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Username (optional)">
                                <Input value={form.username} onChange={(event) => set('username', event.target.value)} />
                            </Field>
                            <Field label="Role">
                                <Select value={form.role} onValueChange={(value) => set('role', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="barangay_staff">Barangay Staff</SelectItem>
                                        <SelectItem value="barangay_admin">Barangay Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                        </div>
                        {editing && (
                            <Field label="Status">
                                <Select value={form.is_active ? '1' : '0'} onValueChange={(value) => set('is_active', value === '1')}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Active</SelectItem>
                                        <SelectItem value="0">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <Field label={editing ? 'New password (optional)' : 'Password'}>
                                <Input
                                    type="password"
                                    value={form.password}
                                    onChange={(event) => set('password', event.target.value)}
                                    required={!editing}
                                />
                            </Field>
                            <Field label="Confirm password">
                                <Input
                                    type="password"
                                    value={form.password_confirmation}
                                    onChange={(event) => set('password_confirmation', event.target.value)}
                                    required={!editing}
                                />
                            </Field>
                        </div>
                    </form>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" form="super-staff-form" disabled={save.isPending}>
                            {save.isPending && <Loader2Icon className="size-4 animate-spin" />}
                            {editing ? 'Save changes' : 'Create account'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {children}
        </div>
    );
}
