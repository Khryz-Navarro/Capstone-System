<?php

use App\Models\Barangay;
use App\Models\DocumentType;
use App\Models\StaffProfile;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\Reports\ReportSummaryCache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->barangay = Barangay::factory()->create();
    $this->admin = User::factory()->forBarangay($this->barangay)->barangayAdmin()->create();
    StaffProfile::factory()->create([
        'user_id' => $this->admin->id,
        'tenant_id' => $this->barangay->tenant_id,
        'barangay_id' => $this->barangay->id,
    ]);

    $this->admin->syncBarangayAssignments([$this->barangay->id]);

    ReportSummaryCache::forget(ReportSummaryCache::keyForBarangay($this->barangay->id));
});

it('returns no summary before generation', function () {
    $this->actingAs($this->admin)
        ->getJson('/api/admin/reports/summary')
        ->assertOk()
        ->assertJsonPath('status', 'none');
});

it('generates a rule-based barangay summary', function () {
    DocumentType::factory()->create([
        'barangay_id' => $this->barangay->id,
        'tenant_id' => $this->barangay->tenant_id,
        'name' => 'Barangay Clearance',
    ]);

    $this->actingAs($this->admin)
        ->postJson('/api/admin/reports/summary')
        ->assertOk()
        ->assertJsonPath('status', 'ready')
        ->assertJsonPath('data.source', 'rules')
        ->assertJsonStructure([
            'data' => ['summary', 'highlights', 'generated_at', 'source'],
        ]);

    $this->actingAs($this->admin)
        ->getJson('/api/admin/reports/summary')
        ->assertOk()
        ->assertJsonPath('status', 'ready')
        ->assertJsonPath('data.source', 'rules');
});

it('uses ai when enabled and configured', function () {
    SystemSetting::setMany(['ai_reports_enabled' => '1']);
    config(['services.google_ai.key' => 'test-key', 'services.google_ai.model' => 'gemini-2.0-flash']);

    Http::fake([
        'generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [
                [
                    'content' => [
                        'parts' => [
                            [
                                'text' => json_encode([
                                    'summary' => 'Barangay activity is steady with room to improve releases.',
                                    'highlights' => ['Focus on pending verifications.', 'Clearance remains popular.'],
                                ]),
                            ],
                        ],
                    ],
                ],
            ],
        ]),
    ]);

    $this->actingAs($this->admin)
        ->postJson('/api/admin/reports/summary')
        ->assertOk()
        ->assertJsonPath('status', 'ready')
        ->assertJsonPath('data.source', 'ai')
        ->assertJsonPath('data.summary', 'Barangay activity is steady with room to improve releases.');

    Http::assertSentCount(1);
});

it('blocks staff from report summaries', function () {
    $staff = User::factory()->forBarangay($this->barangay)->staff()->create();

    $this->actingAs($staff)
        ->postJson('/api/admin/reports/summary')
        ->assertForbidden();
});

it('logs summary generation in the audit trail', function () {
    $this->actingAs($this->admin)
        ->postJson('/api/admin/reports/summary')
        ->assertOk();

    $this->assertDatabaseHas('audit_logs', [
        'user_id' => $this->admin->id,
        'action' => 'reports.summary.requested',
    ]);
});
