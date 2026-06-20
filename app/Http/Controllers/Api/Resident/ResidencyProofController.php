<?php

namespace App\Http\Controllers\Api\Resident;

use App\Enums\VerificationStatus;
use App\Http\Controllers\Concerns\ResolvesActingResident;
use App\Http\Controllers\Controller;
use App\Http\Requests\Resident\StoreResidencyProofRequest;
use App\Http\Resources\ResidencyProofResource;
use App\Models\ResidencyProof;
use App\Support\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ResidencyProofController extends Controller
{
    use ResolvesActingResident;

    public function index(Request $request): AnonymousResourceCollection
    {
        $resident = $this->requireEffectiveResident($request);

        $proofs = ResidencyProof::query()
            ->where('user_id', $resident->id)
            ->latest()
            ->get();

        return ResidencyProofResource::collection($proofs);
    }

    public function store(StoreResidencyProofRequest $request, AuditLogger $audit): JsonResponse
    {
        $resident = $this->requireEffectiveResident($request);
        $file = $request->file('file');

        $path = $file->store("residency-proofs/{$resident->id}", 'local');

        $proof = ResidencyProof::create([
            'user_id' => $resident->id,
            'type' => $request->input('type'),
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
            'status' => VerificationStatus::Pending,
        ]);

        $profile = $resident->residentProfile;
        if ($profile !== null && $profile->verification_status === VerificationStatus::Rejected) {
            $profile->update([
                'verification_status' => VerificationStatus::Pending,
                'rejection_reason' => null,
            ]);
        }

        $audit->log('residency.proof_uploaded', $request->user(), 'Uploaded residency proof', [
            'proof_id' => $proof->id,
            'type' => $proof->type->value,
            'resident_id' => $resident->id,
        ]);

        return ResidencyProofResource::make($proof)
            ->response()
            ->setStatusCode(201);
    }
}
