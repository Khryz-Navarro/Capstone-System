<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| SPA fallback
|--------------------------------------------------------------------------
| Every non-API request returns the React single-page application shell.
| The negative lookahead keeps API, Sanctum, storage and asset routes
| handled by the backend.
*/
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api|sanctum|storage|build|up).*$');
