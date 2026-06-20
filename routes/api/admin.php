<?php

use App\Http\Controllers\Api\Admin\DocumentTemplateController;
use App\Http\Controllers\Api\Admin\DocumentTypeController;
use App\Http\Controllers\Api\Admin\ReportSummaryController;
use App\Http\Controllers\Api\Admin\ReportsController;
use App\Http\Controllers\Api\Admin\StaffController;
use Illuminate\Support\Facades\Route;

Route::get('/reports', ReportsController::class);
Route::get('/reports/summary', [ReportSummaryController::class, 'show']);
Route::post('/reports/summary', [ReportSummaryController::class, 'store'])
    ->middleware('throttle:6,1');

Route::get('/staff', [StaffController::class, 'index']);
Route::post('/staff', [StaffController::class, 'store']);
Route::put('/staff/{staff}', [StaffController::class, 'update']);
Route::delete('/staff/{staff}', [StaffController::class, 'destroy']);

Route::get('/document-types', [DocumentTypeController::class, 'index']);
Route::post('/document-types', [DocumentTypeController::class, 'store']);
Route::put('/document-types/{documentType}', [DocumentTypeController::class, 'update']);
Route::delete('/document-types/{documentType}', [DocumentTypeController::class, 'destroy']);

Route::get('/document-templates', [DocumentTemplateController::class, 'index']);
Route::post('/document-templates', [DocumentTemplateController::class, 'store']);
Route::put('/document-templates/{documentTemplate}', [DocumentTemplateController::class, 'update']);
Route::delete('/document-templates/{documentTemplate}', [DocumentTemplateController::class, 'destroy']);
