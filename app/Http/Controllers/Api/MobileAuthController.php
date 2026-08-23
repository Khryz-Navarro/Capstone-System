<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MobileAuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $request->authenticate();

        $user = $request->user();
        $user->forceFill(['last_login_at' => now()])->save();
        $user->load(['barangay', 'residentProfile']);

        $token = $user->createToken($request->input('device_name', 'mobile-app'))->plainTextToken;

        return response()->json([
            'message' => 'Authenticated.',
            'data' => UserResource::make($user)->resolve() + [
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out.']);
    }
}
