<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UserOrderController extends Controller
{
    public function index(Request $request)
    {
        $orders = Order::with(['rider'])
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($orders);
    }

    public function store(Request $request)
    {
        $request->validate([
            'address' => 'required|string',
            'city' => 'required|string',
            'region' => 'required|string',
            'phone' => 'nullable|string',
            'payment_method' => 'required|string',
            'order_note' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric'
        ]);

        $user = $request->user();

        $directPurchase = $request->input('direct_purchase');
        if ($directPurchase) {
            $product = Product::with('brand')->find($directPurchase['product_id']);
            if (!$product) {
                return response()->json(['message' => 'Product not found'], 404);
            }
            $cartItems = [
                (object) [
                    'product_id' => $product->id,
                    'quantity' => $directPurchase['quantity'],
                    'product' => $product
                ]
            ];
            $isDirect = true;
        } else {
            $cartItems = CartItem::where('user_id', $user->id)->with('product.brand')->get();
            $isDirect = false;
        }

        if (empty($cartItems) || (is_a($cartItems, 'Illuminate\Support\Collection') && $cartItems->isEmpty())) {
            return response()->json(['message' => 'Your cart is empty'], 400);
        }

        $orders = [];
        $ref = 'ORD-' . strtoupper(Str::random(6)); // Grouped under same ref if needed, or distinct

        foreach ($cartItems as $item) {
            $product = $item->product;
            if (!$product || $product->stock < $item->quantity) {
                return response()->json(['message' => 'Insufficient stock for ' . ($product ? $product->name : 'item')], 400);
            }

            // NOTE: Stock is NOT deducted here.
            // Stock is only deducted when the rider marks the order as Delivered.

            $order = Order::create([
                'user_id' => $user->id,
                'customer_name' => $user->name,
                'customer_email' => $user->email,
                'ref' => $ref,
                'product_id' => $product->id,
                'product_name' => $product->name,
                'product_image' => $product->image,
                'brand_id' => $product->brand_id,
                'brand_name' => $product->brand ? $product->brand->name : null,
                'quantity' => $item->quantity,
                'unit_price' => $product->price,
                'total_amount' => $product->price * $item->quantity,
                'status' => 'pending',
                'address' => $request->address,
                'city' => $request->city,
                'region' => $request->region,
                'phone' => $request->phone,
                'payment_method' => $request->payment_method,
                'order_note' => $request->order_note,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
            ]);

            $orders[] = $order;
        }

        // Clear cart
        if (!$isDirect) {
            CartItem::where('user_id', $user->id)->delete();
        }

        // Save profile if requested
        if ($request->save_info) {
            $user->update([
                'address' => $request->address,
                'phone' => $request->phone,
            ]);
        }

        \App\Models\UserNotification::create([
            'user_id' => $user->id,
            'title' => 'Order Placed successfully',
            'message' => 'Your order ' . $ref . ' has been successfully placed.',
            'type' => 'order_status',
            'is_read' => false,
        ]);

        // Notify active Riders in the same region about the new broadcast
        $ridersInRegion = \App\Models\Rider::where('rider_status', 'active')
            ->where('region', $request->region)
            ->pluck('id');

        foreach ($ridersInRegion as $riderId) {
            \App\Models\UserNotification::create([
                'user_id' => $riderId,
                'title' => 'New Delivery Broadcast!',
                'message' => 'A new pending delivery ' . $ref . ' is available in your region. Check your Available Broadcasts.',
                'type' => 'delivery_assigned',
                'is_read' => false,
            ]);
        }

        return response()->json([
            'message' => 'Order placed successfully',
            'orders' => $orders,
            'reference' => $ref
        ], 201);
    }

    public function destroy(Request $request, $id)
    {
        $order = Order::where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->findOrFail($id);

        $order->delete();

        return response()->json(['message' => 'Order cancelled successfully']);
    }
}
