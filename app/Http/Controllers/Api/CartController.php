<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(CartItem::with('product.brand')->where('user_id', $request->user()->id)->get());
    }

    public function store(Request $request)
    {
        $request->validate(['product_id' => 'required|exists:products,id', 'quantity' => 'integer|min:1']);
        $item = CartItem::where('user_id', $request->user()->id)->where('product_id', $request->product_id)->first();
        if ($item) {
            $item->quantity += ($request->quantity ?? 1);
            $item->save();
        } else {
            $item = CartItem::create([
                'user_id' => $request->user()->id,
                'product_id' => $request->product_id,
                'quantity' => $request->quantity ?? 1
            ]);
        }

        // Enforce Wishlist deletion structurally directly in the backend
        \App\Models\WishlistItem::where('user_id', $request->user()->id)
            ->where('product_id', $request->product_id)
            ->delete();

        return response()->json($item->load('product'), 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate(['quantity' => 'required|integer|min:1']);
        $item = CartItem::where('user_id', $request->user()->id)->where('id', $id)->firstOrFail();
        $item->update(['quantity' => $request->quantity]);
        return response()->json($item->load('product'));
    }

    public function destroy(Request $request, $id)
    {
        CartItem::where('user_id', $request->user()->id)->where('id', $id)->delete();
        return response()->json(['message' => 'Item removed']);
    }

    public function clear(Request $request)
    {
        CartItem::where('user_id', $request->user()->id)->delete();
        return response()->json(['message' => 'Cart cleared']);
    }
}
