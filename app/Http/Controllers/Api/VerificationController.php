<?php

namespace App\Http\Controllers\Api;

use App\Enums\RequestStatus;
use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use Illuminate\Http\JsonResponse;

class VerificationController extends Controller
{
    /**
     * Publicly verify the authenticity of an issued document by reference number.
     */
    public function show(string $reference): JsonResponse
    {
        $request = DocumentRequest::withoutGlobalScopes()
            ->where('reference_number', $reference)
            ->with(['documentType', 'resident.residentProfile', 'barangay'])
            ->first();

        $issuedStatuses = [
            RequestStatus::Generated->value,
            RequestStatus::ReadyForPickup->value,
            RequestStatus::Released->value,
        ];

        if ($request === null || ! in_array($request->status->value, $issuedStatuses, true)) {
            return response()->json([
                'valid' => false,
                'message' => 'No issued document matches this reference number.',
            ], 404);
        }

        return response()->json([
            'valid' => true,
            'reference_number' => $request->reference_number,
            'certificate_number' => $request->certificate_number,
            'document_type' => $request->documentType?->name,
            'resident_name' => $request->resident?->residentProfile?->fullName() ?? $request->resident?->name,
            'barangay' => $request->barangay?->name,
            'city' => $request->barangay?->city,
            'province' => $request->barangay?->province,
            'status' => $request->status->value,
            'status_label' => $request->status->label(),
            'issued_at' => $request->generated_at?->toIso8601String(),
        ]);
    }
}
