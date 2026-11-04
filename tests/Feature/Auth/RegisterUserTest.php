<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RegisterUserTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_valid_registration_creates_a_user_without_authenticating_them(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Ana Leitora',
            'email' => 'ana@example.test',
            'password' => 'livros-seguros',
            'password_confirmation' => 'livros-seguros',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Ana Leitora')
            ->assertJsonPath('data.email', 'ana@example.test')
            ->assertJsonStructure([
                'data' => ['id', 'name', 'email'],
                'message',
            ]);

        $user = User::where('email', 'ana@example.test')->firstOrFail();

        $this->assertTrue(Hash::check('livros-seguros', $user->password));
        $this->assertGuest();
    }

    public function test_registration_rejects_a_duplicate_email(): void
    {
        User::factory()->create(['email' => 'ana@example.test']);

        $response = $this->postJson('/api/register', [
            'name' => 'Ana Leitora',
            'email' => 'ana@example.test',
            'password' => 'livros-seguros',
            'password_confirmation' => 'livros-seguros',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_registration_rejects_missing_or_invalid_fields(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => '',
            'email' => 'email-invalido',
            'password' => '1234567',
            'password_confirmation' => '1234567',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);

        $missingFieldsResponse = $this->postJson('/api/register', []);

        $missingFieldsResponse->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_registration_rejects_a_different_password_confirmation(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Ana Leitora',
            'email' => 'ana@example.test',
            'password' => 'livros-seguros',
            'password_confirmation' => 'senha-diferente',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_registration_response_does_not_expose_sensitive_fields(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Ana Leitora',
            'email' => 'ana@example.test',
            'password' => 'livros-seguros',
            'password_confirmation' => 'livros-seguros',
        ]);

        $response->assertCreated()
            ->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('data.password_confirmation')
            ->assertJsonMissingPath('data.token')
            ->assertJsonMissingPath('password')
            ->assertJsonMissingPath('token');
    }
}
