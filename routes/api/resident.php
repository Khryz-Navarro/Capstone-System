<?php

use App\Http\Controllers\Api\Resident\DocumentRequestController;
use App\Http\Controllers\Api\Resident\DocumentTypeController;
use App\Http\Controllers\Api\Resident\NotificationController;
use App\Http\Controllers\Api\Resident\ProfileController;
use App\Http\Controllers\Api\Resident\ResidencyProofController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Resident routes (authenticated + tenant resolved)
|--------------------------------------------------------------------------
*/
Route::get('/profile', [ProfileController::class, 'show']);
Route::put('/profile', [ProfileController::class, 'update']);

Route::get('/residency', [ResidencyProofController::class, 'index']);
Route::post('/residency/upload', [ResidencyProofController::class, 'store']);

Route::get('/document-types', [DocumentTypeController::class, 'index']);

Route::get('/document-requests', [DocumentRequestController::class, 'index']);
Route::post('/document-requests', [DocumentRequestController::class, 'store']);
Route::get('/document-requests/{documentRequest}', [DocumentRequestController::class, 'show']);
Route::get('/document-requests/{documentRequest}/download', [DocumentRequestController::class, 'download']);

Route::get('/notifications', [NotificationController::class, 'index']);
Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
