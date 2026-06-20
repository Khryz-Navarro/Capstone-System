<?php

namespace App\Http\Resources;

use App\Models\ResidentProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ResidentProfile
 */
class ResidentProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'suffix' => $this->suffix,
            'full_name' => $this->fullName(),
            'gender' => $this->gender?->value,
            'birthdate' => $this->birthdate?->toDateString(),
            'civil_status' => $this->civil_status?->value,
            'occupation' => $this->occupation,
            'mobile_number' => $this->mobile_number,
            'address' => [
                'house_number' => $this->house_number,
                'street' => $this->street,
                'purok' => $this->purok,
                'sitio' => $this->sitio,
                'city' => $this->city,
                'province' => $this->province,
            ],
            'verification_status' => $this->verification_status->value,
            'verified_at' => $this->verified_at?->toIso8601String(),
            'rejection_reason' => $this->rejection_reason,
        ];
    }
}
