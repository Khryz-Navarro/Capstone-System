<?php

namespace App\Http\Controllers\Api\Super;

use App\Http\Controllers\Controller;
use App\Services\Reports\PlatformAnalyticsService;
use Illuminate\Http\JsonResponse;

class AnalyticsController extends Controller
{
    public function __invoke(PlatformAnalyticsService $analytics): JsonResponse
    {
        return response()->json($analytics->build());
    }
}
