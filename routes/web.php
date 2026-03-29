<?php

use Illuminate\Support\Facades\Route;

Route::get('/rider/proofs/{filename}', function ($filename) {
    $path = storage_path('app/public/proofs/' . $filename);
    if (!file_exists($path)) {
        abort(404);
    }
    return response()->file($path);
});

Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
