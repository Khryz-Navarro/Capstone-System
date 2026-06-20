<?php

namespace App\Http\Resources;

use App\Models\DocumentType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin DocumentType
 */
class DocumentTypeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'fee' => (float) $this->fee,
            'requires_purpose' => $this->requires_purpose,
            'is_active' => $this->is_active,
            'requests_count' => $this->whenCounted('requests'),
        ];
    }
}
