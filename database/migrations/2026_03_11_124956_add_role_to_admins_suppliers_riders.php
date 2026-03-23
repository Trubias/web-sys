<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddRoleToAdminsSuppliersRiders extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->string('role')->default('admin');
        });
        Schema::table('suppliers', function (Blueprint $table) {
            $table->string('role')->default('supplier');
        });
        Schema::table('riders', function (Blueprint $table) {
            $table->string('role')->default('rider');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('admins_suppliers_riders', function (Blueprint $table) {
            //
        });
    }
}
