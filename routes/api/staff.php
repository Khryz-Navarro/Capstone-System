<?php

use App\Http\Controllers\Api\Staff\ResidentVerificationController;
use App\Http\Controllers\Api\Staff\StaffDashboardController;
use App\Http\Controllers\Api\Staff\StaffDocumentRequestController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Barangay staff & admin routes (prefix: /api/staff)
|--------------------------------------------------------------------------
*/
Route::get('/dashboard', StaffDashboardController::class);

// Resident verification
Route::get('/residents', [ResidentVerificationController::class, 'index']);
Route::get('/residents/{user}', [ResidentVerificationController::class, 'show']);
Route::get('/residency-proofs/{proof}/download', [ResidentVerificationController::class, 'downloadProof']);
    Route::post('/residents/{user}/approve', [ResidentVerificationController::class, 'approve']);
    Route::post('/residents/{user}/reject', [ResidentVerificationController::class, 'reject']);
    Route::post('/residents/{user}/resend-verification', [ResidentVerificationController::class, 'resendVerification']);
Route::delete('/residents/{user}', [ResidentVerificationController::class, 'destroy']);

// Document request processing
Route::get('/document-requests', [StaffDocumentRequestController::class, 'index']);
Route::get('/document-requests/{documentRequest}', [StaffDocumentRequestController::class, 'show']);
Route::get('/document-requests/{documentRequest}/download', [StaffDocumentRequestController::class, 'download']);
Route::post('/document-requests/{documentRequest}/approve', [StaffDocumentRequestController::class, 'approve']);
Route::post('/document-requests/{documentRequest}/reject', [StaffDocumentRequestController::class, 'reject']);
Route::post('/document-requests/{documentRequest}/generate', [StaffDocumentRequestController::class, 'generate']);
Route::post('/document-requests/{documentRequest}/ready', [StaffDocumentRequestController::class, 'markReady']);
Route::post('/document-requests/{documentRequest}/release', [StaffDocumentRequestController::class, 'release']);
