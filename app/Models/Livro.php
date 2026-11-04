<?php

namespace App\Models;

use App\Support\PublicStorageImageUrl;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Livro extends Model
{
    use HasFactory;

    protected $table = 'livros';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'titulo',
        'autor',
        'editora',
        'preco',
        'estoque',
        'ano_publicacao',
        'data_publicacao',
        'descricao',
        'foto',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'preco' => 'decimal:2',
            'estoque' => 'integer',
            'ano_publicacao' => 'integer',
            'data_publicacao' => 'date:Y-m-d',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function itensPedido(): HasMany
    {
        return $this->hasMany(ItemPedido::class);
    }

    /**
     * Accessor for full photo URL.
     */
    public function getFotoUrlAttribute(): ?string
    {
        return PublicStorageImageUrl::make($this->foto, request());
    }
}
