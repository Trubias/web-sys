<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierProduct extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'name', 'slug', 'description', 'price', 'image', 
        'brand_id', 'category_id', 'supplier_id', 'stock', 'status'
    ];
    
    protected $casts = [
        'price' => 'float',
    ];

    public function brand() { return $this->belongsTo(Brand::class); }
    public function category() { return $this->belongsTo(Category::class); }
    public function supplier() { return $this->belongsTo(\App\Models\Supplier::class); }
}
