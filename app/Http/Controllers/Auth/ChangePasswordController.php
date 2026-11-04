<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class ChangePasswordController extends Controller
{
    public function __invoke(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! Hash::check($request->validated('current_password'), $user->password)) {
            return response()->json([
                'message' => 'A senha atual está incorreta.',
                'errors' => ['current_password' => ['A senha atual está incorreta.']],
            ], 422);
        }

        $user->forceFill(['password' => $request->validated('password')])->save();

        return response()->json(['message' => 'Senha alterada com sucesso.']);
    }
}
