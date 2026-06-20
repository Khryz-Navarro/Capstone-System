<?php

namespace App\Http\Controllers\Api\Super;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Super\StoreStaffRequest;
use App\Http\Requests\Super\UpdateStaffRequest;
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
    public function index(Request $request): AnonymousResourceCollection
    {
        $barangayId = $request->integer('barangay_id') ?: null;

        $staff = User::query()
            ->whereIn('role', [UserRole::BarangayAdmin, UserRole::BarangayStaff])
            ->when($barangayId !== null, fn ($query) => $query->whereHas(
                'assignedBarangays',
                fn ($assignmentQuery) => $assignmentQuery->where('barangays.id', $barangayId)
            ))
            ->with(['staffProfile', 'assignedBarangays'])
            ->latest()
            ->paginate(15);

        return UserResource::collection($staff);
    }

    public function store(StoreStaffRequest $request, AuditLogger $audit): JsonResponse
    {
        $data = $request->validated();
        $barangayIds = $data['barangay_ids'];

        $user = DB::transaction(function () use ($data, $barangayIds) {
            $primaryBarangayId = $barangayIds[0];
            $primaryBarangay = \App\Models\Barangay::query()->findOrFail($primaryBarangayId);

            $user = User::create([
                'tenant_id' => $primaryBarangay->tenant_id,
                'barangay_id' => $primaryBarangay->id,
                'name' => trim("{$data['first_name']} {$data['last_name']}"),
                'username' => $data['username'] ?? null,
                'email' => $data['email'],
                'phone' => $data['mobile_number'] ?? null,
                'role' => $data['role'],
                'password' => Hash::make($data['password']),
                'email_verified_at' => now(),
            ]);

            StaffProfile::create([
                'tenant_id' => $primaryBarangay->tenant_id,
                'barangay_id' => $primaryBarangay->id,
                'user_id' => $user->id,
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'position' => $data['position'],
                'mobile_number' => $data['mobile_number'] ?? null,
                'is_active' => true,
            ]);

            $user->syncBarangayAssignments($barangayIds);

            return $user;
        });

        $audit->log('staff.created', $request->user(), 'Created staff account with barangay assignments', [
            'staff_id' => $user->id,
            'barangay_ids' => $barangayIds,
        ]);

        return UserResource::make($user->load(['staffProfile', 'assignedBarangays']))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateStaffRequest $request, User $staff, AuditLogger $audit): UserResource
    {
        abort_unless(in_array($staff->role, [UserRole::BarangayAdmin, UserRole::BarangayStaff], true), 404);

        $data = $request->validated();
        $barangayIds = $data['barangay_ids'];

        DB::transaction(function () use ($staff, $data, $barangayIds) {
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

            $staff->syncBarangayAssignments($barangayIds);
        });

        $audit->log('staff.updated', $request->user(), 'Updated staff account barangay assignments', [
            'staff_id' => $staff->id,
            'barangay_ids' => $barangayIds,
        ]);

        return UserResource::make($staff->fresh()->load(['staffProfile', 'assignedBarangays']));
    }

    public function destroy(Request $request, User $staff, AuditLogger $audit): JsonResponse
    {
        abort_unless(in_array($staff->role, [UserRole::BarangayAdmin, UserRole::BarangayStaff], true), 404);

        $staffId = $staff->id;

        $staff->assignedBarangays()->detach();
        $staff->staffProfile()?->delete();
        $staff->notifications()->delete();
        $staff->delete();

        $audit->log('staff.deleted', $request->user(), 'Deleted staff account', ['staff_id' => $staffId]);

        return response()->json(['message' => 'Staff account removed.']);
    }
}
