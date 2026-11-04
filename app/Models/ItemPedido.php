<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemPedido extends Model
{
    protected $table = 'itens_pedido';

    protected $fillable = [
        'livro_id',
        'vendedor_id',
        'livro_titulo',
        'livro_autor',
        'livro_foto',
        'vendedor_nome',
        'preco_unitario',
        'quantidade',
        'subtotal',
    ];

    protected function casts(): array
    {
        return [
            'preco_unitario' => 'decimal:2',
            'quantidade' => 'integer',
            'subtotal' => 'decimal:2',
        ];
    }

    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class);
    }

    public function livro(): BelongsTo
    {
        return $this->belongsTo(Livro::class);
    }

    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendedor_id');
    }
}
