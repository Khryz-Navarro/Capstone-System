import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2Icon, RefreshCwIcon, SparklesIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReportSummaryResponse } from '@/types';
import { getApiErrorMessage } from '@/lib/errors';

interface AiSummaryCardProps {
    title?: string;
    description?: string;
    queryKey: readonly string[];
    fetchSummary: () => Promise<ReportSummaryResponse>;
    generateSummary: (refresh?: boolean) => Promise<ReportSummaryResponse>;
}

export function AiSummaryCard({
    title = 'AI Insights',
    description = 'A plain-language summary of the metrics below — generated from aggregate data only, never resident PII.',
    queryKey,
    fetchSummary,
    generateSummary,
}: AiSummaryCardProps) {
    const queryClient = useQueryClient();

    const summaryQuery = useQuery({
        queryKey: [...queryKey, 'summary'],
        queryFn: fetchSummary,
        refetchInterval: (query) => (query.state.data?.status === 'pending' ? 2000 : false),
    });

    const generate = useMutation({
        mutationFn: (refresh?: boolean) => generateSummary(refresh),
        onSuccess: (response) => {
            queryClient.setQueryData([...queryKey, 'summary'], response);
            if (response.status === 'ready') {
                toast.success('Summary generated.');
            }
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to generate summary.')),
    });

    const status = summaryQuery.data?.status ?? 'none';
    const summary = summaryQuery.data?.status === 'ready' ? summaryQuery.data.data : null;
    const isWorking = generate.isPending || status === 'pending';

    return (
        <Card className="mt-6">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <SparklesIcon className="size-4" />
                        {title}
                    </CardTitle>
                    <CardDescription className="mt-1">{description}</CardDescription>
                </div>
                <div className="flex shrink-0 gap-2">
                    {summary && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isWorking}
                            onClick={() => generate.mutate(true)}
                        >
                            {isWorking ? <Loader2Icon className="size-4 animate-spin" /> : <RefreshCwIcon className="size-4" />}
                            Refresh
                        </Button>
                    )}
                    <Button type="button" size="sm" disabled={isWorking} onClick={() => generate.mutate(false)}>
                        {isWorking && <Loader2Icon className="size-4 animate-spin" />}
                        {summary ? 'Regenerate' : 'Generate summary'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {summaryQuery.isLoading && !summary ? (
                    <p className="text-muted-foreground text-sm">Loading summary…</p>
                ) : status === 'pending' ? (
                    <p className="text-muted-foreground text-sm">Generating summary…</p>
                ) : summary ? (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={summary.source === 'ai' ? 'default' : 'secondary'}>
                                {summary.source === 'ai' ? 'AI generated' : 'Rule-based insights'}
                            </Badge>
                            <span className="text-muted-foreground text-xs">
                                {new Date(summary.generated_at).toLocaleString()}
                            </span>
                        </div>
                        <p className="text-sm leading-relaxed">{summary.summary}</p>
                        {summary.highlights.length > 0 && (
                            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
                                {summary.highlights.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-sm">
                        No summary yet. Click &ldquo;Generate summary&rdquo; for an automated briefing of these metrics.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
