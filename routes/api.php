<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ChangePasswordController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\UpdateUserProfileController;
use App\Http\Controllers\LivroController;
use App\Http\Controllers\PublicBookImageController;
use App\Http\Controllers\PedidoController;
use App\Http\Controllers\VendedorController;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [RegisteredUserController::class, 'store']);
Route::post('/login', [AuthenticatedSessionController::class, 'storeMobile'])->name('api.login');
Route::post('/forgot-password', [PasswordResetController::class, 'email'])
    ->middleware('throttle:5,1');
Route::post('/reset-password', [PasswordResetController::class, 'reset'])
    ->middleware('throttle:5,1');

Route::post('/logout', [AuthenticatedSessionController::class, 'destroyMobile'])
    ->middleware('auth:sanctum');

Route::get('/user', function (Request $request) {
    return response()->json([
        'data' => UserResource::make($request->user())->resolve($request),
    ]);
})->middleware('auth:sanctum');

Route::patch('/user', UpdateUserProfileController::class)
    ->middleware('auth:sanctum');

Route::patch('/password', ChangePasswordController::class)
    ->middleware('auth:sanctum');

Route::get('/vendedores/{id}', [VendedorController::class, 'show']);
Route::get('/public-images/{path}', PublicBookImageController::class)
    ->where('path', 'livros/.*');

Route::apiResource('livros', LivroController::class)
    ->only(['index', 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/meus-livros', [LivroController::class, 'mine']);

    Route::apiResource('pedidos', PedidoController::class)
        ->only(['index', 'store', 'show']);

    Route::apiResource('livros', LivroController::class)
        ->except(['index', 'show']);
});
