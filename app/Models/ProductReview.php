<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductReview extends Model
{
    protected $fillable = [
        'order_id',
        'user_id',
        'product_id',
        'rating',
        'comment',
        'images',
        'helpful_count',
        'is_visible',
    ];

    protected $casts = [
        'images'        => 'array',
        'is_visible'    => 'boolean',
        'rating'        => 'integer',
        'helpful_count' => 'integer',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    // ── Scopes ─────────────────────────────────────────────────────────────────

    public function scopeVisible($query)
    {
        return $query->where('is_visible', true);
    }
}
