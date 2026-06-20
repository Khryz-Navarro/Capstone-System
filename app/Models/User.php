<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Support\Tenancy\TenantContext;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'tenant_id',
        'barangay_id',
        'name',
        'username',
        'role',
        'email',
        'phone',
        'password',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }

    /**
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * @return BelongsTo<Barangay, $this>
     */
    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class);
    }

    /**
     * @return HasOne<ResidentProfile, $this>
     */
    public function residentProfile(): HasOne
    {
        return $this->hasOne(ResidentProfile::class);
    }

    /**
     * @return HasOne<StaffProfile, $this>
     */
    public function staffProfile(): HasOne
    {
        return $this->hasOne(StaffProfile::class);
    }

    /**
     * @return BelongsToMany<Barangay, $this>
     */
    public function assignedBarangays(): BelongsToMany
    {
        return $this->belongsToMany(Barangay::class)->withTimestamps()->withPivot('tenant_id');
    }

    /**
     * @return list<int>
     */
    public function assignedBarangayIds(): array
    {
        if ($this->relationLoaded('assignedBarangays')) {
            return $this->assignedBarangays->pluck('id')->all();
        }

        return $this->assignedBarangays()->pluck('barangays.id')->all();
    }

    public function isAssignedToBarangay(int $barangayId): bool
    {
        return in_array($barangayId, $this->assignedBarangayIds(), true);
    }

    public function hasMultipleBarangayAssignments(): bool
    {
        return count($this->assignedBarangayIds()) > 1;
    }

    public function activeBarangayId(): ?int
    {
        if (! request()->hasSession()) {
            return null;
        }

        $activeId = request()->session()->get('active_barangay_id');

        return is_numeric($activeId) ? (int) $activeId : null;
    }

    /**
     * @param  list<int>  $barangayIds
     */
    public function syncBarangayAssignments(array $barangayIds): void
    {
        $barangays = Barangay::query()->whereIn('id', $barangayIds)->get();

        $sync = [];
        foreach ($barangays as $barangay) {
            $sync[$barangay->id] = ['tenant_id' => $barangay->tenant_id];
        }

        $this->assignedBarangays()->sync($sync);

        $primary = $barangays->first();
        if ($primary === null) {
            return;
        }

        $this->update([
            'tenant_id' => $primary->tenant_id,
            'barangay_id' => $primary->id,
        ]);

        $this->staffProfile()?->update([
            'tenant_id' => $primary->tenant_id,
            'barangay_id' => $primary->id,
        ]);
    }

    /**
     * @return HasMany<ResidencyProof, $this>
     */
    public function residencyProofs(): HasMany
    {
        return $this->hasMany(ResidencyProof::class);
    }

    /**
     * @return HasMany<DocumentRequest, $this>
     */
    public function documentRequests(): HasMany
    {
        return $this->hasMany(DocumentRequest::class, 'resident_id');
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === UserRole::SuperAdmin;
    }

    public function isBarangayAdmin(): bool
    {
        return $this->role === UserRole::BarangayAdmin;
    }

    public function isBarangayStaff(): bool
    {
        return $this->role === UserRole::BarangayStaff;
    }

    public function isResident(): bool
    {
        return $this->role === UserRole::Resident;
    }

    /**
     * @param  list<string>  $roles
     */
    public function canAccessRole(string ...$roles): bool
    {
        return $this->role->canAccess(...$roles);
    }

    public function effectiveBarangayId(): ?int
    {
        if ($this->isSuperAdmin()) {
            return app(TenantContext::class)->barangayId();
        }

        if ($this->role->isStaffLevel()) {
            $activeId = $this->activeBarangayId();
            if ($activeId !== null && $this->isAssignedToBarangay($activeId)) {
                return $activeId;
            }

            $assignedIds = $this->assignedBarangayIds();
            if (count($assignedIds) === 1) {
                return $assignedIds[0];
            }

            if (count($assignedIds) > 1) {
                return null;
            }
        }

        return $this->barangay_id;
    }

    public function actingResidentId(): ?int
    {
        if (! $this->isSuperAdmin()) {
            return null;
        }

        $request = request();

        if (! $request->hasSession()) {
            return null;
        }

        return $request->session()->get('acting_resident_id');
    }

    public function effectiveResidentId(): ?int
    {
        if ($this->isResident()) {
            return $this->id;
        }

        return $this->actingResidentId();
    }

    public function effectiveResident(): ?User
    {
        if ($this->isResident()) {
            return $this->loadMissing(['barangay', 'residentProfile']);
        }

        $residentId = $this->actingResidentId();

        if ($residentId === null) {
            return null;
        }

        $barangayId = $this->effectiveBarangayId();

        $resident = User::query()
            ->where('id', $residentId)
            ->where('role', UserRole::Resident)
            ->when($barangayId !== null, fn ($query) => $query->where('barangay_id', $barangayId))
            ->with(['barangay', 'residentProfile'])
            ->first();

        if ($resident === null && request()->hasSession()) {
            request()->session()->forget('acting_resident_id');
        }

        return $resident;
    }

    public function actsAsResident(): bool
    {
        return $this->isResident() || ($this->isSuperAdmin() && $this->actingResidentId() !== null);
    }

    public function actsAsStaff(): bool
    {
        return $this->isSuperAdmin() || $this->role->isStaffLevel();
    }

    public function actsAsAdmin(): bool
    {
        return $this->isSuperAdmin() || $this->isBarangayAdmin();
    }

    public function canManageAccounts(): bool
    {
        return $this->actsAsAdmin();
    }
}
