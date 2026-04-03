<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddGenderVariantToSupplierProductsTable extends Migration
{
    public function up()
    {
        Schema::table('supplier_products', function (Blueprint $table) {
            $table->string('gender')->default('All')->after('stock');
            $table->string('variant')->default('All')->after('gender');
        });
    }

    public function down()
    {
        Schema::table('supplier_products', function (Blueprint $table) {
            $table->dropColumn(['gender', 'variant']);
        });
    }
}
