<?php

namespace Database\Factories;

use App\Models\Livro;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Livro>
 */
class LivroFactory extends Factory
{
    protected $model = Livro::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $year = fake()->numberBetween(1900, (int) date('Y'));

        return [
            'titulo' => fake()->sentence(3),
            'autor' => fake()->name(),
            'editora' => fake()->company(),
            'preco' => fake()->randomFloat(2, 10, 150),
            'estoque' => fake()->numberBetween(1, 20),
            'ano_publicacao' => $year,
            'data_publicacao' => fake()->date('Y-m-d', $year.'-12-31'),
            'descricao' => fake()->paragraph(),
            'foto' => null,
        ];
    }
}
