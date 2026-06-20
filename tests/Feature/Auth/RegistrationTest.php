<?php

use App\Models\Barangay;
use App\Models\User;

it('registers a resident with a profile', function () {
    $barangay = Barangay::factory()->create();

    $response = $this->postJson('/api/auth/register', [
        'barangay_id' => $barangay->id,
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'gender' => 'male',
        'birthdate' => '1990-01-01',
        'civil_status' => 'single',
        'mobile_number' => '09171234567',
        'city' => 'Kidapawan City',
        'province' => 'Cotabato',
        'email' => 'juan@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.email', 'juan@example.com')
        ->assertJsonPath('data.role', 'resident');

    $this->assertDatabaseHas('users', [
        'email' => 'juan@example.com',
        'tenant_id' => $barangay->tenant_id,
        'barangay_id' => $barangay->id,
        'role' => 'resident',
    ]);

    $user = User::where('email', 'juan@example.com')->first();

    $this->assertDatabaseHas('resident_profiles', [
        'user_id' => $user->id,
        'verification_status' => 'pending',
    ]);
});

it('rejects registration into a suspended barangay', function () {
    $barangay = Barangay::factory()->suspended()->create();

    $this->postJson('/api/auth/register', [
        'barangay_id' => $barangay->id,
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'gender' => 'male',
        'birthdate' => '1990-01-01',
        'civil_status' => 'single',
        'mobile_number' => '09171234567',
        'city' => 'Kidapawan City',
        'province' => 'Cotabato',
        'email' => 'juan@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertStatus(422);
});

it('requires a unique email', function () {
    $barangay = Barangay::factory()->create();
    User::factory()->forBarangay($barangay)->create(['email' => 'taken@example.com']);

    $this->postJson('/api/auth/register', [
        'barangay_id' => $barangay->id,
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'gender' => 'male',
        'birthdate' => '1990-01-01',
        'civil_status' => 'single',
        'mobile_number' => '09171234567',
        'city' => 'Kidapawan City',
        'province' => 'Cotabato',
        'email' => 'taken@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertStatus(422)->assertJsonValidationErrorFor('email');
});
