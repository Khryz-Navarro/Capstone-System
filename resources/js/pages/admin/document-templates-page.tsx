import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { adminApi, type DocumentTemplatePayload } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import type { DocumentTemplate } from '@/types';

export function DocumentTemplatesPage() {
    const { typeId } = useParams();
    const documentTypeId = Number(typeId);
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<DocumentTemplate | null>(null);
    const [form, setForm] = React.useState<DocumentTemplatePayload>({ name: '', body: '', is_default: false });

    const { data: types } = useQuery({ queryKey: ['admin', 'document-types'], queryFn: adminApi.documentTypes.list });
    const type = types?.find((t) => t.id === documentTypeId);

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'document-templates', documentTypeId],
        queryFn: () => adminApi.templates.list(documentTypeId),
        enabled: Number.isFinite(documentTypeId),
    });

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: ['admin', 'document-templates', documentTypeId] });

    const save = useMutation({
        mutationFn: () =>
            editing
                ? adminApi.templates.update(editing.id, form)
                : adminApi.templates.create({ ...form, document_type_id: documentTypeId }),
        onSuccess: () => {
            invalidate();
            toast.success(editing ? 'Template updated.' : 'Template created.');
            setDialogOpen(false);
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'Unable to save template.')),
    });

    const remove = useMutation({
        mutationFn: (id: number) => adminApi.templates.remove(id),
        onSuccess: () => {
            invalidate();
            toast.success('Template removed.');
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'Unable to remove template.')),
    });

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', body: '', is_default: (data?.length ?? 0) === 0 });
        setDialogOpen(true);
    };

    const openEdit = (t: DocumentTemplate) => {
        setEditing(t);
        setForm({ name: t.name, body: t.body, is_default: t.is_default });
        setDialogOpen(true);
    };

    return (
        <div>
            <Button variant="ghost" size="sm" asChild className="mb-4">
                <Link to="/admin/document-types">
                    <ArrowLeftIcon className="size-4" /> Back to document types
                </Link>
            </Button>

            <PageHeader
                title={type ? `${type.name} Templates` : 'Templates'}
                description="Manage certificate body templates. Use placeholders like {{name}}, {{purpose}}, {{date}}."
                action={
                    <Button onClick={openCreate}>
                        <PlusIcon className="size-4" /> Add Template
                    </Button>
                }
            />

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <PageLoader />
                    ) : !data || data.length === 0 ? (
                        <p className="text-muted-foreground py-12 text-center text-sm">No templates yet.</p>
                    ) : (
                        <ul className="divide-y">
                            {data.map((t) => (
                                <li key={t.id} className="flex items-start justify-between gap-3 p-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{t.name}</p>
                                            {t.is_default && <Badge variant="success">Default</Badge>}
                                        </div>
                                        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm whitespace-pre-wrap">
                                            {t.body}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 gap-1">
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
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit template' : 'New template'}</DialogTitle>
                        <DialogDescription>Body text used when generating this certificate.</DialogDescription>
                    </DialogHeader>

                    <form
                        id="template-form"
                        className="space-y-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            save.mutate();
                        }}
                    >
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Body</Label>
                            <Textarea
                                value={form.body}
                                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                                rows={6}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Default template</Label>
                            <Select
                                value={form.is_default ? '1' : '0'}
                                onValueChange={(v) => setForm((f) => ({ ...f, is_default: v === '1' }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">No</SelectItem>
                                    <SelectItem value="1">Yes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </form>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" form="template-form" disabled={save.isPending}>
                            {save.isPending && <Loader2Icon className="size-4 animate-spin" />}
                            {editing ? 'Save changes' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
