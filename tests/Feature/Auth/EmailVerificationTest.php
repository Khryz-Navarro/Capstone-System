<?php

use App\Models\Barangay;
use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Notification;

it('lets an unverified resident resend the verification email', function () {
    Notification::fake();

    $barangay = Barangay::factory()->create();
    $user = User::factory()->forBarangay($barangay)->resident()->unverified()->create();

    $this->actingAs($user)
        ->postJson('/api/auth/email/verification-notification')
        ->assertOk()
        ->assertJsonPath('message', 'Verification link sent.');

    Notification::assertSentTo($user, VerifyEmail::class);
});

it('does not resend when the resident email is already verified', function () {
    Notification::fake();

    $barangay = Barangay::factory()->create();
    $user = User::factory()->forBarangay($barangay)->resident()->create();

    $this->actingAs($user)
        ->postJson('/api/auth/email/verification-notification')
        ->assertOk()
        ->assertJsonPath('message', 'Email already verified.');

    Notification::assertNothingSent();
});

it('requires authentication to resend verification email', function () {
    $this->postJson('/api/auth/email/verification-notification')->assertUnauthorized();
});
