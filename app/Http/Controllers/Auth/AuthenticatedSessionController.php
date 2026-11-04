<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

class AuthenticatedSessionController extends Controller
{
    public function storeWeb(LoginRequest $request): JsonResponse
    {
        if (! Auth::guard('web')->attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Credenciais inválidas.',
            ], 401);
        }

        $request->session()->regenerate();

        return response()->json([
            'data' => UserResource::make($request->user())->resolve($request),
        ]);
    }

    public function destroyWeb(Request $request): Response
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    public function storeMobile(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->validated('email'))->first();

        if (! $user || ! Hash::check($request->validated('password'), $user->password)) {
            return response()->json([
                'message' => 'Credenciais inválidas.',
            ], 401);
        }

        $token = $user->createToken($request->validated('device_name'));
        $expirationMinutes = (int) config('sanctum.expiration');
        $expiresAt = $token->accessToken->created_at
            ->copy()
            ->addMinutes($expirationMinutes);

        return response()->json([
            'data' => [
                'token' => $token->plainTextToken,
                'token_type' => 'Bearer',
                'expires_at' => $expiresAt->toISOString(),
                'user' => UserResource::make($user)->resolve($request),
            ],
        ]);
    }

    public function destroyMobile(Request $request): Response
    {
        $accessToken = $request->user()->currentAccessToken();

        if (! ($accessToken instanceof PersonalAccessToken)) {
            abort(401, 'Um token Bearer válido é necessário.');
        }

        $accessToken->delete();

        return response()->noContent();
    }
}
