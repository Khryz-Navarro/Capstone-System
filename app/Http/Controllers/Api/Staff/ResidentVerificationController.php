<?php

namespace App\Http\Controllers\Api\Staff;

use App\Enums\UserRole;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Concerns\ResolvesBarangay;
use App\Http\Controllers\Concerns\StreamsPrivateFiles;
use App\Http\Controllers\Controller;
use App\Http\Resources\ResidencyProofResource;
use App\Http\Resources\UserResource;
use App\Models\ResidencyProof;
use App\Models\User;
use App\Notifications\ResidencyReviewedNotification;
use App\Support\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ResidentVerificationController extends Controller
{
    use ResolvesBarangay;
    use StreamsPrivateFiles;

    public function index(Request $request): AnonymousResourceCollection
    {
        $status = $request->string('status')->value();
        $search = $request->string('search')->trim()->value();
        $filterBarangayId = $request->integer('barangay_id') ?: null;

        $query = User::query()
            ->where('role', UserRole::Resident)
            ->whereHas('residentProfile', function ($profileQuery) use ($status) {
                if ($status !== '') {
                    $profileQuery->where('verification_status', $status);
                }
            })
            ->with(['residentProfile', 'barangay']);

        if ($request->user()?->isSuperAdmin()) {
            $actingBarangayId = $this->barangayId($request);

            if ($actingBarangayId !== null) {
                $query->where('barangay_id', $actingBarangayId);
            } elseif ($filterBarangayId !== null) {
                $query->where('barangay_id', $filterBarangayId);
            }
        } else {
            $query->where('barangay_id', $this->requireBarangayId($request));
        }

        if ($search !== '') {
            $query->where(function ($searchQuery) use ($search) {
                $searchQuery
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhereHas('residentProfile', function ($profileQuery) use ($search) {
                        $profileQuery
                            ->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('mobile_number', 'like', "%{$search}%");
                    });
            });
        }

        $residents = $query->latest()->paginate(15);

        return UserResource::collection($residents);
    }

    public function show(Request $request, User $user): JsonResponse
    {
        abort_unless($user->role === UserRole::Resident, 404);

        $this->ensureCanAccessBarangayResource($request, $user->barangay_id, allowSuperAdminGlobalRead: true);

        $proofs = ResidencyProof::query()
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json([
            'resident' => UserResource::make($user->load(['residentProfile', 'barangay'])),
            'proofs' => ResidencyProofResource::collection($proofs),
        ]);
    }

    public function downloadProof(Request $request, ResidencyProof $proof): StreamedResponse|BinaryFileResponse
    {
        $barangayId = $proof->barangay_id ?? $proof->user?->barangay_id;
        $this->ensureCanAccessBarangayResource($request, $barangayId, allowSuperAdminGlobalRead: true);

        return $this->streamPrivateFile(
            $proof->file_path,
            $proof->original_name,
            $request->boolean('inline'),
        );
    }

    public function approve(Request $request, User $user, AuditLogger $audit): JsonResponse
    {
        $this->ensureSameBarangay($request, $user->barangay_id);

        $profile = $user->residentProfile;
        abort_if($profile === null, 404, 'Resident profile not found.');

        $profile->update([
            'verification_status' => VerificationStatus::Approved,
            'verified_at' => now(),
            'verified_by' => $request->user()->id,
            'rejection_reason' => null,
        ]);

        ResidencyProof::where('user_id', $user->id)
            ->where('status', VerificationStatus::Pending)
            ->update(['status' => VerificationStatus::Approved, 'reviewed_by' => $request->user()->id, 'reviewed_at' => now()]);

        $user->notify(new ResidencyReviewedNotification(VerificationStatus::Approved));

        $audit->log('residency.approved', $request->user(), 'Approved resident verification', ['resident_id' => $user->id]);

        return response()->json(['message' => 'Resident verified.']);
    }

    public function reject(Request $request, User $user, AuditLogger $audit): JsonResponse
    {
        $this->ensureSameBarangay($request, $user->barangay_id);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $profile = $user->residentProfile;
        abort_if($profile === null, 404, 'Resident profile not found.');

        $profile->update([
            'verification_status' => VerificationStatus::Rejected,
            'rejection_reason' => $validated['reason'],
            'verified_at' => null,
            'verified_by' => $request->user()->id,
        ]);

        $user->notify(new ResidencyReviewedNotification(VerificationStatus::Rejected, $validated['reason']));

        $audit->log('residency.rejected', $request->user(), 'Rejected resident verification', [
            'resident_id' => $user->id,
            'reason' => $validated['reason'],
        ]);

        return response()->json(['message' => 'Resident verification rejected.']);
    }

    public function resendVerification(Request $request, User $user): JsonResponse
    {
        abort_unless($user->role === UserRole::Resident, 404);

        $this->ensureCanAccessBarangayResource($request, $user->barangay_id, allowSuperAdminGlobalRead: true);

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification link sent.']);
    }

    public function destroy(Request $request, User $user, AuditLogger $audit): JsonResponse
    {
        $this->ensureCanManageAccounts($request);
        abort_unless($user->role === UserRole::Resident, 404);
        $this->ensureCanAccessBarangayResource($request, $user->barangay_id, allowSuperAdminGlobalRead: true);

        $residentId = $user->id;

        DB::transaction(function () use ($request, $user) {
            $user->load(['residencyProofs', 'documentRequests']);

            foreach ($user->residencyProofs as $proof) {
                if ($proof->file_path !== null) {
                    Storage::disk('local')->delete($proof->file_path);
                }
            }

            foreach ($user->documentRequests as $documentRequest) {
                if ($documentRequest->pdf_path !== null) {
                    Storage::disk('local')->delete($documentRequest->pdf_path);
                }
            }

            if ($request->hasSession() && $request->session()->get('acting_resident_id') === $user->id) {
                $request->session()->forget('acting_resident_id');
            }

            $user->notifications()->delete();
            $user->delete();
        });

        $audit->log('resident.deleted', $request->user(), 'Deleted resident account', ['resident_id' => $residentId]);

        return response()->json(['message' => 'Resident account removed.']);
    }
}
