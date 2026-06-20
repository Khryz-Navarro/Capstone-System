import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangleIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { documentRequestApi, documentTypeApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import { useResidentContext } from '@/hooks/use-resident-context';
import { ResidentSelectionAlert } from '@/components/resident-selection-alert';

export function RequestDocumentPage() {
    const { user, needsResident, isVerified } = useResidentContext();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [typeId, setTypeId] = React.useState('');
    const [purpose, setPurpose] = React.useState('');

    const isApproved = isVerified;

    const { data: types } = useQuery({
        queryKey: ['document-types'],
        queryFn: documentTypeApi.list,
        enabled: isVerified && !needsResident,
    });

    const selectedType = types?.find((t) => String(t.id) === typeId);

    const create = useMutation({
        mutationFn: () =>
            documentRequestApi.create({ document_type_id: Number(typeId), purpose: purpose || undefined }),
        onSuccess: (request) => {
            toast.success('Request submitted!');
            queryClient.invalidateQueries({ queryKey: ['document-requests'] });
            navigate(`/requests/${request.id}`);
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!typeId) return toast.error('Select a document type.');
        if (selectedType?.requires_purpose && !purpose.trim()) return toast.error('Please state the purpose.');
        create.mutate();
    };

    if (!isApproved) {
        return (
            <div>
                <PageHeader title="Request a Document" />
                <Alert variant="destructive">
                    <AlertTriangleIcon />
                    <AlertTitle>Residency not verified</AlertTitle>
                    <AlertDescription>
                        You can only request documents after your residency is approved.{' '}
                        <Link to="/residency" className="font-medium underline">
                            Upload residency proof
                        </Link>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div>
            {needsResident && <ResidentSelectionAlert />}
            <PageHeader title="Request a Document" description="Choose a document and provide the purpose of your request." />
            {!needsResident && (
            <Card className="max-w-2xl">
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label>Document type</Label>
                            <Select value={typeId} onValueChange={setTypeId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a document" />
                                </SelectTrigger>
                                <SelectContent>
                                    {types?.map((t) => (
                                        <SelectItem key={t.id} value={String(t.id)}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedType && (
                            <div className="bg-muted/50 space-y-1 rounded-lg p-4 text-sm">
                                {selectedType.description && <p className="text-muted-foreground">{selectedType.description}</p>}
                                <p className="font-medium">
                                    Fee: {selectedType.fee > 0 ? `₱${selectedType.fee.toFixed(2)} (paid onsite)` : 'Free'}
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="purpose">
                                Purpose {selectedType?.requires_purpose ? '' : '(optional)'}
                            </Label>
                            <Textarea
                                id="purpose"
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                placeholder="e.g. For employment requirements"
                                rows={4}
                            />
                        </div>

                        <Button type="submit" disabled={create.isPending}>
                            {create.isPending && <Loader2Icon className="size-4 animate-spin" />}
                            Submit request
                        </Button>
                    </form>
                </CardContent>
            </Card>
            )}
        </div>
    );
}
