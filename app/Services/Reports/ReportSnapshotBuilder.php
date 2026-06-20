<?php

namespace App\Services\Reports;

class ReportSnapshotBuilder
{
    /**
     * Build a PII-free snapshot suitable for AI or rule-based summarization.
     *
     * @param  array<string, mixed>  $report
     * @return array<string, mixed>
     */
    public function fromBarangayReport(array $report, string $barangayName): array
    {
        return [
            'scope' => 'barangay',
            'barangay_name' => $barangayName,
            'period' => 'last_6_months',
            'totals' => $report['totals'],
            'requests_by_status' => $report['requests_by_status'],
            'requests_by_month' => $report['requests_by_month'],
            'most_requested' => $report['most_requested'],
        ];
    }

    /**
     * @param  array<string, mixed>  $analytics
     * @return array<string, mixed>
     */
    public function fromPlatformAnalytics(array $analytics): array
    {
        return [
            'scope' => 'platform',
            'period' => 'last_6_months',
            'totals' => $analytics['totals'],
            'top_barangays' => $analytics['top_barangays'],
            'monthly_registrations' => $analytics['monthly_registrations'],
            'document_trends' => $analytics['document_trends'],
        ];
    }
}
