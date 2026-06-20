<?php

use App\Http\Controllers\Api\Super\ActingBarangayController;
use App\Http\Controllers\Api\Super\ActingContextController;
use App\Http\Controllers\Api\Super\ActingResidentController;
use App\Http\Controllers\Api\Super\AnalyticsController;
use App\Http\Controllers\Api\Super\AnalyticsSummaryController;
use App\Http\Controllers\Api\Super\BarangayController;
use App\Http\Controllers\Api\Super\SettingController;
use App\Http\Controllers\Api\Super\StaffController as SuperStaffController;
use Illuminate\Support\Facades\Route;

Route::get('/analytics', AnalyticsController::class);
Route::get('/analytics/summary', [AnalyticsSummaryController::class, 'show']);
Route::post('/analytics/summary', [AnalyticsSummaryController::class, 'store'])
    ->middleware('throttle:6,1');

Route::get('/acting-barangay', [ActingBarangayController::class, 'show']);
Route::put('/acting-barangay', [ActingBarangayController::class, 'update']);

Route::delete('/acting-context', [ActingContextController::class, 'destroy']);

Route::get('/acting-resident', [ActingResidentController::class, 'show']);
Route::get('/acting-resident/options', [ActingResidentController::class, 'options']);
Route::put('/acting-resident', [ActingResidentController::class, 'update']);

Route::get('/barangays', [BarangayController::class, 'index']);
Route::post('/barangays', [BarangayController::class, 'store']);
Route::put('/barangays/{barangay}', [BarangayController::class, 'update']);
Route::patch('/barangays/{barangay}/status', [BarangayController::class, 'updateStatus']);
Route::delete('/barangays/{barangay}', [BarangayController::class, 'destroy']);

Route::get('/settings', [SettingController::class, 'show']);
Route::put('/settings', [SettingController::class, 'update']);

Route::get('/staff', [SuperStaffController::class, 'index']);
Route::post('/staff', [SuperStaffController::class, 'store']);
Route::put('/staff/{staff}', [SuperStaffController::class, 'update']);
Route::delete('/staff/{staff}', [SuperStaffController::class, 'destroy']);
