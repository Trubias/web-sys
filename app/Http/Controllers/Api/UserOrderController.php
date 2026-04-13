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
    // ── My Orders list: excludes orders hidden by the customer ────────────────
    public function index(Request $request)
    {
        $orders = Order::with(['rider', 'product', 'rating', 'review'])
            ->where('user_id', $request->user()->id)
            ->where('hidden_by_user', false)        // Fix 3/4: hidden orders stay in DB
            ->orderBy('created_at', 'desc')
            ->get();

        $orders = $orders->map(function ($order) {
            $data = $order->toArray();
            $image = null;

            // Fix 1: primary — use product_image stored at order time
            if ($order->product_image) {
                $image = $order->product_image;
            }
            // Fallback: live product image by FK
            elseif ($order->product && $order->product->image) {
                $image = $order->product->image;
            }
            // Last resort: match by name
            elseif ($order->product_name) {
                $p = Product::where('name', $order->product_name)->whereNotNull('image')->first();
                if ($p)
                    $image = $p->image;
            }

            if ($image)
                $data['product_image'] = $image;
            return $data;
        });

        return response()->json($orders);
    }

    // ── Profile Overview stats: counts ALL orders, ignores hidden_by_user ─────
    // Fix 4: Profile totals are never affected by the customer hiding orders.
    public function stats(Request $request)
    {
        $userId = $request->user()->id;
        $total = Order::where('user_id', $userId)->count();
        $spent = Order::where('user_id', $userId)->sum('total_amount');
        return response()->json(['total_orders' => $total, 'total_spent' => (float) $spent]);
    }

    // ── Hide an order from My Orders (Fix 3/4) ───────────────────────────────
    // Sets hidden_by_user=true — keeps the record for stats, admin view, etc.
    // ── Delete from My Orders history (Fix 1-5) ─────────────────────────────
    // Uses hidden_by_user=true so the record is preserved for Profile stats,
    // admin reporting, and audit trails — but is permanently gone from the
    // customer's My Orders list (Fix 5: Profile Overview totals unaffected).
    public function deleteFromHistory(Request $request, $id)
    {
        $order = Order::where('user_id', $request->user()->id)->findOrFail($id);
        $order->update(['hidden_by_user' => true]);
        return response()->json(['message' => 'Order deleted from history'], 200);
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

    public function rateOrder(Request $request, $id)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'tags' => 'nullable|array',
            'comment' => 'nullable|string'
        ]);

        $order = Order::where('user_id', $request->user()->id)->findOrFail($id);

        if (!in_array(strtolower($order->status), ['delivered', 'completed'])) {
            return response()->json(['message' => 'You can only rate delivered orders.'], 400);
        }

        if ($order->rating) {
            return response()->json(['message' => 'Order has already been rated.'], 400);
        }

        $rating = \App\Models\OrderRating::create([
            'order_id' => $order->id,
            'product_id' => $order->product_id,
            'rider_id' => $order->rider_id,
            'user_id' => $request->user()->id,
            'rating' => $request->rating,
            'tags' => $request->tags,
            'comment' => $request->comment
        ]);

        return response()->json(['message' => 'Rating submitted successfully!', 'rating' => $rating]);
    }
}
