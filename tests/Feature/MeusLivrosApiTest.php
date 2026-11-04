<?php

namespace Tests\Feature;

use App\Models\Livro;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MeusLivrosApiTest extends TestCase
{
    use RefreshDatabase;

    private function criarLivro(User $vendedor, array $dados = []): Livro
    {
        return $vendedor->livros()->create(array_merge(
            Livro::factory()->make()->getAttributes(),
            $dados,
        ));
    }

    public function test_endpoint_exige_autenticacao(): void
    {
        $this->getJson('/api/meus-livros')->assertUnauthorized();
    }

    public function test_retorna_somente_anuncios_disponiveis_do_usuario_autenticado(): void
    {
        $vendedor = User::factory()->create();
        $outroVendedor = User::factory()->create();
        $proprioDisponivel = $this->criarLivro($vendedor, [
            'titulo' => 'Meu livro disponível',
            'estoque' => 3,
        ]);
        $this->criarLivro($vendedor, [
            'titulo' => 'Meu livro esgotado',
            'estoque' => 0,
        ]);
        $livroDeOutraPessoa = $this->criarLivro($outroVendedor, [
            'titulo' => 'Livro de outra pessoa',
            'estoque' => 5,
        ]);
        Sanctum::actingAs($vendedor);

        $resposta = $this->getJson('/api/meus-livros');

        $resposta->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $proprioDisponivel->id)
            ->assertJsonPath('0.vendedor.id', $vendedor->id)
            ->assertJsonPath('0.estoque', 3);
        $this->assertNotSame($livroDeOutraPessoa->id, $resposta->json('0.id'));
    }

    public function test_responde_lista_vazia_quando_nao_ha_anuncios_com_estoque(): void
    {
        $vendedor = User::factory()->create();
        $this->criarLivro($vendedor, ['estoque' => 0]);
        Sanctum::actingAs($vendedor);

        $this->getJson('/api/meus-livros')->assertOk()->assertExactJson([]);
    }

    public function test_usuario_pode_editar_e_excluir_anuncio_da_sua_lista(): void
    {
        $vendedor = User::factory()->create();
        $livro = $this->criarLivro($vendedor, [
            'titulo' => 'Título original',
            'estoque' => 2,
        ]);
        Sanctum::actingAs($vendedor);

        $this->getJson('/api/meus-livros')
            ->assertOk()
            ->assertJsonPath('0.id', $livro->id);

        $this->patchJson("/api/livros/{$livro->id}", [
            'titulo' => 'Título atualizado',
            'estoque' => 4,
        ])->assertOk()
            ->assertJsonPath('titulo', 'Título atualizado')
            ->assertJsonPath('estoque', 4);

        $this->getJson('/api/meus-livros')
            ->assertOk()
            ->assertJsonPath('0.titulo', 'Título atualizado');

        $this->deleteJson("/api/livros/{$livro->id}")->assertNoContent();
        $this->getJson('/api/meus-livros')->assertOk()->assertExactJson([]);
    }

    public function test_edicao_e_exclusao_continuam_restritas_ao_proprietario(): void
    {
        $vendedor = User::factory()->create();
        $visitante = User::factory()->create();
        $livro = $this->criarLivro($vendedor, ['titulo' => 'Anúncio protegido']);
        Sanctum::actingAs($visitante);

        $this->getJson('/api/meus-livros')->assertOk()->assertExactJson([]);
        $this->patchJson("/api/livros/{$livro->id}", ['titulo' => 'Alteração indevida'])
            ->assertNotFound();
        $this->deleteJson("/api/livros/{$livro->id}")->assertNotFound();

        $this->assertDatabaseHas('livros', [
            'id' => $livro->id,
            'titulo' => 'Anúncio protegido',
            'user_id' => $vendedor->id,
        ]);
    }
}
