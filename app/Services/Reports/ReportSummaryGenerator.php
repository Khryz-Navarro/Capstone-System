<?php

namespace App\Services\Reports;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ReportSummaryGenerator
{
    /**
     * @param  array<string, mixed>  $snapshot
     * @return array{summary: string, highlights: list<string>, generated_at: string, source: string}
     */
    public function generate(array $snapshot): array
    {
        if ($this->aiEnabled()) {
            try {
                return $this->generateWithAi($snapshot);
            } catch (\Throwable $exception) {
                Log::warning('AI report summary failed, falling back to rules.', [
                    'message' => $exception->getMessage(),
                ]);
            }
        }

        return $this->generateWithRules($snapshot);
    }

    public function aiEnabled(): bool
    {
        return SystemSetting::getValue('ai_reports_enabled') === '1'
            && filled(config('services.google_ai.key'));
    }

    /**
     * @param  array<string, mixed>  $snapshot
     * @return array{summary: string, highlights: list<string>, generated_at: string, source: string}
     */
    protected function generateWithAi(array $snapshot): array
    {
        $model = config('services.google_ai.model');
        $apiKey = config('services.google_ai.key');

        $response = Http::timeout(30)
            ->post(
                "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}",
                [
                    'systemInstruction' => [
                        'parts' => [
                            ['text' => $this->aiSystemPrompt()],
                        ],
                    ],
                    'contents' => [
                        [
                            'role' => 'user',
                            'parts' => [
                                ['text' => json_encode($snapshot, JSON_THROW_ON_ERROR)],
                            ],
                        ],
                    ],
                    'generationConfig' => [
                        'temperature' => 0.4,
                        'responseMimeType' => 'application/json',
                    ],
                ],
            )
            ->throw()
            ->json();

        $content = data_get($response, 'candidates.0.content.parts.0.text');

        if (! is_string($content) || trim($content) === '') {
            throw new \RuntimeException('Google AI returned an empty summary.');
        }

        return $this->parseAiPayload($content);
    }

    protected function aiSystemPrompt(): string
    {
        return 'You summarize barangay document request analytics for local government staff. '
            .'Use only the aggregate data provided. Do not invent numbers. '
            .'Respond with JSON: {"summary":"2-4 sentences","highlights":["3-5 short bullet strings"]}. '
            .'Be practical and action-oriented.';
    }

    /**
     * @return array{summary: string, highlights: list<string>, generated_at: string, source: string}
     */
    protected function parseAiPayload(string $content): array
    {
        /** @var array{summary?: string, highlights?: list<string>|string} $parsed */
        $parsed = json_decode($content, true, flags: JSON_THROW_ON_ERROR);

        $summary = trim((string) ($parsed['summary'] ?? ''));
        $highlights = collect($parsed['highlights'] ?? [])
            ->filter(fn ($item) => is_string($item) && trim($item) !== '')
            ->map(fn (string $item) => trim($item))
            ->values()
            ->all();

        if ($summary === '') {
            throw new \RuntimeException('Google AI returned an invalid summary payload.');
        }

        return $this->payload($summary, $highlights, 'ai');
    }

    /**
     * @param  array<string, mixed>  $snapshot
     * @return array{summary: string, highlights: list<string>, generated_at: string, source: string}
     */
    protected function generateWithRules(array $snapshot): array
    {
        if (($snapshot['scope'] ?? null) === 'platform') {
            return $this->platformRules($snapshot);
        }

        return $this->barangayRules($snapshot);
    }

