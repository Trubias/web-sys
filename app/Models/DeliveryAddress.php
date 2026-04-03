<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryAddress extends Model
{
    protected $fillable = [
        'user_id',
        'full_name',
        'address',
        'city',
        'region',
        'phone',
        'is_default',
        'latitude',
        'longitude',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'latitude'   => 'float',
        'longitude'  => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
