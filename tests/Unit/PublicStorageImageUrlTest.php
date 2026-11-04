<?php

namespace Tests\Unit;

use App\Support\PublicStorageImageUrl;
use Illuminate\Http\Request;
use Tests\TestCase;

class PublicStorageImageUrlTest extends TestCase
{
    public function test_relative_image_path_uses_the_current_api_host(): void
    {
        $request = Request::create('http://192.168.15.69:8000/api/livros', 'GET');

        $this->assertSame(
            'http://192.168.15.69:8000/api/public-images/livros/capa%20do%20livro.jpg',
            PublicStorageImageUrl::make('livros/capa do livro.jpg', $request),
        );
    }

    public function test_legacy_local_storage_url_is_rebuilt_from_the_current_request_host(): void
    {
        config(['app.url' => 'http://sebo-online.test']);
        $request = Request::create('http://192.168.15.69:8000/api/livros', 'GET');

        $this->assertSame(
            'http://192.168.15.69:8000/api/public-images/livros/capa.jpg',
            PublicStorageImageUrl::make('http://sebo-online.test/storage/livros/capa.jpg', $request),
        );
    }

    public function test_external_image_url_is_preserved(): void
    {
        $request = Request::create('http://192.168.15.69:8000/api/livros', 'GET');
        $externalUrl = 'https://images.example.org/capas/capa.jpg';

        $this->assertSame($externalUrl, PublicStorageImageUrl::make($externalUrl, $request));
    }
}
