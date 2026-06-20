<?php

namespace App\Http\Controllers\Api;

use App\Enums\BarangayStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\BarangayResource;
use App\Models\Barangay;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BarangayController extends Controller
{
    /**
     * Publicly list active barangays for the registration barangay selector.
     */
    public function index(): AnonymousResourceCollection
    {
        $barangays = Barangay::query()
            ->where('status', BarangayStatus::Active)
            ->orderBy('name')
            ->get();

        return BarangayResource::collection($barangays);
    }
}
