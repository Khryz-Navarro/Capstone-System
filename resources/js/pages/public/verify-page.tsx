import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheckIcon, SearchIcon, ShieldXIcon } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { ModeToggle } from '@/components/mode-toggle';
import { PageLoader } from '@/components/page-loader';
import { RequestStatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { verifyApi } from '@/lib/api';
import type { RequestStatus } from '@/types';

export function VerifyDocumentPage() {
    const { reference } = useParams();
    const navigate = useNavigate();
    const [input, setInput] = React.useState(reference ?? '');

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['verify', reference],
        queryFn: () => verifyApi.check(reference as string),
        enabled: !!reference,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const ref = input.trim();
        if (ref) navigate(`/verify/${encodeURIComponent(ref)}`);
    };

    return (
        <div className="bg-muted/30 flex min-h-screen flex-col">
            <header className="flex h-16 items-center justify-between border-b px-4 lg:px-8">
                <Link to="/">
                    <BrandLogo />
                </Link>
                <ModeToggle />
            </header>

            <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center p-4 py-10">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold tracking-tight">Document Verification</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Enter a reference number to confirm a document's authenticity.
                    </p>
                </div>

                <form onSubmit={submit} className="mb-6 flex gap-2">
                    <Input
                        placeholder="e.g. REQ-2026-ABC123"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="font-mono"
                    />
                    <Button type="submit">
                        <SearchIcon className="size-4" /> Verify
                    </Button>
                </form>

                {reference && (isLoading || isFetching) && <PageLoader />}

                {reference && !isLoading && data && (
                    data.valid ? (
                        <Card className="border-emerald-500/40">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <span className="flex size-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                                        <BadgeCheckIcon className="size-6" />
                                    </span>
                                    <div>
                                        <CardTitle className="text-base">Authentic document</CardTitle>
                                        <p className="text-muted-foreground text-sm">This document was issued by the barangay.</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Row label="Reference" value={<span className="font-mono">{data.reference_number}</span>} />
                                {data.certificate_number && (
                                    <Row label="Certificate No." value={<span className="font-mono">{data.certificate_number}</span>} />
                                )}
                                <Row label="Document" value={data.document_type ?? '—'} />
                                <Row label="Issued to" value={data.resident_name ?? '—'} />
                                <Row
                                    label="Barangay"
                                    value={[data.barangay, data.city, data.province].filter(Boolean).join(', ') || '—'}
                                />
                                <Row
                                    label="Status"
                                    value={
                                        data.status ? (
                                            <RequestStatusBadge status={data.status as RequestStatus} label={data.status_label} />
                                        ) : (
                                            '—'
                                        )
                                    }
                                />
                                <Row
                                    label="Issued on"
                                    value={data.issued_at ? new Date(data.issued_at).toLocaleString() : '—'}
                                    last
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-destructive/40">
                            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                                <span className="bg-destructive/15 text-destructive flex size-12 items-center justify-center rounded-full">
                                    <ShieldXIcon className="size-7" />
                                </span>
                                <div>
                                    <p className="font-semibold">Not verified</p>
                                    <p className="text-muted-foreground text-sm">
                                        {data.message ?? 'No issued document matches this reference number.'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )
                )}
            </main>
        </div>
    );
}

function Row({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) {
    return (
        <div>
            <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="col-span-2 font-medium">{value}</span>
            </div>
            {!last && <Separator className="mt-4" />}
        </div>
    );
}
