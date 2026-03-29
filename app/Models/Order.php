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
        'expected_delivery_date'
    ];

    protected $casts = [
        'unit_price' => 'float',
        'total_amount' => 'float',
        'quantity' => 'integer',
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
}
