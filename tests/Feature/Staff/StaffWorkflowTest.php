<?php

use App\Models\Barangay;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\ResidentProfile;
use App\Models\User;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Notification::fake();
    Storage::fake('local');

    $this->barangay = Barangay::factory()->create();
    $this->staff = User::factory()->forBarangay($this->barangay)->staff()->create();
    $this->staff->syncBarangayAssignments([$this->barangay->id]);
    $this->resident = User::factory()->forBarangay($this->barangay)->resident()->create();
    ResidentProfile::factory()->approved()->create([
        'user_id' => $this->resident->id,
        'tenant_id' => $this->barangay->tenant_id,
        'barangay_id' => $this->barangay->id,
    ]);
    $this->type = DocumentType::factory()->create([
        'barangay_id' => $this->barangay->id,
        'tenant_id' => $this->barangay->tenant_id,
    ]);
});

function makeRequest($test): DocumentRequest
{
    return DocumentRequest::factory()->create([
        'resident_id' => $test->resident->id,
        'tenant_id' => $test->barangay->tenant_id,
        'barangay_id' => $test->barangay->id,
        'document_type_id' => $test->type->id,
    ]);
}

it('blocks residents from staff routes', function () {
    $this->actingAs($this->resident)
        ->getJson('/api/staff/dashboard')
        ->assertForbidden();
});

it('lets staff approve and generate a certificate', function () {
    $request = makeRequest($this);

    $this->actingAs($this->staff)
        ->postJson("/api/staff/document-requests/{$request->id}/approve")
        ->assertOk()
        ->assertJsonPath('data.status', 'approved');

    $this->actingAs($this->staff)
        ->postJson("/api/staff/document-requests/{$request->id}/generate")
        ->assertOk()
        ->assertJsonPath('data.status', 'certificate_generated');

    $request->refresh();
    expect($request->certificate_number)->not->toBeNull();
    expect($request->pdf_path)->not->toBeNull();
    Storage::disk('local')->assertExists($request->pdf_path);
});

it('downloads a generated certificate pdf', function () {
    $request = makeRequest($this);

    $this->actingAs($this->staff)->postJson("/api/staff/document-requests/{$request->id}/approve")->assertOk();
    $this->actingAs($this->staff)->postJson("/api/staff/document-requests/{$request->id}/generate")->assertOk();

    $request->refresh();

    $this->actingAs($this->staff)
        ->get("/api/staff/document-requests/{$request->id}/download")
        ->assertOk()
        ->assertHeader('content-disposition');
});

it('previews a generated certificate inline', function () {
    $request = makeRequest($this);

    $this->actingAs($this->staff)->postJson("/api/staff/document-requests/{$request->id}/approve")->assertOk();
    $this->actingAs($this->staff)->postJson("/api/staff/document-requests/{$request->id}/generate")->assertOk();

    $this->actingAs($this->staff)
        ->get("/api/staff/document-requests/{$request->id}/download?inline=1")
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});

it('downloads a residency proof file', function () {
    $proof = \App\Models\ResidencyProof::factory()->create([
        'user_id' => $this->resident->id,
        'tenant_id' => $this->barangay->tenant_id,
        'barangay_id' => $this->barangay->id,
        'file_path' => 'residency-proofs/test-proof.pdf',
        'original_name' => 'valid-id.pdf',
    ]);

    Storage::disk('local')->put($proof->file_path, '%PDF-1.4 test');

    $this->actingAs($this->staff)
        ->get("/api/staff/residency-proofs/{$proof->id}/download")
        ->assertOk()
        ->assertHeader('content-disposition');

    $this->actingAs($this->staff)
        ->get("/api/staff/residency-proofs/{$proof->id}/download?inline=1")
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});

it('verifies an issued document publicly', function () {
    $request = makeRequest($this);

    $this->actingAs($this->staff)->postJson("/api/staff/document-requests/{$request->id}/approve")->assertOk();
    $this->actingAs($this->staff)->postJson("/api/staff/document-requests/{$request->id}/generate")->assertOk();

    $this->getJson("/api/verify/{$request->reference_number}")
        ->assertOk()
        ->assertJsonPath('valid', true)
        ->assertJsonPath('reference_number', $request->reference_number);
});

it('returns invalid for an unknown reference', function () {
    $this->getJson('/api/verify/UNKNOWN-REF')
        ->assertStatus(404)
        ->assertJsonPath('valid', false);
});

