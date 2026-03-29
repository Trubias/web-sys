<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

foreach (\App\Models\Order::all() as $order) {
    if ($order->product) {
        $order->update(['product_image' => $order->product->image]);
    }
}
echo "Done backfilling images.\n";
