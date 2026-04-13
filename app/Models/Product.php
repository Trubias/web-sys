<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = ['name','slug','description','price','image','brand_id','category_id','supplier_id','stock','is_featured','is_new','status','gender','variant','color_variants'];
    protected $casts    = ['price' => 'float', 'is_featured' => 'boolean', 'is_new' => 'boolean', 'color_variants' => 'array'];

    public function brand()    { return $this->belongsTo(Brand::class); }
    public function category() { return $this->belongsTo(Category::class); }
    public function supplier() { return $this->belongsTo(\App\Models\Supplier::class); }

    // ── Reviews ───────────────────────────────────────────────────────────────

    public function reviews()
    {
        return $this->hasMany(ProductReview::class);
    }

    // Average rating across all visible reviews for this product (1 decimal)
    public function getAverageRatingAttribute(): ?float
    {
        $avg = $this->reviews()->visible()->avg('rating');
        return $avg ? round((float) $avg, 1) : null;
    }

    // Count of visible reviews
    public function getRatingCountAttribute(): int
    {
        return $this->reviews()->visible()->count();
    }
}
