<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddRiderFeeToOrdersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('rider_fee', 8, 2)->nullable()->after('total_amount');
        });

        // Initialize historical data for orders strictly already marked as delivered/completed
        \DB::table('orders')
            ->whereIn('status', ['delivered', 'completed'])
            ->update(['rider_fee' => 50.00]);
    }

    public function down()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('rider_fee');
        });
    }
}
