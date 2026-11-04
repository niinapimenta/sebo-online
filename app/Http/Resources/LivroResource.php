<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Support\PublicStorageImageUrl;

class LivroResource extends JsonResource
{
    /**
     * Disable top-level data wrapping for this resource.
     *
     * @var string|null
     */
    public static $wrap = null;

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $fotoUrl = PublicStorageImageUrl::make($this->foto, $request);

        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'autor' => $this->autor,
            'editora' => $this->editora,
            'preco' => (float) $this->preco,
            'estoque' => (int) $this->estoque,
            'ano_publicacao' => (int) $this->ano_publicacao,
            'data_publicacao' => $this->data_publicacao instanceof \DateTimeInterface
                ? $this->data_publicacao->format('Y-m-d')
                : (string) $this->data_publicacao,
            'descricao' => $this->descricao,
            'foto' => $fotoUrl,
            'vendedor' => $this->user
                ? [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                ]
                : null,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
