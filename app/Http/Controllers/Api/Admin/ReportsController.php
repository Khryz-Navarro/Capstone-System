<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\ResolvesBarangay;
use App\Http\Controllers\Controller;
use App\Services\Reports\BarangayReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportsController extends Controller
{
    use ResolvesBarangay;

    public function __invoke(Request $request, BarangayReportService $reports): JsonResponse
    {
        return response()->json(
            $reports->build($this->requireBarangayId($request)),
        );
    }
}
