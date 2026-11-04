<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendedorResource extends JsonResource
{
    /** @var string|null */
    public static $wrap = 'data';

    /**
     * Transform the seller and their available books into a public response.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'vendedor' => [
                'id' => $this->id,
                'name' => $this->name,
            ],
            'livros' => LivroResource::collection($this->livros)->resolve($request),
        ];
    }
}
