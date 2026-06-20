<?php

namespace Database\Factories;

use App\Enums\CivilStatus;
use App\Enums\Gender;
use App\Enums\VerificationStatus;
use App\Models\ResidentProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ResidentProfile>
 */
class ResidentProfileFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'tenant_id' => fn (array $attributes) => User::find($attributes['user_id'])?->tenant_id,
            'barangay_id' => fn (array $attributes) => User::find($attributes['user_id'])?->barangay_id,
            'first_name' => fake()->firstName(),
            'middle_name' => fake()->lastName(),
            'last_name' => fake()->lastName(),
            'gender' => fake()->randomElement(Gender::cases()),
            'birthdate' => fake()->dateTimeBetween('-60 years', '-18 years')->format('Y-m-d'),
            'civil_status' => fake()->randomElement(CivilStatus::cases()),
            'occupation' => fake()->jobTitle(),
            'mobile_number' => fake()->numerify('09#########'),
            'house_number' => (string) fake()->numberBetween(1, 999),
            'street' => fake()->streetName(),
            'purok' => 'Purok '.fake()->numberBetween(1, 9),
            'sitio' => fake()->word(),
            'city' => 'Kidapawan City',
            'province' => 'Cotabato',
            'verification_status' => VerificationStatus::Pending,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'verification_status' => VerificationStatus::Approved,
            'verified_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'verification_status' => VerificationStatus::Rejected,
            'rejection_reason' => fake()->sentence(),
        ]);
    }
}
