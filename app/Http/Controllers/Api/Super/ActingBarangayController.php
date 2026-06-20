<?php

namespace App\Http\Controllers\Api\Super;

use App\Http\Controllers\Controller;
use App\Http\Resources\BarangayResource;
use App\Models\Barangay;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActingBarangayController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $barangayId = $request->session()->get('acting_barangay_id');

        if ($barangayId === null) {
            return response()->json(['data' => null]);
        }

        $barangay = Barangay::query()->find($barangayId);

        if ($barangay === null) {
            $request->session()->forget('acting_barangay_id');

            return response()->json(['data' => null]);
        }

        return response()->json([
            'data' => BarangayResource::make($barangay),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'barangay_id' => ['nullable', 'integer', 'exists:barangays,id'],
        ]);

        if ($validated['barangay_id'] === null) {
            $request->session()->forget('acting_barangay_id');
            $request->session()->forget('acting_resident_id');

            return response()->json(['data' => null]);
        }

        $barangay = Barangay::query()->findOrFail($validated['barangay_id']);

        $previousBarangayId = $request->session()->get('acting_barangay_id');
        if ($previousBarangayId !== $barangay->id) {
            $request->session()->forget('acting_resident_id');
        }

        $request->session()->put('acting_barangay_id', $barangay->id);

        return response()->json([
            'data' => BarangayResource::make($barangay),
        ]);
    }
}
