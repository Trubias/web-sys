<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RiderDeliveryController extends Controller
{
    /**
     * Get all deliveries assigned to the currently authenticated rider
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'rider') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $deliveries = Order::with(['user', 'product', 'brand'])
            ->where('rider_id', $user->id)
            ->orderByDesc('updated_at')
            ->get();

        return response()->json($deliveries);
    }

    /**
     * Accept an assigned delivery
     */
    public function acceptDelivery(Request $request, $orderId)
    {
        $user = $request->user();
        if ($user->role !== 'rider') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $order = Order::where('rider_id', $user->id)->where('status', 'assigned')->findOrFail($orderId);
        $order->status = 'accepted';
        $order->save();

        if ($order->user_id) {
            \App\Models\UserNotification::create([
                'user_id' => $order->user_id,
                'title' => 'Rider Accepted',
                'message' => 'Your order ' . $order->ref . ' has been accepted by your rider ' . $user->name . '. It will be picked up soon.',
                'type' => 'delivery_update',
                'is_read' => false
            ]);
        }

        return response()->json($order);
    }

    /**
     * Cancel/Reject an assigned delivery
     */
    public function cancelDelivery(Request $request, $orderId)
    {
        $user = $request->user();
        if ($user->role !== 'rider') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $order = Order::where('rider_id', $user->id)->where('status', 'assigned')->findOrFail($orderId);
        $order->status = 'pending';
        $order->rider_id = null;
        $order->save();

        return response()->json($order);
    }

    /**
     * Mark an order as picked up
     */
    public function markAsPickedUp(Request $request, $orderId)
    {
        $user = $request->user();
        if ($user->role !== 'rider') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $order = Order::where('rider_id', $user->id)->findOrFail($orderId);
        $order->status = 'out_for_delivery';
        $order->save();

        if ($order->user_id) {
            \App\Models\UserNotification::create([
                'user_id' => $order->user_id,
                'title' => 'Order Out for Delivery',
                'message' => 'Your order ' . $order->ref . ' has been picked up and is now Out for Delivery!',
                'type' => 'delivery_update',
                'is_read' => false
            ]);
        }

        return response()->json($order);
    }

    /**
     * Mark an order as delivered, accepting a proof of delivery photo.
     * STOCK IS DEDUCTED HERE — only on confirmed delivery.
     */
    public function markAsDelivered(Request $request, $orderId)
    {
        $user = $request->user();
        if ($user->role !== 'rider') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'proof_of_delivery' => 'required|image|mimes:jpeg,png,jpg|max:5120',
        ]);

        $order = Order::where('rider_id', $user->id)->findOrFail($orderId);

        if ($request->hasFile('proof_of_delivery')) {
            $path = $request->file('proof_of_delivery')->store('proofs', 'public');
            $order->proof_of_delivery = $path;
        }

        $order->status = 'delivered';
        $order->delivered_at = now();
        $order->save();

        // ── Deduct stock now that order is confirmed delivered ─────────────────
        if ($order->product_id) {
            $product = Product::find($order->product_id);
            if ($product) {
                $product->stock = max(0, $product->stock - $order->quantity);
                if ($product->stock == 0) {
                    $product->status = 'Out of Stock';
                } elseif ($product->stock <= 5) {
                    $product->status = 'Low Stock';
                } else {
                    $product->status = 'Active';
                }
                $product->save();
            }
        }

        if ($order->user_id) {
            \App\Models\UserNotification::create([
                'user_id' => $order->user_id,
                'title' => 'Order Delivered',
                'message' => 'Your order ' . $order->ref . ' has been successfully delivered! Thank you for shopping with J&K Watch.',
                'type' => 'delivery_update',
                'is_read' => false
            ]);
        }

        return response()->json($order);
    }

    /**
     * Update rider profile
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'rider') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name'         => 'sometimes|string|max:255',
            'phone'        => 'sometimes|nullable|string|max:20',
            'region'       => 'sometimes|nullable|string|max:255',
            'city'         => 'sometimes|nullable|string|max:255',
            'vehicle_type' => 'sometimes|nullable|string|max:255',
            'avatar'       => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $user->avatar));
            }
            $path = $request->file('avatar')->store('avatars', 'public');
            $validated['avatar'] = '/storage/' . $path;
        }

        $user->update($validated);

        return response()->json($user->fresh());
    }
}
