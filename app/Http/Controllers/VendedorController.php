<?php

namespace App\Http\Controllers;

use App\Http\Resources\VendedorResource;
use App\Models\User;

class VendedorController extends Controller
{
    public function show(int $id): VendedorResource
    {
        $vendedor = User::query()
            ->with(['livros' => fn ($query) => $query
                ->where('estoque', '>', 0)
                ->with('user')])
            ->findOrFail($id);

        return new VendedorResource($vendedor);
    }
}
