<?php

namespace Database\Factories;

use App\Models\StaffProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StaffProfile>
 */
class StaffProfileFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->staff(),
            'tenant_id' => fn (array $attributes) => User::find($attributes['user_id'])?->tenant_id,
            'barangay_id' => fn (array $attributes) => User::find($attributes['user_id'])?->barangay_id,
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'position' => fake()->randomElement(['Secretary', 'Clerk', 'Encoder', 'Treasurer']),
            'mobile_number' => fake()->numerify('09#########'),
            'is_active' => true,
        ];
    }
}
