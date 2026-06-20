<?php

namespace App\Http\Resources;

use App\Models\DocumentTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin DocumentTemplate
 */
class DocumentTemplateResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'document_type_id' => $this->document_type_id,
            'name' => $this->name,
            'body' => $this->body,
            'is_default' => $this->is_default,
            'document_type' => new DocumentTypeResource($this->whenLoaded('documentType')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
