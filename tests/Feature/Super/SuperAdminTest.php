<?php

use App\Models\Barangay;
use App\Models\DocumentType;
use App\Models\SystemSetting;
use App\Models\User;

beforeEach(function () {
    $this->superAdmin = User::factory()->superAdmin()->create();
});

it('blocks barangay admins from super admin routes', function () {
    $barangay = Barangay::factory()->create();
    $admin = User::factory()->forBarangay($barangay)->barangayAdmin()->create();

    $this->actingAs($admin)
        ->getJson('/api/super/analytics')
        ->assertForbidden();
});

it('lists barangays across every tenant', function () {
    Barangay::factory()->count(3)->create();

    $this->actingAs($this->superAdmin)
        ->getJson('/api/super/barangays')
        ->assertOk()
        ->assertJsonStructure(['data' => [['id', 'name', 'status', 'residents_count', 'requests_count']]])
        ->assertJsonCount(3, 'data');
});

it('creates a barangay with its tenant and default document types', function () {
    $response = $this->actingAs($this->superAdmin)->postJson('/api/super/barangays', [
        'name' => 'New Test Barangay',
        'code' => 'BRGY-TST',
        'region' => 'Region XII',
        'province' => 'Cotabato',
        'city' => 'Kidapawan City',
        'official_email' => 'test@brgy.gov.ph',
        'captain' => 'Hon. Captain',
    ]);

    $response->assertCreated()->assertJsonPath('data.name', 'New Test Barangay');
    $barangayId = $response->json('data.id');

    $this->assertDatabaseHas('tenants', ['name' => 'New Test Barangay']);
    expect(DocumentType::withoutGlobalScopes()->where('barangay_id', $barangayId)->count())->toBe(3);
});

it('suspends a barangay and its tenant', function () {
    $barangay = Barangay::factory()->create();

    $this->actingAs($this->superAdmin)
        ->patchJson("/api/super/barangays/{$barangay->id}/status", ['status' => 'suspended'])
        ->assertOk()
        ->assertJsonPath('data.status', 'suspended');

    $this->assertDatabaseHas('barangays', ['id' => $barangay->id, 'status' => 'suspended']);
    $this->assertDatabaseHas('tenants', ['id' => $barangay->tenant_id, 'status' => 'suspended']);
});

it('returns cross-tenant analytics', function () {
    Barangay::factory()->count(2)->create();

    $this->actingAs($this->superAdmin)
        ->getJson('/api/super/analytics')
        ->assertOk()
        ->assertJsonStructure([
            'totals' => ['barangays', 'tenants', 'residents', 'staff', 'requests', 'released'],
            'top_barangays',
            'monthly_registrations',
            'document_trends',
        ])
        ->assertJsonCount(6, 'monthly_registrations');
});

it('reads and updates system settings', function () {
    $this->actingAs($this->superAdmin)
        ->getJson('/api/super/settings')
        ->assertOk()
        ->assertJsonPath('data.allow_registration', '1');

    $this->actingAs($this->superAdmin)
        ->putJson('/api/super/settings', [
            'app_name' => 'Kidapawan BDRS',
            'support_email' => 'help@kidapawan.gov.ph',
            'allow_registration' => false,
            'maintenance_mode' => false,
            'ai_reports_enabled' => true,
        ])
        ->assertOk()
        ->assertJsonPath('data.app_name', 'Kidapawan BDRS')
        ->assertJsonPath('data.allow_registration', '0')
        ->assertJsonPath('data.ai_reports_enabled', '1');

    expect(SystemSetting::getValue('allow_registration'))->toBe('0');
});

it('sets an acting barangay and accesses staff and admin routes', function () {
    config([
        'sanctum.stateful' => ['127.0.0.1:8000', '127.0.0.1'],
        'session.domain' => null,
    ]);

    $barangay = Barangay::factory()->create();

    $statefulHeaders = [
        'Origin' => 'http://127.0.0.1:8000',
        'Referer' => 'http://127.0.0.1:8000/',
        'X-Requested-With' => 'XMLHttpRequest',
    ];

    $this->actingAs($this->superAdmin)->withHeaders($statefulHeaders);

    $this->putJson('/api/super/acting-barangay', ['barangay_id' => $barangay->id])
        ->assertOk()
        ->assertJsonPath('data.id', $barangay->id);

    $this->getJson('/api/staff/dashboard')
        ->assertOk()
        ->assertJsonStructure(['residents', 'requests', 'recent_requests']);

    $this->getJson('/api/admin/reports')
        ->assertOk()
        ->assertJsonStructure(['totals', 'requests_by_status', 'requests_by_month', 'most_requested']);
});

it('requires an acting barangay for tenant-scoped super admin actions', function () {
    $this->actingAs($this->superAdmin)
        ->getJson('/api/staff/dashboard')
        ->assertUnprocessable();
});

