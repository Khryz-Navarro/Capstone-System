<?php

namespace App\Http\Resources;

use App\Models\RequestStatusLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin RequestStatusLog
 */
class RequestStatusLogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'from_status' => $this->from_status?->value,
            'to_status' => $this->to_status->value,
            'to_status_label' => $this->to_status->label(),
            'remarks' => $this->remarks,
            'actor' => $this->whenLoaded('actor', fn () => [
                'id' => $this->actor?->id,
                'name' => $this->actor?->name,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
