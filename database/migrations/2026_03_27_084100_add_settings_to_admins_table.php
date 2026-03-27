<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSettingsToAdminsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->string('store_name')->nullable();
            $table->string('currency')->default('PHP');
            $table->string('address')->nullable();
            $table->text('description')->nullable();
            $table->boolean('notify_new_order')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->dropColumn(['store_name', 'currency', 'address', 'description', 'notify_new_order']);
        });
    }
}
