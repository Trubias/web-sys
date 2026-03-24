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
            ['email' => 'admin@gmail.com'],
            [
                'name'     => 'admin@gmail.com',
                'email'    => 'admin@gmail.com',
                'password' => Hash::make('123'),
                'role'     => 'admin',
            ]
        );
    }
}
