<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProductReviewsTable extends Migration
{
    public function up()
    {
        Schema::create('product_reviews', function (Blueprint $table) {
            $table->id();

            // One review per delivered order row — enforced by unique constraint
            $table->unsignedBigInteger('order_id')->unique();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('product_id')->nullable();

            $table->tinyInteger('rating');          // 1–5, NOT NULL
            $table->text('comment')->nullable();
            $table->json('images')->nullable();     // array of storage paths
            $table->integer('helpful_count')->default(0);
            $table->boolean('is_visible')->default(true);

            $table->timestamps();

            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('product_id')->references('id')->on('products')->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::dropIfExists('product_reviews');
    }
}
