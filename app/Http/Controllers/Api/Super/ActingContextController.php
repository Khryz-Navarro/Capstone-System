<?php

namespace App\Http\Controllers\Api\Super;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActingContextController extends Controller
{
    public function destroy(Request $request): JsonResponse
    {
        $request->session()->forget([
            'acting_barangay_id',
            'acting_resident_id',
        ]);

        return response()->json([
            'message' => 'Acting context cleared.',
            'data' => [
                'acting_barangay' => null,
                'acting_resident' => null,
            ],
        ]);
    }
}
