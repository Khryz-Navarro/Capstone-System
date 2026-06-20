<?php

namespace App\Http\Resources;

use App\Models\DocumentRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin DocumentRequest
 */
class DocumentRequestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference_number' => $this->reference_number,
            'certificate_number' => $this->certificate_number,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'purpose' => $this->purpose,
            'fee' => (float) $this->fee,
            'remarks' => $this->remarks,
            'has_pdf' => $this->pdf_path !== null,
            'document_type' => DocumentTypeResource::make($this->whenLoaded('documentType')),
            'resident' => UserResource::make($this->whenLoaded('resident')),
            'status_logs' => RequestStatusLogResource::collection($this->whenLoaded('statusLogs')),
            'approved_at' => $this->approved_at?->toIso8601String(),
            'generated_at' => $this->generated_at?->toIso8601String(),
            'released_at' => $this->released_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
