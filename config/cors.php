<?php

$frontendUrl = trim((string) env('FRONTEND_URL', ''));
$frontendOrigin = null;
if ($frontendUrl !== '') {
    $parts = parse_url($frontendUrl);
    if (is_array($parts) && isset($parts['scheme'], $parts['host'])) {
        $frontendOrigin = $parts['scheme'].'://'.$parts['host']
            .(isset($parts['port']) ? ':'.$parts['port'] : '');
    }
}

return [
    'paths' => ['api/*', 'login', 'logout', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => [
        'http://localhost:8081',
        'http://127.0.0.1:8081',
        ...($frontendOrigin ? [$frontendOrigin] : []),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Accept',
        'Authorization',
        'Content-Type',
        'Origin',
        'X-Requested-With',
        'X-CSRF-TOKEN',
        'X-XSRF-TOKEN',
    ],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
