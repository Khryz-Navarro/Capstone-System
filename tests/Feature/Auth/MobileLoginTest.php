<?php

use App\Models\Barangay;
use App\Models\User;

it('issues a sanctum token for mobile authentication', function () {
    $barangay = Barangay::factory()->create();
    User::factory()->forBarangay($barangay)->create([
        'email' => 'mobile@example.com',
        'password' => 'password123',
    ]);

    $response = $this->postJson('/api/mobile/login', [
        'login' => 'mobile@example.com',
        'password' => 'password123',
        'device_name' => 'expo-test',
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('data.email', 'mobile@example.com')
        ->assertJsonPath('data.token', fn ($token) => filled($token));
});
