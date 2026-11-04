<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ItemPedidoResource extends JsonResource
{
    /** @var string|null */
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $foto = $this->livro_foto;
        if ($foto && ! str_starts_with($foto, 'http://') && ! str_starts_with($foto, 'https://')) {
            $foto = Storage::disk('public')->url($foto);
        }

        return [
            'id' => $this->id,
            'livro_id' => $this->livro_id,
            'titulo' => $this->livro_titulo,
            'autor' => $this->livro_autor,
            'foto' => $foto,
            'vendedor' => $this->vendedor_id
                ? ['id' => $this->vendedor_id, 'name' => $this->vendedor_nome]
                : null,
            'preco_unitario' => $this->preco_unitario,
            'quantidade' => $this->quantidade,
            'subtotal' => $this->subtotal,
        ];
    }
}
