import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeftIcon,
    CheckIcon,
    DownloadIcon,
    FileBadgeIcon,
    Loader2Icon,
    PackageCheckIcon,
    PrinterIcon,
    XIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { PageLoader } from '@/components/page-loader';
import { RequestStatusBadge } from '@/components/status-badge';
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
import type { DocumentRequest } from '@/types';

export function RequestReviewPage() {
    const { id } = useParams();
    const requestId = Number(id);
    const queryClient = useQueryClient();
    const [rejectOpen, setRejectOpen] = React.useState(false);
    const [rejectReason, setRejectReason] = React.useState('');

    const { data: request, isLoading } = useQuery({
        queryKey: ['staff', 'request', requestId],
        queryFn: () => staffApi.requests.get(requestId),
        enabled: Number.isFinite(requestId),
    });

    const onSuccess = (updated: DocumentRequest, message: string) => {
        queryClient.setQueryData(['staff', 'request', requestId], updated);
        queryClient.invalidateQueries({ queryKey: ['staff', 'request', requestId] });
        queryClient.invalidateQueries({ queryKey: ['staff', 'requests'] });
        queryClient.invalidateQueries({ queryKey: ['staff', 'dashboard'] });
        toast.success(message);
    };

    const approve = useMutation({
        mutationFn: () => staffApi.requests.approve(requestId),
        onSuccess: (data) => onSuccess(data, 'Request approved.'),
        onError: (e) => toast.error(getApiErrorMessage(e, 'Unable to approve.')),
    });

    const generate = useMutation({
        mutationFn: () => staffApi.requests.generate(requestId),
        onSuccess: (data) => onSuccess(data, 'Certificate generated.'),
        onError: (e) => toast.error(getApiErrorMessage(e, 'Unable to generate certificate.')),
    });

    const markReady = useMutation({
        mutationFn: () => staffApi.requests.markReady(requestId),
        onSuccess: (data) => onSuccess(data, 'Marked ready for pickup.'),
        onError: (e) => toast.error(getApiErrorMessage(e, 'Unable to update.')),
    });

    const release = useMutation({
        mutationFn: () => staffApi.requests.release(requestId),
        onSuccess: (data) => onSuccess(data, 'Document released.'),
        onError: (e) => toast.error(getApiErrorMessage(e, 'Unable to release.')),
    });

    const reject = useMutation({
        mutationFn: () => staffApi.requests.reject(requestId, rejectReason.trim()),
        onSuccess: (data) => {
            onSuccess(data, 'Request rejected.');
            setRejectOpen(false);
            setRejectReason('');
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'Unable to reject.')),
    });

    if (isLoading) return <PageLoader />;
    if (!request) return <p className="text-muted-foreground">Request not found.</p>;

    const busy = approve.isPending || generate.isPending || markReady.isPending || release.isPending || reject.isPending;
    const profile = request.resident?.resident_profile;

    return (
        <div>
            <Button variant="ghost" size="sm" asChild className="mb-4">
                <Link to="/staff/requests">
                    <ArrowLeftIcon className="size-4" /> Back to requests
                </Link>
            </Button>

            <PageHeader
                title={request.document_type?.name ?? 'Document Request'}
                description={request.reference_number}
                action={<RequestStatusBadge status={request.status} label={request.status_label} />}
            />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Resident</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DetailRow label="Name" value={profile?.full_name ?? request.resident?.name ?? '—'} />
                            <DetailRow label="Email" value={request.resident?.email ?? '—'} />
                            <DetailRow label="Mobile" value={profile?.mobile_number ?? '—'} />
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
                                          ]
                                              .filter(Boolean)
                                              .join(', ') || '—'
                                        : '—'
                                }
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Request details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DetailRow label="Reference Number" value={<span className="font-mono">{request.reference_number}</span>} />
                            {request.certificate_number && (
                                <DetailRow label="Certificate Number" value={<span className="font-mono">{request.certificate_number}</span>} />
                            )}
                            <DetailRow label="Purpose" value={request.purpose || '—'} />
                            <DetailRow label="Fee" value={request.fee > 0 ? `₱${request.fee.toFixed(2)}` : 'Free'} />
                            {request.remarks && <DetailRow label="Remarks" value={request.remarks} />}
                            <DetailRow
                                label="Submitted"
                                value={request.created_at ? new Date(request.created_at).toLocaleString() : '—'}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {request.status === 'submitted' && (
                                <>
                                    <Button className="w-full" onClick={() => approve.mutate()} disabled={busy}>
                                        {approve.isPending ? <Loader2Icon className="size-4 animate-spin" /> : <CheckIcon className="size-4" />}
                                        Approve
                                    </Button>
                                    <Button variant="destructive" className="w-full" onClick={() => setRejectOpen(true)} disabled={busy}>
                                        <XIcon className="size-4" /> Reject
                                    </Button>
                                </>
                            )}

                            {request.status === 'approved' && (
                                <Button className="w-full" onClick={() => generate.mutate()} disabled={busy}>
                                    {generate.isPending ? <Loader2Icon className="size-4 animate-spin" /> : <FileBadgeIcon className="size-4" />}
                                    Generate Certificate
                                </Button>
                            )}

                            {request.status === 'certificate_generated' && (
                                <Button className="w-full" onClick={() => markReady.mutate()} disabled={busy}>
                                    {markReady.isPending ? <Loader2Icon className="size-4 animate-spin" /> : <PackageCheckIcon className="size-4" />}
                                    Mark Ready for Pickup
                                </Button>
                            )}

                            {request.status === 'ready_for_pickup' && (
                                <Button className="w-full" onClick={() => release.mutate()} disabled={busy}>
                                    {release.isPending ? <Loader2Icon className="size-4 animate-spin" /> : <CheckIcon className="size-4" />}
                                    Release Document
                                </Button>
                            )}

                            {request.has_pdf && (
                                <>
                                    <Separator className="my-2" />
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={async () => {
                                            try {
                                                await staffApi.requests.download(request.id);
                                            } catch (error) {
                                                toast.error(error instanceof Error ? error.message : 'Unable to download PDF.');
                                            }
                                        }}
                                    >
                                        <DownloadIcon className="size-4" /> Download PDF
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={async () => {
                                            try {
                                                await staffApi.requests.open(request.id);
                                            } catch (error) {
                                                toast.error(error instanceof Error ? error.message : 'Unable to open PDF.');
                                            }
                                        }}
                                    >
                                        <PrinterIcon className="size-4" /> Open / Print
                                    </Button>
                                </>
                            )}

                            {request.status === 'rejected' && (
                                <p className="text-muted-foreground text-sm">This request was rejected.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {request.status_logs && request.status_logs.length > 0 ? (
                                <ol className="relative space-y-4">
                                    {request.status_logs.map((log) => (
                                        <li key={log.id} className="border-muted relative border-l pl-4">
                                            <span className="bg-primary absolute top-1 -left-[5px] size-2.5 rounded-full" />
                                            <p className="text-sm font-medium">{log.to_status_label}</p>
                                            {log.actor && <p className="text-muted-foreground text-xs">by {log.actor.name}</p>}
                                            {log.remarks && <p className="text-muted-foreground text-xs">{log.remarks}</p>}
                                            <p className="text-muted-foreground text-xs">
                                                {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                                            </p>
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <p className="text-muted-foreground text-sm">No status updates yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject request</DialogTitle>
                        <DialogDescription>Provide a reason. The resident will be notified.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason</Label>
                        <Textarea
                            id="reason"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Explain why this request is being rejected…"
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
                            disabled={reject.isPending || rejectReason.trim().length === 0}
                        >
                            {reject.isPending && <Loader2Icon className="size-4 animate-spin" />}
                            Reject request
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
