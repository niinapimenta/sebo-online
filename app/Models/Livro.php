<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

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

    /**
     * Accessor for full photo URL.
     */
    public function getFotoUrlAttribute(): ?string
    {
        if (! $this->foto) {
            return null;
        }

        if (str_starts_with($this->foto, 'http://') || str_starts_with($this->foto, 'https://')) {
            return $this->foto;
        }

        return Storage::disk('public')->url($this->foto);
    }
}
