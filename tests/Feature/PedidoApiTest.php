<?php

namespace Tests\Feature;

use App\Models\ItemPedido;
use App\Models\Livro;
use App\Models\Pedido;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PedidoApiTest extends TestCase
{
    use RefreshDatabase;

    private function autenticar(?User $user = null): User
    {
        $user ??= User::factory()->create();
        Sanctum::actingAs($user);

        return $user;
    }

    private function criarLivro(User $vendedor, array $dados = []): Livro
    {
        return $vendedor->livros()->create(array_merge(
            Livro::factory()->make()->getAttributes(),
            $dados,
        ));
    }

    public function test_pedidos_exigem_autenticacao(): void
    {
        $this->getJson('/api/pedidos')->assertUnauthorized();
        $this->postJson('/api/pedidos', ['itens' => [['livro_id' => 1, 'quantidade' => 1]]])
            ->assertUnauthorized();
        $this->getJson('/api/pedidos/1')->assertUnauthorized();
    }

    public function test_cria_pedido_com_livros_de_vendedores_diferentes_e_usa_precos_do_banco(): void
    {
        $comprador = $this->autenticar();
        $vendedorA = User::factory()->create(['name' => 'Vendedora A']);
        $vendedorB = User::factory()->create(['name' => 'Vendedor B']);
        $livroA = $this->criarLivro($vendedorA, [
            'titulo' => 'Livro A',
            'autor' => 'Autora A',
            'preco' => '12.34',
            'estoque' => 3,
        ]);
        $livroB = $this->criarLivro($vendedorB, [
            'titulo' => 'Livro B',
            'autor' => 'Autor B',
            'preco' => '5.55',
            'estoque' => 2,
        ]);

        $response = $this->postJson('/api/pedidos', [
            'itens' => [
                ['livro_id' => $livroA->id, 'quantidade' => 2],
                ['livro_id' => $livroB->id, 'quantidade' => 1],
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('status', 'confirmado')
            ->assertJsonPath('total', '30.23')
            ->assertJsonCount(2, 'itens')
            ->assertJsonPath('itens.0.preco_unitario', '12.34')
            ->assertJsonPath('itens.0.subtotal', '24.68')
            ->assertJsonPath('itens.0.titulo', 'Livro A')
            ->assertJsonPath('itens.0.vendedor.name', 'Vendedora A')
            ->assertJsonPath('itens.1.preco_unitario', '5.55')
            ->assertJsonPath('itens.1.subtotal', '5.55')
            ->assertJsonPath('itens.1.vendedor.name', 'Vendedor B');

        $this->assertDatabaseHas('pedidos', [
            'id' => $response->json('id'),
            'user_id' => $comprador->id,
            'total' => '30.23',
        ]);
        $this->assertDatabaseHas('itens_pedido', [
            'pedido_id' => $response->json('id'),
            'livro_id' => $livroA->id,
            'preco_unitario' => '12.34',
            'quantidade' => 2,
            'subtotal' => '24.68',
        ]);
        $this->assertSame(1, $livroA->fresh()->estoque);
        $this->assertSame(1, $livroB->fresh()->estoque);
    }

    public function test_rejeita_compra_do_proprio_livro_sem_alterar_estoque(): void
    {
        $comprador = $this->autenticar();
        $livro = $this->criarLivro($comprador, ['estoque' => 4]);

        $this->postJson('/api/pedidos', [
            'itens' => [['livro_id' => $livro->id, 'quantidade' => 1]],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['itens.0.livro_id']);

        $this->assertSame(4, $livro->fresh()->estoque);
        $this->assertSame(0, Pedido::count());
    }

    public function test_rejeita_livro_inexistente_ou_sem_estoque(): void
    {
        $this->autenticar();
        $vendedor = User::factory()->create();
        $semEstoque = $this->criarLivro($vendedor, ['estoque' => 0]);

        $this->postJson('/api/pedidos', [
            'itens' => [['livro_id' => 999999, 'quantidade' => 1]],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['itens.0.livro_id']);

        $this->postJson('/api/pedidos', [
            'itens' => [['livro_id' => $semEstoque->id, 'quantidade' => 1]],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['itens.0.livro_id']);

        $this->assertSame(0, Pedido::count());
    }

    public function test_reverte_pedido_inteiro_quando_um_item_excede_o_estoque(): void
    {
        $this->autenticar();
        $vendedor = User::factory()->create();
        $livroDisponivel = $this->criarLivro($vendedor, ['estoque' => 5]);
        $livroComPoucoEstoque = $this->criarLivro($vendedor, ['estoque' => 1]);

        $this->postJson('/api/pedidos', [
            'itens' => [
                ['livro_id' => $livroDisponivel->id, 'quantidade' => 2],
                ['livro_id' => $livroComPoucoEstoque->id, 'quantidade' => 2],
            ],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['itens.1.quantidade']);

        $this->assertSame(5, $livroDisponivel->fresh()->estoque);
        $this->assertSame(1, $livroComPoucoEstoque->fresh()->estoque);
        $this->assertSame(0, Pedido::count());
        $this->assertSame(0, ItemPedido::count());
    }

    public function test_valida_quantidades_itens_distintos_e_nao_aceita_precos_do_cliente(): void
    {
        $this->autenticar();
        $vendedor = User::factory()->create();
        $livro = $this->criarLivro($vendedor, ['estoque' => 3]);

        $this->postJson('/api/pedidos', [
            'itens' => [['livro_id' => $livro->id, 'quantidade' => 0]],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['itens.0.quantidade']);

        $this->postJson('/api/pedidos', [
            'itens' => [
                ['livro_id' => $livro->id, 'quantidade' => 1],
                ['livro_id' => $livro->id, 'quantidade' => 1],
            ],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['itens.1.livro_id']);

        $this->postJson('/api/pedidos', [
            'itens' => [['livro_id' => $livro->id, 'quantidade' => 1, 'preco' => 0.01]],
            'total' => 0.01,
        ])->assertUnprocessable();

        $this->assertSame(3, $livro->fresh()->estoque);
        $this->assertSame(0, Pedido::count());
    }

    public function test_usuario_so_lista_e_consulta_seus_proprios_pedidos(): void
    {
        $compradorA = $this->autenticar();
        $compradorB = User::factory()->create();
        $vendedor = User::factory()->create();
        $livro = $this->criarLivro($vendedor, ['estoque' => 3]);

        $pedidoA = $compradorA->pedidos()->create(['status' => 'confirmado', 'total' => '10.00']);
        $pedidoA->itens()->create([
            'livro_id' => $livro->id,
            'vendedor_id' => $vendedor->id,
            'livro_titulo' => 'Título salvo A',
            'livro_autor' => 'Autor salvo A',
            'livro_foto' => null,
            'vendedor_nome' => $vendedor->name,
            'preco_unitario' => '10.00',
            'quantidade' => 1,
            'subtotal' => '10.00',
        ]);
        $pedidoB = $compradorB->pedidos()->create(['status' => 'confirmado', 'total' => '10.00']);

        $this->getJson('/api/pedidos')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $pedidoA->id)
            ->assertJsonPath('0.itens.0.titulo', 'Título salvo A');
        $this->getJson("/api/pedidos/{$pedidoA->id}")
            ->assertOk()
            ->assertJsonPath('id', $pedidoA->id);
        $this->getJson("/api/pedidos/{$pedidoB->id}")->assertNotFound();
    }

    public function test_item_do_pedido_preserva_snapshot_apos_edicao_do_livro(): void
    {
        $this->autenticar();
        $vendedor = User::factory()->create();
        $livro = $this->criarLivro($vendedor, [
            'titulo' => 'Título original',
            'autor' => 'Autor original',
            'preco' => '17.90',
            'estoque' => 2,
        ]);

        $resposta = $this->postJson('/api/pedidos', [
            'itens' => [['livro_id' => $livro->id, 'quantidade' => 1]],
        ])->assertCreated();

        $livro->update([
            'titulo' => 'Título atualizado',
            'autor' => 'Outro autor',
            'preco' => '99.99',
        ]);

        $this->getJson('/api/pedidos/'.$resposta->json('id'))
            ->assertOk()
            ->assertJsonPath('total', '17.90')
            ->assertJsonPath('itens.0.titulo', 'Título original')
            ->assertJsonPath('itens.0.autor', 'Autor original')
            ->assertJsonPath('itens.0.preco_unitario', '17.90');
    }
}
