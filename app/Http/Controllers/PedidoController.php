<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePedidoRequest;
use App\Http\Resources\PedidoResource;
use App\Models\Livro;
use App\Models\Pedido;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PedidoController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $pedidos = $request->user()
            ->pedidos()
            ->with('itens')
            ->latest()
            ->get();

        return PedidoResource::collection($pedidos);
    }

    public function store(StorePedidoRequest $request): PedidoResource
    {
        $itensSolicitados = $request->validated('itens');
        $comprador = $request->user();

        $pedido = DB::transaction(function () use ($itensSolicitados, $comprador): Pedido {
            $idsLivros = collect($itensSolicitados)
                ->pluck('livro_id')
                ->map(fn ($id) => (int) $id)
                ->sort()
                ->values();

            $livros = Livro::query()
                ->with('user')
                ->whereIn('id', $idsLivros)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $erros = [];
            foreach ($itensSolicitados as $indice => $itemSolicitado) {
                $livro = $livros->get((int) $itemSolicitado['livro_id']);

                if (! $livro) {
                    $erros["itens.{$indice}.livro_id"] = 'Este livro não existe ou não está disponível.';

                    continue;
                }

                if ((int) $livro->user_id === (int) $comprador->id) {
                    $erros["itens.{$indice}.livro_id"] = 'Você não pode comprar um livro anunciado por você.';
                }

                if ($livro->estoque <= 0) {
                    $erros["itens.{$indice}.livro_id"] = 'Este livro está indisponível no momento.';
                } elseif ((int) $itemSolicitado['quantidade'] > $livro->estoque) {
                    $erros["itens.{$indice}.quantidade"] = 'A quantidade solicitada excede o estoque disponível.';
                }
            }

            if ($erros !== []) {
                throw ValidationException::withMessages($erros);
            }

            $linhas = [];
            $totalCentavos = 0;
            foreach ($itensSolicitados as $itemSolicitado) {
                /** @var Livro $livro */
                $livro = $livros->get((int) $itemSolicitado['livro_id']);
                $quantidade = (int) $itemSolicitado['quantidade'];
                $precoUnitarioCentavos = $this->precoParaCentavos((string) $livro->preco);
                $subtotalCentavos = $precoUnitarioCentavos * $quantidade;
                $totalCentavos += $subtotalCentavos;

                $linhas[] = [
                    'livro' => $livro,
                    'quantidade' => $quantidade,
                    'preco_unitario' => $this->centavosParaDecimal($precoUnitarioCentavos),
                    'subtotal' => $this->centavosParaDecimal($subtotalCentavos),
                ];
            }

            /** @var HasMany $relacaoPedidos */
            $relacaoPedidos = $comprador->pedidos();
            $pedido = $relacaoPedidos->create([
                'status' => 'confirmado',
                'total' => $this->centavosParaDecimal($totalCentavos),
            ]);

            foreach ($linhas as $linha) {
                /** @var Livro $livro */
                $livro = $linha['livro'];
                $livro->estoque -= $linha['quantidade'];
                $livro->save();

                $pedido->itens()->create([
                    'livro_id' => $livro->id,
                    'vendedor_id' => $livro->user_id,
                    'livro_titulo' => $livro->titulo,
                    'livro_autor' => $livro->autor,
                    'livro_foto' => $livro->foto,
                    'vendedor_nome' => $livro->user?->name,
                    'preco_unitario' => $linha['preco_unitario'],
                    'quantidade' => $linha['quantidade'],
                    'subtotal' => $linha['subtotal'],
                ]);
            }

            return $pedido->load('itens');
        }, attempts: 3);

        return new PedidoResource($pedido);
    }

    public function show(Request $request, int $id): PedidoResource
    {
        $pedido = $request->user()
            ->pedidos()
            ->with('itens')
            ->findOrFail($id);

        return new PedidoResource($pedido);
    }

    private function precoParaCentavos(string $preco): int
    {
        if (! preg_match('/^(\d+)(?:\.(\d{1,2}))?$/', $preco, $partes)) {
            throw new \UnexpectedValueException('O preço do livro possui formato inválido.');
        }

        $reais = (int) $partes[1];
        $centavos = (int) str_pad($partes[2] ?? '', 2, '0');

        return ($reais * 100) + $centavos;
    }

    private function centavosParaDecimal(int $centavos): string
    {
        return intdiv($centavos, 100).'.'.str_pad((string) ($centavos % 100), 2, '0', STR_PAD_LEFT);
    }
}
