<?php

namespace App\Http\Controllers\Api\Super;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Support\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(['data' => SystemSetting::values()]);
    }

    public function update(Request $request, AuditLogger $audit): JsonResponse
    {
        $validated = $request->validate([
            'app_name' => ['required', 'string', 'max:100'],
            'support_email' => ['required', 'email', 'max:255'],
            'allow_registration' => ['required', 'boolean'],
            'maintenance_mode' => ['required', 'boolean'],
            'ai_reports_enabled' => ['required', 'boolean'],
        ]);

        SystemSetting::setMany([
            'app_name' => $validated['app_name'],
            'support_email' => $validated['support_email'],
            'allow_registration' => $validated['allow_registration'] ? '1' : '0',
            'maintenance_mode' => $validated['maintenance_mode'] ? '1' : '0',
            'ai_reports_enabled' => $validated['ai_reports_enabled'] ? '1' : '0',
        ]);

        $audit->log('settings.updated', $request->user(), 'Updated system settings');

        return response()->json(['data' => SystemSetting::values()]);
    }
}
