<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_web_login_starts_a_session_and_returns_only_public_user_fields(): void
    {
        $user = User::factory()->create([
            'name' => 'Ana Leitora',
            'email' => 'ana@example.test',
            'password' => 'livros-seguros',
        ]);

        $response = $this->postJson('/login', [
            'email' => 'ana@example.test',
            'password' => 'livros-seguros',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.name', 'Ana Leitora')
            ->assertJsonPath('data.email', 'ana@example.test')
            ->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('data.token');

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_web_session_authenticates_the_api_user_endpoint_for_expo_origin(): void
    {
        $user = User::factory()->create([
            'name' => 'Ana Leitora',
            'email' => 'ana@example.test',
            'password' => 'livros-seguros',
        ]);

        $this->withHeader('Origin', 'http://localhost:8081')
            ->postJson('/login', [
                'email' => 'ana@example.test',
                'password' => 'livros-seguros',
            ])
            ->assertOk();

        $this->withHeader('Origin', 'http://localhost:8081')
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.name', 'Ana Leitora')
            ->assertJsonPath('data.email', 'ana@example.test');
    }

    public function test_web_login_returns_422_for_invalid_fields_and_401_for_wrong_credentials(): void
    {
        $invalidFields = $this->postJson('/login', [
            'email' => 'not-an-email',
        ]);

        $invalidFields->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);

        User::factory()->create([
            'email' => 'ana@example.test',
            'password' => 'livros-seguros',
        ]);

        $wrongCredentials = $this->postJson('/login', [
            'email' => 'ana@example.test',
            'password' => 'senha-incorreta',
        ]);

        $wrongCredentials->assertUnauthorized()
            ->assertJson(['message' => 'Credenciais inválidas.']);
    }

    public function test_web_logout_ends_only_the_current_session(): void
    {
        $user = User::factory()->create([
            'email' => 'ana@example.test',
            'password' => 'livros-seguros',
        ]);

        $this->postJson('/login', [
            'email' => 'ana@example.test',
            'password' => 'livros-seguros',
        ])->assertOk();

        $this->assertAuthenticatedAs($user, 'web');

        $this->postJson('/logout')->assertNoContent();

        $this->assertGuest('web');
    }

    public function test_mobile_login_issues_a_token_with_a_thirty_day_expiration(): void
    {
        config(['sanctum.expiration' => 43200]);

        $user = User::factory()->create([
            'name' => 'Ana Leitora',
            'email' => 'ana@example.test',
            'password' => 'livros-seguros',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'ana@example.test',
            'password' => 'livros-seguros',
            'device_name' => 'Traça Android',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.name', 'Ana Leitora')
            ->assertJsonPath('data.user.email', 'ana@example.test')
            ->assertJsonMissingPath('data.user.password')
            ->assertJsonStructure(['data' => ['token', 'expires_at', 'user']]);

        $token = $user->tokens()->latest('created_at')->firstOrFail();
        $expectedExpiry = $token->created_at->copy()->addMinutes(43200);

        $this->assertSame($expectedExpiry->toISOString(), $response->json('data.expires_at'));
        $this->assertSame('Traça Android', $token->name);
    }

    public function test_mobile_login_returns_422_for_invalid_fields_and_401_for_wrong_credentials(): void
    {
        $invalidFields = $this->postJson('/api/login', [
            'email' => 'not-an-email',
            'password' => 'x',
        ]);

        $invalidFields->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'device_name']);

        User::factory()->create([
            'email' => 'ana@example.test',
            'password' => 'livros-seguros',
        ]);

        $wrongCredentials = $this->postJson('/api/login', [
            'email' => 'ana@example.test',
            'password' => 'senha-incorreta',
            'device_name' => 'Traça Android',
        ]);

        $wrongCredentials->assertUnauthorized()
            ->assertJson(['message' => 'Credenciais inválidas.']);
    }

    public function test_mobile_token_authenticates_user_and_logout_revokes_only_that_token(): void
    {
        $user = User::factory()->create([
            'name' => 'Ana Leitora',
            'email' => 'ana@example.test',
            'password' => 'livros-seguros',
        ]);

        $firstToken = $user->createToken('Traça Android')->plainTextToken;
        $secondToken = $user->createToken('Traça iOS')->plainTextToken;
        $firstTokenId = $user->tokens()->where('name', 'Traça Android')->value('id');

        $this->withToken($firstToken)->getJson('/api/user')
            ->assertOk()
            ->assertExactJson([
                'data' => [
                    'id' => $user->id,
                    'name' => 'Ana Leitora',
                    'email' => 'ana@example.test',
                ],
            ]);

        $this->withToken($firstToken)->postJson('/api/logout')->assertNoContent();

        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $firstTokenId]);
        $this->app['auth']->forgetGuards();
        $this->withToken($firstToken)->getJson('/api/user')->assertUnauthorized();
        $this->app['auth']->forgetGuards();
        $this->withToken($secondToken)->getJson('/api/user')->assertOk();
    }

    public function test_mobile_logout_does_not_treat_a_web_session_as_a_bearer_token(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web')
            ->postJson('/api/logout')
            ->assertUnauthorized();

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_expired_mobile_tokens_are_rejected(): void
    {
        config(['sanctum.expiration' => 43200]);

        $user = User::factory()->create();
        $plainTextToken = $user->createToken('Traça Android')->plainTextToken;

        PersonalAccessToken::query()
            ->where('tokenable_id', $user->id)
            ->update(['created_at' => now()->subMinutes(43201)]);

        $this->withToken($plainTextToken)->getJson('/api/user')->assertUnauthorized();
    }

    public function test_user_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_authenticated_user_can_update_own_name_and_email(): void
    {
        $user = User::factory()->create([
            'name' => 'Nome anterior',
            'email' => 'anterior@example.test',
        ]);

        $response = $this->actingAs($user, 'sanctum')->patchJson('/api/user', [
            'name' => 'Nome atualizado',
            'email' => 'novo@example.test',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.name', 'Nome atualizado')
            ->assertJsonPath('data.email', 'novo@example.test')
            ->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('data.token')
            ->assertJsonMissingPath('data.tokens');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Nome atualizado',
            'email' => 'novo@example.test',
        ]);
    }

    public function test_authenticated_user_can_keep_their_current_email(): void
    {
        $user = User::factory()->create([
            'name' => 'Nome anterior',
            'email' => 'atual@example.test',
        ]);

        $this->actingAs($user, 'sanctum')
            ->patchJson('/api/user', [
                'name' => 'Nome atualizado',
                'email' => 'atual@example.test',
            ])
            ->assertOk()
            ->assertJsonPath('data.email', 'atual@example.test');
    }

    public function test_profile_update_rejects_an_email_used_by_another_user(): void
    {
        $user = User::factory()->create(['email' => 'usuario@example.test']);
        User::factory()->create(['email' => 'ocupado@example.test']);

        $this->actingAs($user, 'sanctum')
            ->patchJson('/api/user', [
                'name' => 'Nome atualizado',
                'email' => 'ocupado@example.test',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_profile_update_rejects_invalid_or_missing_fields(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->patchJson('/api/user', [
                'name' => '',
                'email' => 'email-invalido',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email']);
    }

    public function test_profile_update_requires_authentication(): void
    {
        $this->patchJson('/api/user', [
            'name' => 'Nome',
            'email' => 'nome@example.test',
        ])->assertUnauthorized();
    }

    public function test_profile_update_ignores_extra_identity_and_password_fields(): void
    {
        $user = User::factory()->create([
            'name' => 'Conta autenticada',
            'email' => 'autenticada@example.test',
        ]);
        $otherUser = User::factory()->create([
            'name' => 'Outra conta',
            'email' => 'outra@example.test',
        ]);
        $otherPassword = $otherUser->password;

        $response = $this->actingAs($user, 'sanctum')->patchJson('/api/user', [
            'name' => 'Conta atualizada',
            'email' => 'atualizada@example.test',
            'id' => $otherUser->id,
            'user_id' => $otherUser->id,
            'password' => 'senha-atacante',
            'is_admin' => true,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.name', 'Conta atualizada')
            ->assertJsonPath('data.email', 'atualizada@example.test')
            ->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('data.tokens');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Conta atualizada',
            'email' => 'atualizada@example.test',
        ]);
        $this->assertDatabaseHas('users', [
            'id' => $otherUser->id,
            'name' => 'Outra conta',
            'email' => 'outra@example.test',
            'password' => $otherPassword,
        ]);
    }
}
