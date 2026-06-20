<?php

namespace App\Support\Tenancy;

/**
 * Request-scoped holder for the currently active tenant and barangay.
 *
 * Bound as a singleton so the global tenant scope, model creation hooks,
 * and controllers all read from the same source of truth during a request.
 */
class TenantContext
{
    protected ?int $tenantId = null;

    protected ?int $barangayId = null;

    /**
     * When bypassed (e.g. super admin or system jobs), the tenant scope is
     * skipped entirely so queries can span every tenant.
     */
    protected bool $bypassed = false;

    public function set(?int $tenantId, ?int $barangayId = null): void
    {
        $this->tenantId = $tenantId;
        $this->barangayId = $barangayId;
        $this->bypassed = false;
    }

    public function tenantId(): ?int
    {
        return $this->tenantId;
    }

    public function barangayId(): ?int
    {
        return $this->barangayId;
    }

    public function hasTenant(): bool
    {
        return ! $this->bypassed && $this->tenantId !== null;
    }

    public function bypass(): void
    {
        $this->bypassed = true;
    }

    public function isBypassed(): bool
    {
        return $this->bypassed;
    }

    public function forget(): void
    {
        $this->tenantId = null;
        $this->barangayId = null;
        $this->bypassed = false;
    }

    /**
     * Run a callback with the tenant scope temporarily disabled, restoring
     * the previous context afterwards.
     *
     * @template TReturn
     *
     * @param  callable(): TReturn  $callback
     * @return TReturn
     */
    public function runWithoutScope(callable $callback): mixed
    {
        $previousTenant = $this->tenantId;
        $previousBarangay = $this->barangayId;
        $previousBypass = $this->bypassed;

        $this->bypass();

        try {
            return $callback();
        } finally {
            $this->tenantId = $previousTenant;
            $this->barangayId = $previousBarangay;
            $this->bypassed = $previousBypass;
        }
    }
}