    /**
     * @param  array<string, mixed>  $snapshot
     * @return array{summary: string, highlights: list<string>, generated_at: string, source: string}
     */
    protected function barangayRules(array $snapshot): array
    {
        /** @var array<string, int> $totals */
        $totals = $snapshot['totals'] ?? [];
        $name = (string) ($snapshot['barangay_name'] ?? 'This barangay');
        $requests = (int) ($totals['requests'] ?? 0);
        $released = (int) ($totals['released'] ?? 0);
        $residents = (int) ($totals['residents'] ?? 0);
        $pendingVerification = (int) ($totals['pending_verification'] ?? 0);

        $releaseRate = $requests > 0 ? round(($released / $requests) * 100) : 0;

        /** @var list<array{label: string, total: int}> $months */
        $months = $snapshot['requests_by_month'] ?? [];
        $peakMonth = collect($months)->sortByDesc('total')->first();
        $recentTotal = collect($months)->take(-3)->sum('total');

        /** @var list<array{name: string, total: int}> $mostRequested */
        $mostRequested = $snapshot['most_requested'] ?? [];
        $topDocument = $mostRequested[0]['name'] ?? null;

        $summary = "{$name} serves {$residents} registered residents with {$requests} total document requests. "
            ."{$released} requests ({$releaseRate}%) have been released. "
            ."In the last three months, {$recentTotal} new requests were recorded.";

        if ($pendingVerification > 0) {
            $summary .= " {$pendingVerification} resident profile(s) still need verification.";
        }

        $highlights = [];

        if ($peakMonth && ($peakMonth['total'] ?? 0) > 0) {
            $highlights[] = "Busiest month: {$peakMonth['label']} with {$peakMonth['total']} requests.";
        }

        if ($topDocument) {
            $topTotal = (int) ($mostRequested[0]['total'] ?? 0);
            $highlights[] = "Most requested document: {$topDocument} ({$topTotal} requests).";
        }

        if ($pendingVerification > 0) {
            $highlights[] = "Prioritize {$pendingVerification} pending resident verification(s).";
        }

        /** @var list<array{status: string, label: string, total: int}> $statuses */
        $statuses = $snapshot['requests_by_status'] ?? [];
        $openRequests = collect($statuses)
            ->reject(fn (array $row) => in_array($row['status'], ['released', 'rejected', 'cancelled'], true))
            ->sum('total');

        if ($openRequests > 0) {
            $highlights[] = "{$openRequests} request(s) are still in progress across active statuses.";
        }

        if ($highlights === []) {
            $highlights[] = 'Activity is low — encourage residents to register and request documents online.';
        }

        return $this->payload($summary, $highlights, 'rules');
    }

    /**
     * @param  array<string, mixed>  $snapshot
     * @return array{summary: string, highlights: list<string>, generated_at: string, source: string}
     */
    protected function platformRules(array $snapshot): array
    {
        /** @var array<string, int> $totals */
        $totals = $snapshot['totals'] ?? [];
        $barangays = (int) ($totals['barangays'] ?? 0);
        $activeBarangays = (int) ($totals['active_barangays'] ?? 0);
        $residents = (int) ($totals['residents'] ?? 0);
        $requests = (int) ($totals['requests'] ?? 0);
        $released = (int) ($totals['released'] ?? 0);
        $releaseRate = $requests > 0 ? round(($released / $requests) * 100) : 0;

        $summary = "The platform connects {$activeBarangays} active barangays out of {$barangays} total, "
            ."with {$residents} registered residents and {$requests} document requests system-wide. "
            ."Overall release rate is {$releaseRate}% ({$released} released).";

        $highlights = [];

        /** @var list<array{name: string, residents: int, requests: int}> $topBarangays */
        $topBarangays = $snapshot['top_barangays'] ?? [];
        if ($topBarangays !== []) {
            $leader = $topBarangays[0];
            $highlights[] = "Highest activity: {$leader['name']} with {$leader['requests']} requests.";
        }

        /** @var list<array{label: string, total: int}> $registrations */
        $registrations = $snapshot['monthly_registrations'] ?? [];
        $peakRegistration = collect($registrations)->sortByDesc('total')->first();
        if ($peakRegistration && ($peakRegistration['total'] ?? 0) > 0) {
            $highlights[] = "Peak resident registrations: {$peakRegistration['label']} ({$peakRegistration['total']}).";
        }

        /** @var list<array{name: string, total: int}> $trends */
        $trends = $snapshot['document_trends'] ?? [];
        if ($trends !== []) {
            $highlights[] = "Top document type platform-wide: {$trends[0]['name']} ({$trends[0]['total']} requests).";
        }

        $recentRegistrations = collect($registrations)->take(-3)->sum('total');
        if ($recentRegistrations > 0) {
            $highlights[] = "{$recentRegistrations} new residents registered in the last three months.";
        }

        if ($highlights === []) {
            $highlights[] = 'Platform usage is still ramping up — onboard more barangays and residents.';
        }

        return $this->payload($summary, $highlights, 'rules');
    }

    /**
     * @param  list<string>  $highlights
     * @return array{summary: string, highlights: list<string>, generated_at: string, source: string}
     */
    protected function payload(string $summary, array $highlights, string $source): array
    {
        return [
            'summary' => Str::of($summary)->squish()->toString(),
            'highlights' => array_values(array_slice($highlights, 0, 5)),
            'generated_at' => now()->toIso8601String(),
            'source' => $source,
        ];
    }
}
