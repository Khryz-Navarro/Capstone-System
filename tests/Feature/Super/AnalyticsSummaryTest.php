<?php

use App\Models\Barangay;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\Reports\ReportSummaryCache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->superAdmin = User::factory()->superAdmin()->create();

    ReportSummaryCache::forget(ReportSummaryCache::keyForPlatform());
});

it('returns no platform summary before generation', function () {
    $this->actingAs($this->superAdmin)
        ->getJson('/api/super/analytics/summary')
        ->assertOk()
        ->assertJsonPath('status', 'none');
});

it('generates a rule-based platform summary', function () {
    Barangay::factory()->count(2)->create();

    $this->actingAs($this->superAdmin)
        ->postJson('/api/super/analytics/summary')
        ->assertOk()
        ->assertJsonPath('status', 'ready')
        ->assertJsonPath('data.source', 'rules')
        ->assertJsonStructure([
            'data' => ['summary', 'highlights', 'generated_at', 'source'],
        ]);
});

it('uses ai for platform summaries when enabled', function () {
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
                                    'summary' => 'Platform adoption is growing across barangays.',
                                    'highlights' => ['Onboard inactive barangays.', 'Monitor release rates.'],
                                ]),
                            ],
                        ],
                    ],
                ],
            ],
        ]),
    ]);

    $this->actingAs($this->superAdmin)
        ->postJson('/api/super/analytics/summary')
        ->assertOk()
        ->assertJsonPath('status', 'ready')
        ->assertJsonPath('data.source', 'ai');

    Http::assertSentCount(1);
});

it('blocks barangay admins from platform summaries', function () {
    $barangay = Barangay::factory()->create();
    $admin = User::factory()->forBarangay($barangay)->barangayAdmin()->create();

    $this->actingAs($admin)
        ->postJson('/api/super/analytics/summary')
        ->assertForbidden();
});

it('logs platform summary generation in the audit trail', function () {
    $this->actingAs($this->superAdmin)
        ->postJson('/api/super/analytics/summary')
        ->assertOk();

    $this->assertDatabaseHas('audit_logs', [
        'user_id' => $this->superAdmin->id,
        'action' => 'analytics.summary.requested',
    ]);
});
