<?php

namespace Tests\Feature;

use App\Models\Livro;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LivroApiTest extends TestCase
{
    use RefreshDatabase;

    private function autenticarUsuario(?User $user = null): User
    {
        $user ??= User::factory()->create();

        Sanctum::actingAs($user);

        return $user;
    }

    private function criarLivroDoVendedor(User $vendedor, array $attributes = []): Livro
    {
        return Livro::factory()->for($vendedor, 'user')->create($attributes);
    }

    public function test_can_list_all_books(): void
    {
        Livro::factory()->count(3)->create();

        $response = $this->getJson('/api/livros');

        $response->assertStatus(200)
            ->assertJsonCount(3)
            ->assertJsonStructure([
                '*' => [
                    'id',
                    'titulo',
                    'autor',
                    'editora',
                    'preco',
                    'estoque',
                    'ano_publicacao',
                    'data_publicacao',
                    'descricao',
                    'foto',
                    'created_at',
                    'updated_at',
                ],
            ]);
    }

    public function test_public_catalog_includes_books_from_all_vendors_and_legacy_books(): void
    {
        $primeiroVendedor = User::factory()->create(['name' => 'Vendedora Um']);
        $segundoVendedor = User::factory()->create(['name' => 'Vendedor Dois']);

        $primeiroVendedor->livros()->create(Livro::factory()->make()->getAttributes());
        $segundoVendedor->livros()->create(Livro::factory()->make()->getAttributes());
        Livro::factory()->create();

        $response = $this->getJson('/api/livros');

        $response->assertOk()
            ->assertJsonCount(3)
            ->assertJsonFragment(['name' => 'Vendedora Um'])
            ->assertJsonFragment(['name' => 'Vendedor Dois'])
            ->assertJsonFragment(['vendedor' => null]);
    }

    public function test_can_filter_books_by_search_query(): void
    {
        Livro::factory()->create([
            'titulo' => 'Dom Casmurro',
            'autor' => 'Machado de Assis',
        ]);

        Livro::factory()->create([
            'titulo' => 'Capitães da Areia',
            'autor' => 'Jorge Amado',
        ]);

        $response = $this->getJson('/api/livros?busca=Machado');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment(['titulo' => 'Dom Casmurro']);
    }

    public function test_can_show_a_specific_book(): void
    {
        $livro = Livro::factory()->create([
            'titulo' => 'Memórias Póstumas de Brás Cubas',
            'autor' => 'Machado de Assis',
            'editora' => 'Tipografia Nacional',
            'preco' => 35.50,
            'estoque' => 4,
            'ano_publicacao' => 1881,
            'data_publicacao' => '1881-01-01',
            'descricao' => 'Excelente estado.',
        ]);

        $response = $this->getJson("/api/livros/{$livro->id}");

        $response->assertStatus(200)
            ->assertJson([
                'id' => $livro->id,
                'titulo' => 'Memórias Póstumas de Brás Cubas',
                'autor' => 'Machado de Assis',
                'editora' => 'Tipografia Nacional',
                'preco' => 35.50,
                'estoque' => 4,
                'ano_publicacao' => 1881,
                'data_publicacao' => '1881-01-01',
                'descricao' => 'Excelente estado.',
                'foto' => null,
                'vendedor' => null,
            ]);
    }

    public function test_public_book_response_contains_only_public_vendor_identity(): void
    {
        $vendedor = User::factory()->create([
            'name' => 'Vendedora Pública',
            'email' => 'privado@example.test',
        ]);
        $livro = $vendedor->livros()->create(Livro::factory()->make()->getAttributes());

        $response = $this->getJson("/api/livros/{$livro->id}");

        $response->assertOk()
            ->assertJsonPath('vendedor.id', $vendedor->id)
            ->assertJsonPath('vendedor.name', 'Vendedora Pública')
            ->assertJsonMissingPath('vendedor.email')
            ->assertJsonMissingPath('vendedor.password')
            ->assertJsonMissingPath('vendedor.tokens')
            ->assertJsonMissingPath('token');
    }

    public function test_unauthenticated_visitors_cannot_write_books(): void
    {
        $livro = Livro::factory()->create();
        $payload = [
            'titulo' => 'Livro de Teste',
            'autor' => 'Autora Teste',
            'preco' => 20.00,
            'estoque' => 1,
            'ano_publicacao' => 2020,
            'data_publicacao' => '2020-01-01',
        ];

        $this->postJson('/api/livros', $payload)->assertUnauthorized();
        $this->putJson("/api/livros/{$livro->id}", $payload)->assertUnauthorized();
        $this->patchJson("/api/livros/{$livro->id}", ['estoque' => 2])->assertUnauthorized();
        $this->deleteJson("/api/livros/{$livro->id}")->assertUnauthorized();
    }

    public function test_returns_404_when_book_does_not_exist(): void
    {
        $response = $this->getJson('/api/livros/99999');

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Livro não encontrado.',
            ]);
    }

    public function test_can_create_a_book_without_photo(): void
    {
        $vendedor = $this->autenticarUsuario();
        $outroUsuario = User::factory()->create();
        $payload = [
            'titulo' => 'Vidas Secas',
            'autor' => 'Graciliano Ramos',
            'editora' => 'José Olympio',
            'preco' => 32.00,
            'estoque' => 7,
            'ano_publicacao' => 1938,
            'data_publicacao' => '1938-05-10',
            'user_id' => $outroUsuario->id,
            'descricao' => 'Clássico da literatura regionalista.',
        ];

        $response = $this->postJson('/api/livros', $payload);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'titulo' => 'Vidas Secas',
                'autor' => 'Graciliano Ramos',
                'editora' => 'José Olympio',
                'preco' => 32.00,
                'estoque' => 7,
                'ano_publicacao' => 1938,
                'data_publicacao' => '1938-05-10',
                'foto' => null,
            ]);

        $response->assertJsonPath('vendedor.id', $vendedor->id)
            ->assertJsonPath('vendedor.name', $vendedor->name)
            ->assertJsonMissingPath('vendedor.email')
            ->assertJsonMissingPath('vendedor.password')
            ->assertJsonMissingPath('vendedor.tokens');

        $this->assertDatabaseHas('livros', [
            'titulo' => 'Vidas Secas',
            'autor' => 'Graciliano Ramos',
            'preco' => 32.00,
            'estoque' => 7,
            'user_id' => $vendedor->id,
        ]);
    }

    public function test_can_create_a_book_with_photo_upload(): void
    {
        $vendedor = $this->autenticarUsuario();
        Storage::fake('public');

        $foto = UploadedFile::fake()->create('capa_dom_casmurro.jpg', 200, 'image/jpeg');

        $payload = [
            'titulo' => 'Dom Casmurro',
            'autor' => 'Machado de Assis',
            'editora' => 'Livraria Garnier',
            'preco' => 28.50,
            'estoque' => 3,
            'ano_publicacao' => 1899,
            'data_publicacao' => '1899-01-01',
            'descricao' => 'Capa dura em ótimo estado.',
            'foto' => $foto,
        ];

        $response = $this->postJson('/api/livros', $payload);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'titulo' => 'Dom Casmurro',
                'autor' => 'Machado de Assis',
            ]);

        $livro = Livro::first();
        $this->assertNotNull($livro->foto);
        $this->assertStringStartsWith('livros/', $livro->foto);

        Storage::disk('public')->assertExists($livro->foto);

        $this->assertNotNull($response->json('foto'));
        $this->assertStringContainsString('/storage/livros/', $response->json('foto'));
        $this->assertSame($vendedor->id, $livro->user_id);
        $response->assertJsonPath('vendedor.id', $vendedor->id);
    }

    public function test_validates_required_fields_when_creating_book(): void
    {
        $this->autenticarUsuario();

        $response = $this->postJson('/api/livros', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'titulo',
                'autor',
                'preco',
                'estoque',
                'ano_publicacao',
                'data_publicacao',
            ]);
    }

    public function test_validates_numeric_rules_for_price_and_stock(): void
    {
        $this->autenticarUsuario();

        $response = $this->postJson('/api/livros', [
            'titulo' => 'Livro Inválido',
            'autor' => 'Autor Teste',
            'preco' => 0,
            'estoque' => -2,
            'ano_publicacao' => 2000,
            'data_publicacao' => '2000-01-01',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['preco', 'estoque']);
    }

    public function test_validates_future_publication_year(): void
    {
        $this->autenticarUsuario();

        $anoFuturo = (int) date('Y') + 5;

        $response = $this->postJson('/api/livros', [
            'titulo' => 'Livro do Futuro',
            'autor' => 'Viajante do Tempo',
            'preco' => 45.00,
            'estoque' => 1,
            'ano_publicacao' => $anoFuturo,
            'data_publicacao' => '2030-01-01',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['ano_publicacao']);
    }

    public function test_validates_invalid_photo_file(): void
    {
        $this->autenticarUsuario();

        $arquivoInvalido = UploadedFile::fake()->create('documento.pdf', 100, 'application/pdf');

        $response = $this->postJson('/api/livros', [
            'titulo' => 'Livro com PDF',
            'autor' => 'Autor Teste',
            'preco' => 20.00,
            'estoque' => 1,
            'ano_publicacao' => 2020,
            'data_publicacao' => '2020-01-01',
            'foto' => $arquivoInvalido,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['foto']);
    }

    public function test_validates_photo_max_size(): void
    {
        $this->autenticarUsuario();

        // 6000 KB exceeds the 5120 KB limit
        $fotoGrande = UploadedFile::fake()->create('foto_gigante.jpg', 6000, 'image/jpeg');

        $response = $this->postJson('/api/livros', [
            'titulo' => 'Livro com Foto Grande',
            'autor' => 'Autor Teste',
            'preco' => 20.00,
            'estoque' => 1,
            'ano_publicacao' => 2020,
            'data_publicacao' => '2020-01-01',
            'foto' => $fotoGrande,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['foto']);
    }

    public function test_can_update_a_book_with_put(): void
    {
        $vendedor = $this->autenticarUsuario();
        $livro = $this->criarLivroDoVendedor($vendedor, [
            'titulo' => 'Título Antigo',
            'autor' => 'Autor Antigo',
            'preco' => 20.00,
            'estoque' => 2,
        ]);

        $updateData = [
            'titulo' => 'Título Atualizado',
            'autor' => 'Autor Atualizado',
            'editora' => 'Nova Editora',
            'preco' => 39.90,
            'estoque' => 5,
            'ano_publicacao' => 2021,
            'data_publicacao' => '2021-06-15',
            'descricao' => 'Descrição atualizada.',
        ];

        $response = $this->putJson("/api/livros/{$livro->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'titulo' => 'Título Atualizado',
                'autor' => 'Autor Atualizado',
                'preco' => 39.90,
                'estoque' => 5,
            ]);

        $this->assertDatabaseHas('livros', [
            'id' => $livro->id,
            'titulo' => 'Título Atualizado',
            'preco' => 39.90,
            'estoque' => 5,
        ]);
    }

    public function test_can_partially_update_a_book_with_patch(): void
    {
        $vendedor = User::factory()->create();
        $this->autenticarUsuario($vendedor);
        $livro = $this->criarLivroDoVendedor($vendedor, [
            'titulo' => 'Iracema',
            'autor' => 'José de Alencar',
            'preco' => 18.00,
            'estoque' => 4,
        ]);

        $response = $this->patchJson("/api/livros/{$livro->id}", [
            'preco' => 22.50,
            'estoque' => 10,
        ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'id' => $livro->id,
                'titulo' => 'Iracema',
                'preco' => 22.50,
                'estoque' => 10,
            ]);

        $this->assertDatabaseHas('livros', [
            'id' => $livro->id,
            'titulo' => 'Iracema',
            'preco' => 22.50,
            'estoque' => 10,
        ]);
    }

    public function test_can_update_photo_and_removes_old_photo_from_disk(): void
    {
        $vendedor = $this->autenticarUsuario();
        Storage::fake('public');

        $fotoAntiga = UploadedFile::fake()->create('antiga.jpg', 100, 'image/jpeg');
        $caminhoAntigo = $fotoAntiga->store('livros', 'public');

        $livro = $this->criarLivroDoVendedor($vendedor, [
            'foto' => $caminhoAntigo,
        ]);

        Storage::disk('public')->assertExists($caminhoAntigo);

        $novaFoto = UploadedFile::fake()->create('nova.png', 120, 'image/png');

        $response = $this->postJson("/api/livros/{$livro->id}", [
            '_method' => 'PUT',
            'titulo' => $livro->titulo,
            'autor' => $livro->autor,
            'preco' => $livro->preco,
            'estoque' => $livro->estoque,
            'ano_publicacao' => $livro->ano_publicacao,
            'data_publicacao' => $livro->data_publicacao->format('Y-m-d'),
            'foto' => $novaFoto,
        ]);

        $response->assertStatus(200);

        $livro->refresh();
        Storage::disk('public')->assertMissing($caminhoAntigo);
        Storage::disk('public')->assertExists($livro->foto);
        $this->assertNotEquals($caminhoAntigo, $livro->foto);
    }

    public function test_returns_404_when_updating_nonexistent_book(): void
    {
        $this->autenticarUsuario();

        $response = $this->putJson('/api/livros/99999', [
            'titulo' => 'Teste',
            'autor' => 'Autor',
            'preco' => 10.00,
            'estoque' => 1,
            'ano_publicacao' => 2020,
            'data_publicacao' => '2020-01-01',
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Livro não encontrado.',
            ]);
    }

    public function test_can_delete_a_book_and_removes_its_photo(): void
    {
        $vendedor = $this->autenticarUsuario();
        Storage::fake('public');

        $foto = UploadedFile::fake()->create('foto_excluir.jpg', 100, 'image/jpeg');
        $caminhoFoto = $foto->store('livros', 'public');

        $livro = $this->criarLivroDoVendedor($vendedor, [
            'foto' => $caminhoFoto,
        ]);

        Storage::disk('public')->assertExists($caminhoFoto);

        $response = $this->deleteJson("/api/livros/{$livro->id}");

        $response->assertStatus(204);

        $this->assertDatabaseMissing('livros', [
            'id' => $livro->id,
        ]);

        Storage::disk('public')->assertMissing($caminhoFoto);
    }

    public function test_returns_404_when_deleting_nonexistent_book(): void
    {
        $this->autenticarUsuario();

        $response = $this->deleteJson('/api/livros/99999');

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Livro não encontrado.',
            ]);
    }

    public function test_seller_cannot_update_another_sellers_book(): void
    {
        $owner = User::factory()->create();
        $this->autenticarUsuario();
        $livro = $this->criarLivroDoVendedor($owner, ['titulo' => 'Título original']);

        $response = $this->patchJson("/api/livros/{$livro->id}", [
            'titulo' => 'Título alterado',
        ]);

        $response->assertNotFound();
        $this->assertDatabaseHas('livros', [
            'id' => $livro->id,
            'titulo' => 'Título original',
            'user_id' => $owner->id,
        ]);
    }

    public function test_seller_cannot_delete_another_sellers_book(): void
    {
        $owner = User::factory()->create();
        $this->autenticarUsuario();
        $livro = $this->criarLivroDoVendedor($owner);

        $this->deleteJson("/api/livros/{$livro->id}")->assertNotFound();

        $this->assertDatabaseHas('livros', [
            'id' => $livro->id,
            'user_id' => $owner->id,
        ]);
    }

    public function test_seller_cannot_update_or_delete_a_book_without_an_owner(): void
    {
        $this->autenticarUsuario();
        $livro = Livro::factory()->create(['titulo' => 'Livro legado']);

        $this->patchJson("/api/livros/{$livro->id}", ['titulo' => 'Alterado'])
            ->assertNotFound();
        $this->deleteJson("/api/livros/{$livro->id}")->assertNotFound();

        $this->assertDatabaseHas('livros', [
            'id' => $livro->id,
            'titulo' => 'Livro legado',
            'user_id' => null,
        ]);
    }

    public function test_public_seller_library_exposes_only_available_books_and_public_data(): void
    {
        Storage::fake('public');
        $vendedor = User::factory()->create([
            'name' => 'Vendedor Público',
            'email' => 'privado@example.test',
        ]);
        $outroVendedor = User::factory()->create();

        $caminhoFoto = UploadedFile::fake()
            ->create('capa.jpg', 100, 'image/jpeg')
            ->store('livros', 'public');

        $livroDisponivelComFoto = $this->criarLivroDoVendedor($vendedor, [
            'titulo' => 'Livro disponível com foto',
            'estoque' => 2,
            'foto' => $caminhoFoto,
        ]);
        $livroDisponivel = $this->criarLivroDoVendedor($vendedor, [
            'titulo' => 'Outro livro disponível',
            'estoque' => 1,
        ]);
        $livroSemEstoque = $this->criarLivroDoVendedor($vendedor, ['estoque' => 0]);
        $livroDeOutroVendedor = $this->criarLivroDoVendedor($outroVendedor, ['estoque' => 5]);
        $livroLegado = Livro::factory()->create(['estoque' => 4, 'user_id' => null]);

        $response = $this->getJson("/api/vendedores/{$vendedor->id}");

        $response->assertOk()
            ->assertJsonPath('data.vendedor.id', $vendedor->id)
            ->assertJsonPath('data.vendedor.name', 'Vendedor Público')
            ->assertJsonCount(2, 'data.livros')
            ->assertJsonStructure([
                'data' => [
                    'vendedor' => ['id', 'name'],
                    'livros' => [
                        '*' => [
                            'id',
                            'titulo',
                            'autor',
                            'editora',
                            'preco',
                            'estoque',
                            'ano_publicacao',
                            'data_publicacao',
                            'descricao',
                            'foto',
                            'vendedor' => ['id', 'name'],
                            'created_at',
                            'updated_at',
                        ],
                    ],
                ],
            ])
            ->assertJsonMissingPath('data.vendedor.email')
            ->assertJsonMissingPath('data.vendedor.password')
            ->assertJsonMissingPath('data.vendedor.tokens');

        $this->assertSame(
            ['id', 'name'],
            array_keys($response->json('data.vendedor')),
        );
        $this->assertEqualsCanonicalizing(
            [$livroDisponivelComFoto->id, $livroDisponivel->id],
            array_column($response->json('data.livros'), 'id'),
        );
        $this->assertStringContainsString(
            '/storage/livros/',
            $response->json('data.livros.0.foto') === null
                ? $response->json('data.livros.1.foto')
                : $response->json('data.livros.0.foto'),
        );
        $this->assertGreaterThan(0, $response->json('data.livros.0.estoque'));
        $this->assertGreaterThan(0, $response->json('data.livros.1.estoque'));
        $this->assertNotContains($livroSemEstoque->id, array_column($response->json('data.livros'), 'id'));
        $this->assertNotContains($livroDeOutroVendedor->id, array_column($response->json('data.livros'), 'id'));
        $this->assertNotContains($livroLegado->id, array_column($response->json('data.livros'), 'id'));
    }

    public function test_public_seller_library_returns_404_for_unknown_seller(): void
    {
        $this->getJson('/api/vendedores/99999')->assertNotFound();
    }

    public function test_public_seller_library_returns_empty_books_when_none_are_available(): void
    {
        $vendedor = User::factory()->create();
        $this->criarLivroDoVendedor($vendedor, ['estoque' => 0]);

        $this->getJson("/api/vendedores/{$vendedor->id}")
            ->assertOk()
            ->assertJsonPath('data.vendedor.id', $vendedor->id)
            ->assertJsonPath('data.livros', []);
    }
}
