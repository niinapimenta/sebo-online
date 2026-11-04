<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StorePedidoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'itens' => ['required', 'array', 'min:1', 'max:100'],
            'itens.*' => ['required', 'array:livro_id,quantidade'],
            'itens.*.livro_id' => ['required', 'integer', 'min:1', 'distinct'],
            'itens.*.quantidade' => ['required', 'integer', 'min:1', 'max:1000000'],
            'preco' => ['prohibited'],
            'preco_unitario' => ['prohibited'],
            'subtotal' => ['prohibited'],
            'total' => ['prohibited'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'itens.required' => 'Informe ao menos um item para o pedido.',
            'itens.min' => 'Informe ao menos um item para o pedido.',
            'itens.max' => 'O pedido não pode conter mais de 100 livros diferentes.',
            'itens.*.array' => 'Cada item deve conter somente livro_id e quantidade.',
            'itens.*.livro_id.required' => 'O identificador do livro é obrigatório.',
            'itens.*.livro_id.distinct' => 'Cada livro deve aparecer somente uma vez no pedido.',
            'itens.*.quantidade.required' => 'A quantidade é obrigatória.',
            'itens.*.quantidade.min' => 'A quantidade solicitada deve ser maior que zero.',
            'itens.*.quantidade.max' => 'A quantidade solicitada excede o limite permitido.',
            '*.prohibited' => 'Preços e totais são calculados pelo servidor.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'message' => 'Os dados fornecidos são inválidos.',
            'errors' => $validator->errors(),
        ], 422));
    }
}
