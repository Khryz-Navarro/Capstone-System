<?php

namespace App\Models\Concerns;

use App\Models\Barangay;
use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Support\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Applies automatic tenant isolation to a model.
 *
 * Adds a global scope filtering every query by the active tenant and
 * auto-fills tenant_id / barangay_id on creation from the request context.
 */
trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function (Model $model): void {
            $context = app(TenantContext::class);

            if (! $context->hasTenant()) {
                return;
            }

            if (empty($model->tenant_id)) {
                $model->tenant_id = $context->tenantId();
            }

            if (empty($model->barangay_id) && $context->barangayId() !== null) {
                $model->barangay_id = $context->barangayId();
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class);
    }
}
