<?php

use App\Models\Barangay;
use App\Models\DocumentType;
use App\Models\StaffProfile;
use App\Models\User;

beforeEach(function () {
    $this->barangay = Barangay::factory()->create();
    $this->admin = User::factory()->forBarangay($this->barangay)->barangayAdmin()->create();
    StaffProfile::factory()->create([
        'user_id' => $this->admin->id,
        'tenant_id' => $this->barangay->tenant_id,
        'barangay_id' => $this->barangay->id,
    ]);

    $this->admin->syncBarangayAssignments([$this->barangay->id]);
});

it('blocks staff from admin routes', function () {
    $staff = User::factory()->forBarangay($this->barangay)->staff()->create();

    $this->actingAs($staff)
        ->getJson('/api/admin/reports')
        ->assertForbidden();
});

it('lets an admin create a staff account', function () {
    $payload = [
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'position' => 'Secretary',
        'mobile_number' => '09171234567',
        'email' => 'maria@brgy.test',
        'username' => 'maria_santos',
        'role' => 'barangay_staff',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ];

    $this->actingAs($this->admin)
        ->postJson('/api/admin/staff', $payload)
        ->assertCreated()
        ->assertJsonPath('data.staff_profile.full_name', 'Maria Santos');

    $this->assertDatabaseHas('users', [
        'email' => 'maria@brgy.test',
        'barangay_id' => $this->barangay->id,
        'role' => 'barangay_staff',
    ]);
});

it('lets an admin manage document types', function () {
    $createResponse = $this->actingAs($this->admin)->postJson('/api/admin/document-types', [
        'name' => 'Barangay Clearance',
        'description' => 'For employment',
        'fee' => 50,
        'requires_purpose' => true,
        'is_active' => true,
    ]);

    $createResponse->assertCreated()->assertJsonPath('data.slug', 'barangay-clearance');
    $typeId = $createResponse->json('data.id');

    $this->actingAs($this->admin)
        ->putJson("/api/admin/document-types/{$typeId}", [
            'name' => 'Barangay Clearance',
            'description' => 'Updated',
            'fee' => 75,
            'requires_purpose' => false,
            'is_active' => true,
        ])
        ->assertOk()
        ->assertJsonPath('data.fee', 75);

    $this->actingAs($this->admin)
        ->deleteJson("/api/admin/document-types/{$typeId}")
        ->assertOk();

    $this->assertDatabaseMissing('document_types', ['id' => $typeId]);
});

it('manages templates and keeps a single default per type', function () {
    $type = DocumentType::factory()->create([
        'barangay_id' => $this->barangay->id,
        'tenant_id' => $this->barangay->tenant_id,
    ]);

    $first = $this->actingAs($this->admin)->postJson('/api/admin/document-templates', [
        'document_type_id' => $type->id,
        'name' => 'Default body',
        'body' => 'This certifies that {{name}}...',
        'is_default' => true,
    ])->assertCreated()->json('data.id');

    $this->actingAs($this->admin)->postJson('/api/admin/document-templates', [
        'document_type_id' => $type->id,
        'name' => 'Alternative body',
        'body' => 'Alt body',
        'is_default' => true,
    ])->assertCreated();

    $this->assertDatabaseHas('document_templates', ['id' => $first, 'is_default' => false]);
});

it('returns report metrics', function () {
    DocumentType::factory()->count(2)->create([
        'barangay_id' => $this->barangay->id,
        'tenant_id' => $this->barangay->tenant_id,
    ]);

    $this->actingAs($this->admin)
        ->getJson('/api/admin/reports')
        ->assertOk()
        ->assertJsonStructure([
            'totals' => ['residents', 'staff', 'document_types', 'requests', 'released'],
            'requests_by_status',
            'requests_by_month',
            'most_requested',
        ])
        ->assertJsonCount(6, 'requests_by_month');
});

it('lets an admin delete a staff account', function () {
    $staff = User::factory()->forBarangay($this->barangay)->staff()->create();
    StaffProfile::factory()->create([
        'user_id' => $staff->id,
        'tenant_id' => $this->barangay->tenant_id,
        'barangay_id' => $this->barangay->id,
    ]);
    $staff->syncBarangayAssignments([$this->barangay->id]);

    $this->actingAs($this->admin)
        ->deleteJson("/api/admin/staff/{$staff->id}")
        ->assertOk()
        ->assertJsonPath('message', 'Staff account removed.');

    $this->assertDatabaseMissing('users', ['id' => $staff->id]);
    $this->assertDatabaseMissing('staff_profiles', ['user_id' => $staff->id]);
});

it('prevents an admin from deleting their own staff account', function () {
    $this->actingAs($this->admin)
        ->deleteJson("/api/admin/staff/{$this->admin->id}")
        ->assertUnprocessable()
        ->assertJsonPath('message', 'You cannot delete your own account.');
});
