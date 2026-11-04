<?php

namespace App\Support;

use Illuminate\Http\Request;

class PublicStorageImageUrl
{
    public static function make(?string $storedPath, Request $request): ?string
    {
        if (! $storedPath) {
            return null;
        }

        $path = $storedPath;

        if (preg_match('/^https?:\/\//i', $storedPath)) {
            $parts = parse_url($storedPath);
            $host = strtolower((string) ($parts['host'] ?? ''));
            $configuredHost = strtolower((string) parse_url((string) config('app.url'), PHP_URL_HOST));
            $imagePath = (string) ($parts['path'] ?? '');

            if (! self::isLocalHost($host, $configuredHost) || ! str_starts_with($imagePath, '/storage/')) {
                return $storedPath;
            }

            $path = substr($imagePath, strlen('/storage/'));
        } else {
            $path = ltrim($path, '/');
            if (str_starts_with($path, 'storage/')) {
                $path = substr($path, strlen('storage/'));
            }
        }

        $path = trim($path, '/');
        if ($path === '') {
            return null;
        }

        $encodedPath = implode('/', array_map('rawurlencode', explode('/', $path)));

        return rtrim($request->getSchemeAndHttpHost(), '/').'/api/public-images/'.$encodedPath;
    }

    private static function isLocalHost(string $host, string $configuredHost): bool
    {
        if ($host === '' || $host === $configuredHost || in_array($host, ['localhost', '::1'], true)) {
            return true;
        }

        if (filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return str_starts_with($host, '10.')
                || str_starts_with($host, '192.168.')
                || (preg_match('/^172\.(1[6-9]|2\d|3[01])\./', $host) === 1)
                || str_starts_with($host, '127.');
        }

        return false;
    }
}