it('lists residents for staff in their barangay', function () {
    ResidentProfile::factory()->approved()->create([
        'user_id' => $this->resident->id,
        'tenant_id' => $this->barangay->tenant_id,
        'barangay_id' => $this->barangay->id,
    ]);

    $otherBarangay = Barangay::factory()->create();
    $otherResident = User::factory()->forBarangay($otherBarangay)->resident()->create();
    ResidentProfile::factory()->approved()->create([
        'user_id' => $otherResident->id,
        'tenant_id' => $otherBarangay->tenant_id,
        'barangay_id' => $otherBarangay->id,
    ]);

    $this->actingAs($this->staff)
        ->getJson('/api/staff/residents')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $this->resident->id);
});

it('lets an admin list residents in their barangay', function () {
    $admin = User::factory()->forBarangay($this->barangay)->barangayAdmin()->create();

    $this->actingAs($admin)
        ->getJson('/api/staff/residents')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $this->resident->id);
});

it('filters residents by verification status', function () {
    $pending = User::factory()->forBarangay($this->barangay)->resident()->create();
    ResidentProfile::factory()->create([
        'user_id' => $pending->id,
        'tenant_id' => $this->barangay->tenant_id,
        'barangay_id' => $this->barangay->id,
        'verification_status' => 'pending',
    ]);

    $this->actingAs($this->staff)
        ->getJson('/api/staff/residents?status=pending')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $pending->id);
});

it('approves a resident verification', function () {
    $pending = User::factory()->forBarangay($this->barangay)->resident()->create();
    ResidentProfile::factory()->create([
        'user_id' => $pending->id,
        'tenant_id' => $this->barangay->tenant_id,
        'barangay_id' => $this->barangay->id,
        'verification_status' => 'pending',
    ]);

    $this->actingAs($this->staff)
        ->postJson("/api/staff/residents/{$pending->id}/approve")
        ->assertOk();

    $this->assertDatabaseHas('resident_profiles', [
        'user_id' => $pending->id,
        'verification_status' => 'approved',
    ]);
});

it('lets staff resend email verification for an unverified resident', function () {
    Notification::fake();

    $resident = User::factory()->forBarangay($this->barangay)->resident()->unverified()->create();
    ResidentProfile::factory()->create([
        'user_id' => $resident->id,
        'tenant_id' => $this->barangay->tenant_id,
        'barangay_id' => $this->barangay->id,
    ]);

    $this->actingAs($this->staff)
        ->postJson("/api/staff/residents/{$resident->id}/resend-verification")
        ->assertOk()
        ->assertJsonPath('message', 'Verification link sent.');

    Notification::assertSentTo($resident, \Illuminate\Auth\Notifications\VerifyEmail::class);
});

it('lets an admin delete a resident account', function () {
    $admin = User::factory()->forBarangay($this->barangay)->barangayAdmin()->create();

    $this->actingAs($admin)
        ->deleteJson("/api/staff/residents/{$this->resident->id}")
        ->assertOk()
        ->assertJsonPath('message', 'Resident account removed.');

    $this->assertDatabaseMissing('users', ['id' => $this->resident->id]);
    $this->assertDatabaseMissing('resident_profiles', ['user_id' => $this->resident->id]);
});

it('blocks staff from deleting a resident account', function () {
    $this->actingAs($this->staff)
        ->deleteJson("/api/staff/residents/{$this->resident->id}")
        ->assertForbidden();
});

it('prevents staff from acting on another barangay request', function () {
    $otherBarangay = Barangay::factory()->create();
    $otherResident = User::factory()->forBarangay($otherBarangay)->resident()->create();
    $otherType = DocumentType::factory()->create([
        'barangay_id' => $otherBarangay->id,
        'tenant_id' => $otherBarangay->tenant_id,
    ]);
    $otherRequest = DocumentRequest::factory()->create([
        'resident_id' => $otherResident->id,
        'tenant_id' => $otherBarangay->tenant_id,
        'barangay_id' => $otherBarangay->id,
        'document_type_id' => $otherType->id,
    ]);

    $response = $this->actingAs($this->staff)
        ->postJson("/api/staff/document-requests/{$otherRequest->id}/approve");

    expect($response->status())->toBeIn([403, 404]);
});
