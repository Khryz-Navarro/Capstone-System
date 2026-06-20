<?php

namespace App\Services\Reports;

use App\Enums\RequestStatus;
use App\Enums\UserRole;
use App\Enums\VerificationStatus;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\ResidentProfile;
use App\Models\User;
use Illuminate\Support\Carbon;

class BarangayReportService
{
    /**
     * @return array{
     *     totals: array<string, int>,
     *     requests_by_status: list<array{status: string, label: string, total: int}>,
     *     requests_by_month: list<array{month: string, label: string, total: int}>,
     *     most_requested: list<array{name: string, total: int}>
     * }
     */
    public function build(int $barangayId): array
    {
        $statusCounts = DocumentRequest::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return [
            'totals' => [
                'residents' => User::where('barangay_id', $barangayId)->where('role', UserRole::Resident)->count(),
                'pending_verification' => ResidentProfile::where('verification_status', VerificationStatus::Pending)->count(),
                'staff' => User::where('barangay_id', $barangayId)
                    ->whereIn('role', [UserRole::BarangayAdmin, UserRole::BarangayStaff])
                    ->count(),
                'document_types' => DocumentType::count(),
                'requests' => DocumentRequest::count(),
                'released' => (int) ($statusCounts[RequestStatus::Released->value] ?? 0),
            ],
            'requests_by_status' => collect(RequestStatus::cases())->map(fn (RequestStatus $status) => [
                'status' => $status->value,
                'label' => $status->label(),
                'total' => (int) ($statusCounts[$status->value] ?? 0),
            ])->values()->all(),
            'requests_by_month' => $this->requestsByMonth(),
            'most_requested' => $this->mostRequested(),
        ];
    }

    /**
     * @return list<array{month: string, label: string, total: int}>
     */
    protected function requestsByMonth(): array
    {
        $start = Carbon::now()->startOfMonth()->subMonths(5);

        $counts = DocumentRequest::query()
            ->where('created_at', '>=', $start)
            ->get(['created_at'])
            ->groupBy(fn (DocumentRequest $request) => $request->created_at->format('Y-m'))
            ->map->count();

        $months = [];
        for ($i = 0; $i < 6; $i++) {
            $month = $start->copy()->addMonths($i);
            $key = $month->format('Y-m');
            $months[] = [
                'month' => $key,
                'label' => $month->format('M Y'),
                'total' => (int) ($counts[$key] ?? 0),
            ];
        }

        return $months;
    }

    /**
     * @return list<array{name: string, total: int}>
     */
    protected function mostRequested(): array
    {
        return DocumentType::query()
            ->withCount('requests')
            ->orderByDesc('requests_count')
            ->limit(5)
            ->get()
            ->map(fn (DocumentType $type) => [
                'name' => $type->name,
                'total' => (int) $type->requests_count,
            ])
            ->values()
            ->all();
    }
}
