<?php

namespace App\Support\Audit;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;

class AuditLogger
{
    public function __construct(protected Request $request) {}

    /**
     * Record an audit log entry for the given user (or the current request user).
     *
     * @param  array<string, mixed>  $metadata
     */
    public function log(string $action, ?User $user = null, ?string $description = null, array $metadata = []): AuditLog
    {
        $user ??= $this->request->user();

        return AuditLog::create([
            'tenant_id' => $user?->tenant_id,
            'barangay_id' => $user?->barangay_id,
            'user_id' => $user?->id,
            'action' => $action,
            'description' => $description,
            'ip_address' => $this->request->ip(),
            'browser' => $this->request->userAgent(),
            'metadata' => $metadata ?: null,
        ]);
    }
}
