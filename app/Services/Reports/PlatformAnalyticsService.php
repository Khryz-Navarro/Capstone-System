<?php

namespace App\Services\Reports;

use App\Enums\BarangayStatus;
use App\Enums\RequestStatus;
use App\Enums\UserRole;
use App\Models\Barangay;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Carbon;

class PlatformAnalyticsService
{
    /**
     * @return array{
     *     totals: array<string, int>,
     *     top_barangays: list<array{name: string, residents: int, requests: int}>,
     *     monthly_registrations: list<array{month: string, label: string, total: int}>,
     *     document_trends: list<array{name: string, total: int}>
     * }
     */
    public function build(): array
    {
        return [
            'totals' => [
                'barangays' => Barangay::count(),
                'active_barangays' => Barangay::where('status', BarangayStatus::Active)->count(),
                'tenants' => Tenant::count(),
                'residents' => User::where('role', UserRole::Resident)->count(),
                'staff' => User::whereIn('role', [UserRole::BarangayAdmin, UserRole::BarangayStaff])->count(),
                'requests' => DocumentRequest::count(),
                'released' => DocumentRequest::where('status', RequestStatus::Released)->count(),
            ],
            'top_barangays' => $this->topBarangays(),
            'monthly_registrations' => $this->monthlyRegistrations(),
            'document_trends' => $this->documentTrends(),
        ];
    }

    /**
     * @return list<array{name: string, residents: int, requests: int}>
     */
    protected function topBarangays(): array
    {
        return Barangay::query()
            ->withCount([
                'users as residents_count' => fn ($query) => $query->where('role', UserRole::Resident),
                'documentRequests as requests_count',
            ])
            ->orderByDesc('requests_count')
            ->limit(8)
            ->get()
            ->map(fn (Barangay $barangay) => [
                'name' => $barangay->name,
                'residents' => (int) $barangay->residents_count,
                'requests' => (int) $barangay->requests_count,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{month: string, label: string, total: int}>
     */
    protected function monthlyRegistrations(): array
    {
        $start = Carbon::now()->startOfMonth()->subMonths(5);

        $counts = User::query()
            ->where('role', UserRole::Resident)
            ->where('created_at', '>=', $start)
            ->get(['created_at'])
            ->groupBy(fn (User $user) => $user->created_at->format('Y-m'))
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
    protected function documentTrends(): array
    {
        return DocumentType::query()
            ->withCount('requests')
            ->get()
            ->groupBy('name')
            ->map(fn ($group) => $group->sum('requests_count'))
            ->sortDesc()
            ->take(6)
            ->map(fn (int $total, string $name) => ['name' => $name, 'total' => $total])
            ->values()
            ->all();
    }
}
