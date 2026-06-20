<?php

namespace Database\Factories;

use App\Enums\BarangayStatus;
use App\Models\Barangay;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Barangay>
 */
class BarangayFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->streetName();

        return [
            'tenant_id' => Tenant::factory(),
            'name' => $name,
            'code' => strtoupper(Str::random(3)).'-'.fake()->unique()->numberBetween(1000, 9999),
            'region' => 'Region XII',
            'province' => 'Cotabato',
            'city' => 'Kidapawan City',
            'contact_number' => fake()->numerify('09#########'),
            'official_email' => fake()->unique()->companyEmail(),
            'captain' => fake()->name(),
            'status' => BarangayStatus::Active,
        ];
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => BarangayStatus::Suspended,
        ]);
    }
}
