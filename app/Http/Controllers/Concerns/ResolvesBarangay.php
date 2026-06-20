<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Barangay;
use Illuminate\Http\Request;

trait ResolvesBarangay
{
    protected function barangayId(Request $request): ?int
    {
        return $request->user()?->effectiveBarangayId();
    }

    protected function requireBarangayId(Request $request): int
    {
        $barangayId = $this->barangayId($request);

        abort_if($barangayId === null, 422, 'Select a barangay to continue.');

        return $barangayId;
    }

    /**
     * @return array{tenant_id: int, barangay_id: int}
     */
    protected function tenantScope(Request $request): array
    {
        $user = $request->user();
        abort_if($user === null, 401);

        if ($user->isSuperAdmin()) {
            $barangay = Barangay::query()->findOrFail($this->requireBarangayId($request));

            return [
                'tenant_id' => $barangay->tenant_id,
                'barangay_id' => $barangay->id,
            ];
        }

        $barangayId = $this->requireBarangayId($request);
        $barangay = Barangay::query()->findOrFail($barangayId);

        return [
            'tenant_id' => $barangay->tenant_id,
            'barangay_id' => $barangay->id,
        ];
    }

    protected function ensureSameBarangay(Request $request, ?int $resourceBarangayId): void
    {
        abort_unless($resourceBarangayId === $this->requireBarangayId($request), 403);
    }

    protected function ensureCanAccessBarangayResource(Request $request, ?int $resourceBarangayId, bool $allowSuperAdminGlobalRead = false): void
    {
        if ($allowSuperAdminGlobalRead && $request->user()?->isSuperAdmin() && $this->barangayId($request) === null) {
            return;
        }

        $this->ensureSameBarangay($request, $resourceBarangayId);
    }

    protected function ensureCanManageAccounts(Request $request): void
    {
        abort_unless($request->user()?->canManageAccounts(), 403, 'You do not have permission to manage accounts.');
    }
}
