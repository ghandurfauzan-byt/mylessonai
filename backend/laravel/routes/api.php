<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\LandingController;
use App\Http\Controllers\Api\CurriculumController;

/*
|--------------------------------------------------------------------------
| REST API Routes (ExplainMyLesson SD Pintar v1)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // 1. Landing Page Public Stats
    Route::get('/landing/stats', [LandingController::class, 'getStats']);

    // 2. Authentication (FR-01, FR-02)
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    // 3. Modul Kurikulum & Request AI (Kemdikbud + Generative AI)
    Route::get('/curriculum/catalog', [CurriculumController::class, 'catalog']);
    Route::post('/curriculum/request', [CurriculumController::class, 'requestModule']);
    Route::post('/curriculum/validate', [CurriculumController::class, 'validateModule']);

    // 4. Protected Auth Endpoints (JWT / Sesi Aktif)
    Route::middleware('auth:api')->group(function () {
        Route::get('/auth/session', [AuthController::class, 'session']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
    });
});
