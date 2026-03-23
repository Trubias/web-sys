<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('customer_name')->nullable();
            $table->string('customer_email')->nullable();
            $table->string('ref')->unique()->nullable();           // e.g. ORD-ABC123
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('product_name');                        // snapshot at time of order
            $table->foreignId('brand_id')->nullable()->constrained('brands')->nullOnDelete();
            $table->string('brand_name')->nullable();             // snapshot
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 12, 2)->default(0);     // price per unit at time of order
            $table->decimal('total_amount', 12, 2)->default(0);   // quantity * unit_price
            $table->string('status')->default('pending');          // pending, processing, completed, cancelled
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
