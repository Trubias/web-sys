<?php

use Illuminate\Support\Facades\Route;

Route::get('/run-migrations', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        return "Migrations ran successfully! <br><br> Output: <br>" . \Illuminate\Support\Facades\Artisan::output();
    } catch (\Exception $e) {
        return "Migration error: " . $e->getMessage();
    }
});

Route::get('/run-seed', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
        return "Seeding ran successfully! <br><br> Output: <br>" . \Illuminate\Support\Facades\Artisan::output();
    } catch (\Exception $e) {
        return "Seeding error: " . $e->getMessage();
    }
});

Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
