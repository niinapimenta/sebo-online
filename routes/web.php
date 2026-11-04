<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::post('/login', [AuthenticatedSessionController::class, 'storeWeb'])
    ->name('login.store');

Route::post('/logout', [AuthenticatedSessionController::class, 'destroyWeb'])
    ->middleware('auth')
    ->name('logout');
