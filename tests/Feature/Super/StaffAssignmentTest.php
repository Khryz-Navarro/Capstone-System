<?php

use App\Models\Barangay;
use App\Models\StaffProfile;
use App\Models\User;

beforeEach(function () {
    $this->superAdmin = User::factory()->superAdmin()->create();
    $this->firstBarangay = Barangay::factory()->create();
    $this->secondBarangay = Barangay::factory()->create();
});

it('lets a super admin assign staff to multiple barangays', function () {
    $response = $this->actingAs($this->superAdmin)->postJson('/api/super/staff', [
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'position' => 'Floating Secretary',
        'email' => 'maria@brgy.test',
        'role' => 'barangay_staff',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'barangay_ids' => [$this->firstBarangay->id, $this->secondBarangay->id],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.email', 'maria@brgy.test')
        ->assertJsonCount(2, 'data.assigned_barangays');

    $staffId = $response->json('data.id');

    $this->assertDatabaseHas('barangay_user', [
        'user_id' => $staffId,
        'barangay_id' => $this->firstBarangay->id,
    ]);

    $this->assertDatabaseHas('barangay_user', [
        'user_id' => $staffId,
        'barangay_id' => $this->secondBarangay->id,
    ]);
});

it('blocks barangay admins from super staff routes', function () {
    $admin = User::factory()->forBarangay($this->firstBarangay)->barangayAdmin()->create();
    StaffProfile::factory()->create([
        'user_id' => $admin->id,
        'tenant_id' => $this->firstBarangay->tenant_id,
        'barangay_id' => $this->firstBarangay->id,
    ]);

    $this->actingAs($admin)
        ->postJson('/api/super/staff', [
            'first_name' => 'Juan',
            'last_name' => 'Cruz',
            'position' => 'Staff',
            'email' => 'juan@brgy.test',
            'role' => 'barangay_staff',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'barangay_ids' => [$this->firstBarangay->id],
        ])
        ->assertForbidden();
});

it('lets multi-assigned staff switch active barangay context', function () {
    config([
        'sanctum.stateful' => ['127.0.0.1:8000', '127.0.0.1'],
        'session.domain' => null,
    ]);

    $staff = User::factory()->forBarangay($this->firstBarangay)->staff()->create();
    StaffProfile::factory()->create([
        'user_id' => $staff->id,
        'tenant_id' => $this->firstBarangay->tenant_id,
        'barangay_id' => $this->firstBarangay->id,
    ]);

    $staff->syncBarangayAssignments([$this->firstBarangay->id, $this->secondBarangay->id]);

    $headers = [
        'Origin' => 'http://127.0.0.1:8000',
        'Referer' => 'http://127.0.0.1:8000/',
        'X-Requested-With' => 'XMLHttpRequest',
    ];

    $this->actingAs($staff)->withHeaders($headers);

    $this->getJson('/api/active-barangay/options')
        ->assertOk()
        ->assertJsonCount(2, 'data');

    $this->putJson('/api/active-barangay', ['barangay_id' => $this->secondBarangay->id])
        ->assertOk()
        ->assertJsonPath('data.id', $this->secondBarangay->id);

    $this->getJson('/api/staff/dashboard')
        ->assertOk();
});

it('requires an active barangay when staff has multiple assignments', function () {
    $staff = User::factory()->forBarangay($this->firstBarangay)->staff()->create();
    StaffProfile::factory()->create([
        'user_id' => $staff->id,
        'tenant_id' => $this->firstBarangay->tenant_id,
        'barangay_id' => $this->firstBarangay->id,
    ]);

    $staff->syncBarangayAssignments([$this->firstBarangay->id, $this->secondBarangay->id]);

    $this->actingAs($staff)
        ->getJson('/api/staff/dashboard')
        ->assertUnprocessable();
});

it('keeps barangay admin staff limited to a single barangay assignment', function () {
    $admin = User::factory()->forBarangay($this->firstBarangay)->barangayAdmin()->create();
    StaffProfile::factory()->create([
        'user_id' => $admin->id,
        'tenant_id' => $this->firstBarangay->tenant_id,
        'barangay_id' => $this->firstBarangay->id,
    ]);

    $this->actingAs($admin)->postJson('/api/admin/staff', [
        'first_name' => 'Ana',
        'last_name' => 'Reyes',
        'position' => 'Clerk',
        'email' => 'ana@brgy.test',
        'role' => 'barangay_staff',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertCreated();

    $staff = User::where('email', 'ana@brgy.test')->first();

    expect($staff->assignedBarangayIds())->toBe([$this->firstBarangay->id]);
});
