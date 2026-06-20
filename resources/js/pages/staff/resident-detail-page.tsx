import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, CheckIcon, DownloadIcon, FileIcon, Loader2Icon, MailIcon, Trash2Icon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { PageLoader } from '@/components/page-loader';
import { VerificationBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { staffApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import { useAuth } from '@/providers/auth-provider';

export function ResidentDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const canManageAccounts = currentUser?.role === 'barangay_admin' || currentUser?.role === 'super_admin';
    const residentId = Number(id);
    const queryClient = useQueryClient();
    const [rejectOpen, setRejectOpen] = React.useState(false);
    const [deleteOpen, setDeleteOpen] = React.useState(false);
    const [reason, setReason] = React.useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['staff', 'resident', residentId],
        queryFn: () => staffApi.residents.get(residentId),
        enabled: Number.isFinite(residentId),
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['staff', 'resident', residentId] });
        queryClient.invalidateQueries({ queryKey: ['staff', 'residents'] });
        queryClient.invalidateQueries({ queryKey: ['staff', 'dashboard'] });
    };

    const approve = useMutation({
        mutationFn: () => staffApi.residents.approve(residentId),
        onSuccess: () => {
            invalidate();
            toast.success('Resident verified.');
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'Unable to approve.')),
    });

    const reject = useMutation({
        mutationFn: () => staffApi.residents.reject(residentId, reason.trim()),
        onSuccess: () => {
            invalidate();
            toast.success('Resident verification rejected.');
            setRejectOpen(false);
            setReason('');
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'Unable to reject.')),
    });

    const resendVerification = useMutation({
        mutationFn: () => staffApi.residents.resendVerification(residentId),
        onSuccess: (message) => toast.success(message),
        onError: (e) => toast.error(getApiErrorMessage(e, 'Unable to resend verification email.')),
    });

    const remove = useMutation({
        mutationFn: () => staffApi.residents.remove(residentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff', 'residents'] });
            queryClient.invalidateQueries({ queryKey: ['staff', 'dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
            queryClient.invalidateQueries({ queryKey: ['super', 'acting-resident'] });
            toast.success('Resident account removed.');
            navigate('/staff/residents');
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'Unable to remove resident account.')),
    });

    if (isLoading) return <PageLoader />;
    if (!data) return <p className="text-muted-foreground">Resident not found.</p>;

    const { resident, proofs } = data;
    const profile = resident.resident_profile;
    const status = profile?.verification_status ?? 'pending';

    return (
        <div>
            <Button variant="ghost" size="sm" asChild className="mb-4">
                <Link to="/staff/residents">
                    <ArrowLeftIcon className="size-4" /> Back to residents
                </Link>
            </Button>

            <PageHeader
                title={profile?.full_name ?? resident.name}
                description={resident.email}
                action={<VerificationBadge status={status} />}
            />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DetailRow label="Mobile" value={profile?.mobile_number ?? '—'} />
                            <DetailRow label="Gender" value={profile?.gender ?? '—'} />
                            <DetailRow label="Birthdate" value={profile?.birthdate ?? '—'} />
                            <DetailRow label="Civil Status" value={profile?.civil_status ?? '—'} />
                            <DetailRow label="Occupation" value={profile?.occupation ?? '—'} />
                            <DetailRow
                                label="Address"
                                value={
                                    profile?.address
                                        ? [
                                              profile.address.house_number,
                                              profile.address.street,
                                              profile.address.purok,
                                              profile.address.sitio,
                                              profile.address.city,
                                              profile.address.province,
                                          ]
                                              .filter(Boolean)
                                              .join(', ') || '—'
                                        : '—'
                                }
                            />
                            {profile?.rejection_reason && status === 'rejected' && (
                                <DetailRow label="Rejection Reason" value={profile.rejection_reason} />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Residency proofs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {proofs.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No proofs uploaded.</p>
                            ) : (
                                <ul className="divide-y">
                                    {proofs.map((proof) => (
                                        <li key={proof.id} className="flex items-center justify-between gap-3 py-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <FileIcon className="text-muted-foreground size-5 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium">{proof.original_name}</p>
                                                    <p className="text-muted-foreground text-xs">
                                                        {proof.type_label} ·{' '}
                                                        {proof.created_at ? new Date(proof.created_at).toLocaleDateString() : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={async () => {
                                                    try {
                                                        await staffApi.residents.viewProof(proof.id);
                                                    } catch (error) {
                                                        toast.error(error instanceof Error ? error.message : 'Unable to open file.');
                                                    }
                                                }}
                                            >
                                                <DownloadIcon className="size-4" /> View
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="text-base">Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {!resident.email_verified && (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => resendVerification.mutate()}
                                disabled={resendVerification.isPending || approve.isPending || reject.isPending}
                            >
                                {resendVerification.isPending ? (
                                    <Loader2Icon className="size-4 animate-spin" />
                                ) : (
                                    <MailIcon className="size-4" />
                                )}
                                Resend verification email
                            </Button>
                        )}
                        {status !== 'approved' && (
                            <Button
                                className="w-full"
                                onClick={() => approve.mutate()}
                                disabled={approve.isPending || reject.isPending}
                            >
                                {approve.isPending ? <Loader2Icon className="size-4 animate-spin" /> : <CheckIcon className="size-4" />}
                                Approve Verification
                            </Button>
                        )}
                        {status !== 'rejected' && (
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => setRejectOpen(true)}
                                disabled={approve.isPending || reject.isPending}
                            >
                                <XIcon className="size-4" /> Reject
                            </Button>
                        )}
                        {status === 'approved' && (
                            <p className="text-muted-foreground text-sm">This resident is verified.</p>
                        )}
                        {canManageAccounts && (
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => setDeleteOpen(true)}
                                disabled={remove.isPending}
                            >
                                {remove.isPending ? (
                                    <Loader2Icon className="size-4 animate-spin" />
                                ) : (
                                    <Trash2Icon className="size-4" />
                                )}
                                Delete resident
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete resident account</DialogTitle>
                        <DialogDescription>
                            This permanently removes {profile?.full_name ?? resident.name}, their profile, residency proofs,
                            and document requests.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={() => remove.mutate()} disabled={remove.isPending}>
                            {remove.isPending && <Loader2Icon className="size-4 animate-spin" />}
                            Delete resident
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject verification</DialogTitle>
                        <DialogDescription>Provide a reason. The resident will be notified.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain why the residency proof is being rejected…"
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => reject.mutate()}
                            disabled={reject.isPending || reason.trim().length === 0}
                        >
                            {reject.isPending && <Loader2Icon className="size-4 animate-spin" />}
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="col-span-2 font-medium">{value}</span>
            </div>
            <Separator className="mt-4" />
        </div>
    );
}
