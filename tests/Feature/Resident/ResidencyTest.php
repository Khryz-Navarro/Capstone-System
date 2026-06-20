<?php

use App\Models\Barangay;
use App\Models\ResidentProfile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('accepts a residency proof upload', function () {
    Storage::fake('local');

    $barangay = Barangay::factory()->create();
    $resident = User::factory()->forBarangay($barangay)->resident()->create();
    ResidentProfile::factory()->create([
        'user_id' => $resident->id,
        'tenant_id' => $barangay->tenant_id,
        'barangay_id' => $barangay->id,
        'verification_status' => 'pending',
    ]);

    $this->actingAs($resident)
        ->postJson('/api/residency/upload', [
            'type' => 'government_id',
            'file' => UploadedFile::fake()->create('id.pdf', 200, 'application/pdf'),
        ])
        ->assertCreated()
        ->assertJsonPath('data.status', 'pending');

    $this->assertDatabaseHas('residency_proofs', [
        'user_id' => $resident->id,
        'type' => 'government_id',
        'tenant_id' => $barangay->tenant_id,
    ]);
});

it('rejects an oversized residency proof', function () {
    Storage::fake('local');

    $barangay = Barangay::factory()->create();
    $resident = User::factory()->forBarangay($barangay)->resident()->create();

    $this->actingAs($resident)
        ->postJson('/api/residency/upload', [
            'type' => 'government_id',
            'file' => UploadedFile::fake()->create('id.pdf', 11000, 'application/pdf'),
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('file');
});
