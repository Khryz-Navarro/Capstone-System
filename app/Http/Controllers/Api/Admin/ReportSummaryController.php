<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\ResolvesBarangay;
use App\Http\Controllers\Controller;
use App\Jobs\GenerateReportSummaryJob;
use App\Models\Barangay;
use App\Services\Reports\BarangayReportService;
use App\Services\Reports\ReportSnapshotBuilder;
use App\Services\Reports\ReportSummaryCache;
use App\Support\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportSummaryController extends Controller
{
    use ResolvesBarangay;

    public function show(Request $request): JsonResponse
    {
        $cacheKey = ReportSummaryCache::keyForBarangay($this->requireBarangayId($request));

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
        BarangayReportService $reports,
        ReportSnapshotBuilder $snapshots,
        AuditLogger $audit,
    ): JsonResponse {
        $barangayId = $this->requireBarangayId($request);
        $barangay = Barangay::query()->findOrFail($barangayId);
        $cacheKey = ReportSummaryCache::keyForBarangay($barangayId);

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

        $snapshot = $snapshots->fromBarangayReport(
            $reports->build($barangayId),
            $barangay->name,
        );

        GenerateReportSummaryJob::dispatch($cacheKey, $snapshot);

        $audit->log(
            'reports.summary.requested',
            $request->user(),
            "Requested report summary for {$barangay->name}",
            ['barangay_id' => $barangayId],
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
