<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PasswordManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_password_change_requires_authentication(): void
    {
        $this->patchJson('/api/password', [
            'current_password' => 'senha-atual-segura',
            'password' => 'senha-nova-segura',
            'password_confirmation' => 'senha-nova-segura',
        ])->assertUnauthorized();
    }

    public function test_authenticated_user_can_change_password_without_returning_it(): void
    {
        $user = User::factory()->create(['password' => 'senha-atual-segura']);
        Sanctum::actingAs($user);

        $this->patchJson('/api/password', [
            'current_password' => 'senha-atual-segura',
            'password' => 'senha-nova-segura',
            'password_confirmation' => 'senha-nova-segura',
        ])->assertOk()
            ->assertJson(['message' => 'Senha alterada com sucesso.'])
            ->assertJsonMissingPath('password')
            ->assertJsonMissingPath('current_password');

        $this->assertTrue(Hash::check('senha-nova-segura', $user->fresh()->password));
        $this->assertFalse(Hash::check('senha-atual-segura', $user->fresh()->password));
    }

    public function test_password_change_rejects_wrong_current_password_and_weak_or_unconfirmed_password(): void
    {
        $user = User::factory()->create(['password' => 'senha-atual-segura']);
        Sanctum::actingAs($user);

        $this->patchJson('/api/password', [
            'current_password' => 'incorreta',
            'password' => 'senha-nova-segura',
            'password_confirmation' => 'senha-nova-segura',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');

        $this->patchJson('/api/password', [
            'current_password' => 'senha-atual-segura',
            'password' => 'curta',
            'password_confirmation' => 'diferente',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->assertTrue(Hash::check('senha-atual-segura', $user->fresh()->password));
    }

    public function test_recovery_does_not_claim_delivery_when_mailer_is_not_configured(): void
    {
        config([
            'mail.default' => 'log',
            'app.frontend_url' => null,
        ]);
        User::factory()->create(['email' => 'known@example.test']);

        $known = $this->postJson('/api/forgot-password', ['email' => 'known@example.test']);
        $unknown = $this->postJson('/api/forgot-password', ['email' => 'unknown@example.test']);

        $known->assertStatus(503);
        $unknown->assertStatus(503);
        $this->assertSame($known->json('message'), $unknown->json('message'));
        $this->assertDatabaseCount('password_reset_tokens', 0);
    }

    public function test_password_can_be_reset_with_a_valid_laravel_broker_token(): void
    {
        $user = User::factory()->create(['password' => 'senha-antiga-segura']);
        $token = Password::broker()->createToken($user);

        $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'senha-nova-segura',
            'password_confirmation' => 'senha-nova-segura',
        ])->assertOk()->assertJson(['message' => 'Senha redefinida com sucesso.']);

        $this->assertTrue(Hash::check('senha-nova-segura', $user->fresh()->password));
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
    }

    public function test_invalid_reset_token_does_not_change_password(): void
    {
        $user = User::factory()->create(['password' => 'senha-antiga-segura']);

        $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'token' => 'token-invalido',
            'password' => 'senha-nova-segura',
            'password_confirmation' => 'senha-nova-segura',
        ])->assertUnprocessable();

        $this->assertTrue(Hash::check('senha-antiga-segura', $user->fresh()->password));
    }
}
