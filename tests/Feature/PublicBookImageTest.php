<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PublicBookImageTest extends TestCase
{
    public function test_public_book_image_route_streams_existing_public_disk_file(): void
    {
        Storage::fake('public');
        $photo = UploadedFile::fake()->image('capa.png', 12, 12);
        $path = $photo->store('livros', 'public');

        $this->get('/api/public-images/'.$path)
            ->assertOk()
            ->assertHeader('Content-Type', 'image/png');
    }

    public function test_public_book_image_route_does_not_expose_other_public_disk_paths(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('documentos/privado.txt', 'conteúdo');

        $this->get('/api/public-images/documentos/privado.txt')->assertNotFound();
        $this->get('/api/public-images/livros/ausente.jpg')->assertNotFound();
    }
}
