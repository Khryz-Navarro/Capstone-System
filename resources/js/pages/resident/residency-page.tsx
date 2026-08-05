import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileIcon, Loader2Icon, UploadCloudIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { VerificationBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { residencyApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import { isMobileApp } from '@/lib/platform';
import { useResidentContext } from '@/hooks/use-resident-context';
import { ResidentSelectionAlert } from '@/components/resident-selection-alert';

const proofTypes = [
    { value: 'government_id', label: 'Government ID' },
    { value: 'voters_id', label: "Voter's ID" },
    { value: 'utility_bill', label: 'Utility Bill' },
    { value: 'lease_contract', label: 'Lease Contract' },
    { value: 'residency_certificate', label: 'Existing Residency Certificate' },
    { value: 'other', label: 'Other Supporting Document' },
];

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResidencyPage() {
    const { user, needsResident, isSuper, verificationStatus, isVerified } = useResidentContext();
    const queryClient = useQueryClient();
    const [type, setType] = React.useState('');
    const [file, setFile] = React.useState<File | null>(null);

    const { data: proofs } = useQuery({
        queryKey: ['residency'],
        queryFn: residencyApi.list,
        enabled: !needsResident,
    });

    const upload = useMutation({
        mutationFn: () => residencyApi.upload(type, file as File),
        onSuccess: () => {
            toast.success('Residency proof uploaded for review.');
            setType('');
            setFile(null);
            queryClient.invalidateQueries({ queryKey: ['residency'] });
            queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
            queryClient.invalidateQueries({ queryKey: ['super', 'acting-resident'] });
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!type) return toast.error('Select a document type.');
        if (!file) return toast.error('Choose a file to upload.');
        upload.mutate();
    };

    const verification = verificationStatus;

    return (
        <div>
            {needsResident && <ResidentSelectionAlert />}
            <PageHeader title="Residency Verification" description="Upload proof that you are a resident of your barangay." />

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base">Current status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <VerificationBadge status={verification} />
                        {isSuper && needsResident && (
                            <p className="text-muted-foreground text-sm">
                                Verified for super admin access. Select a resident to view or manage a specific account.
                            </p>
                        )}
                        {verification === 'rejected' && user?.resident_profile?.rejection_reason && (
                            <p className="text-destructive text-sm">{user.resident_profile.rejection_reason}</p>
                        )}
                        {isVerified && !needsResident && (
                            <p className="text-muted-foreground text-sm">You are verified and can request documents.</p>
                        )}
                        {!isVerified && verification === 'pending' && (
                            <p className="text-muted-foreground text-sm">Your submission is awaiting review by barangay staff.</p>
                        )}
                    </CardContent>
                </Card>

                {!needsResident && (
                    <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Upload new proof</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Document type</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select document type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {proofTypes.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="file">File (JPG, PNG, PDF — max 10MB)</Label>
                                <input
                                    id="file"
                                    type="file"
                                    accept={isMobileApp() ? 'image/*,.pdf' : '.jpg,.jpeg,.png,.pdf'}
                                    capture={isMobileApp() ? 'environment' : undefined}
                                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                    className="border-input file:bg-secondary file:text-secondary-foreground block w-full rounded-md border text-sm file:mr-3 file:border-0 file:px-3 file:py-2 file:text-sm"
                                />
                                {file && <p className="text-muted-foreground text-xs">{file.name} ({formatBytes(file.size)})</p>}
                            </div>
                            <Button type="submit" disabled={upload.isPending}>
                                {upload.isPending ? <Loader2Icon className="size-4 animate-spin" /> : <UploadCloudIcon className="size-4" />}
                                Upload proof
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                )}
            </div>

            {!needsResident && (
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-base">Submission history</CardTitle>
                </CardHeader>
                <CardContent>
                    {!proofs || proofs.length === 0 ? (
                        <p className="text-muted-foreground py-6 text-center text-sm">No documents uploaded yet.</p>
                    ) : (
                        <ul className="divide-y">
                            {proofs.map((p) => (
                                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <FileIcon className="text-muted-foreground size-5 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">{p.type_label}</p>
                                            <p className="text-muted-foreground truncate text-xs">
                                                {p.original_name} · {formatBytes(p.size)}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={p.status === 'approved' ? 'success' : p.status === 'rejected' ? 'destructive' : 'warning'}>
                                        {p.status}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
            )}
        </div>
    );
}
