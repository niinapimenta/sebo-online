<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateLivroRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $isPatch = $this->isMethod('patch');

        return [
            'titulo' => array_merge($isPatch ? ['sometimes'] : [], ['required', 'string', 'max:255']),
            'autor' => array_merge($isPatch ? ['sometimes'] : [], ['required', 'string', 'max:255']),
            'editora' => ['sometimes', 'nullable', 'string', 'max:255'],
            'preco' => array_merge($isPatch ? ['sometimes'] : [], ['required', 'numeric', 'gt:0']),
            'estoque' => array_merge($isPatch ? ['sometimes'] : [], ['required', 'integer', 'min:0']),
            'ano_publicacao' => array_merge($isPatch ? ['sometimes'] : [], ['required', 'integer', 'min:1', 'max:'.date('Y')]),
            'data_publicacao' => array_merge($isPatch ? ['sometimes'] : [], ['required', 'date']),
            'descricao' => ['sometimes', 'nullable', 'string'],
            'foto' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png', 'max:5120'],
        ];
    }

    /**
     * Custom message for validation errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'titulo.required' => 'O título do livro é obrigatório.',
            'autor.required' => 'O autor do livro é obrigatório.',
            'preco.required' => 'O preço do livro é obrigatório.',
            'preco.numeric' => 'O preço deve ser um valor numérico.',
            'preco.gt' => 'O preço deve ser maior que zero.',
            'estoque.required' => 'A quantidade em estoque é obrigatória.',
            'estoque.integer' => 'O estoque deve ser um número inteiro.',
            'estoque.min' => 'O estoque não pode ser negativo.',
            'ano_publicacao.required' => 'O ano de publicação é obrigatório.',
            'ano_publicacao.integer' => 'O ano de publicação deve ser um número inteiro.',
            'ano_publicacao.max' => 'O ano de publicação não pode ser um ano futuro.',
            'data_publicacao.required' => 'A data de publicação é obrigatória.',
            'data_publicacao.date' => 'A data de publicação deve ser uma data válida.',
            'foto.image' => 'O arquivo enviado para foto deve ser uma imagem.',
            'foto.mimes' => 'A foto deve estar no formato JPG, JPEG ou PNG.',
            'foto.max' => 'A foto não pode ter tamanho superior a 5 MB.',
        ];
    }

    /**
     * Ensure failed validation always returns a JSON 422 response.
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'message' => 'Os dados fornecidos são inválidos.',
            'errors' => $validator->errors(),
        ], 422));
    }
}
