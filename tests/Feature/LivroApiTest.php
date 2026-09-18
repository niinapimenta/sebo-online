<?php

namespace Tests\Feature;

use App\Models\Livro;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LivroApiTest extends TestCase
{
    use RefreshDatabase;

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
            ]);
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
        $payload = [
            'titulo' => 'Vidas Secas',
            'autor' => 'Graciliano Ramos',
            'editora' => 'José Olympio',
            'preco' => 32.00,
            'estoque' => 7,
            'ano_publicacao' => 1938,
            'data_publicacao' => '1938-05-10',
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

        $this->assertDatabaseHas('livros', [
            'titulo' => 'Vidas Secas',
            'autor' => 'Graciliano Ramos',
            'preco' => 32.00,
            'estoque' => 7,
        ]);
    }

    public function test_can_create_a_book_with_photo_upload(): void
    {
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
    }

    public function test_validates_required_fields_when_creating_book(): void
    {
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
        $livro = Livro::factory()->create([
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
        $livro = Livro::factory()->create([
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
        Storage::fake('public');

        $fotoAntiga = UploadedFile::fake()->create('antiga.jpg', 100, 'image/jpeg');
        $caminhoAntigo = $fotoAntiga->store('livros', 'public');

        $livro = Livro::factory()->create([
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
        Storage::fake('public');

        $foto = UploadedFile::fake()->create('foto_excluir.jpg', 100, 'image/jpeg');
        $caminhoFoto = $foto->store('livros', 'public');

        $livro = Livro::factory()->create([
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
        $response = $this->deleteJson('/api/livros/99999');

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Livro não encontrado.',
            ]);
    }
}
