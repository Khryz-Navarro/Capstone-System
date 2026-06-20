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
import { adminApi, type StaffPayload } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import { useAuth } from '@/providers/auth-provider';
import type { User } from '@/types';

const emptyForm: StaffPayload = {
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
};

export function StaffListPage() {
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();
    const [page, setPage] = React.useState(1);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<User | null>(null);
    const [form, setForm] = React.useState<StaffPayload>(emptyForm);

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'staff', page],
        queryFn: () => adminApi.staff.list(page),
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    };

    const save = useMutation({
        mutationFn: () => (editing ? adminApi.staff.update(editing.id, form) : adminApi.staff.create(form)),
        onSuccess: () => {
            invalidate();
            toast.success(editing ? 'Staff updated.' : 'Staff account created.');
            setDialogOpen(false);
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'Unable to save staff account.')),
    });

    const remove = useMutation({
        mutationFn: (id: number) => adminApi.staff.remove(id),
        onSuccess: () => {
            invalidate();
            toast.success('Staff account removed.');
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'Unable to remove staff account.')),
    });

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setDialogOpen(true);
    };

    const openEdit = (u: User) => {
        setEditing(u);
        setForm({
            first_name: u.staff_profile?.first_name ?? '',
            last_name: u.staff_profile?.last_name ?? '',
            position: u.staff_profile?.position ?? '',
            mobile_number: u.staff_profile?.mobile_number ?? '',
            email: u.email,
            username: u.username ?? '',
            role: (u.role === 'barangay_admin' ? 'barangay_admin' : 'barangay_staff') as StaffPayload['role'],
            is_active: u.staff_profile?.is_active ?? true,
            password: '',
            password_confirmation: '',
        });
        setDialogOpen(true);
    };

    const set = (key: keyof StaffPayload, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

    return (
        <div>
            <PageHeader
                title="Manage Staff"
                description="Create and manage barangay staff and admin accounts."
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
                                    <TableHead>Position</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.data.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell className="font-medium">{u.staff_profile?.full_name ?? u.name}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {u.staff_profile?.position ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={u.role === 'barangay_admin' ? 'default' : 'secondary'}>
                                                {u.role_label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={u.staff_profile?.is_active ? 'success' : 'outline'}>
                                                {u.staff_profile?.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                                                    <PencilIcon className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={u.id === currentUser?.id || remove.isPending}
                                                    onClick={() => {
                                                        if (confirm(`Remove ${u.name}?`)) remove.mutate(u.id);
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
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                        Previous
                    </Button>
                    <span className="text-muted-foreground text-sm">
                        Page {data.meta.current_page} of {data.meta.last_page}
                    </span>
                    <Button variant="outline" size="sm" disabled={page >= data.meta.last_page} onClick={() => setPage((p) => p + 1)}>
                        Next
                    </Button>
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit staff account' : 'New staff account'}</DialogTitle>
                        <DialogDescription>
                            {editing ? 'Update the staff member details.' : 'Create a barangay staff or admin account.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        id="staff-form"
                        className="space-y-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            save.mutate();
                        }}
                    >
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="First name">
                                <Input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} required />
                            </Field>
                            <Field label="Last name">
                                <Input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} required />
                            </Field>
                        </div>
                        <Field label="Position">
                            <Input value={form.position} onChange={(e) => set('position', e.target.value)} required />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Email">
                                <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
                            </Field>
                            <Field label="Mobile number">
                                <Input value={form.mobile_number} onChange={(e) => set('mobile_number', e.target.value)} />
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Username (optional)">
                                <Input value={form.username} onChange={(e) => set('username', e.target.value)} />
                            </Field>
                            <Field label="Role">
                                <Select value={form.role} onValueChange={(v) => set('role', v)}>
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
                                <Select
                                    value={form.is_active ? '1' : '0'}
                                    onValueChange={(v) => set('is_active', v === '1')}
                                >
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
                                    onChange={(e) => set('password', e.target.value)}
                                    required={!editing}
                                />
                            </Field>
                            <Field label="Confirm password">
                                <Input
                                    type="password"
                                    value={form.password_confirmation}
                                    onChange={(e) => set('password_confirmation', e.target.value)}
                                    required={!editing}
                                />
                            </Field>
                        </div>
                    </form>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" form="staff-form" disabled={save.isPending}>
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
