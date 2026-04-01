<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryAddress;
use App\Models\DeliveryAddressLog;
use Illuminate\Http\Request;

class DeliveryAddressController extends Controller
{
    public function index(Request $request)
    {
        $addresses = DeliveryAddress::where('user_id', $request->user()->id)
            ->orderByDesc('is_default')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($addresses);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'full_name' => 'required|string|max:255',
            'address'   => 'required|string|max:500',
            'city'      => 'required|string|max:255',
            'region'    => 'required|string|max:100',
            'phone'     => 'nullable|string|max:50',
            'is_default' => 'boolean',
        ]);

        $userId = $request->user()->id;

        // If new address is default, clear existing default
        if (!empty($data['is_default'])) {
            DeliveryAddress::where('user_id', $userId)->update(['is_default' => false]);
        }

        $address = DeliveryAddress::create(array_merge($data, ['user_id' => $userId]));

        DeliveryAddressLog::create([
            'user_id'    => $userId,
            'address_id' => $address->id,
            'action'     => 'created',
            'old_values' => null,
            'new_values' => $address->only(['full_name', 'address', 'city', 'region', 'phone', 'is_default']),
        ]);

        return response()->json($address, 201);
    }

    public function update(Request $request, $id)
    {
        $address = DeliveryAddress::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $data = $request->validate([
            'full_name'  => 'required|string|max:255',
            'address'    => 'required|string|max:500',
            'city'       => 'required|string|max:255',
            'region'     => 'required|string|max:100',
            'phone'      => 'nullable|string|max:50',
            'is_default' => 'boolean',
        ]);

        $userId = $request->user()->id;
        $oldValues = $address->only(['full_name', 'address', 'city', 'region', 'phone', 'is_default']);

        // If setting as default, clear others
        if (!empty($data['is_default'])) {
            DeliveryAddress::where('user_id', $userId)
                ->where('id', '!=', $id)
                ->update(['is_default' => false]);
        }

        $address->update($data);

        DeliveryAddressLog::create([
            'user_id'    => $userId,
            'address_id' => $address->id,
            'action'     => 'updated',
            'old_values' => $oldValues,
            'new_values' => $address->only(['full_name', 'address', 'city', 'region', 'phone', 'is_default']),
        ]);

        return response()->json($address);
    }

    public function destroy(Request $request, $id)
    {
        $address = DeliveryAddress::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        DeliveryAddressLog::create([
            'user_id'    => $request->user()->id,
            'address_id' => $address->id,
            'action'     => 'deleted',
            'old_values' => $address->only(['full_name', 'address', 'city', 'region', 'phone', 'is_default']),
            'new_values' => null,
        ]);

        $address->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
