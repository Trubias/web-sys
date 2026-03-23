<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run()
    {
        $brandsData = [
            ['name' => 'Rolex',          'slug' => 'rolex'],
            ['name' => 'Omega',          'slug' => 'omega'],
            ['name' => 'Patek Philippe', 'slug' => 'patek-philippe'],
            ['name' => 'Cartier',        'slug' => 'cartier'],
            ['name' => 'Tag Heuer',      'slug' => 'tag-heuer'],
            ['name' => 'Seiko',          'slug' => 'seiko'],
            ['name' => 'Jaeger',         'slug' => 'jaeger'],
        ];
        foreach ($brandsData as $b) Brand::firstOrCreate(['slug' => $b['slug']], $b);

        $catsData = [
            ['name' => 'Automatic',   'slug' => 'automatic'],
            ['name' => 'Chronograph', 'slug' => 'chronograph'],
            ['name' => 'Diver',       'slug' => 'diver'],
            ['name' => 'Dress',       'slug' => 'dress'],
        ];
        foreach ($catsData as $c) Category::firstOrCreate(['slug' => $c['slug']], $c);

        // Products will be added manually through the interface.
    }
}
