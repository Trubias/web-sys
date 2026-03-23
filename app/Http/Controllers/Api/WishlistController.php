<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WishlistItem;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(WishlistItem::with(['product.brand', 'product.category'])->where('user_id', $request->user()->id)->get());
    }

    public function store(Request $request)
    {
        $request->validate(['product_id' => 'required|exists:products,id']);
        $item = WishlistItem::firstOrCreate(['user_id' => $request->user()->id, 'product_id' => $request->product_id]);
        return response()->json($item->load('product'), 201);
    }

    public function destroy(Request $request, $id)
    {
        WishlistItem::where('user_id', $request->user()->id)->where('id', $id)->delete();
        return response()->json(['message' => 'Removed from wishlist']);
    }
}
