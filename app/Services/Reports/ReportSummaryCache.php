<?php

namespace App\Services\Reports;

use Illuminate\Support\Facades\Cache;

class ReportSummaryCache
{
    public const TTL_SECONDS = 3600;

    public static function keyForBarangay(int $barangayId): string
    {
        return "report-summary:barangay:{$barangayId}";
    }

    public static function keyForPlatform(): string
    {
        return 'report-summary:platform';
    }

    public static function pendingKey(string $cacheKey): string
    {
        return "{$cacheKey}:pending";
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function get(string $cacheKey): ?array
    {
        $summary = Cache::get($cacheKey);

        return is_array($summary) ? $summary : null;
    }

    /**
     * @param  array<string, mixed>  $summary
     */
    public static function store(string $cacheKey, array $summary): void
    {
        Cache::put($cacheKey, $summary, now()->addSeconds(self::TTL_SECONDS));
        Cache::forget(self::pendingKey($cacheKey));
    }

    public static function markPending(string $cacheKey): void
    {
        Cache::put(self::pendingKey($cacheKey), true, now()->addMinutes(10));
    }

    public static function isPending(string $cacheKey): bool
    {
        return Cache::has(self::pendingKey($cacheKey));
    }

    public static function forget(string $cacheKey): void
    {
        Cache::forget($cacheKey);
        Cache::forget(self::pendingKey($cacheKey));
    }
}
