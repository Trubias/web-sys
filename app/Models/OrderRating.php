<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderRating extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'rider_id',
        'user_id',
        'rating',
        'tags',
        'comment'
    ];

    protected $casts = [
        'tags' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function rider()
    {
        return $this->belongsTo(Rider::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
