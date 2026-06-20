<?php

namespace App\Http\Controllers\Api\Staff;

use App\Enums\RequestStatus;
use App\Enums\UserRole;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Concerns\ResolvesBarangay;
use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentRequestResource;
use App\Models\DocumentRequest;
use App\Models\ResidentProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffDashboardController extends Controller
{
    use ResolvesBarangay;

    public function __invoke(Request $request): JsonResponse
    {
        $barangayId = $this->requireBarangayId($request);

        $statusCounts = DocumentRequest::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $recent = DocumentRequest::query()
            ->with(['documentType', 'resident.residentProfile'])
            ->latest()
            ->limit(8)
            ->get();

        return response()->json([
            'residents' => [
                'total' => User::where('barangay_id', $barangayId)->where('role', UserRole::Resident)->count(),
                'pending_verification' => ResidentProfile::where('verification_status', VerificationStatus::Pending)->count(),
            ],
            'requests' => [
                'total' => DocumentRequest::count(),
                'submitted' => (int) ($statusCounts[RequestStatus::Submitted->value] ?? 0),
                'approved' => (int) ($statusCounts[RequestStatus::Approved->value] ?? 0),
                'generated' => (int) ($statusCounts[RequestStatus::Generated->value] ?? 0),
                'ready_for_pickup' => (int) ($statusCounts[RequestStatus::ReadyForPickup->value] ?? 0),
                'released' => (int) ($statusCounts[RequestStatus::Released->value] ?? 0),
            ],
            'recent_requests' => DocumentRequestResource::collection($recent),
        ]);
    }
}