it('lists residents across all barangays for super admin', function () {
    $firstBarangay = Barangay::factory()->create();
    $secondBarangay = Barangay::factory()->create();

    $firstResident = User::factory()->forBarangay($firstBarangay)->resident()->create();
    $secondResident = User::factory()->forBarangay($secondBarangay)->resident()->create();

    \App\Models\ResidentProfile::factory()->approved()->create([
        'user_id' => $firstResident->id,
        'tenant_id' => $firstBarangay->tenant_id,
        'barangay_id' => $firstBarangay->id,
    ]);

    \App\Models\ResidentProfile::factory()->approved()->create([
        'user_id' => $secondResident->id,
        'tenant_id' => $secondBarangay->tenant_id,
        'barangay_id' => $secondBarangay->id,
    ]);

    $this->actingAs($this->superAdmin)
        ->getJson('/api/staff/residents')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('lists residents for super admin within the acting barangay', function () {
    config([
        'sanctum.stateful' => ['127.0.0.1:8000', '127.0.0.1'],
        'session.domain' => null,
    ]);

    $barangay = Barangay::factory()->create();
    $otherBarangay = Barangay::factory()->create();
    $resident = User::factory()->forBarangay($barangay)->resident()->create();
    $otherResident = User::factory()->forBarangay($otherBarangay)->resident()->create();

    \App\Models\ResidentProfile::factory()->approved()->create([
        'user_id' => $resident->id,
        'tenant_id' => $barangay->tenant_id,
        'barangay_id' => $barangay->id,
    ]);

    \App\Models\ResidentProfile::factory()->approved()->create([
        'user_id' => $otherResident->id,
        'tenant_id' => $otherBarangay->tenant_id,
        'barangay_id' => $otherBarangay->id,
    ]);

    $statefulHeaders = [
        'Origin' => 'http://127.0.0.1:8000',
        'Referer' => 'http://127.0.0.1:8000/',
        'X-Requested-With' => 'XMLHttpRequest',
    ];

    $this->actingAs($this->superAdmin)->withHeaders($statefulHeaders);

    $this->putJson('/api/super/acting-barangay', ['barangay_id' => $barangay->id])->assertOk();

    $this->getJson('/api/staff/residents')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $resident->id);
});

it('lets a super admin delete a resident account', function () {
    $superAdmin = User::factory()->superAdmin()->create();
    $barangay = Barangay::factory()->create();
    $resident = User::factory()->forBarangay($barangay)->resident()->create();
    \App\Models\ResidentProfile::factory()->approved()->create([
        'user_id' => $resident->id,
        'tenant_id' => $barangay->tenant_id,
        'barangay_id' => $barangay->id,
    ]);

    $this->actingAs($superAdmin)
        ->deleteJson("/api/staff/residents/{$resident->id}")
        ->assertOk()
        ->assertJsonPath('message', 'Resident account removed.');

    $this->assertDatabaseMissing('users', ['id' => $resident->id]);
});

it('controls a resident account when acting resident is selected', function () {
    config([
        'sanctum.stateful' => ['127.0.0.1:8000', '127.0.0.1'],
        'session.domain' => null,
    ]);

    $barangay = Barangay::factory()->create();
    $resident = User::factory()->forBarangay($barangay)->resident()->create();
    \App\Models\ResidentProfile::factory()->approved()->create([
        'user_id' => $resident->id,
        'tenant_id' => $barangay->tenant_id,
        'barangay_id' => $barangay->id,
    ]);

    $statefulHeaders = [
        'Origin' => 'http://127.0.0.1:8000',
        'Referer' => 'http://127.0.0.1:8000/',
        'X-Requested-With' => 'XMLHttpRequest',
    ];

    $this->actingAs($this->superAdmin)->withHeaders($statefulHeaders);

    $this->putJson('/api/super/acting-barangay', ['barangay_id' => $barangay->id])->assertOk();

    $this->putJson('/api/super/acting-resident', ['resident_id' => $resident->id])
        ->assertOk()
        ->assertJsonPath('data.id', $resident->id);

    $this->getJson('/api/profile')
        ->assertOk()
        ->assertJsonPath('data.id', $resident->id);

    $this->getJson('/api/document-requests')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

it('clears acting barangay and resident context', function () {
    config([
        'sanctum.stateful' => ['127.0.0.1:8000', '127.0.0.1'],
        'session.domain' => null,
    ]);

    $barangay = Barangay::factory()->create();
    $resident = User::factory()->forBarangay($barangay)->resident()->create();

    $statefulHeaders = [
        'Origin' => 'http://127.0.0.1:8000',
        'Referer' => 'http://127.0.0.1:8000/',
        'X-Requested-With' => 'XMLHttpRequest',
    ];

    $this->actingAs($this->superAdmin)->withHeaders($statefulHeaders);

    $this->putJson('/api/super/acting-barangay', ['barangay_id' => $barangay->id])->assertOk();
    $this->putJson('/api/super/acting-resident', ['resident_id' => $resident->id])->assertOk();

    $this->deleteJson('/api/super/acting-context')
        ->assertOk()
        ->assertJsonPath('data.acting_barangay', null)
        ->assertJsonPath('data.acting_resident', null);

    $this->getJson('/api/super/acting-barangay')->assertOk()->assertJsonPath('data', null);
    $this->getJson('/api/super/acting-resident')->assertOk()->assertJsonPath('data', null);
});

it('lets a super admin delete a staff account', function () {
    $barangay = Barangay::factory()->create();
    $staff = User::factory()->forBarangay($barangay)->staff()->create();
    \App\Models\StaffProfile::factory()->create([
        'user_id' => $staff->id,
        'tenant_id' => $barangay->tenant_id,
        'barangay_id' => $barangay->id,
    ]);

    $this->actingAs($this->superAdmin)
        ->deleteJson("/api/admin/staff/{$staff->id}")
        ->assertOk()
        ->assertJsonPath('message', 'Staff account removed.');

    $this->assertDatabaseMissing('users', ['id' => $staff->id]);
});
