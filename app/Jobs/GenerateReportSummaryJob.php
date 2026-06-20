<?php

namespace App\Jobs;

use App\Services\Reports\ReportSummaryCache;
use App\Services\Reports\ReportSummaryGenerator;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class GenerateReportSummaryJob implements ShouldQueue
{
    use Queueable;

    /**
     * @param  array<string, mixed>  $snapshot
     */
    public function __construct(
        public string $cacheKey,
        public array $snapshot,
    ) {}

    public function handle(ReportSummaryGenerator $generator): void
    {
        $summary = $generator->generate($this->snapshot);

        ReportSummaryCache::store($this->cacheKey, $summary);
    }

    public function failed(?\Throwable $exception): void
    {
        ReportSummaryCache::forget($this->cacheKey);
    }
}
