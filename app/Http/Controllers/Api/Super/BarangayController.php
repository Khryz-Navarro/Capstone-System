<?php

namespace App\Http\Controllers\Api\Super;

use App\Enums\BarangayStatus;
use App\Enums\TenantStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Super\StoreBarangayRequest;
use App\Http\Requests\Super\UpdateBarangayRequest;
use App\Http\Resources\BarangayResource;
use App\Models\Barangay;
use App\Models\DocumentType;
use App\Models\Tenant;
use App\Support\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BarangayController extends Controller
{
    /**
     * Default document types provisioned for a newly created barangay.
     *
     * @var list<array{name: string, fee: float, requires_purpose: bool, description: string}>
     */
    protected array $defaultDocumentTypes = [
        ['name' => 'Barangay Clearance', 'fee' => 50, 'requires_purpose' => true, 'description' => 'General clearance certifying good standing in the barangay.'],
        ['name' => 'Certificate of Residency', 'fee' => 0, 'requires_purpose' => true, 'description' => 'Certifies that the requester is a bona fide resident.'],
        ['name' => 'Certificate of Indigency', 'fee' => 0, 'requires_purpose' => true, 'description' => 'Certifies indigent status for assistance and waivers.'],
    ];

    public function index(Request $request): AnonymousResourceCollection
    {
        $search = $request->string('search')->value();
        $status = $request->string('status')->value();

        $barangays = Barangay::query()
            ->with('tenant')
            ->withCount([
                'users as residents_count' => fn ($q) => $q->where('role', UserRole::Resident),
                'users as staff_count' => fn ($q) => $q->whereIn('role', [UserRole::BarangayAdmin, UserRole::BarangayStaff]),
                'documentRequests',
            ])
            ->when($search !== '', fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->orderBy('name')
            ->paginate(20);

        return BarangayResource::collection($barangays);
    }

    public function store(StoreBarangayRequest $request, AuditLogger $audit): JsonResponse
    {
        $data = $request->validated();

        $barangay = DB::transaction(function () use ($data) {
            $tenant = Tenant::create([
                'name' => $data['name'],
                'slug' => $this->uniqueTenantSlug($data['name']),
                'status' => TenantStatus::Active,
            ]);

            $barangay = Barangay::create([
                'tenant_id' => $tenant->id,
                'name' => $data['name'],
                'code' => $data['code'],
                'region' => $data['region'] ?? null,
                'province' => $data['province'] ?? null,
                'city' => $data['city'] ?? null,
                'contact_number' => $data['contact_number'] ?? null,
                'official_email' => $data['official_email'] ?? null,
                'captain' => $data['captain'] ?? null,
                'status' => BarangayStatus::Active,
            ]);

            foreach ($this->defaultDocumentTypes as $type) {
                DocumentType::create([
                    'tenant_id' => $tenant->id,
                    'barangay_id' => $barangay->id,
                    'name' => $type['name'],
                    'slug' => Str::slug($type['name']),
                    'description' => $type['description'],
                    'fee' => $type['fee'],
                    'requires_purpose' => $type['requires_purpose'],
                    'is_active' => true,
                ]);
            }

            return $barangay;
        });

        $audit->log('barangay.created', $request->user(), 'Created barangay', ['barangay_id' => $barangay->id]);

        return BarangayResource::make($barangay->load('tenant'))->response()->setStatusCode(201);
    }

    public function update(UpdateBarangayRequest $request, Barangay $barangay, AuditLogger $audit): BarangayResource
    {
        $barangay->update($request->validated());
        $audit->log('barangay.updated', $request->user(), 'Updated barangay', ['barangay_id' => $barangay->id]);

        return BarangayResource::make($barangay->load('tenant'));
    }

    public function updateStatus(Request $request, Barangay $barangay, AuditLogger $audit): BarangayResource
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:active,inactive,suspended'],
        ]);

        DB::transaction(function () use ($barangay, $validated) {
            $barangay->update(['status' => $validated['status']]);
            $barangay->tenant?->update(['status' => $validated['status']]);
        });

        $audit->log('barangay.status_changed', $request->user(), 'Changed barangay status', [
            'barangay_id' => $barangay->id,
            'status' => $validated['status'],
        ]);

        return BarangayResource::make($barangay->fresh()->load('tenant'));
    }

    public function destroy(Request $request, Barangay $barangay, AuditLogger $audit): JsonResponse
    {
        if ($barangay->users()->exists() || $barangay->documentRequests()->exists()) {
            throw ValidationException::withMessages([
                'barangay' => 'Cannot delete a barangay that already has users or requests. Suspend it instead.',
            ]);
        }

        DB::transaction(function () use ($barangay) {
            $barangay->documentTypes()->delete();
            $tenant = $barangay->tenant;
            $barangay->delete();
            $tenant?->delete();
        });

        $audit->log('barangay.deleted', $request->user(), 'Deleted barangay', ['barangay_id' => $barangay->id]);

        return response()->json(['message' => 'Barangay removed.']);
    }

    protected function uniqueTenantSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 1;

        while (Tenant::query()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
