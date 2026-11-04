<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PublicBookImageController extends Controller
{
    public function __invoke(string $path): StreamedResponse|Response
    {
        abort_unless(str_starts_with($path, 'livros/'), 404);
        abort_if(preg_match('#(^|/)\.\.?(/|$)#', $path) === 1, 404);

        $disk = Storage::disk('public');
        abort_unless($disk->exists($path), 404);

        return $disk->response($path, basename($path), [
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
