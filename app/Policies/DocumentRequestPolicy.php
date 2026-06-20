<?php

namespace App\Policies;

use App\Models\DocumentRequest;
use App\Models\User;

class DocumentRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isResident() || $user->actsAsStaff() || $user->actsAsResident();
    }

    public function view(User $user, DocumentRequest $documentRequest): bool
    {
        if ($user->isResident()) {
            return $documentRequest->resident_id === $user->id;
        }

        if ($user->isSuperAdmin()) {
            $actingResidentId = $user->actingResidentId();

            if ($actingResidentId !== null) {
                return $documentRequest->resident_id === $actingResidentId;
            }

            $barangayId = $user->effectiveBarangayId();

            return $barangayId !== null && $documentRequest->barangay_id === $barangayId;
        }

        return $user->role->isStaffLevel()
            && $documentRequest->barangay_id === $user->effectiveBarangayId();
    }

    /**
     * Residents may only request documents once their residency is approved.
     */
    public function create(User $user): bool
    {
        if ($user->isResident()) {
            return (bool) $user->residentProfile?->isApproved();
        }

        if ($user->isSuperAdmin()) {
            return $user->effectiveResident() !== null;
        }

        return false;
    }

    public function download(User $user, DocumentRequest $documentRequest): bool
    {
        return $this->view($user, $documentRequest)
            && $documentRequest->pdf_path !== null;
    }
}
