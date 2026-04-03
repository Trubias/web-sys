<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddColorVariantsToProductsTables extends Migration
{
    public function up()
    {
        Schema::table('supplier_products', function (Blueprint $table) {
            $table->json('color_variants')->nullable()->after('variant');
        });
        Schema::table('products', function (Blueprint $table) {
            $table->json('color_variants')->nullable()->after('variant');
        });
    }

    public function down()
    {
        Schema::table('supplier_products', function (Blueprint $table) {
            $table->dropColumn('color_variants');
        });
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('color_variants');
        });
    }
}
