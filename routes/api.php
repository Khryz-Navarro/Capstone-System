<?php

use App\Http\Controllers\Api\ActiveBarangayController;
use App\Http\Controllers\Api\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Api\Auth\EmailVerificationController;
use App\Http\Controllers\Api\Auth\NewPasswordController;
use App\Http\Controllers\Api\Auth\PasswordResetLinkController;
use App\Http\Controllers\Api\Auth\RegisteredUserController;
use App\Http\Controllers\Api\BarangayController;
use App\Http\Controllers\Api\VerificationController;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
*/
Route::get('/barangays', [BarangayController::class, 'index']);
Route::get('/verify/{reference}', [VerificationController::class, 'show']);

Route::prefix('auth')->group(function () {
    Route::post('/register', [RegisteredUserController::class, 'store']);
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
    Route::post('/forgot-password', [PasswordResetLinkController::class, 'store']);
    Route::post('/reset-password', [NewPasswordController::class, 'store']);

    Route::get('/verify-email/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware('signed')
        ->name('verification.verify');
});

/*
|--------------------------------------------------------------------------
| Authenticated routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
    Route::get('/user', function (Request $request) {
        $user = $request->user();
        $relations = ['barangay', 'residentProfile'];

        if ($user?->role->isStaffLevel()) {
            $relations[] = 'assignedBarangays';
        }

        return UserResource::make($user->load($relations));
    });

    Route::middleware('role:barangay_admin,barangay_staff')->group(function () {
        Route::get('/active-barangay', [ActiveBarangayController::class, 'show']);
        Route::get('/active-barangay/options', [ActiveBarangayController::class, 'options']);
        Route::put('/active-barangay', [ActiveBarangayController::class, 'update']);
    });

    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
        Route::post('/email/verification-notification', [EmailVerificationController::class, 'send'])
            ->middleware('throttle:6,1');
    });

    require __DIR__.'/api/resident.php';

    Route::middleware('role:barangay_admin,barangay_staff,super_admin')
        ->prefix('staff')
        ->group(base_path('routes/api/staff.php'));

    Route::middleware('role:barangay_admin,super_admin')
        ->prefix('admin')
        ->group(base_path('routes/api/admin.php'));

    Route::middleware('role:super_admin')
        ->prefix('super')
        ->group(base_path('routes/api/super.php'));
});
