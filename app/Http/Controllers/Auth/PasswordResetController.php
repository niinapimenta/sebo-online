<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Throwable;

class PasswordResetController extends Controller
{
    public function email(ForgotPasswordRequest $request): JsonResponse
    {
        if (! $this->deliveryIsConfigured()) {
            return $this->deliveryUnavailable();
        }

        try {
            Password::sendResetLink($request->validated());
        } catch (Throwable) {
            return $this->deliveryUnavailable();
        }

        return response()->json([
            'message' => 'Se houver uma conta associada a este e-mail, enviaremos instruções para redefinir a senha.',
        ], 202);
    }

    public function reset(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->validated(),
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'O link é inválido ou expirou. Solicite uma nova recuperação.',
            ], 422);
        }

        return response()->json(['message' => 'Senha redefinida com sucesso.']);
    }

    private function deliveryIsConfigured(): bool
    {
        $mailer = config('mail.default');
        $frontendUrl = config('app.frontend_url');
        $fromAddress = config('mail.from.address');
        $frontendUrlParts = is_string($frontendUrl) ? parse_url($frontendUrl) : false;
        $frontendUrlIsValid = is_array($frontendUrlParts)
            && in_array($frontendUrlParts['scheme'] ?? null, ['http', 'https'], true)
            && isset($frontendUrlParts['host'])
            && ! (isset($frontendUrlParts['user'])
                || isset($frontendUrlParts['pass'])
                || isset($frontendUrlParts['query'])
                || isset($frontendUrlParts['fragment']))
            && in_array($frontendUrlParts['path'] ?? '', ['', '/'], true);

        return is_string($mailer)
            && ! in_array($mailer, ['log', 'array'], true)
            && $frontendUrlIsValid
            && is_string($fromAddress)
            && filter_var($fromAddress, FILTER_VALIDATE_EMAIL) !== false
            && ! str_ends_with(strtolower($fromAddress), '@example.com');
    }

    private function deliveryUnavailable(): JsonResponse
    {
        return response()->json([
            'message' => 'A recuperação por e-mail não está configurada neste ambiente. Entre em contato com o suporte.',
        ], 503);
    }
}
