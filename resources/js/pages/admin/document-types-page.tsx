import * as React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileStackIcon, Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { adminApi, type DocumentTypePayload } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import type { DocumentType } from '@/types';

const emptyForm: DocumentTypePayload = {
    name: '',
    description: '',
    fee: 0,
    requires_purpose: false,
    is_active: true,
};

export function DocumentTypesPage() {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<DocumentType | null>(null);
    const [form, setForm] = React.useState<DocumentTypePayload>(emptyForm);

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'document-types'],
        queryFn: adminApi.documentTypes.list,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'document-types'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    };

    const save = useMutation({
        mutationFn: () =>
            editing ? adminApi.documentTypes.update(editing.id, form) : adminApi.documentTypes.create(form),
        onSuccess: () => {
            invalidate();
            toast.success(editing ? 'Document type updated.' : 'Document type created.');
            setDialogOpen(false);
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'Unable to save document type.')),
    });

    const remove = useMutation({
        mutationFn: (id: number) => adminApi.documentTypes.remove(id),
        onSuccess: () => {
            invalidate();
            toast.success('Document type removed.');
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'Unable to remove document type.')),
    });

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setDialogOpen(true);
    };

    const openEdit = (t: DocumentType) => {
        setEditing(t);
        setForm({
            name: t.name,
            description: t.description ?? '',
            fee: t.fee,
            requires_purpose: t.requires_purpose,
            is_active: t.is_active,
        });
        setDialogOpen(true);
    };

    const set = (key: keyof DocumentTypePayload, value: string | number | boolean) =>
        setForm((f) => ({ ...f, [key]: value }));

    return (
        <div>
            <PageHeader
                title="Document Types"
                description="Manage the documents residents can request and their templates."
                action={
                    <Button onClick={openCreate}>
                        <PlusIcon className="size-4" /> Add Document Type
                    </Button>
                }
            />

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <PageLoader />
                    ) : !data || data.length === 0 ? (
                        <p className="text-muted-foreground py-12 text-center text-sm">No document types yet.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Fee</TableHead>
                                    <TableHead>Purpose</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Requests</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="font-medium">{t.name}</TableCell>
                                        <TableCell>{t.fee > 0 ? `₱${t.fee.toFixed(2)}` : 'Free'}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {t.requires_purpose ? 'Required' : 'Optional'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={t.is_active ? 'success' : 'outline'}>
                                                {t.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{t.requests_count ?? 0}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" asChild title="Templates">
                                                    <Link to={`/admin/document-types/${t.id}/templates`}>
                                                        <FileStackIcon className="size-4" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                                                    <PencilIcon className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={remove.isPending}
                                                    onClick={() => {
                                                        if (confirm(`Delete "${t.name}"?`)) remove.mutate(t.id);
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

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit document type' : 'New document type'}</DialogTitle>
                        <DialogDescription>Configure the document residents can request.</DialogDescription>
                    </DialogHeader>

                    <form
                        id="type-form"
                        className="space-y-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            save.mutate();
                        }}
                    >
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Fee (₱)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={form.fee}
                                    onChange={(e) => set('fee', Number(e.target.value))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Purpose</Label>
                                <Select
                                    value={form.requires_purpose ? '1' : '0'}
                                    onValueChange={(v) => set('requires_purpose', v === '1')}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Optional</SelectItem>
                                        <SelectItem value="1">Required</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={form.is_active ? '1' : '0'} onValueChange={(v) => set('is_active', v === '1')}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Active</SelectItem>
                                    <SelectItem value="0">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </form>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" form="type-form" disabled={save.isPending}>
                            {save.isPending && <Loader2Icon className="size-4 animate-spin" />}
                            {editing ? 'Save changes' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
