<?php

namespace Database\Seeders;

use App\Models\Livro;
use Illuminate\Database\Seeder;

class LivroSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $livros = [
            [
                'titulo' => 'Dom Casmurro',
                'autor' => 'Machado de Assis',
                'editora' => 'Livraria Garnier',
                'preco' => 29.90,
                'estoque' => 3,
                'ano_publicacao' => 1899,
                'data_publicacao' => '1899-01-01',
                'descricao' => 'Exemplar em bom estado de conservação, páginas levemente amareladas pela ação do tempo, miolo firme.',
                'foto' => null,
            ],
            [
                'titulo' => 'O Cortiço',
                'autor' => 'Aluísio Azevedo',
                'editora' => 'B. L. Garnier',
                'preco' => 24.50,
                'estoque' => 5,
                'ano_publicacao' => 1890,
                'data_publicacao' => '1890-01-01',
                'descricao' => 'Clássico do naturalismo brasileiro. Capa preservada, sem anotações ou grifos.',
                'foto' => null,
            ],
            [
                'titulo' => 'Memórias Póstumas de Brás Cubas',
                'autor' => 'Machado de Assis',
                'editora' => 'Tipografia Nacional',
                'preco' => 35.00,
                'estoque' => 2,
                'ano_publicacao' => 1881,
                'data_publicacao' => '1881-01-01',
                'descricao' => 'Edição de sebo, miolo bem cuidado, sem páginas faltantes.',
                'foto' => null,
            ],
            [
                'titulo' => 'Grande Sertão: Veredas',
                'autor' => 'João Guimarães Rosa',
                'editora' => 'José Olympio',
                'preco' => 48.00,
                'estoque' => 1,
                'ano_publicacao' => 1956,
                'data_publicacao' => '1956-05-15',
                'descricao' => 'Obra-prima da literatura brasileira. Lombada íntegra, exemplar raro.',
                'foto' => null,
            ],
            [
                'titulo' => 'Capitães da Areia',
                'autor' => 'Jorge Amado',
                'editora' => 'José Olympio',
                'preco' => 22.00,
                'estoque' => 4,
                'ano_publicacao' => 1937,
                'data_publicacao' => '1937-01-01',
                'descricao' => 'Livro de bolso em ótimo estado de conservação.',
                'foto' => null,
            ],
        ];

        foreach ($livros as $livro) {
            Livro::firstOrCreate(
                ['titulo' => $livro['titulo'], 'autor' => $livro['autor']],
                $livro
            );
        }
    }
}
