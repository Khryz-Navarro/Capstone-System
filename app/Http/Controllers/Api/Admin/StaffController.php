<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Concerns\ResolvesBarangay;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreStaffRequest;
use App\Http\Requests\Admin\UpdateStaffRequest;
use App\Http\Resources\UserResource;
use App\Models\StaffProfile;
use App\Models\User;
use App\Support\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StaffController extends Controller
{
    use ResolvesBarangay;

    public function index(Request $request): AnonymousResourceCollection
    {
        $barangayId = $this->requireBarangayId($request);

        $staff = User::query()
            ->whereIn('role', [UserRole::BarangayAdmin, UserRole::BarangayStaff])
            ->whereHas('assignedBarangays', fn ($query) => $query->where('barangays.id', $barangayId))
            ->with(['staffProfile', 'assignedBarangays'])
            ->latest()
            ->paginate(15);

        return UserResource::collection($staff);
    }

    public function store(StoreStaffRequest $request, AuditLogger $audit): JsonResponse
    {
        $admin = $request->user();
        $scope = $this->tenantScope($request);
        $data = $request->validated();

        $user = DB::transaction(function () use ($scope, $data) {
            $user = User::create([
                'tenant_id' => $scope['tenant_id'],
                'barangay_id' => $scope['barangay_id'],
                'name' => trim("{$data['first_name']} {$data['last_name']}"),
                'username' => $data['username'] ?? null,
                'email' => $data['email'],
                'phone' => $data['mobile_number'] ?? null,
                'role' => $data['role'],
                'password' => Hash::make($data['password']),
                'email_verified_at' => now(),
            ]);

            StaffProfile::create([
                'tenant_id' => $scope['tenant_id'],
                'barangay_id' => $scope['barangay_id'],
                'user_id' => $user->id,
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'position' => $data['position'],
                'mobile_number' => $data['mobile_number'] ?? null,
                'is_active' => true,
            ]);

            $user->syncBarangayAssignments([$scope['barangay_id']]);

            return $user;
        });

        $audit->log('staff.created', $admin, 'Created staff account', ['staff_id' => $user->id]);

        return UserResource::make($user->load('staffProfile'))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateStaffRequest $request, User $staff, AuditLogger $audit): UserResource
    {
        $this->ensureStaffMember($request, $staff);
        $data = $request->validated();

        DB::transaction(function () use ($staff, $data) {
            $staff->update([
                'name' => trim("{$data['first_name']} {$data['last_name']}"),
                'username' => $data['username'] ?? null,
                'email' => $data['email'],
                'phone' => $data['mobile_number'] ?? null,
                'role' => $data['role'],
                ...(empty($data['password']) ? [] : ['password' => Hash::make($data['password'])]),
            ]);

            $staff->staffProfile()->update([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'position' => $data['position'],
                'mobile_number' => $data['mobile_number'] ?? null,
                'is_active' => $data['is_active'],
            ]);
        });

        $audit->log('staff.updated', $request->user(), 'Updated staff account', ['staff_id' => $staff->id]);

        return UserResource::make($staff->fresh()->load('staffProfile'));
    }

    public function destroy(Request $request, User $staff, AuditLogger $audit): JsonResponse
    {
        $this->ensureCanManageAccounts($request);
        $this->ensureStaffMember($request, $staff);
        abort_if($staff->id === $request->user()->id, 422, 'You cannot delete your own account.');

        $staffId = $staff->id;

        $staff->staffProfile()->delete();
        $staff->assignedBarangays()->detach();
        $staff->notifications()->delete();
        $staff->delete();

        $audit->log('staff.deleted', $request->user(), 'Deleted staff account', ['staff_id' => $staffId]);

        return response()->json(['message' => 'Staff account removed.']);
    }

    protected function ensureStaffMember(Request $request, User $staff): void
    {
        abort_unless(in_array($staff->role, [UserRole::BarangayAdmin, UserRole::BarangayStaff], true), 403);

        if ($request->user()?->isSuperAdmin() && $this->barangayId($request) === null) {
            return;
        }

        abort_unless($staff->isAssignedToBarangay($this->requireBarangayId($request)), 403);
    }
}
