<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Api\AdminSupplierController;
use App\Http\Controllers\Api\SupplierProductController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AdminRiderController;
use App\Http\Controllers\Api\AdminReportsController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\ContactController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Auth (public)
Route::post('/register', [AuthController::class , 'register']);
Route::post('/login', [AuthController::class , 'login']);

// Products (public)
Route::get('/products', [ProductController::class , 'index']);
Route::get('/products/{id}', [ProductController::class , 'show']);

// Contact (public)
Route::post('/contact', [ContactController::class, 'send']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class , 'logout']);
    Route::get('/user', [AuthController::class , 'me']);
    Route::put('/user/profile', [AuthController::class, 'updateUserProfile']);
    Route::put('/supplier/profile', [AuthController::class, 'updateSupplierProfile']);

    Route::get('/cart', [CartController::class , 'index']);
    Route::post('/cart', [CartController::class , 'store']);
    Route::put('/cart/{id}', [CartController::class , 'update']);
    Route::delete('/cart/{id}', [CartController::class , 'destroy']);
    Route::delete('/cart', [CartController::class , 'clear']);

    Route::get('/user/notifications', [\App\Http\Controllers\Api\UserNotificationController::class, 'index']);
    Route::post('/user/notifications/read', [\App\Http\Controllers\Api\UserNotificationController::class, 'markAsRead']);
    Route::put('/user/notifications/{id}/read', [\App\Http\Controllers\Api\UserNotificationController::class, 'markOneAsRead']);
    Route::delete('/user/notifications', [\App\Http\Controllers\Api\UserNotificationController::class, 'destroyAll']);

    Route::get('/orders', [\App\Http\Controllers\Api\UserOrderController::class, 'index']);
    Route::post('/orders', [\App\Http\Controllers\Api\UserOrderController::class, 'store']);
    Route::delete('/orders/{id}', [\App\Http\Controllers\Api\UserOrderController::class, 'destroy']);

    // Rider routes
    Route::get('/rider/deliveries', [\App\Http\Controllers\Api\RiderDeliveryController::class, 'index']);
    Route::put('/rider/deliveries/{id}/accept', [\App\Http\Controllers\Api\RiderDeliveryController::class, 'acceptDelivery']);
    Route::put('/rider/deliveries/{id}/cancel', [\App\Http\Controllers\Api\RiderDeliveryController::class, 'cancelDelivery']);
    Route::put('/rider/deliveries/{id}/picked-up', [\App\Http\Controllers\Api\RiderDeliveryController::class, 'markAsPickedUp']);
    Route::put('/rider/deliveries/{id}/delivered', [\App\Http\Controllers\Api\RiderDeliveryController::class, 'markAsDelivered']);
    Route::post('/rider/profile', [\App\Http\Controllers\Api\RiderDeliveryController::class, 'updateProfile']);

    Route::get('/wishlist', [WishlistController::class , 'index']);
    Route::post('/wishlist', [WishlistController::class , 'store']);
    Route::delete('/wishlist/{id}', [WishlistController::class , 'destroy']);

    // Admin routes
    Route::middleware([\App\Http\Middleware\AdminMiddleware::class])->group(function () {
            // Suppliers
            Route::get('/admin/suppliers', [AdminSupplierController::class , 'index']);
            Route::put('/admin/suppliers/{id}/interview', [AdminSupplierController::class , 'setInterview']);
            Route::put('/admin/suppliers/{id}/confirm', [AdminSupplierController::class , 'confirm']);
            Route::delete('/admin/suppliers/{id}', [AdminSupplierController::class , 'destroy']);

            // Dashboard
            Route::get('/admin/dashboard', [AdminDashboardController::class, 'index']);
            Route::put('/admin/settings', [AdminDashboardController::class, 'updateSettings']);

            // Reports & Customer Orders
            Route::get('/admin/reports', [AdminReportsController::class, 'index']);
            Route::get('/admin/orders', [AdminReportsController::class, 'orders']);
            Route::post('/admin/orders', [AdminReportsController::class, 'store']);
            Route::put('/admin/orders/{id}/assign-rider', [AdminReportsController::class, 'assignRider']);
            Route::delete('/admin/orders/{id}', [AdminReportsController::class, 'destroyOrder']);

            // Users
            Route::get('/admin/users', [AdminUserController::class , 'index']);
            Route::delete('/admin/users/{id}', [AdminUserController::class , 'destroy']);

            // Riders
            Route::get('/admin/riders', [AdminRiderController::class , 'index']);
            Route::put('/admin/riders/{id}/interview', [AdminRiderController::class , 'setInterview']);
            Route::put('/admin/riders/{id}/confirm', [AdminRiderController::class , 'confirm']);
            Route::delete('/admin/riders/{id}', [AdminRiderController::class , 'destroy']);

        }
        );

    // Admin & Supplier Products CRUD
    Route::middleware([\App\Http\Middleware\AdminOrSupplierMiddleware::class])->group(function () {
        Route::get('/admin/products', [\App\Http\Controllers\Api\AdminProductController::class , 'index']);
        Route::post('/admin/products', [\App\Http\Controllers\Api\AdminProductController::class , 'store']);
        Route::put('/admin/products/{id}', [\App\Http\Controllers\Api\AdminProductController::class , 'update']);
        Route::delete('/admin/products/{id}', [\App\Http\Controllers\Api\AdminProductController::class , 'destroy']);
        Route::get('/admin/brands', [\App\Http\Controllers\Api\AdminProductController::class , 'brands']);
        Route::post('/admin/brands', [\App\Http\Controllers\Api\AdminProductController::class , 'storeBrand']);
        Route::get('/admin/categories', [\App\Http\Controllers\Api\AdminProductController::class , 'categories']);
        Route::post('/admin/categories', [\App\Http\Controllers\Api\AdminProductController::class , 'storeCategory']);
        Route::get('/admin/companies', [\App\Http\Controllers\Api\AdminProductController::class , 'suppliers']);
        
        // Supplier's Own Products CRUD
        Route::get('/supplier-products', [SupplierProductController::class, 'index']);
        Route::post('/supplier-products', [SupplierProductController::class, 'store']);
        Route::put('/supplier-products/{id}', [SupplierProductController::class, 'update']);
        Route::delete('/supplier-products/{id}', [SupplierProductController::class, 'destroy']);
    });
});

Route::get('/db-test', function() {
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        return "Connected to: " . \Illuminate\Support\Facades\DB::connection()->getDatabaseName();
    } catch (\Exception $e) {
        return "Connection failed: " . $e->getMessage();
    }
});

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
