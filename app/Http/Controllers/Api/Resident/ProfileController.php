<?php

namespace App\Http\Controllers\Api\Resident;

use App\Http\Controllers\Concerns\ResolvesActingResident;
use App\Http\Controllers\Controller;
use App\Http\Requests\Resident\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    use ResolvesActingResident;

    public function show(Request $request): UserResource
    {
        $resident = $this->requireEffectiveResident($request);

        return UserResource::make($resident);
    }

    public function update(UpdateProfileRequest $request): UserResource
    {
        $resident = $this->requireEffectiveResident($request);

        if ($request->filled('phone')) {
            $resident->update(['phone' => $request->string('phone')->value()]);
        }

        $profile = $resident->residentProfile;

        if ($profile !== null) {
            $profile->update($request->safe()->except('phone'));
        }

        return UserResource::make($resident->fresh()->load(['barangay', 'residentProfile']));
    }
}
