<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Barangay;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'barangay_id' => Barangay::factory(),
            'name' => fake()->name(),
            'username' => fake()->unique()->userName(),
            'role' => UserRole::Resident,
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->numerify('09#########'),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function superAdmin(): static
    {
        return $this->state(fn (array $attributes) => [
            'tenant_id' => null,
            'barangay_id' => null,
            'role' => UserRole::SuperAdmin,
        ]);
    }

    public function barangayAdmin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::BarangayAdmin,
        ]);
    }

    public function staff(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::BarangayStaff,
        ]);
    }

    public function resident(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::Resident,
        ]);
    }

    /**
     * Assign the user to an existing barangay (and its tenant).
     */
    public function forBarangay(Barangay $barangay): static
    {
        return $this->state(fn (array $attributes) => [
            'tenant_id' => $barangay->tenant_id,
            'barangay_id' => $barangay->id,
        ]);
    }
}
