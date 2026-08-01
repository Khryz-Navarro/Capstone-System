<?php

namespace App\Http\Controllers\Api\Auth;

use App\Enums\ProofType;
use App\Enums\UserRole;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\Barangay;
use App\Models\ResidencyProof;
use App\Models\ResidentProfile;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RegisteredUserController extends Controller
{
    public function store(RegisterRequest $request): JsonResponse
    {
        if (SystemSetting::getValue('allow_registration') !== '1') {
            throw ValidationException::withMessages([
                'email' => 'Resident registration is currently disabled. Please contact your barangay.',
            ]);
        }

        $barangay = Barangay::findOrFail($request->integer('barangay_id'));

        $user = DB::transaction(function () use ($request, $barangay): User {
            $user = User::create([
                'tenant_id' => $barangay->tenant_id,
                'barangay_id' => $barangay->id,
                'name' => trim($request->string('first_name').' '.$request->string('last_name')),
                'username' => $request->input('username'),
                'role' => UserRole::Resident,
                'email' => $request->string('email')->value(),
                'phone' => $request->input('mobile_number'),
                'password' => $request->string('password')->value(),
            ]);

            ResidentProfile::create([
                'tenant_id' => $barangay->tenant_id,
                'barangay_id' => $barangay->id,
                'user_id' => $user->id,
                'first_name' => $request->input('first_name'),
                'middle_name' => $request->input('middle_name'),
                'last_name' => $request->input('last_name'),
                'suffix' => $request->input('suffix'),
                'gender' => $request->input('gender'),
                'birthdate' => $request->input('birthdate'),
                'civil_status' => $request->input('civil_status'),
                'occupation' => $request->input('occupation'),
                'mobile_number' => $request->input('mobile_number'),
                'house_number' => $request->input('house_number'),
                'street' => $request->input('street'),
                'purok' => $request->input('purok'),
                'sitio' => $request->input('sitio'),
                'city' => $request->input('city'),
                'province' => $request->input('province'),
                'verification_status' => VerificationStatus::Pending,
            ]);

            $file = $request->file('id_photo');
            $path = $file->store("residency-proofs/{$user->id}", 'local');

            ResidencyProof::create([
                'tenant_id' => $barangay->tenant_id,
                'barangay_id' => $barangay->id,
                'user_id' => $user->id,
                'type' => ProofType::GovernmentId,
                'file_path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize(),
                'status' => VerificationStatus::Pending,
            ]);

            return $user;
        });

        event(new Registered($user));

        Auth::login($user);

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        $user->load(['barangay', 'residentProfile']);

        $token = $user->createToken('mobile-app')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful.',
            'data' => UserResource::make($user)->resolve() + [
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ], 201);
    }
}
