<?php

namespace Database\Factories;

use App\Enums\ProofType;
use App\Enums\VerificationStatus;
use App\Models\ResidencyProof;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ResidencyProof>
 */
class ResidencyProofFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'tenant_id' => fn (array $attributes) => User::find($attributes['user_id'])?->tenant_id,
            'barangay_id' => fn (array $attributes) => User::find($attributes['user_id'])?->barangay_id,
            'type' => fake()->randomElement(ProofType::cases()),
            'file_path' => 'residency-proofs/'.fake()->uuid().'.pdf',
            'original_name' => fake()->word().'.pdf',
            'mime_type' => 'application/pdf',
            'size' => fake()->numberBetween(10000, 5000000),
            'status' => VerificationStatus::Pending,
        ];
    }
}
