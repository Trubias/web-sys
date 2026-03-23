<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddRiderFieldsToOrdersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('rider_id')->nullable()->after('status');
            $table->string('proof_of_delivery')->nullable();
            $table->timestamp('expected_delivery_date')->nullable();
            $table->timestamp('delivered_at')->nullable();
        });
    }

    public function down()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['rider_id', 'proof_of_delivery', 'expected_delivery_date', 'delivered_at']);
        });
    }
}
