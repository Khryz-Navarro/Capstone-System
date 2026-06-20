import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon, DownloadIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { PageLoader } from '@/components/page-loader';
import { RequestStatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { documentRequestApi } from '@/lib/api';

export function RequestDetailPage() {
    const { id } = useParams();
    const requestId = Number(id);

    const { data: request, isLoading } = useQuery({
        queryKey: ['document-request', requestId],
        queryFn: () => documentRequestApi.get(requestId),
        enabled: Number.isFinite(requestId),
    });

    if (isLoading) return <PageLoader />;
    if (!request) return <p className="text-muted-foreground">Request not found.</p>;

    return (
        <div>
            <Button variant="ghost" size="sm" asChild className="mb-4">
                <Link to="/requests">
                    <ArrowLeftIcon className="size-4" /> Back to requests
                </Link>
            </Button>

            <PageHeader
                title={request.document_type?.name ?? 'Document Request'}
                description={request.reference_number}
                action={
                    request.has_pdf ? (
                        <Button
                            onClick={async () => {
                                try {
                                    await documentRequestApi.download(request.id);
                                } catch (error) {
                                    toast.error(error instanceof Error ? error.message : 'Unable to download PDF.');
                                }
                            }}
                        >
                            <DownloadIcon className="size-4" /> Download PDF
                        </Button>
                    ) : undefined
                }
            />

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Request details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <DetailRow label="Status" value={<RequestStatusBadge status={request.status} label={request.status_label} />} />
                        <DetailRow label="Reference Number" value={<span className="font-mono">{request.reference_number}</span>} />
                        {request.certificate_number && (
                            <DetailRow label="Certificate Number" value={<span className="font-mono">{request.certificate_number}</span>} />
                        )}
                        <DetailRow label="Purpose" value={request.purpose || '—'} />
                        <DetailRow label="Fee" value={request.fee > 0 ? `₱${request.fee.toFixed(2)} (paid onsite)` : 'Free'} />
                        {request.remarks && <DetailRow label="Remarks" value={request.remarks} />}
                        <DetailRow
                            label="Submitted"
                            value={request.created_at ? new Date(request.created_at).toLocaleString() : '—'}
                        />
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
                                        <span className="bg-primary absolute -left-[5px] top-1 size-2.5 rounded-full" />
                                        <p className="text-sm font-medium">{log.to_status_label}</p>
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
