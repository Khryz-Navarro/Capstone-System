<?php

namespace App\Services;

use App\Enums\RequestStatus;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\RequestRequirement;
use App\Models\RequestStatusLog;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DocumentRequestService
{
    /**
     * Create a new document request for a resident and log the initial status.
     *
     * @param  array<int, UploadedFile>  $supportingDocuments
     */
    public function submit(
        User $resident,
        DocumentType $type,
        ?string $purpose,
        ?UploadedFile $idPhoto = null,
        array $supportingDocuments = [],
    ): DocumentRequest {
        return DB::transaction(function () use ($resident, $type, $purpose, $idPhoto, $supportingDocuments): DocumentRequest {
            $request = DocumentRequest::create([
                'tenant_id' => $resident->tenant_id,
                'barangay_id' => $resident->barangay_id,
                'resident_id' => $resident->id,
                'document_type_id' => $type->id,
                'reference_number' => $this->generateReferenceNumber(),
                'status' => RequestStatus::Submitted,
                'purpose' => $purpose,
                'fee' => $type->fee,
            ]);

            $this->logStatus($request, null, RequestStatus::Submitted, $resident, 'Request submitted by resident.');

            if ($idPhoto !== null) {
                $this->storeRequirement($request, $idPhoto, 'id_photo');
            }

            foreach ($supportingDocuments as $file) {
                $this->storeRequirement($request, $file, 'supporting_document');
            }

            return $request;
        });
    }

    /**
     * Transition a request to a new status, recording the change in the log.
     */
    public function transition(DocumentRequest $request, RequestStatus $to, ?User $actor = null, ?string $remarks = null): DocumentRequest
    {
        return DB::transaction(function () use ($request, $to, $actor, $remarks): DocumentRequest {
            $from = $request->status;

            $attributes = ['status' => $to];

            $attributes += match ($to) {
                RequestStatus::Approved => ['approved_at' => now(), 'processed_by' => $actor?->id],
                RequestStatus::Generated => ['generated_at' => now()],
                RequestStatus::Released => ['released_at' => now(), 'issued_at' => $request->issued_at ?? now()],
                default => [],
            };

            if ($remarks !== null) {
                $attributes['remarks'] = $remarks;
            }

            $request->update($attributes);

            $this->logStatus($request, $from, $to, $actor, $remarks);

            return $request->refresh();
        });
    }

    public function logStatus(DocumentRequest $request, ?RequestStatus $from, RequestStatus $to, ?User $actor, ?string $remarks): void
    {
        RequestStatusLog::create([
            'tenant_id' => $request->tenant_id,
            'barangay_id' => $request->barangay_id,
            'document_request_id' => $request->id,
            'from_status' => $from,
            'to_status' => $to,
            'actor_id' => $actor?->id,
            'remarks' => $remarks,
        ]);
    }

    protected function generateReferenceNumber(): string
    {
        do {
            $reference = 'REQ-'.now()->format('Y').'-'.strtoupper(Str::random(8));
        } while (DocumentRequest::withoutGlobalScopes()->where('reference_number', $reference)->exists());

        return $reference;
    }

    protected function storeRequirement(DocumentRequest $request, UploadedFile $file, string $type): void
    {
        $path = $file->store("document-requests/{$request->id}/requirements/{$type}", 'local');

        RequestRequirement::create([
            'tenant_id' => $request->tenant_id,
            'barangay_id' => $request->barangay_id,
            'document_request_id' => $request->id,
            'type' => $type,
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType() ?? $file->getMimeType() ?? 'application/octet-stream',
            'size' => $file->getSize() ?? 0,
        ]);
    }
}
