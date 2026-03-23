<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run()
    {
        Admin::updateOrCreate(
            ['email' => 'Admin@gmail.com'],
            [
                'name'     => 'Admin',
                'email'    => 'Admin@gmail.com',
                'password' => Hash::make('123'),
            ]
        );
    }
}
