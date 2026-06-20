<?php

namespace Database\Factories;

use App\Enums\RequestStatus;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<DocumentRequest>
 */
class DocumentRequestFactory extends Factory
{
    public function definition(): array
    {
        return [
            'resident_id' => User::factory(),
            'tenant_id' => fn (array $attributes) => User::find($attributes['resident_id'])?->tenant_id,
            'barangay_id' => fn (array $attributes) => User::find($attributes['resident_id'])?->barangay_id,
            'document_type_id' => DocumentType::factory(),
            'reference_number' => 'REQ-'.strtoupper(Str::random(10)),
            'status' => RequestStatus::Submitted,
            'purpose' => fake()->sentence(),
            'fee' => fake()->randomElement([0, 50, 100]),
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RequestStatus::Approved,
            'approved_at' => now(),
        ]);
    }

    public function released(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RequestStatus::Released,
            'released_at' => now(),
        ]);
    }
}
