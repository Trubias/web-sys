<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Soft-hides the order from the customer's My Orders list
            // without deleting it from the database.
            // Profile overview stats still count all orders regardless of this flag.
            $table->boolean('hidden_by_user')->default(false)->after('admin_archived');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('hidden_by_user');
        });
    }
};
