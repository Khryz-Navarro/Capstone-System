<?php

namespace App\Http\Controllers\Api\Super;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActingResidentController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $resident = $request->user()?->effectiveResident();

        return response()->json([
            'data' => $resident !== null ? UserResource::make($resident) : null,
        ]);
    }

    public function options(Request $request): JsonResponse
    {
        $barangayId = $request->user()?->effectiveBarangayId();
        abort_if($barangayId === null, 422, 'Select a barangay first.');

        $residents = User::query()
            ->where('barangay_id', $barangayId)
            ->where('role', UserRole::Resident)
            ->with('residentProfile')
            ->orderBy('name')
            ->limit(100)
            ->get();

        return response()->json([
            'data' => $residents->map(fn (User $resident) => [
                'id' => $resident->id,
                'name' => $resident->residentProfile?->full_name ?? $resident->name,
                'email' => $resident->email,
            ])->values(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'resident_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        if ($validated['resident_id'] === null) {
            $request->session()->forget('acting_resident_id');

            return response()->json(['data' => null]);
        }

        $barangayId = $request->user()?->effectiveBarangayId();
        abort_if($barangayId === null, 422, 'Select a barangay first.');

        $resident = User::query()
            ->where('id', $validated['resident_id'])
            ->where('role', UserRole::Resident)
            ->where('barangay_id', $barangayId)
            ->with(['barangay', 'residentProfile'])
            ->firstOrFail();

        $request->session()->put('acting_resident_id', $resident->id);

        return response()->json([
            'data' => UserResource::make($resident),
        ]);
    }
}
