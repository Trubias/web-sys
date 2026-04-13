<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'customer_name',
        'customer_email',
        'ref',
        'product_id',
        'product_name',
        'product_image',
        'brand_id',
        'brand_name',
        'quantity',
        'unit_price',
        'total_amount',
        'status',
        'address',
        'city',
        'region',
        'phone',
        'payment_method',
        'order_note',
        'rider_id',
        'proof_of_delivery',
        'expected_delivery_date',
        'latitude',
        'longitude',
        'delivered_at'
    ];

    protected $casts = [
        'unit_price' => 'float',
        'total_amount' => 'float',
        'quantity' => 'integer',
        'rejected_by_riders' => 'array',
        'delivered_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }
    public function rider()
    {
        return $this->belongsTo(Rider::class);
    }
    public function rating()
    {
        return $this->hasOne(OrderRating::class);
    }

    public function review()
    {
        return $this->hasOne(ProductReview::class);
    }
}
