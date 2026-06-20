<?php

use App\Models\Barangay;
use App\Models\User;

it('logs in with an email address', function () {
    $barangay = Barangay::factory()->create();
    User::factory()->forBarangay($barangay)->create([
        'email' => 'resident@example.com',
        'password' => 'password123',
    ]);

    $this->postJson('/api/auth/login', [
        'login' => 'resident@example.com',
        'password' => 'password123',
    ])->assertOk()->assertJsonPath('data.email', 'resident@example.com');
});

it('logs in with a username', function () {
    $barangay = Barangay::factory()->create();
    User::factory()->forBarangay($barangay)->create([
        'username' => 'resident01',
        'password' => 'password123',
    ]);

    $this->postJson('/api/auth/login', [
        'login' => 'resident01',
        'password' => 'password123',
    ])->assertOk()->assertJsonPath('data.username', 'resident01');
});

it('rejects invalid credentials', function () {
    $barangay = Barangay::factory()->create();
    User::factory()->forBarangay($barangay)->create([
        'email' => 'resident@example.com',
        'password' => 'password123',
    ]);

    $this->postJson('/api/auth/login', [
        'login' => 'resident@example.com',
        'password' => 'wrong-password',
    ])->assertStatus(422);
});

it('returns the authenticated user', function () {
    $barangay = Barangay::factory()->create();
    $user = User::factory()->forBarangay($barangay)->create();

    $this->actingAs($user)
        ->getJson('/api/user')
        ->assertOk()
        ->assertJsonPath('data.id', $user->id);
});

it('persists the session across requests like a browser refresh', function () {
    config([
        'sanctum.stateful' => ['127.0.0.1:8000', '127.0.0.1'],
        'session.domain' => null,
    ]);

    $barangay = Barangay::factory()->create();
    User::factory()->forBarangay($barangay)->create([
        'email' => 'resident@example.com',
        'password' => 'password123',
    ]);

    $statefulHeaders = [
        'Origin' => 'http://127.0.0.1:8000',
        'Referer' => 'http://127.0.0.1:8000/',
        'X-Requested-With' => 'XMLHttpRequest',
    ];

    $this->withHeaders($statefulHeaders)->get('/sanctum/csrf-cookie')->assertNoContent();

    $this->withHeaders($statefulHeaders)
        ->postJson('/api/auth/login', [
            'login' => 'resident@example.com',
            'password' => 'password123',
        ])
        ->assertOk()
        ->assertJsonPath('data.email', 'resident@example.com');

    $this->withHeaders($statefulHeaders)
        ->getJson('/api/user')
        ->assertOk()
        ->assertJsonPath('data.email', 'resident@example.com');
});
