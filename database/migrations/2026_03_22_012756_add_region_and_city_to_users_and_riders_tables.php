<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddRegionAndCityToUsersAndRidersTables extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('region')->nullable();
            $table->string('city')->nullable();
        });

        Schema::table('riders', function (Blueprint $table) {
            $table->string('region')->nullable();
            $table->string('city')->nullable();
            $table->string('government_id')->nullable();
            $table->string('avatar')->nullable();
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['region', 'city']);
        });

        Schema::table('riders', function (Blueprint $table) {
            $table->dropColumn(['region', 'city', 'government_id', 'avatar']);
        });
    }
}
