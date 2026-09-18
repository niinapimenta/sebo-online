<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLivroRequest;
use App\Http\Requests\UpdateLivroRequest;
use App\Http\Resources\LivroResource;
use App\Models\Livro;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class LivroController extends Controller
{
    /**
     * Display a listing of books.
     *
     * GET /api/livros
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Livro::query();

        if ($request->filled('busca')) {
            $busca = $request->input('busca');
            $query->where(function ($q) use ($busca) {
                $q->where('titulo', 'like', "%{$busca}%")
                    ->orWhere('autor', 'like', "%{$busca}%")
                    ->orWhere('editora', 'like', "%{$busca}%");
            });
        }

        $livros = $query->latest()->get();

        return LivroResource::collection($livros);
    }

    /**
     * Store a newly created book.
     *
     * POST /api/livros
     */
    public function store(StoreLivroRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('foto')) {
            $fotoPath = $request->file('foto')->store('livros', 'public');
            $data['foto'] = $fotoPath;
        }

        $livro = Livro::create($data);

        return (new LivroResource($livro))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified book.
     *
     * GET /api/livros/{id}
     */
    public function show($id): LivroResource|JsonResponse
    {
        $livro = Livro::find($id);

        if (! $livro) {
            return response()->json([
                'message' => 'Livro não encontrado.',
            ], 404);
        }

        return new LivroResource($livro);
    }

    /**
     * Update the specified book in storage (supports PUT and PATCH).
     *
     * PUT|PATCH /api/livros/{id}
     */
    public function update(UpdateLivroRequest $request, $id): LivroResource|JsonResponse
    {
        $livro = Livro::find($id);

        if (! $livro) {
            return response()->json([
                'message' => 'Livro não encontrado.',
            ], 404);
        }

        $data = $request->validated();

        if ($request->hasFile('foto')) {
            // Delete previous photo if it exists on disk
            if ($livro->foto && Storage::disk('public')->exists($livro->foto)) {
                Storage::disk('public')->delete($livro->foto);
            }

            $fotoPath = $request->file('foto')->store('livros', 'public');
            $data['foto'] = $fotoPath;
        }

        $livro->update($data);

        return new LivroResource($livro);
    }

    /**
     * Remove the specified book from storage.
     *
     * DELETE /api/livros/{id}
     */
    public function destroy($id): Response|JsonResponse
    {
        $livro = Livro::find($id);

        if (! $livro) {
            return response()->json([
                'message' => 'Livro não encontrado.',
            ], 404);
        }

        if ($livro->foto && Storage::disk('public')->exists($livro->foto)) {
            Storage::disk('public')->delete($livro->foto);
        }

        $livro->delete();

        return response()->noContent();
    }
}
