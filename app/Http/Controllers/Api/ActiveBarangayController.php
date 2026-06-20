<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BarangayResource;
use App\Models\Barangay;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActiveBarangayController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null && $user->role->isStaffLevel() && ! $user->isSuperAdmin(), 403);

        $barangayId = $user->activeBarangayId();

        if ($barangayId === null) {
            return response()->json(['data' => null]);
        }

        if (! $user->isAssignedToBarangay($barangayId)) {
            $request->session()->forget('active_barangay_id');

            return response()->json(['data' => null]);
        }

        $barangay = Barangay::query()->find($barangayId);

        if ($barangay === null) {
            $request->session()->forget('active_barangay_id');

            return response()->json(['data' => null]);
        }

        return response()->json([
            'data' => BarangayResource::make($barangay),
        ]);
    }

    public function options(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null && $user->role->isStaffLevel() && ! $user->isSuperAdmin(), 403);

        $barangays = $user->assignedBarangays()->orderBy('name')->get();

        return response()->json([
            'data' => BarangayResource::collection($barangays),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null && $user->role->isStaffLevel() && ! $user->isSuperAdmin(), 403);

        $validated = $request->validate([
            'barangay_id' => ['nullable', 'integer', 'exists:barangays,id'],
        ]);

        if ($validated['barangay_id'] === null) {
            $request->session()->forget('active_barangay_id');

            return response()->json(['data' => null]);
        }

        abort_unless($user->isAssignedToBarangay((int) $validated['barangay_id']), 422, 'You are not assigned to this barangay.');

        $barangay = Barangay::query()->findOrFail($validated['barangay_id']);

        $request->session()->put('active_barangay_id', $barangay->id);

        return response()->json([
            'data' => BarangayResource::make($barangay),
        ]);
    }
}
