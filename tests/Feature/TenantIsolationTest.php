<?php

use App\Models\Barangay;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\ResidentProfile;
use App\Models\User;

it('prevents a resident from viewing another barangay request', function () {
    $barangayA = Barangay::factory()->create();
    $barangayB = Barangay::factory()->create();

    $residentA = User::factory()->forBarangay($barangayA)->resident()->create();
    ResidentProfile::factory()->approved()->create([
        'user_id' => $residentA->id,
        'tenant_id' => $barangayA->tenant_id,
        'barangay_id' => $barangayA->id,
    ]);

    $residentB = User::factory()->forBarangay($barangayB)->resident()->create();
    $typeB = DocumentType::factory()->create([
        'barangay_id' => $barangayB->id,
        'tenant_id' => $barangayB->tenant_id,
    ]);
    $requestB = DocumentRequest::factory()->create([
        'resident_id' => $residentB->id,
        'tenant_id' => $barangayB->tenant_id,
        'barangay_id' => $barangayB->id,
        'document_type_id' => $typeB->id,
    ]);

    $response = $this->actingAs($residentA)->getJson("/api/document-requests/{$requestB->id}");

    expect($response->status())->toBeIn([403, 404]);
});

it('scopes document type listing to the resident barangay', function () {
    $barangayA = Barangay::factory()->create();
    $barangayB = Barangay::factory()->create();

    DocumentType::factory()->create(['barangay_id' => $barangayA->id, 'tenant_id' => $barangayA->tenant_id]);
    DocumentType::factory()->create(['barangay_id' => $barangayB->id, 'tenant_id' => $barangayB->tenant_id]);

    $residentA = User::factory()->forBarangay($barangayA)->resident()->create();
    ResidentProfile::factory()->approved()->create([
        'user_id' => $residentA->id,
        'tenant_id' => $barangayA->tenant_id,
        'barangay_id' => $barangayA->id,
    ]);

    $this->actingAs($residentA)
        ->getJson('/api/document-types')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});
