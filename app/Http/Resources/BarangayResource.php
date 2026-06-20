<?php

namespace App\Http\Resources;

use App\Models\Barangay;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Barangay
 */
class BarangayResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'region' => $this->region,
            'province' => $this->province,
            'city' => $this->city,
            'contact_number' => $this->contact_number,
            'official_email' => $this->official_email,
            'captain' => $this->captain,
            'status' => $this->status->value,
            'tenant' => $this->whenLoaded('tenant', fn () => [
                'id' => $this->tenant->id,
                'name' => $this->tenant->name,
                'status' => $this->tenant->status->value,
            ]),
            'residents_count' => $this->whenCounted('residents'),
            'staff_count' => $this->whenCounted('staff'),
            'requests_count' => $this->whenCounted('documentRequests'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
