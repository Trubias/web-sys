<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN', null),
        'secret' => env('MAILGUN_SECRET', null),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN', null),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID', null),
        'secret' => env('AWS_SECRET_ACCESS_KEY', null),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

];
