<?php

namespace App\Http\Controllers\Api\Super;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateReportSummaryJob;
use App\Services\Reports\PlatformAnalyticsService;
use App\Services\Reports\ReportSnapshotBuilder;
use App\Services\Reports\ReportSummaryCache;
use App\Support\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsSummaryController extends Controller
{
    public function show(): JsonResponse
    {
        $cacheKey = ReportSummaryCache::keyForPlatform();

        if (ReportSummaryCache::isPending($cacheKey)) {
            return response()->json(['status' => 'pending']);
        }

        $summary = ReportSummaryCache::get($cacheKey);

        if ($summary === null) {
            return response()->json(['status' => 'none']);
        }

        return response()->json([
            'status' => 'ready',
            'data' => $summary,
        ]);
    }

    public function store(
        Request $request,
        PlatformAnalyticsService $analytics,
        ReportSnapshotBuilder $snapshots,
        AuditLogger $audit,
    ): JsonResponse {
        $cacheKey = ReportSummaryCache::keyForPlatform();

        if (! $request->boolean('refresh')) {
            $cached = ReportSummaryCache::get($cacheKey);

            if ($cached !== null) {
                return response()->json([
                    'status' => 'ready',
                    'data' => $cached,
                ]);
            }
        } else {
            ReportSummaryCache::forget($cacheKey);
        }

        ReportSummaryCache::markPending($cacheKey);

        $snapshot = $snapshots->fromPlatformAnalytics($analytics->build());

        GenerateReportSummaryJob::dispatch($cacheKey, $snapshot);

        $audit->log(
            'analytics.summary.requested',
            $request->user(),
            'Requested platform analytics summary',
        );

        if ($summary = ReportSummaryCache::get($cacheKey)) {
            return response()->json([
                'status' => 'ready',
                'data' => $summary,
            ]);
        }

        return response()->json(['status' => 'pending'], 202);
    }
}
