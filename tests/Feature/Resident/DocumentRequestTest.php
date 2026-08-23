<?php

use App\Models\Barangay;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\ResidentProfile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

function makeResident(Barangay $barangay, string $verification = 'approved'): User
{
    $user = User::factory()->forBarangay($barangay)->resident()->create();
    ResidentProfile::factory()->create([
        'user_id' => $user->id,
        'tenant_id' => $barangay->tenant_id,
        'barangay_id' => $barangay->id,
        'verification_status' => $verification,
        'verified_at' => $verification === 'approved' ? now() : null,
    ]);

    return $user->fresh();
}

it('lets an approved resident submit a document request', function () {
    $barangay = Barangay::factory()->create();
    $resident = makeResident($barangay, 'approved');
    $type = DocumentType::factory()->create([
        'barangay_id' => $barangay->id,
        'tenant_id' => $barangay->tenant_id,
    ]);

    $this->actingAs($resident)
        ->postJson('/api/document-requests', [
            'document_type_id' => $type->id,
            'purpose' => 'Employment',
        ])
        ->assertCreated()
        ->assertJsonPath('data.status', 'submitted');

    $this->assertDatabaseHas('document_requests', [
        'resident_id' => $resident->id,
        'document_type_id' => $type->id,
        'tenant_id' => $barangay->tenant_id,
        'status' => 'submitted',
    ]);

    $this->assertDatabaseCount('request_status_logs', 1);
});

it('blocks a resident with pending residency from requesting documents', function () {
    $barangay = Barangay::factory()->create();
    $resident = makeResident($barangay, 'pending');
    $type = DocumentType::factory()->create([
        'barangay_id' => $barangay->id,
        'tenant_id' => $barangay->tenant_id,
    ]);

    $this->actingAs($resident)
        ->postJson('/api/document-requests', [
            'document_type_id' => $type->id,
            'purpose' => 'Employment',
        ])
        ->assertForbidden();
});

it('lists only the resident own requests', function () {
    $barangay = Barangay::factory()->create();
    $resident = makeResident($barangay, 'approved');
    $type = DocumentType::factory()->create([
        'barangay_id' => $barangay->id,
        'tenant_id' => $barangay->tenant_id,
    ]);

    $other = makeResident($barangay, 'approved');

    $this->actingAs($resident)->postJson('/api/document-requests', [
        'document_type_id' => $type->id,
        'purpose' => 'Mine',
    ])->assertCreated();

    $this->actingAs($other)->postJson('/api/document-requests', [
        'document_type_id' => $type->id,
        'purpose' => 'Theirs',
    ])->assertCreated();

    $this->actingAs($resident)
        ->getJson('/api/document-requests')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

it('lets a resident download their generated certificate', function () {
    Storage::fake('local');

    $barangay = Barangay::factory()->create();
    $resident = makeResident($barangay, 'approved');
    $type = DocumentType::factory()->create([
        'barangay_id' => $barangay->id,
        'tenant_id' => $barangay->tenant_id,
    ]);

    $request = DocumentRequest::factory()->create([
        'resident_id' => $resident->id,
        'tenant_id' => $barangay->tenant_id,
        'barangay_id' => $barangay->id,
        'document_type_id' => $type->id,
        'status' => 'certificate_generated',
        'pdf_path' => 'certificates/test.pdf',
    ]);

    Storage::disk('local')->put($request->pdf_path, '%PDF-1.4 test');

    $this->actingAs($resident)
        ->get("/api/document-requests/{$request->id}/download")
        ->assertOk()
        ->assertHeader('content-disposition');
});

it('stores uploaded requirement files for a resident document request', function () {
    Storage::fake('local');

    $barangay = Barangay::factory()->create();
    $resident = makeResident($barangay, 'approved');
    $type = DocumentType::factory()->create([
        'barangay_id' => $barangay->id,
        'tenant_id' => $barangay->tenant_id,
    ]);

    $response = $this->actingAs($resident)->post('/api/document-requests', [
        'document_type_id' => $type->id,
        'purpose' => 'Employment',
        'id_photo' => UploadedFile::fake()->image('id-photo.jpg'),
        'requirements' => [
            UploadedFile::fake()->image('utility-bill.jpg'),
            UploadedFile::fake()->create('referral.pdf', 120, 'application/pdf'),
        ],
        'notification_channels' => ['email', 'sms'],
    ], ['Accept' => 'application/json']);

    $response->assertCreated();

    $requestId = $response->json('data.id');

    $this->assertDatabaseHas('request_requirements', [
        'document_request_id' => $requestId,
        'type' => 'id_photo',
    ]);

    $this->assertDatabaseHas('request_requirements', [
        'document_request_id' => $requestId,
        'type' => 'supporting_document',
        'original_name' => 'utility-bill.jpg',
    ]);

    $this->assertDatabaseCount('request_requirements', 3);
});
