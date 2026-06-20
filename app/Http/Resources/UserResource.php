<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role->value,
            'role_label' => $this->role->label(),
            'tenant_id' => $this->tenant_id,
            'barangay_id' => $this->barangay_id,
            'email_verified' => $this->hasVerifiedEmail(),
            'barangay' => new BarangayResource($this->whenLoaded('barangay')),
            'assigned_barangays' => BarangayResource::collection($this->whenLoaded('assignedBarangays')),
            'has_multiple_barangay_assignments' => $this->when(
                $this->role->isStaffLevel(),
                fn () => $this->relationLoaded('assignedBarangays')
                    ? $this->assignedBarangays->count() > 1
                    : $this->assignedBarangays()->count() > 1,
            ),
            'resident_profile' => new ResidentProfileResource($this->whenLoaded('residentProfile')),
            'staff_profile' => new StaffProfileResource($this->whenLoaded('staffProfile')),
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
