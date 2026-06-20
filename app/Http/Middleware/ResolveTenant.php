<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use App\Models\Barangay;
use App\Support\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Establishes the tenant context from the authenticated user.
 *
 * Must run after the authentication middleware. Super admins bypass the
 * tenant scope so they can operate across every barangay.
 */
class ResolveTenant
{
    public function __construct(protected TenantContext $context) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user !== null) {
            if ($user->role === UserRole::SuperAdmin) {
                $actingBarangayId = $request->hasSession()
                    ? $request->session()->get('acting_barangay_id')
                    : null;

                if ($actingBarangayId !== null) {
                    $barangay = Barangay::query()->find($actingBarangayId);

                    if ($barangay !== null) {
                        $this->context->set($barangay->tenant_id, $barangay->id);
                    } elseif ($request->hasSession()) {
                        $request->session()->forget('acting_barangay_id');
                        $this->context->bypass();
                    } else {
                        $this->context->bypass();
                    }
                } else {
                    $this->context->bypass();
                }
            } elseif ($user->role->isStaffLevel()) {
                $barangayId = $user->effectiveBarangayId();

                if ($barangayId !== null) {
                    $barangay = Barangay::query()->find($barangayId);

                    if ($barangay !== null) {
                        $this->context->set($barangay->tenant_id, $barangay->id);
                    }
                }
            } elseif ($user->tenant_id !== null) {
                $this->context->set($user->tenant_id, $user->barangay_id);
            }
        }

        return $next($request);
    }
}
